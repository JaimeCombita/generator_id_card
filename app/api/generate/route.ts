import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

import {
  FILE_SIZE_LIMITS,
  RECORD_LIMITS,
  ALLOWED_EXCEL_MIME_TYPES,
  PDF_CARDS_PER_PAGE,
} from '@/lib/infrastructure/config/constants';
import { logger } from '@/lib/infrastructure/logging/logger';
import { isRateLimited } from '@/lib/infrastructure/rateLimit/rateLimitService';
import { getClientIp, isOriginAllowed } from '@/lib/infrastructure/http/requestUtils';

import { verifyAdminCode } from '@/lib/domain/admin/adminService';
import { limitRecords, shouldAddWatermark } from '@/lib/domain/carnet/carnetService';

import { parseExcelFile } from '@/lib/application/excel/excelParser';
import {
  buildPhotosMapByIdentification,
  buildCapturedPhotosMapByIdentification,
  mergePhotosMaps,
} from '@/lib/application/photos/photoService';
import { buildDefaultTemplate, buildCustomTemplate } from '@/lib/application/template/templateService';
import { generateSinglePDF, generateMultiplePDFs } from '@/lib/application/pdf/pdfGenerator';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id')?.trim() || crypto.randomUUID();
  const clientIp = getClientIp(request);
  const requestLogger = logger.child({
    scope: 'api.generate',
    requestId,
    clientIp,
  });

  try {
    if (await isRateLimited(clientIp)) {
      requestLogger.warn('Rate limit exceeded');
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 },
      );
    }

    if (!isOriginAllowed(request)) {
      requestLogger.warn('Request blocked by origin policy', {
        origin: request.headers.get('origin'),
      });
      return NextResponse.json(
        { error: 'Origen de solicitud no permitido.' },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const excelFile = formData.get('excelFile') as File;
    const photosZip = formData.get('photosZip') as File | null;
    const capturedPhotosData = formData.get('capturedPhotosData') as string | null;
    const mode = formData.get('mode') as string;
    const useDefaultTemplate = formData.get('useDefaultTemplate') === 'true';
    const adminCode = ((formData.get('adminCode') as string | null) ?? '').trim();
    const envAdminCode = (process.env.ADMIN_CODE ?? '').trim();
    const cardsPerPage = formData.get('cardsPerPage')
      ? Number(formData.get('cardsPerPage'))
      : PDF_CARDS_PER_PAGE.DEFAULT;


    if (!excelFile) {
      return NextResponse.json({ error: 'Falta el archivo Excel' }, { status: 400 });
    }
    if (!['single', 'multiple'].includes(mode)) {
      return NextResponse.json({ error: 'Modo de generacion invalido.' }, { status: 400 });
    }
    if (
      !Number.isFinite(cardsPerPage)
      || cardsPerPage < PDF_CARDS_PER_PAGE.MIN
      || cardsPerPage > PDF_CARDS_PER_PAGE.MAX
    ) {
      return NextResponse.json({ error: 'Cantidad de carnets por pagina invalida.' }, { status: 400 });
    }
    if (excelFile.size === 0 || excelFile.size > FILE_SIZE_LIMITS.EXCEL) {
      return NextResponse.json({ error: 'Archivo Excel invalido o demasiado grande.' }, { status: 400 });
    }
    if (excelFile.type && !ALLOWED_EXCEL_MIME_TYPES.includes(excelFile.type as any)) {
      return NextResponse.json({ error: 'Tipo de archivo Excel no permitido.' }, { status: 400 });
    }
    if (photosZip && photosZip.size > FILE_SIZE_LIMITS.ZIP) {
      return NextResponse.json(
        { error: 'El archivo ZIP de fotos supera el tamano permitido.' },
        { status: 400 },
      );
    }
    if (capturedPhotosData) {
      const capturedSize = Buffer.byteLength(capturedPhotosData, 'utf8');
      if (capturedSize > FILE_SIZE_LIMITS.CAPTURED_PHOTOS) {
        return NextResponse.json(
          { error: 'Las fotos capturadas superan el tamano permitido.' },
          { status: 400 },
        );
      }
    }


    if (adminCode && !verifyAdminCode(adminCode, envAdminCode)) {
      requestLogger.warn('Invalid admin code submitted');
      return NextResponse.json(
        { adminCodeError: 'Codigo de asesor incorrecto.' },
        { status: 401 },
      );
    }
    const isAdmin = verifyAdminCode(adminCode, envAdminCode);

    let data = await parseExcelFile(excelFile);

    if (data.length === 0) {
      return NextResponse.json({ error: 'El Excel no contiene registros validos.' }, { status: 400 });
    }
    if (data.length > RECORD_LIMITS.ABSOLUTE_MAX) {
      return NextResponse.json(
        { error: `Se excede el maximo permitido de ${RECORD_LIMITS.ABSOLUTE_MAX} registros.` },
        { status: 400 },
      );
    }
    data = limitRecords(data, isAdmin);

    const zipPhotosMap = await buildPhotosMapByIdentification(photosZip);
    const capturedPhotosMap = buildCapturedPhotosMapByIdentification(capturedPhotosData);
    const photosMap = mergePhotosMaps(zipPhotosMap, capturedPhotosMap);


    let templateHtml: string;
    const origin = request.nextUrl.origin;

    if (useDefaultTemplate) {
      const credentialLevel =
        (formData.get('credentialLevel') as string) === 'business' ? 'business' : 'student';
      const schoolName = ((formData.get('schoolName') as string) ?? 'Colegio Estrella del Sur').trim();
      const includeSEDLogo = formData.get('includeSEDLogo') === 'true';
      const alternativeCityHallLogo = formData.get('alternativeCityHallLogo') as File | null;
      const schoolLogo = formData.get('schoolLogo') as File | null;
      const colorThemeStr = formData.get('colorTheme') as string | null;

      let colorTheme: Record<string, string> | null = null;
      if (colorThemeStr) {
        try { colorTheme = JSON.parse(colorThemeStr); } catch { }
      }

      templateHtml = await buildDefaultTemplate({
        credentialLevel,
        schoolName,
        includeSEDLogo,
        alternativeCityHallLogo,
        schoolLogo,
        colorTheme,
      });
    } else {
      const templateFile = formData.get('templateFile') as File;
      if (!templateFile) {
        return NextResponse.json({ error: 'Falta la plantilla' }, { status: 400 });
      }
      try {
        templateHtml = await buildCustomTemplate(templateFile);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al procesar la plantilla.';
        requestLogger.warn('Custom template rejected', {
          message,
        });
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const addWatermark = shouldAddWatermark(isAdmin);

    if (mode === 'single') {
      const pdf = await generateSinglePDF(data, templateHtml, cardsPerPage, origin, photosMap, addWatermark);
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="carnets_todos.pdf"',
        },
      });
    }

    const pdfBuffers = await generateMultiplePDFs(data, templateHtml, origin, photosMap, addWatermark);
    const zip = new JSZip();
    pdfBuffers.forEach((buf, idx) => {
      const student = data[idx] ?? {};
      const nombre = (student.nombres || 'carnet').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      const curso = (student.curso || student.cargo || '').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      const identificacion = (student.identificacion || '').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      const base = [nombre, curso || undefined, identificacion || undefined].filter(Boolean).join('_');
      zip.file(`${base || `carnet_${idx + 1}`}.pdf`, buf);
    });

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="carnets_individuales.zip"',
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generando PDFs';
    requestLogger.error('Unhandled error while generating PDFs', {
      error,
    });
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

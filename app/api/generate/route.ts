import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_EXCEL_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_TEMPLATE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_ZIP_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_CAPTURED_PHOTOS_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_ROWS_ABSOLUTE = 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;

const requestHits = new Map<string, number[]>();

function getRedisConfig() {
  const redisUrl = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const redisToken = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!redisUrl || !redisToken) {
    return null;
  }

  return { redisUrl, redisToken };
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeTemplateHtml(input: string): string {
  let sanitized = input;

  // Remove active content tags that can execute JS or load remote content.
  sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, '');
  sanitized = sanitized.replace(/<link[^>]*>/gi, '');
  sanitized = sanitized.replace(/<meta[^>]*http-equiv[^>]*>/gi, '');

  // Remove inline event handlers.
  sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  // Neutralize javascript: URLs.
  sanitized = sanitized.replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"');
  sanitized = sanitized.replace(/(href|src)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'");
  sanitized = sanitized.replace(/\ssrcdoc\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\ssrcdoc\s*=\s*'[^']*'/gi, '');

  return sanitized;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

function isRateLimitedInMemory(clientIp: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const hits = requestHits.get(clientIp) || [];
  const freshHits = hits.filter((t) => t > cutoff);

  if (freshHits.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestHits.set(clientIp, freshHits);
    return true;
  }

  freshHits.push(now);
  requestHits.set(clientIp, freshHits);
  return false;
}

async function isRateLimited(clientIp: string): Promise<boolean> {
  const redisConfig = getRedisConfig();
  if (!redisConfig) {
    return isRateLimitedInMemory(clientIp);
  }

  const { redisUrl, redisToken } = redisConfig;
  const key = `rate:generate:${clientIp}`;
  const encodedKey = encodeURIComponent(key);

  try {
    const incrementResponse = await fetch(`${redisUrl}/incr/${encodedKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
      cache: 'no-store',
    });

    if (!incrementResponse.ok) {
      return isRateLimitedInMemory(clientIp);
    }

    const incrementResult = await incrementResponse.json();
    const count = Number(incrementResult?.result || 0);

    await fetch(`${redisUrl}/pexpire/${encodedKey}/${RATE_LIMIT_WINDOW_MS}/NX`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
      cache: 'no-store',
    });

    return count > RATE_LIMIT_MAX_REQUESTS;
  } catch {
    return isRateLimitedInMemory(clientIp);
  }
}

function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return true;
  }

  const currentOrigin = request.nextUrl.origin;
  const allowListRaw = process.env.ALLOWED_ORIGINS || '';
  const allowList = allowListRaw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (allowList.length === 0) {
    return origin === currentOrigin;
  }

  return allowList.includes(origin);
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (await isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    if (!isOriginAllowed(request)) {
      return NextResponse.json(
        { error: 'Origen de solicitud no permitido.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const excelFile = formData.get('excelFile') as File;
    const photosZip = formData.get('photosZip') as File | null;
    const capturedPhotosData = formData.get('capturedPhotosData') as string | null;
    const mode = formData.get('mode') as string;
    const useDefaultTemplate = formData.get('useDefaultTemplate') === 'true';
    const adminCode = ((formData.get('adminCode') as string | null) || '').trim();
    const envAdminCode = (process.env.ADMIN_CODE || '').trim();
    const cardsPerPageParam = formData.get('cardsPerPage');
    const cardsPerPage = cardsPerPageParam ? Number(cardsPerPageParam) : 8;

    let templateHtml: string;

    if (!excelFile) {
      return NextResponse.json(
        { error: 'Falta el archivo Excel' },
        { status: 400 }
      );
    }

    if (!['single', 'multiple'].includes(mode)) {
      return NextResponse.json(
        { error: 'Modo de generacion invalido.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(cardsPerPage) || cardsPerPage < 1 || cardsPerPage > 8) {
      return NextResponse.json(
        { error: 'Cantidad de carnets por pagina invalida.' },
        { status: 400 }
      );
    }

    if (excelFile.size === 0 || excelFile.size > MAX_EXCEL_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Archivo Excel invalido o demasiado grande.' },
        { status: 400 }
      );
    }

    const allowedExcelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (excelFile.type && !allowedExcelTypes.includes(excelFile.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo Excel no permitido.' },
        { status: 400 }
      );
    }

    if (photosZip && photosZip.size > MAX_ZIP_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'El archivo ZIP de fotos supera el tamano permitido.' },
        { status: 400 }
      );
    }

    if (capturedPhotosData) {
      const capturedSize = Buffer.byteLength(capturedPhotosData, 'utf8');
      if (capturedSize > MAX_CAPTURED_PHOTOS_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'Las fotos capturadas superan el tamano permitido.' },
          { status: 400 }
        );
      }
    }

    if (adminCode && (!envAdminCode || adminCode !== envAdminCode)) {
      return NextResponse.json(
        { adminCodeError: 'Codigo de asesor incorrecto.' },
        { status: 401 }
      );
    }

    const isAdmin = Boolean(adminCode && envAdminCode && adminCode === envAdminCode);

    const excelBuffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(excelBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    let data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'El Excel no contiene registros validos.' },
        { status: 400 }
      );
    }

    if (data.length > MAX_ROWS_ABSOLUTE) {
      return NextResponse.json(
        { error: `Se excede el maximo permitido de ${MAX_ROWS_ABSOLUTE} registros.` },
        { status: 400 }
      );
    }

    if (!isAdmin && data.length > 5) {
      data = data.slice(0, 5);
    }
    const zipPhotosMap = await buildPhotosMapByIdentification(photosZip);
    const capturedPhotosMap = buildCapturedPhotosMapByIdentification(capturedPhotosData);
    const photosMap = mergePhotosMaps(zipPhotosMap, capturedPhotosMap);

    const origin = request.nextUrl.origin;

    if (useDefaultTemplate) {
      const credentialLevel = (formData.get('credentialLevel') as string) === 'business' ? 'business' : 'student';
      const schoolName = (formData.get('schoolName') as string || 'Colegio Estrella del Sur').trim();
      const includeSEDLogo = formData.get('includeSEDLogo') === 'true';
      const alternativeCityHallLogo = formData.get('alternativeCityHallLogo') as File | null;
      const schoolLogo = formData.get('schoolLogo') as File | null;

      const templatePath = path.join(process.cwd(), 'public', 'templates', 'carnet-horizontal.html');
      templateHtml = fs.readFileSync(templatePath, 'utf-8');

      templateHtml = templateHtml.replace(/Colegio Estrella del Sur/g, escapeHtml(schoolName));
      if (credentialLevel === 'business') {
        templateHtml = templateHtml
          .replace(/Carnet Estudiantil/g, 'Carnet Empresarial')
          .replace(/>Curso</g, '>Cargo<')
          .replace(/Logo Colegio/g, 'Logo Institución');
      }

      let schoolLogoData = '/templates/logo_colegio.jpg';
      let cityHallLogoData = '/templates/logo_secretaria.jpg';

      if (schoolLogo) {
        const logoBuffer = await schoolLogo.arrayBuffer();
        const logoBase64 = Buffer.from(logoBuffer).toString('base64');
        const mimeType = schoolLogo.type || 'image/jpeg';
        schoolLogoData = `data:${mimeType};base64,${logoBase64}`;
      }

      if (credentialLevel === 'business') {
        cityHallLogoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      } else if (!includeSEDLogo) {
        if (alternativeCityHallLogo) {
          const logoBuffer = await alternativeCityHallLogo.arrayBuffer();
          const logoBase64 = Buffer.from(logoBuffer).toString('base64');
          const mimeType = alternativeCityHallLogo.type || 'image/jpeg';
          cityHallLogoData = `data:${mimeType};base64,${logoBase64}`;
        } else {
          cityHallLogoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }
      }

      templateHtml = templateHtml.replace(/\/templates\/logo_colegio\.jpg/g, schoolLogoData);
      templateHtml = templateHtml.replace(/\/templates\/logo_secretaria\.jpg/g, cityHallLogoData);

      // Aplicar tema de colores si se proporciona
      const colorThemeStr = formData.get('colorTheme') as string;
      if (colorThemeStr) {
        try {
          const colorTheme = JSON.parse(colorThemeStr);
          
          // Mapa de reemplazos de colores (original -> nuevo)
          const colorMap: Record<string, string> = {
            '#1e3a8a': colorTheme.gradientStart,
            '#3b82f6': colorTheme.gradientEnd,
            '#1e40af': colorTheme.border || colorTheme.titleColor,
            '#fbbf24': colorTheme.headerBorder || colorTheme.labelColor,
            '#ffffff': colorTheme.textColor,
          };

          // Reemplazar colores en la plantilla
          Object.entries(colorMap).forEach(([original, replacement]) => {
            const regex = new RegExp(original.replace(/#/g, '\\#'), 'g');
            templateHtml = templateHtml.replace(regex, replacement);
          });

          // Reemplazar gradiente completo
          templateHtml = templateHtml.replace(
            /linear-gradient\(135deg, #1e3a8a 0%, #3b82f6 100%\)/g,
            `linear-gradient(135deg, ${colorTheme.gradientStart} 0%, ${colorTheme.gradientEnd} 100%)`
          );
        } catch (err) {
          console.error('Error parsing color theme:', err);
        }
      }

    } else {
      const templateFile = formData.get('templateFile') as File;
      
      if (!templateFile) {
        return NextResponse.json(
          { error: 'Falta la plantilla' },
          { status: 400 }
        );
      }

      if (templateFile.size === 0 || templateFile.size > MAX_TEMPLATE_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'Plantilla invalida o demasiado grande.' },
          { status: 400 }
        );
      }

      const templateName = templateFile.name.toLowerCase();
      if (!templateName.endsWith('.html') && !templateName.endsWith('.htm')) {
        return NextResponse.json(
          { error: 'La plantilla debe ser un archivo HTML.' },
          { status: 400 }
        );
      }

      const templateBuffer = await templateFile.arrayBuffer();
      const decoder = new TextDecoder();
      templateHtml = sanitizeTemplateHtml(decoder.decode(templateBuffer));
    }

    const addWatermark = !isAdmin;

    if (mode === 'single') {
      const pdf = await generateSinglePDF(data, templateHtml, cardsPerPage, origin, photosMap, addWatermark);
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="carnets_todos.pdf"',
        },
      });
    } else {
      const pdfBuffers = await generateMultiplePDFs(data, templateHtml, origin, photosMap, addWatermark);

      const zip = new JSZip();
      pdfBuffers.forEach((buf, idx) => {
        const student = data[idx] || {};
        const nombre = (student.nombres || 'carnet').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
        const curso = (student.curso || student.cargo || '').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
        const identificacion = (student.identificacion || '').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
        const filenameBase = [nombre, curso || undefined, identificacion || undefined].filter(Boolean).join('_');
        const filename = `${filenameBase || `carnet_${idx + 1}`}.pdf`;
        zip.file(filename, buf);
      });

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

      return new NextResponse(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="carnets_individuales.zip"',
        },
      });
    }

  } catch (error: any) {
    console.error('Error generando PDFs:', error);
    return NextResponse.json(
      { error: error.message || 'Error generando PDFs' },
      { status: 500 }
    );
  }
}

function extractStyle(html: string): string {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1] : '';
}

function extractBodyInner(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

async function launchBrowser() {
  const isVercel = Boolean(process.env.VERCEL);

  if (isVercel) {
    const chromiumBinPath = path.join(process.cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin');
    const executablePath = await chromium.executablePath(chromiumBinPath);
    return puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  return puppeteer.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

const PHOTO_PLACEHOLDER_HTML = `
  <div class="photo-placeholder">
    <div class="photo-icon">👤</div>
    <div class="photo-text">3x4 cm</div>
  </div>
`;

function normalizeIdentifier(value: unknown): string {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function getPhotoMimeType(fileName: string): string | null {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return null;
  }
}

async function buildPhotosMapByIdentification(photosZip: File | null): Promise<Map<string, string>> {
  const photosMap = new Map<string, string>();

  if (!photosZip || photosZip.size === 0) {
    return photosMap;
  }

  const zipBuffer = await photosZip.arrayBuffer();
  const zip = await JSZip.loadAsync(zipBuffer);

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) {
      continue;
    }

    const mimeType = getPhotoMimeType(relativePath);
    if (!mimeType) {
      continue;
    }

    const baseName = path.basename(relativePath, path.extname(relativePath));
    const normalizedId = normalizeIdentifier(baseName);
    if (!normalizedId) {
      continue;
    }

    const base64 = await zipEntry.async('base64');
    photosMap.set(normalizedId, `data:${mimeType};base64,${base64}`);
  }

  return photosMap;
}

function buildCapturedPhotosMapByIdentification(rawData: string | null): Map<string, string> {
  const photosMap = new Map<string, string>();

  if (!rawData) {
    return photosMap;
  }

  try {
    const parsed = JSON.parse(rawData) as Record<string, string>;

    Object.entries(parsed).forEach(([rawId, dataUrl]) => {
      const normalizedId = normalizeIdentifier(rawId);
      if (!normalizedId) {
        return;
      }
      photosMap.set(normalizedId, dataUrl);
    });
  } catch (error) {
    console.error('Error parsing captured photos data:', error);
  }

  return photosMap;
}

function mergePhotosMaps(baseMap: Map<string, string>, overrideMap: Map<string, string>): Map<string, string> {
  const mergedMap = new Map<string, string>(baseMap);

  overrideMap.forEach((value, key) => {
    mergedMap.set(key, value);
  });

  return mergedMap;
}

function resolvePhotoHtml(student: any, photosMap: Map<string, string>): string {
  const studentId = normalizeIdentifier(student.identificacion);
  const photoDataUrl = studentId ? photosMap.get(studentId) : null;

  if (!photoDataUrl) {
    return PHOTO_PLACEHOLDER_HTML;
  }

  return `<img src="${photoDataUrl}" alt="Foto" style="width: 100%; height: 100%; object-fit: cover;" />`;
}

async function generateSinglePDF(
  data: any[],
  templateHtml: string,
  cardsPerPage: number,
  baseHref: string,
  photosMap: Map<string, string>,
  addWatermark: boolean = false
): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    const templateStyle = extractStyle(templateHtml);
    const carnetInner = extractBodyInner(templateHtml);

    const columns = 2;
    const rows = 4;
    const perPage = Math.max(1, Math.min(cardsPerPage, columns * rows));

    const pagesHtml: string[] = [];
    for (let i = 0; i < data.length; i += perPage) {
      const chunk = data.slice(i, i + perPage);
      let gridItemsHtml = '';
      for (const student of chunk) {
        const courseOrRole = escapeHtml(student.curso || student.cargo || '');
        let cardHtml = carnetInner
          .replace(/\{\{NOMBRES\}\}/g, escapeHtml(student.nombres || ''))
          .replace(/\{\{CURSO\}\}/g, courseOrRole)
          .replace(/\{\{IDENTIFICACION\}\}/g, escapeHtml(student.identificacion || ''))
          .replace(/\{\{FOTO_HTML\}\}/g, resolvePhotoHtml(student, photosMap));
        if (addWatermark) {
          cardHtml = `<div style="position:relative;width:100%;height:100%;">${cardHtml}<div style="position:absolute;top:40%;left:10%;width:80%;height:40px;background:rgba(0,0,0,0.15);color:#fff;font-size:24px;text-align:center;z-index:999;font-weight:bold;transform:rotate(-10deg);pointer-events:none;">VERSIÓN DE PRUEBA</div></div>`;
        }
        gridItemsHtml += `\n${cardHtml}\n`;
      }

      const pageHtml = `
        <div class="page" style="position:relative;">
          <div class="grid">${gridItemsHtml}</div>
        </div>
      `;
      pagesHtml.push(pageHtml);
    }

    const allHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <base href="${baseHref}" />
        <style>
          @page { size: A4; margin: 0; }
          html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
          .page { width: 210mm; height: 297mm; page-break-after: always; display: block; }
          .grid {
            width: 210mm; height: 297mm; margin: 0; padding: 0;
            display: grid;
            grid-template-columns: repeat(${columns}, 8.5cm);
            grid-auto-rows: 5.5cm;
            justify-content: center;
            align-content: center;
            gap: 0.5cm;
          }
          /* Estilos originales de la plantilla */
          ${templateStyle}
        </style>
      </head>
      <body>
        ${pagesHtml.join('\n')}
      </body>
      </html>
    `;

    await page.setContent(allHtml, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function generateMultiplePDFs(
  data: any[],
  templateHtml: string,
  baseHref: string,
  photosMap: Map<string, string>,
  addWatermark: boolean = false
): Promise<Buffer[]> {
  const pdfs: Buffer[] = [];
  const browser = await launchBrowser();

  try {
    const templateStyle = extractStyle(templateHtml);
    const carnetInner = extractBodyInner(templateHtml);

    for (const student of data) {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

      const courseOrRole = escapeHtml(student.curso || student.cargo || '');
      let filledCard = carnetInner
        .replace(/\{\{NOMBRES\}\}/g, escapeHtml(student.nombres || ''))
        .replace(/\{\{CURSO\}\}/g, courseOrRole)
        .replace(/\{\{IDENTIFICACION\}\}/g, escapeHtml(student.identificacion || ''))
        .replace(/\{\{FOTO_HTML\}\}/g, resolvePhotoHtml(student, photosMap));
      if (addWatermark) {
        filledCard += `<div style="position:absolute;top:40%;left:10%;width:80%;height:40px;background:rgba(0,0,0,0.15);color:#fff;font-size:24px;text-align:center;z-index:999;font-weight:bold;transform:rotate(-10deg);pointer-events:none;">VERSIÓN DE PRUEBA</div>`;
      }

      const a4Html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <base href="${baseHref}" />
          <style>
            @page { size: A4; margin: 0; }
            html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
            body { display: flex; align-items: center; justify-content: center; }
            /* Estilos originales de la plantilla */
            ${templateStyle}
          </style>
        </head>
        <body>
          ${filledCard}
        </body>
        </html>
      `;

      await page.setContent(a4Html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true,
      });

      pdfs.push(Buffer.from(pdf));
      await page.close();
    }

    return pdfs;
  } finally {
    await browser.close();
  }
}

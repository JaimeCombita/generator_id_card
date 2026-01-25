import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import JSZip from 'jszip';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const excelFile = formData.get('excelFile') as File;
    const templateFile = formData.get('templateFile') as File;
    const mode = formData.get('mode') as string; // 'single' o 'multiple'
    const cardsPerPageParam = formData.get('cardsPerPage');
    const cardsPerPage = cardsPerPageParam ? Number(cardsPerPageParam) : 8; // por defecto 8 (2x4 en A4)

    if (!excelFile || !templateFile) {
      return NextResponse.json(
        { error: 'Faltan archivos requeridos' },
        { status: 400 }
      );
    }

    // Leer archivo Excel
    const excelBuffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(excelBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    // Leer plantilla HTML
    const templateBuffer = await templateFile.arrayBuffer();
    const decoder = new TextDecoder();
    const templateHtml = decoder.decode(templateBuffer);

    const origin = request.nextUrl.origin;

    if (mode === 'single') {
      const pdf = await generateSinglePDF(data, templateHtml, cardsPerPage, origin);
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="carnets_todos.pdf"',
        },
      });
    } else {
      const pdfBuffers = await generateMultiplePDFs(data, templateHtml, origin);

      // Crear archivo ZIP con todos los PDFs
      const zip = new JSZip();
      pdfBuffers.forEach((buf, idx) => {
        const student = data[idx] || {};
        const nombre = (student.nombres || 'carnet').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
        const curso = (student.curso || '').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
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

async function generateSinglePDF(data: any[], templateHtml: string, cardsPerPage: number, baseHref: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    // Vista no es crítica para PDF, pero mantener A4
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    // Extraer estilos y contenido de la plantilla
    const templateStyle = extractStyle(templateHtml);
    const carnetInner = extractBodyInner(templateHtml);

    // Construir páginas con múltiples carnets por A4
    const columns = 2; // 2 columnas de 8.5cm
    const rows = 4; // 4 filas de 5.5cm
    const perPage = Math.max(1, Math.min(cardsPerPage, columns * rows));

    const pagesHtml: string[] = [];
    for (let i = 0; i < data.length; i += perPage) {
      const chunk = data.slice(i, i + perPage);
      let gridItemsHtml = '';
      for (const student of chunk) {
        const cardHtml = carnetInner
          .replace(/\{\{NOMBRES\}\}/g, student.nombres || '')
          .replace(/\{\{CURSO\}\}/g, student.curso || '')
          .replace(/\{\{IDENTIFICACION\}\}/g, student.identificacion || '');
        gridItemsHtml += `\n${cardHtml}\n`;
      }

      const pageHtml = `
        <div class="page">
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

async function generateMultiplePDFs(data: any[], templateHtml: string, baseHref: string): Promise<Buffer[]> {
  const pdfs: Buffer[] = [];
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const templateStyle = extractStyle(templateHtml);
    const carnetInner = extractBodyInner(templateHtml);

    for (const student of data) {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

      const filledCard = carnetInner
        .replace(/\{\{NOMBRES\}\}/g, student.nombres || '')
        .replace(/\{\{CURSO\}\}/g, student.curso || '')
        .replace(/\{\{IDENTIFICACION\}\}/g, student.identificacion || '');

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

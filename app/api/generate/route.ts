import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const excelFile = formData.get('excelFile') as File;
    const mode = formData.get('mode') as string;
    const useDefaultTemplate = formData.get('useDefaultTemplate') === 'true';
    const cardsPerPageParam = formData.get('cardsPerPage');
    const cardsPerPage = cardsPerPageParam ? Number(cardsPerPageParam) : 8;

    let templateHtml: string;

    if (!excelFile) {
      return NextResponse.json(
        { error: 'Falta el archivo Excel' },
        { status: 400 }
      );
    }

    const excelBuffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(excelBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const origin = request.nextUrl.origin;

    if (useDefaultTemplate) {
      const schoolName = formData.get('schoolName') as string || 'Colegio Estrella del Sur';
      const includeSEDLogo = formData.get('includeSEDLogo') === 'true';
      const alternativeCityHallLogo = formData.get('alternativeCityHallLogo') as File | null;
      const schoolLogo = formData.get('schoolLogo') as File | null;

      const templatePath = path.join(process.cwd(), 'public', 'templates', 'carnet-horizontal.html');
      templateHtml = fs.readFileSync(templatePath, 'utf-8');

      templateHtml = templateHtml.replace(/Colegio Estrella del Sur/g, schoolName);

      let schoolLogoData = '/templates/logo_colegio.jpg';
      let cityHallLogoData = '/templates/logo_secretaria.jpg';

      if (schoolLogo) {
        const logoBuffer = await schoolLogo.arrayBuffer();
        const logoBase64 = Buffer.from(logoBuffer).toString('base64');
        const mimeType = schoolLogo.type || 'image/jpeg';
        schoolLogoData = `data:${mimeType};base64,${logoBase64}`;
      }

      if (!includeSEDLogo) {
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

    } else {
      const templateFile = formData.get('templateFile') as File;
      
      if (!templateFile) {
        return NextResponse.json(
          { error: 'Falta la plantilla' },
          { status: 400 }
        );
      }

      const templateBuffer = await templateFile.arrayBuffer();
      const decoder = new TextDecoder();
      templateHtml = decoder.decode(templateBuffer);
    }

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

async function generateSinglePDF(data: any[], templateHtml: string, cardsPerPage: number, baseHref: string): Promise<Buffer> {
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
  const browser = await launchBrowser();

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

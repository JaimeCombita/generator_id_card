import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const excelFile = formData.get('excelFile') as File;
    const templateFile = formData.get('templateFile') as File;
    const mode = formData.get('mode') as string; // 'single' o 'multiple'

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

    if (mode === 'single') {
      const pdf = await generateSinglePDF(data, templateHtml);
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="carnets_todos.pdf"',
        },
      });
    } else {
      const pdf = await generateMultiplePDFs(data, templateHtml);
      return new NextResponse(pdf[0], {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="carnets.pdf"',
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

async function generateSinglePDF(data: any[], templateHtml: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 321,
      height: 208,
      deviceScaleFactor: 2,
    });

    // Crear HTML con todos los carnets
    let allCarnetsHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 85mm 55mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .page-break {
            page-break-after: always;
          }
        </style>
      </head>
      <body>
    `;

    data.forEach((student, index) => {
      let carnetHtml = templateHtml
        .replace(/\{\{NOMBRES\}\}/g, student.nombres || '')
        .replace(/\{\{CURSO\}\}/g, student.curso || '')
        .replace(/\{\{IDENTIFICACION\}\}/g, student.identificacion || '');
      
      if (index < data.length - 1) {
        carnetHtml = carnetHtml.replace('</body>', '<div class="page-break"></div></body>');
      }
      
      allCarnetsHtml += carnetHtml;
    });

    allCarnetsHtml += '</body></html>';

    await page.setContent(allCarnetsHtml, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: undefined,
      width: '85mm',
      height: '55mm',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function generateMultiplePDFs(data: any[], templateHtml: string): Promise<Buffer[]> {
  const pdfs: Buffer[] = [];
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const student of data) {
      const page = await browser.newPage();
      
      await page.setViewport({
        width: 321,
        height: 208,
        deviceScaleFactor: 2,
      });

      let carnetHtml = templateHtml
        .replace(/\{\{NOMBRES\}\}/g, student.nombres || '')
        .replace(/\{\{CURSO\}\}/g, student.curso || '')
        .replace(/\{\{IDENTIFICACION\}\}/g, student.identificacion || '');

      await page.setContent(carnetHtml, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: undefined,
        width: '85mm',
        height: '55mm',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      pdfs.push(Buffer.from(pdf));
      await page.close();
    }

    return pdfs;
  } finally {
    await browser.close();
  }
}

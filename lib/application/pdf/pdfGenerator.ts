import { escapeHtml } from '@/lib/infrastructure/security/htmlEscaper';
import { resolvePhotoHtml } from '@/lib/application/photos/photoService';
import { launchBrowser } from './browser';

const WATERMARK_HTML =
  '<div style="position:absolute;top:40%;left:10%;width:80%;height:40px;background:rgba(0,0,0,0.15);color:#fff;font-size:24px;text-align:center;z-index:999;font-weight:bold;transform:rotate(-10deg);pointer-events:none;">VERSIÓN DE PRUEBA</div>';

function extractStyle(html: string): string {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1] : '';
}

function extractBodyInner(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

function buildCardHtml(
  student: any,
  carnetInner: string,
  photosMap: Map<string, string>,
  addWatermark: boolean,
): string {
  const courseOrRole = escapeHtml(student.curso || student.cargo || '');
  let cardHtml = carnetInner
    .replace(/\{\{NOMBRES\}\}/g, escapeHtml(student.nombres || ''))
    .replace(/\{\{CURSO\}\}/g, courseOrRole)
    .replace(/\{\{IDENTIFICACION\}\}/g, escapeHtml(student.identificacion || ''))
    .replace(/\{\{FOTO_HTML\}\}/g, resolvePhotoHtml(student, photosMap));

  if (addWatermark) {
    cardHtml = `<div style="position:relative;width:100%;height:100%;">${cardHtml}${WATERMARK_HTML}</div>`;
  }

  return cardHtml;
}

export async function generateSinglePDF(
  data: any[],
  templateHtml: string,
  cardsPerPage: number,
  baseHref: string,
  photosMap: Map<string, string>,
  addWatermark = false,
): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    const templateStyle = extractStyle(templateHtml);
    const carnetInner = extractBodyInner(templateHtml);

    const columns = 2;
    const perPage = Math.max(1, Math.min(cardsPerPage, columns * 4));

    const pagesHtml = [];
    for (let i = 0; i < data.length; i += perPage) {
      const chunk = data.slice(i, i + perPage);
      const gridItems = chunk
        .map((student) => buildCardHtml(student, carnetInner, photosMap, addWatermark))
        .join('\n');
      pagesHtml.push(`
        <div class="page" style="position:relative;">
          <div class="grid">${gridItems}</div>
        </div>
      `);
    }

    const fullHtml = `<!DOCTYPE html>
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
    ${templateStyle}
  </style>
</head>
<body>
  ${pagesHtml.join('\n')}
</body>
</html>`;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
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

export async function generateMultiplePDFs(
  data: any[],
  templateHtml: string,
  baseHref: string,
  photosMap: Map<string, string>,
  addWatermark = false,
): Promise<Buffer[]> {
  const pdfs: Buffer[] = [];
  const browser = await launchBrowser();
  try {
    const templateStyle = extractStyle(templateHtml);
    const carnetInner = extractBodyInner(templateHtml);

    for (const student of data) {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

      const filledCard = buildCardHtml(student, carnetInner, photosMap, addWatermark);

      const a4Html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <base href="${baseHref}" />
  <style>
    @page { size: A4; margin: 0; }
    html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
    body { display: flex; align-items: center; justify-content: center; }
    ${templateStyle}
  </style>
</head>
<body>
  ${filledCard}
</body>
</html>`;

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

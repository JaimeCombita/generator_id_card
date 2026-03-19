import * as fs from 'fs';
import * as path from 'path';
import { escapeHtml } from '@/lib/infrastructure/security/htmlEscaper';
import { sanitizeTemplateHtml } from '@/lib/infrastructure/security/htmlSanitizer';
import { FILE_SIZE_LIMITS, TRANSPARENT_1PX_PNG } from '@/lib/infrastructure/config/constants';

export type CredentialLevel = 'student' | 'business';

export interface DefaultTemplateOptions {
  credentialLevel: CredentialLevel;
  schoolName: string;
  includeSEDLogo: boolean;
  alternativeCityHallLogo: File | null;
  schoolLogo: File | null;
  colorTheme: Record<string, string> | null;
}

async function encodeFileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = file.type || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

export async function buildDefaultTemplate(options: DefaultTemplateOptions): Promise<string> {
  const templatePath = path.join(
    process.cwd(),
    'public',
    'templates',
    'carnet-horizontal.html',
  );
  let html = fs.readFileSync(templatePath, 'utf-8');

  html = html.replace(/Colegio Estrella del Sur/g, escapeHtml(options.schoolName));

  if (options.credentialLevel === 'business') {
    html = html
      .replace(/Carnet Estudiantil/g, 'Carnet Empresarial')
      .replace(/>Curso</g, '>Cargo<')
      .replace(/Logo Colegio/g, 'Logo InstituciÃ³n');
  }

  let schoolLogoData = '/templates/logos/logo_colegio.jpg';
  if (options.schoolLogo) {
    schoolLogoData = await encodeFileToDataUrl(options.schoolLogo);
  }

  let cityHallLogoData = '/templates/logos/logo_secretaria.jpg';
  if (options.credentialLevel === 'business') {
    cityHallLogoData = TRANSPARENT_1PX_PNG;
  } else if (!options.includeSEDLogo) {
    cityHallLogoData = options.alternativeCityHallLogo
      ? await encodeFileToDataUrl(options.alternativeCityHallLogo)
      : TRANSPARENT_1PX_PNG;
  }

  html = html.replace(/\/templates\/logo_colegio\.jpg/g, schoolLogoData);
  html = html.replace(/\/templates\/logo_secretaria\.jpg/g, cityHallLogoData);

  if (options.colorTheme) {
    const theme = options.colorTheme;
    const colorMap: Record<string, string> = {
      '#1e3a8a': theme.gradientStart,
      '#3b82f6': theme.gradientEnd,
      '#1e40af': theme.border ?? theme.titleColor,
      '#fbbf24': theme.headerBorder ?? theme.labelColor,
      '#ffffff': theme.textColor,
    };

    Object.entries(colorMap).forEach(([original, replacement]) => {
      if (!replacement) return;
      const regex = new RegExp(original.replace(/#/g, '\\#'), 'g');
      html = html.replace(regex, replacement);
    });

    if (theme.gradientStart && theme.gradientEnd) {
      html = html.replace(
        /linear-gradient\(135deg, #1e3a8a 0%, #3b82f6 100%\)/g,
        `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
      );
    }
  }

  return html;
}

export async function buildCustomTemplate(templateFile: File): Promise<string> {
  if (templateFile.size === 0 || templateFile.size > FILE_SIZE_LIMITS.TEMPLATE) {
    throw new Error('Plantilla invalida o demasiado grande.');
  }

  const name = templateFile.name.toLowerCase();
  if (!name.endsWith('.html') && !name.endsWith('.htm')) {
    throw new Error('La plantilla debe ser un archivo HTML.');
  }

  const buffer = await templateFile.arrayBuffer();
  const html = new TextDecoder().decode(buffer);
  return sanitizeTemplateHtml(html);
}


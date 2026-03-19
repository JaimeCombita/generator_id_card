import JSZip from 'jszip';
import * as path from 'path';
import { normalizeIdentifier } from '@/lib/domain/carnet/carnetService';
import {
  ALLOWED_PHOTO_EXTENSIONS,
  PHOTO_MIME_BY_EXTENSION,
} from '@/lib/infrastructure/config/constants';
import { logger } from '@/lib/infrastructure/logging/logger';

const PHOTO_PLACEHOLDER_HTML = `
  <div class="photo-placeholder">
    <div class="photo-icon">👤</div>
    <div class="photo-text">3x4 cm</div>
  </div>
`;

function getPhotoMimeType(fileName: string): string | null {
  const extension = path.extname(fileName).toLowerCase() as (typeof ALLOWED_PHOTO_EXTENSIONS)[number];
  return PHOTO_MIME_BY_EXTENSION[extension] ?? null;
}

export async function buildPhotosMapByIdentification(
  photosZip: File | null,
): Promise<Map<string, string>> {
  const photosMap = new Map<string, string>();
  if (!photosZip || photosZip.size === 0) return photosMap;

  const zipBuffer = await photosZip.arrayBuffer();
  const zip = await JSZip.loadAsync(zipBuffer);

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    const mimeType = getPhotoMimeType(relativePath);
    if (!mimeType) continue;

    const baseName = path.basename(relativePath, path.extname(relativePath));
    const normalizedId = normalizeIdentifier(baseName);
    if (!normalizedId) continue;

    const base64 = await zipEntry.async('base64');
    photosMap.set(normalizedId, `data:${mimeType};base64,${base64}`);
  }

  return photosMap;
}

export function buildCapturedPhotosMapByIdentification(
  rawData: string | null,
): Map<string, string> {
  const photosMap = new Map<string, string>();
  if (!rawData) return photosMap;

  try {
    const parsed = JSON.parse(rawData) as Record<string, string>;
    Object.entries(parsed).forEach(([rawId, dataUrl]) => {
      const normalizedId = normalizeIdentifier(rawId);
      if (!normalizedId) return;
      photosMap.set(normalizedId, dataUrl);
    });
  } catch (error) {
    logger.warn('Invalid captured photos payload', {
      scope: 'photos.capture-map',
      error,
    });
  }

  return photosMap;
}

export function mergePhotosMaps(
  baseMap: Map<string, string>,
  overrideMap: Map<string, string>,
): Map<string, string> {
  const merged = new Map<string, string>(baseMap);
  overrideMap.forEach((value, key) => merged.set(key, value));
  return merged;
}

export function resolvePhotoHtml(student: any, photosMap: Map<string, string>): string {
  const studentId = normalizeIdentifier(student.identificacion);
  const photoDataUrl = studentId ? photosMap.get(studentId) : null;

  if (!photoDataUrl) return PHOTO_PLACEHOLDER_HTML;
  return `<img src="${photoDataUrl}" alt="Foto" style="width: 100%; height: 100%; object-fit: cover;" />`;
}

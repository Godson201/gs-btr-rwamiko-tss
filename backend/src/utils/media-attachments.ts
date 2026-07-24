import { extname } from 'path';
import { AttachmentType } from '@prisma/client';
import mime from 'mime-types';

// Documents are an explicit allowlist (not a wildcard like image/video/audio) so we never accept
// arbitrary application/* types (e.g. executables) — this list covers the common office/PDF/text
// formats a school would realistically receive.
const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/rtf',
  'text/plain',
  'text/csv',
]);

export function isAllowedMediaMime(mimetype: string): boolean {
  return (
    mimetype.startsWith('image/') ||
    mimetype.startsWith('video/') ||
    mimetype.startsWith('audio/') ||
    DOCUMENT_MIME_TYPES.has(mimetype)
  );
}

export function attachmentTypeFromMime(mimetype: string): AttachmentType {
  if (mimetype.startsWith('image/')) return AttachmentType.IMAGE;
  if (mimetype.startsWith('video/')) return AttachmentType.VIDEO;
  if (mimetype.startsWith('audio/')) return AttachmentType.AUDIO;
  return AttachmentType.DOCUMENT;
}

/**
 * Some containers (notably .webm) map to the wrong Content-Type when served by extension alone —
 * mime-types defaults ".webm" to "video/webm" even for audio recordings, so a voice note saved
 * with that extension gets served as video and browsers refuse to play it as audio. Deriving the
 * saved file's extension from its actual mimetype (e.g. audio/webm -> .weba) keeps the extension
 * and the Content-Type Express serves back in sync.
 */
export function extensionFromMime(mimetype: string, originalFilename: string): string {
  return mime.extension(mimetype) || extname(originalFilename).replace(/^\./, '') || 'bin';
}

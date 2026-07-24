import { AttachmentType } from '@prisma/client';

export const MEDIA_MIME_PATTERN =
  /^(image\/(png|jpe?g|gif|webp)|video\/(mp4|webm|quicktime)|audio\/(webm|mp4|mpeg|ogg|wav|x-wav)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|vnd\.ms-(excel|powerpoint))|text\/plain)$/;

export function attachmentTypeFromMime(mimetype: string): AttachmentType {
  if (mimetype.startsWith('image/')) return AttachmentType.IMAGE;
  if (mimetype.startsWith('video/')) return AttachmentType.VIDEO;
  if (mimetype.startsWith('audio/')) return AttachmentType.AUDIO;
  return AttachmentType.DOCUMENT;
}

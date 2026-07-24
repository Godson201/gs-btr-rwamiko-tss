// Keep in sync with backend/.env MAX_FILE_SIZE
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = '20MB';

export const ATTACHMENT_ACCEPT =
  'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp';

export function isFileTooLarge(file: File): boolean {
  return file.size > MAX_FILE_SIZE_BYTES;
}

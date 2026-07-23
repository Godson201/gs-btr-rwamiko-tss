export interface UploadedSpreadsheetFile {
  buffer: Buffer;
  originalname: string;
}

export interface UploadedMediaFile {
  filename: string;
  originalname: string;
  mimetype: string;
}

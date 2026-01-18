export interface ResultFileResponseDto {
  fileId: string;
  relativePath: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}
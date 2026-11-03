export interface WeddingConfigData {
  id: string;
  weddingTitle: string;
  coupleNames: string;
  weddingDate: string;
  venue: string;
  welcomeMessage: string;
  allowVideoUploads: boolean;
  allowGuestDownloads?: boolean;
  maxFilesPerUpload: number;
  maxFileSizeMb: number;
  isUploadActive: boolean;
  isGalleryPublic: boolean;
  themePrimaryColor: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface PhotoData {
  id: string;
  originalFileName: string;
  sanitizedFileName?: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
  guestName?: string | null;
  guestCaption?: string | null;
  storageProvider?: string;
  status: 'APPROVED' | 'PENDING' | 'HIDDEN';
  createdAt: string;
  updatedAt: string;
}

export interface GalleryResponse {
  photos: PhotoData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UploadResultItem {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface UploadApiResponse {
  success: boolean;
  message: string;
  uploaded: UploadResultItem[];
  failedCount: number;
  successCount: number;
}

import { getStoredToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';

export interface FileUploadResponse {
  id: number;
  fileUrl: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  
  // ?¸ì¦? ?† ?°?´ ?ˆ?œ¼ë©? ì¶”ê??
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // multipart/form-data?Š” ë¸Œë¼?š°???ê°? ??™?œ¼ë¡? Content-Type?„ ?„¤? •?•˜ë¯?ë¡? ëª…ì‹œ?•˜ì§? ?•Š?Œ

  const response = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = '?ŒŒ?¼ ?—…ë¡œë“œ?— ?‹¤?Œ¨?–ˆ?Šµ?‹ˆ?‹¤.';
    try {
      const errorText = await response.text();
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorText;
    } catch {
      // JSON ?ŒŒ?‹± ?‹¤?Œ¨ ?‹œ ê¸°ë³¸ ë©”ì‹œì§? ?‚¬?š©
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function deleteFile(fileId: number): Promise<void> {
  const headers: HeadersInit = {};
  
  // ?¸ì¦? ?† ?°?´ ?ˆ?œ¼ë©? ì¶”ê??
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: headers,
  });

  if (!response.ok) {
    let errorMessage = '?ŒŒ?¼ ?‚­? œ?— ?‹¤?Œ¨?–ˆ?Šµ?‹ˆ?‹¤.';
    try {
      const errorText = await response.text();
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorText;
    } catch {
      // JSON ?ŒŒ?‹± ?‹¤?Œ¨ ?‹œ ê¸°ë³¸ ë©”ì‹œì§? ?‚¬?š©
    }
    throw new Error(errorMessage);
  }
}

import imageCompression from 'browser-image-compression';

// 이미지 파일 검증 (실제 이미지 파일인지 확인)
export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // 파일 타입 검증
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 가능)' };
  }

  // 파일 크기 검증 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기가 10MB를 초과합니다.' };
  }

  // 실제 이미지 파일인지 확인 (헤더 검증)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 이미지 파일 시그니처 확인
      const signatures: { [key: string]: number[] } = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
      };

      const fileSignature = Array.from(uint8Array.slice(0, 4));
      const isValid = Object.values(signatures).some(sig => 
        sig.every((byte, index) => fileSignature[index] === byte)
      );

      if (isValid) {
        resolve({ valid: true });
      } else {
        resolve({ valid: false, error: '유효하지 않은 이미지 파일입니다.' });
      }
    };
    reader.onerror = () => {
      resolve({ valid: false, error: '파일을 읽을 수 없습니다.' });
    };
    reader.readAsArrayBuffer(file);
  });
}

// 이미지 압축 및 최적화
export async function compressImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
  }
): Promise<File> {
  const defaultOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    maxSizeMB: 2,
    useWebWorker: true,
  };

  const compressionOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    throw new Error('이미지 압축에 실패했습니다.');
  }
}

// 이미지를 Base64로 변환
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

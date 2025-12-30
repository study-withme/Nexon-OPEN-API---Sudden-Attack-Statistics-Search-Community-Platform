// 링크 미리보기 데이터 타입
export interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
}

// Open Graph 메타데이터 파싱 (CORS 제한으로 인해 프록시 필요할 수 있음)
export async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  try {
    // CORS 문제를 피하기 위해 간단한 프록시 사용 (실제로는 백엔드에서 처리하는 것이 좋음)
    // 여기서는 기본 정보만 반환
    const preview: LinkPreviewData = {
      url,
      title: new URL(url).hostname,
      description: url,
    };

    // 실제 구현 시 백엔드 API를 통해 Open Graph 메타데이터를 가져와야 함
    // 예: const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
    
    return preview;
  } catch (error) {
    console.error('링크 미리보기 가져오기 실패:', error);
    return {
      url,
      title: new URL(url).hostname,
      description: url,
    };
  }
}

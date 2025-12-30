// 자동 저장 관련 유틸리티

export interface AutoSaveData {
  title?: string;
  content?: string;
  category?: string;
  images?: string[];
  youtubeLinks?: string[];
  urlLinks?: Array<{ url: string; text: string }>;
  timestamp: number;
}

const STORAGE_PREFIX = 'editor_autosave_';

// 자동 저장 데이터 저장
export function saveAutoSaveData(key: string, data: Partial<AutoSaveData>): void {
  try {
    const fullData: AutoSaveData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(fullData));
  } catch (error) {
    console.error('자동 저장 실패:', error);
  }
}

// 자동 저장 데이터 불러오기
export function loadAutoSaveData(key: string): AutoSaveData | null {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!data) return null;

    const parsed = JSON.parse(data) as AutoSaveData;
    
    // 24시간 이상 된 데이터는 삭제
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > oneDay) {
      clearAutoSaveData(key);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('자동 저장 데이터 불러오기 실패:', error);
    return null;
  }
}

// 자동 저장 데이터 삭제
export function clearAutoSaveData(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error('자동 저장 데이터 삭제 실패:', error);
  }
}

// 모든 자동 저장 데이터 목록 가져오기
export function getAllAutoSaveKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key.replace(STORAGE_PREFIX, ''));
      }
    }
  } catch (error) {
    console.error('자동 저장 키 목록 가져오기 실패:', error);
  }
  return keys;
}

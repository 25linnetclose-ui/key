// API 관련 타입 정의

// 동화 페이지
export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  // 생성된 이미지 데이터 (옵셔널 — 이미지 생성 후 추가됨)
  imageBase64?: string;
  mimeType?: string;
}

// 동화 선택지
export interface StoryChoice {
  id: string;
  text: string;
}

// 동화 구조
export interface StoryData {
  title: string;
  pages: StoryPage[];
  choices: StoryChoice[];
}

// 저장되는 완성된 동화 (id, 날짜 포함)
export interface SavedStory {
  id: string;
  title: string;
  originalInput: string;
  pages: StoryPage[];
  choices: StoryChoice[];
  createdAt: string; // ISO 날짜 문자열
}

// 이미지 생성 API 응답
export interface ImageResponse {
  imageBase64: string;
  mimeType: string;
}

// 이야기 생성 API 응답
export type StoryResponse = StoryData;

// API 에러 응답
export interface ApiError {
  error: string;
  detail?: string;
}

// 세션 스토리지에 저장되는 API 키
export interface ApiKeys {
  geminiKey: string;
}

// 이야기 생성 상태
export type GenerationStatus =
  | "idle"
  | "generating-story"
  | "generating-images"
  | "complete"
  | "error";

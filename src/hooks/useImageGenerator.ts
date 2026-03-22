// 이미지 생성 훅 — Gemini API를 통해 이미지를 순차적으로 생성
import { useState, useCallback } from "react";
import type { StoryPage, ImageResponse } from "../types/api";

interface UseImageGeneratorReturn {
  generateImagesSequentially: (
    pages: StoryPage[],
    geminiKey: string,
    onPageComplete: (pageIndex: number, imageData: ImageResponse) => void
  ) => Promise<void>;
  isGenerating: boolean;
  currentPage: number;
  totalPages: number;
  error: string | null;
}

export function useImageGenerator(): UseImageGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 페이지별 순차 이미지 생성 (API 과부하 방지를 위해 병렬 처리 금지)
  const generateImagesSequentially = useCallback(
    async (
      pages: StoryPage[],
      geminiKey: string,
      onPageComplete: (pageIndex: number, imageData: ImageResponse) => void
    ) => {
      setIsGenerating(true);
      setError(null);
      setTotalPages(pages.length);
      setCurrentPage(0);

      for (let i = 0; i < pages.length; i++) {
        setCurrentPage(i + 1);

        try {
          const response = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: pages[i].imagePrompt,
              geminiKey,
            }),
          });

          if (!response.ok) {
            // 이미지 생성 실패 시 placeholder 사용 (에러 크래시 없음)
            console.warn(`페이지 ${i + 1} 이미지 생성 실패, placeholder 사용`);
            onPageComplete(i, {
              imageBase64: getDefaultPlaceholder(),
              mimeType: "image/svg+xml",
            });
          } else {
            const data: ImageResponse = await response.json();
            onPageComplete(i, data);
          }
        } catch (err) {
          // 네트워크 오류 등 — placeholder 사용
          console.warn(`페이지 ${i + 1} 이미지 오류:`, err);
          onPageComplete(i, {
            imageBase64: getDefaultPlaceholder(),
            mimeType: "image/svg+xml",
          });
        }

        // 연속 요청 사이 짧은 대기 (rate limit 방지)
        if (i < pages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setIsGenerating(false);
    },
    []
  );

  return { generateImagesSequentially, isGenerating, currentPage, totalPages, error };
}

// 기본 placeholder base64 SVG 반환
function getDefaultPlaceholder(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E0F4FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EDE7F6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" rx="20"/>
  <text x="256" y="220" text-anchor="middle" font-size="80">🌟</text>
  <text x="256" y="320" text-anchor="middle" font-size="80">🎨</text>
  <text x="256" y="400" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#9E9E9E">그림 준비 중...</text>
</svg>`;
  return btoa(unescape(encodeURIComponent(svg)));
}

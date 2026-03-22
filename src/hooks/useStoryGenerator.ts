// 동화 생성 훅 — Claude API를 통해 동화 구조를 생성
import { useState, useCallback } from "react";
import type { StoryData, GenerationStatus, ApiError } from "../types/api";

interface UseStoryGeneratorReturn {
  generate: (story: string, anthropicKey: string) => Promise<StoryData | null>;
  status: GenerationStatus;
  error: string | null;
  reset: () => void;
}

export function useStoryGenerator(): UseStoryGeneratorReturn {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (story: string, anthropicKey: string): Promise<StoryData | null> => {
      setStatus("generating-story");
      setError(null);

      try {
        const response = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ story, anthropicKey }),
        });

        if (!response.ok) {
          const errData: ApiError = await response.json();
          throw new Error(errData.error ?? "이야기 생성에 실패했습니다");
        }

        const data: StoryData = await response.json();
        setStatus("complete");
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";
        setError(message);
        setStatus("error");
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { generate, status, error, reset };
}

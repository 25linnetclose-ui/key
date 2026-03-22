// 동화책 뷰어 화면 (/book/:id)
// 저장된 동화를 페이지별로 표시하고 선택지로 이야기를 분기할 수 있음
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageCard from "./PageCard";
import type { SavedStory } from "../types/api";

// 페이지 슬라이드 애니메이션 변형
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

const pageTransition = {
  type: "tween",
  duration: 0.4,
  ease: "easeInOut",
};

export default function BookViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<SavedStory | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isBranchLoading, setIsBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  // 이야기 불러오기
  useEffect(() => {
    const stored = localStorage.getItem("savedStories");
    if (!stored || !id) {
      navigate("/");
      return;
    }
    const stories: SavedStory[] = JSON.parse(stored);
    const found = stories.find((s) => s.id === id);
    if (!found) {
      navigate("/");
      return;
    }
    setStory(found);
  }, [id, navigate]);

  // 다음 페이지로 이동
  const goNext = useCallback(() => {
    if (!story) return;
    if (currentPageIndex < story.pages.length - 1) {
      setDirection(1);
      setCurrentPageIndex((prev) => prev + 1);
    }
  }, [story, currentPageIndex]);

  // 이전 페이지로 이동
  const goPrev = useCallback(() => {
    if (currentPageIndex > 0) {
      setDirection(-1);
      setCurrentPageIndex((prev) => prev - 1);
    }
  }, [currentPageIndex]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  // localStorage 저장
  const handleSave = () => {
    setSaveMessage("✅ 저장되었습니다!");
    setTimeout(() => setSaveMessage(null), 2000);
  };

  // 인쇄
  const handlePrint = () => {
    window.print();
  };

  // 선택지 선택 → 이야기 분기 생성
  const handleChoiceSelect = async (choiceText: string) => {
    if (!story) return;

    const anthropicKey = sessionStorage.getItem("anthropicKey");
    const geminiKey = sessionStorage.getItem("geminiKey");

    if (!anthropicKey || !geminiKey) {
      navigate("/setup");
      return;
    }

    setIsBranchLoading(true);
    setBranchError(null);

    try {
      // 선택된 분기로 새 이야기 생성
      const branchInput = `${story.originalInput} 그 다음 이야기: ${choiceText}`;

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: branchInput, anthropicKey }),
      });

      if (!response.ok) {
        throw new Error("분기 이야기 생성에 실패했습니다");
      }

      const newStoryData = await response.json();

      // 이미지 생성 (순차)
      const pages = newStoryData.pages.map((p: any) => ({ ...p }));
      for (let i = 0; i < pages.length; i++) {
        try {
          const imgResponse = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: pages[i].imagePrompt, geminiKey }),
          });
          if (imgResponse.ok) {
            const imgData = await imgResponse.json();
            pages[i].imageBase64 = imgData.imageBase64;
            pages[i].mimeType = imgData.mimeType;
          }
        } catch {
          // placeholder 유지
        }
        if (i < pages.length - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      // 새 이야기 저장 후 이동
      const branchId = `story_${Date.now()}`;
      const branchStory: SavedStory = {
        id: branchId,
        title: newStoryData.title,
        originalInput: branchInput,
        pages,
        choices: newStoryData.choices,
        createdAt: new Date().toISOString(),
      };

      const stored = localStorage.getItem("savedStories");
      const existing: SavedStory[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(
        "savedStories",
        JSON.stringify([branchStory, ...existing].slice(0, 20))
      );

      setIsBranchLoading(false);
      navigate(`/book/${branchId}`);
    } catch (err) {
      setBranchError(
        err instanceof Error ? err.message : "오류가 발생했습니다"
      );
      setIsBranchLoading(false);
    }
  };

  if (!story) return null;

  const currentPage = story.pages[currentPageIndex];
  const isLastPage = currentPageIndex === story.pages.length - 1;

  return (
    <>
      {/* 인쇄 스타일 */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: fixed; top: 0; left: 0; width: 100%; }
          .page-card { page-break-after: always; width: 190mm; margin: 10mm auto; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* 분기 로딩 오버레이 */}
      <AnimatePresence>
        {isBranchLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-purple-100 bg-opacity-90 z-50 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-7xl mb-4"
            >
              🌀
            </motion.div>
            <p className="text-2xl font-bold text-purple-700">
              새로운 이야기를 쓰고 있어요...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-pastel-sky to-pastel-lavender">
        <div className="max-w-lg mx-auto px-4 py-6 print-area">
          {/* 상단 네비게이션 */}
          <div className="flex items-center justify-between mb-6 no-print">
            <button
              onClick={() => navigate("/")}
              className="text-purple-400 hover:text-purple-600 font-semibold transition-colors text-sm"
            >
              ← 홈으로
            </button>
            <h1 className="text-lg font-black text-purple-700 text-center flex-1 px-4 truncate">
              {story.title}
            </h1>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                className="bg-white rounded-xl p-2 shadow-card text-lg hover:shadow-md transition-shadow"
                title="저장"
              >
                💾
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrint}
                className="bg-white rounded-xl p-2 shadow-card text-lg hover:shadow-md transition-shadow"
                title="인쇄"
              >
                🖨️
              </motion.button>
            </div>
          </div>

          {/* 저장 메시지 */}
          <AnimatePresence>
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mb-4 text-green-600 font-semibold no-print"
              >
                {saveMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 페이지 카드 (슬라이드 애니메이션) */}
          <div className="relative overflow-hidden rounded-3xl mb-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPageIndex}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={pageTransition}
              >
                <PageCard
                  page={currentPage}
                  pageNumber={currentPageIndex + 1}
                  totalPages={story.pages.length}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 페이지 인디케이터 */}
          <div className="flex justify-center gap-2 mb-6 no-print">
            {story.pages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentPageIndex ? 1 : -1);
                  setCurrentPageIndex(i);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentPageIndex
                    ? "bg-purple-500 scale-125"
                    : "bg-purple-200"
                }`}
                aria-label={`${i + 1}페이지로 이동`}
              />
            ))}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex gap-4 mb-6 no-print">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={goPrev}
              disabled={currentPageIndex === 0}
              className={`flex-1 py-3 rounded-2xl font-bold text-base transition-all ${
                currentPageIndex === 0
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-white text-purple-600 shadow-card hover:shadow-md"
              }`}
            >
              ← 이전
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              disabled={isLastPage}
              className={`flex-1 py-3 rounded-2xl font-bold text-base transition-all ${
                isLastPage
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              다음 →
            </motion.button>
          </div>

          {/* 마지막 페이지: 선택지 */}
          {isLastPage && story.choices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-fairy p-6 no-print"
            >
              <h3 className="text-center font-bold text-gray-700 text-lg mb-4">
                🔮 이야기는 어떻게 될까요?
              </h3>

              {branchError && (
                <p className="text-red-400 text-sm text-center mb-4">
                  ⚠️ {branchError}
                </p>
              )}

              <div className="space-y-3">
                {story.choices.map((choice) => (
                  <motion.button
                    key={choice.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoiceSelect(choice.text)}
                    disabled={isBranchLoading}
                    className="w-full py-4 px-5 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 text-gray-700 font-semibold text-left transition-all"
                  >
                    <span className="text-purple-500 font-bold mr-2">
                      {choice.id}.
                    </span>
                    {choice.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

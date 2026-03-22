// 메인 입력 화면 (/)
// 아이의 상상 이야기를 입력받아 동화 생성을 시작하는 화면
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStoryGenerator } from "../hooks/useStoryGenerator";
import { useImageGenerator } from "../hooks/useImageGenerator";
import type { SavedStory, StoryPage } from "../types/api";

// 별 파티클 컴포넌트 (로딩 애니메이션용)
function StarParticle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0.5, 1.2, 0.5],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
      }}
    >
      ⭐
    </motion.div>
  );
}

// 구름 컴포넌트 (로딩 애니메이션용)
function FloatingCloud({ delay, y }: { delay: number; y: number }) {
  return (
    <motion.div
      className="absolute text-4xl pointer-events-none"
      style={{ top: `${y}%` }}
      animate={{ x: ["100vw", "-200px"] }}
      transition={{
        duration: 8 + delay * 2,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      ☁️
    </motion.div>
  );
}

export default function StoryInput() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [recentStories, setRecentStories] = useState<SavedStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const { generate: generateStory } = useStoryGenerator();
  const { generateImagesSequentially } = useImageGenerator();

  // 최근 이야기 목록 불러오기
  useEffect(() => {
    const stored = localStorage.getItem("savedStories");
    if (stored) {
      const stories: SavedStory[] = JSON.parse(stored);
      // 최신순 정렬, 최대 10개
      setRecentStories(
        stories.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 10)
      );
    }
  }, []);

  // API 키 확인
  const getGeminiKey = () => sessionStorage.getItem("geminiKey");

  const handleGenerate = async () => {
    if (inputText.trim().length < 10) return;

    const geminiKey = getGeminiKey();
    if (!geminiKey) {
      navigate("/setup");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("✨ 아이의 이야기로 동화를 쓰고 있어요...");

    // 1단계: Gemini로 동화 구조 생성
    const storyData = await generateStory(inputText.trim(), geminiKey);

    if (!storyData) {
      setIsLoading(false);
      return;
    }

    setLoadingMessage("🎨 동화 속 장면을 그리고 있어요...");

    // 2단계: 이야기 ID 생성 및 초기 저장
    const storyId = `story_${Date.now()}`;
    const pages: StoryPage[] = storyData.pages.map((page) => ({ ...page }));

    // 이미지 순차 생성
    await generateImagesSequentially(
      pages,
      geminiKey,
      (pageIndex, imageData) => {
        pages[pageIndex].imageBase64 = imageData.imageBase64;
        pages[pageIndex].mimeType = imageData.mimeType;
        setLoadingMessage(
          `🎨 ${pageIndex + 1}/${pages.length} 페이지 그림 완성!`
        );
      }
    );

    // 완성된 이야기 localStorage에 저장
    const savedStory: SavedStory = {
      id: storyId,
      title: storyData.title,
      originalInput: inputText.trim(),
      pages,
      choices: storyData.choices,
      createdAt: new Date().toISOString(),
    };

    const stored = localStorage.getItem("savedStories");
    const existingStories: SavedStory[] = stored ? JSON.parse(stored) : [];
    const updatedStories = [savedStory, ...existingStories].slice(0, 20);
    localStorage.setItem("savedStories", JSON.stringify(updatedStories));

    setIsLoading(false);

    // 동화책 뷰어로 이동
    navigate(`/book/${storyId}`);
  };

  const handleDeleteStory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = localStorage.getItem("savedStories");
    if (!stored) return;
    const stories: SavedStory[] = JSON.parse(stored);
    const updated = stories.filter((s) => s.id !== id);
    localStorage.setItem("savedStories", JSON.stringify(updated));
    setRecentStories(updated.slice(0, 10));
  };

  const isInputValid = inputText.trim().length >= 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-sky via-white to-pastel-lavender">
      {/* 로딩 오버레이 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-purple-100 to-blue-100 z-50 flex flex-col items-center justify-center overflow-hidden"
          >
            {/* 떠다니는 구름들 */}
            <FloatingCloud delay={0} y={20} />
            <FloatingCloud delay={3} y={50} />
            <FloatingCloud delay={6} y={75} />

            {/* 별 파티클들 */}
            {[
              { delay: 0, x: 20, y: 30 },
              { delay: 0.5, x: 80, y: 20 },
              { delay: 1, x: 50, y: 70 },
              { delay: 1.5, x: 30, y: 60 },
              { delay: 0.3, x: 70, y: 80 },
              { delay: 0.8, x: 10, y: 50 },
              { delay: 1.2, x: 90, y: 40 },
            ].map((p, i) => (
              <StarParticle key={i} {...p} />
            ))}

            {/* 메인 아이콘 */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-6 relative z-10"
            >
              📖
            </motion.div>

            <motion.p
              key={loadingMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-purple-700 text-center px-8 relative z-10"
            >
              {loadingMessage}
            </motion.p>
            <p className="text-purple-400 mt-3 text-sm relative z-10">
              잠시만 기다려주세요 🌈
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* 상단 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <div />
            <motion.h1
              className="text-4xl font-black text-purple-700"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🌟 상상을 현실로
            </motion.h1>
            <button
              onClick={() => navigate("/stories")}
              className="text-purple-400 hover:text-purple-600 text-sm font-semibold transition-colors"
            >
              📚 목록
            </button>
          </div>
          <p className="text-purple-400 text-base">
            아이의 상상 이야기를 동화책으로 만들어드려요
          </p>
        </motion.div>

        {/* 입력 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-fairy p-6 mb-8"
        >
          <label className="block text-lg font-bold text-gray-700 mb-3">
            💬 아이의 이야기
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="아이의 상상 이야기를 입력하세요...&#10;예: 용이 구름 위에서 케이크를 먹어요. 그 용은 빨간색이고 아주 착해요."
            className="w-full h-40 resize-none border-2 border-purple-100 rounded-2xl p-4 text-base focus:outline-none focus:border-purple-300 transition-colors placeholder-gray-300 leading-relaxed"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs ${
                inputText.trim().length < 10
                  ? "text-orange-400"
                  : "text-green-500"
              }`}
            >
              {inputText.trim().length < 10
                ? `최소 ${10 - inputText.trim().length}자 더 입력해주세요`
                : "✓ 충분한 이야기예요!"}
            </span>
            <span className="text-xs text-gray-400">
              {inputText.length}자
            </span>
          </div>

          <motion.button
            onClick={handleGenerate}
            disabled={!isInputValid || isLoading}
            whileHover={isInputValid ? { scale: 1.03 } : {}}
            whileTap={isInputValid ? { scale: 0.97 } : {}}
            className={`w-full mt-4 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
              isInputValid
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-xl"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            ✨ 이야기 만들기
          </motion.button>
        </motion.div>

        {/* 최근 이야기 목록 */}
        {recentStories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-gray-600 mb-4">
              📚 최근 이야기
            </h2>
            <div className="space-y-3">
              {recentStories.map((story) => (
                <motion.div
                  key={story.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/book/${story.id}`)}
                  className="bg-white rounded-2xl shadow-card p-4 cursor-pointer flex items-center gap-4 group"
                >
                  {/* 썸네일 */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-purple-50">
                    {story.pages[0]?.imageBase64 ? (
                      <img
                        src={`data:${story.pages[0].mimeType};base64,${story.pages[0].imageBase64}`}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📖
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-700 truncate">
                      {story.title}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      {story.originalInput}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(story.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => handleDeleteStory(story.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                    aria-label="이야기 삭제"
                  >
                    🗑️
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

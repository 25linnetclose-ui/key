// 이야기 목록 화면 (/stories)
// 저장된 모든 동화를 카드 형식으로 표시
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { SavedStory } from "../types/api";

export default function StoryList() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 저장된 이야기 불러오기
  useEffect(() => {
    const stored = localStorage.getItem("savedStories");
    if (stored) {
      const all: SavedStory[] = JSON.parse(stored);
      setStories(
        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    }
  }, []);

  // 이야기 삭제
  const handleDelete = (id: string) => {
    const updated = stories.filter((s) => s.id !== id);
    setStories(updated);
    localStorage.setItem("savedStories", JSON.stringify(updated));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-sky to-pastel-lavender">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 상단 헤더 */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-purple-400 hover:text-purple-600 font-semibold transition-colors mr-4"
          >
            ← 홈
          </button>
          <h1 className="text-2xl font-black text-purple-700">
            📚 저장된 이야기
          </h1>
        </div>

        {/* 이야기 없을 때 */}
        {stories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-7xl mb-4">📖</div>
            <p className="text-purple-400 text-lg font-semibold mb-2">
              아직 이야기가 없어요
            </p>
            <p className="text-gray-400 text-sm mb-8">
              새로운 이야기를 만들어보세요!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg"
            >
              ✨ 첫 이야기 만들기
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl shadow-card overflow-hidden"
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-purple-50 transition-colors"
                    onClick={() => navigate(`/book/${story.id}`)}
                  >
                    {/* 썸네일 */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-pastel-sky to-pastel-lavender">
                      {story.pages[0]?.imageBase64 ? (
                        <img
                          src={`data:${story.pages[0].mimeType};base64,${story.pages[0].imageBase64}`}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          📖
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-700 text-base mb-1 truncate">
                        {story.title}
                      </h3>
                      <p className="text-sm text-gray-400 truncate mb-1">
                        {story.originalInput}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-300">
                        <span>
                          {new Date(story.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span>{story.pages.length}페이지</span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/book/${story.id}`);
                        }}
                        className="bg-purple-100 text-purple-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-purple-200 transition-colors"
                      >
                        📖 보기
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(story.id);
                        }}
                        className="bg-red-50 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        🗑️ 삭제
                      </motion.button>
                    </div>
                  </div>

                  {/* 삭제 확인 */}
                  <AnimatePresence>
                    {deleteConfirm === story.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between"
                      >
                        <p className="text-sm text-red-600 font-semibold">
                          정말 삭제할까요?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-gray-500 text-sm px-3 py-1 rounded-lg hover:bg-gray-100"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleDelete(story.id)}
                            className="text-white bg-red-500 text-sm px-3 py-1 rounded-lg hover:bg-red-600 font-bold"
                          >
                            삭제
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

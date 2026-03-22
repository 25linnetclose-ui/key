// API 키 입력 화면 (/setup)
// Anthropic API 키와 Google Gemini API 키를 입력받아 sessionStorage에 저장
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ApiKeySetup() {
  const navigate = useNavigate();
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!anthropicKey.trim()) {
      setError("Anthropic API 키를 입력해주세요");
      return;
    }
    if (!geminiKey.trim()) {
      setError("Google Gemini API 키를 입력해주세요");
      return;
    }

    // sessionStorage에 저장 (탭 닫으면 삭제됨)
    sessionStorage.setItem("anthropicKey", anthropicKey.trim());
    sessionStorage.setItem("geminiKey", geminiKey.trim());

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-sky to-pastel-lavender flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-6xl mb-4"
          >
            🌟
          </motion.div>
          <h1 className="text-3xl font-bold text-purple-700 mb-2">
            상상을 현실로
          </h1>
          <p className="text-purple-500 text-sm">
            놀이치료 동화 만들기 앱에 오신 것을 환영해요!
          </p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-3xl shadow-fairy p-8">
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            🔑 API 키 설정
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            시작하려면 API 키가 필요해요. 키는 이 탭을 닫으면 자동으로 삭제됩니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Anthropic API Key */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Anthropic API Key
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (claude.ai에서 발급)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showAnthropicKey ? "text" : "password"}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  aria-label={showAnthropicKey ? "키 숨기기" : "키 보기"}
                >
                  {showAnthropicKey ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Gemini API Key */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Google Gemini API Key
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (aistudio.google.com에서 발급)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full border-2 border-blue-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  aria-label={showGeminiKey ? "키 숨기기" : "키 보기"}
                >
                  {showGeminiKey ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center bg-red-50 rounded-xl p-3"
              >
                ⚠️ {error}
              </motion.p>
            )}

            {/* 보안 안내 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-xs text-yellow-700">
              🔒 API 키는 브라우저 탭이 열려있는 동안만 저장됩니다. 탭을
              닫거나 브라우저를 종료하면 자동으로 삭제됩니다.
            </div>

            {/* 제출 버튼 */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              ✨ 동화 만들기 시작!
            </motion.button>
          </form>
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-purple-400 text-xs mt-4">
          API 키는 서버에서 안전하게 처리됩니다
        </p>
      </motion.div>
    </div>
  );
}

// 동화책 한 페이지 카드 컴포넌트
// 이미지와 텍스트를 표시하며 인쇄 시 A4 레이아웃으로 렌더링됨
import { motion } from "framer-motion";
import type { StoryPage } from "../types/api";

interface PageCardProps {
  page: StoryPage;
  pageNumber: number;
  totalPages: number;
  isImageLoading?: boolean;
}

export default function PageCard({
  page,
  pageNumber,
  totalPages,
  isImageLoading = false,
}: PageCardProps) {
  return (
    <div className="page-card bg-white rounded-3xl shadow-fairy overflow-hidden">
      {/* 이미지 영역 */}
      <div className="relative bg-gradient-to-br from-pastel-sky to-pastel-lavender aspect-square">
        {isImageLoading ? (
          // 이미지 로딩 중 스피너
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-5xl mb-3"
            >
              🌟
            </motion.div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-purple-400 text-sm font-semibold"
            >
              그림 그리는 중...
            </motion.div>
          </div>
        ) : page.imageBase64 ? (
          <img
            src={`data:${page.mimeType ?? "image/png"};base64,${page.imageBase64}`}
            alt={`${pageNumber}페이지 삽화`}
            className="w-full h-full object-cover"
          />
        ) : (
          // placeholder
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl">🎨</span>
            <p className="text-purple-300 text-sm mt-2">그림 준비 중</p>
          </div>
        )}

        {/* 페이지 번호 뱃지 */}
        <div className="absolute top-3 left-3 bg-white bg-opacity-90 rounded-full px-3 py-1 text-xs font-bold text-purple-600 shadow-sm">
          {pageNumber} / {totalPages}
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div className="p-6">
        <p className="text-gray-700 text-lg leading-relaxed font-medium text-center">
          {page.text}
        </p>
      </div>
    </div>
  );
}

// 앱 최상위 컴포넌트
// 라우팅 및 에러 바운더리 처리
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Component, type ReactNode } from "react";
import ApiKeySetup from "./components/ApiKeySetup";
import StoryInput from "./components/StoryInput";
import BookViewer from "./components/BookViewer";
import StoryList from "./components/StoryList";

// API 키 존재 여부 확인 후 리다이렉트하는 가드 컴포넌트
function RequireApiKeys({ children }: { children: ReactNode }) {
  const geminiKey = sessionStorage.getItem("geminiKey");

  if (!geminiKey) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}

// 에러 바운더리 — 앱 전체 크래시 방지
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("앱 오류:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pastel-sky to-pastel-lavender flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-fairy p-8 max-w-md text-center">
            <div className="text-5xl mb-4">😢</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              앗, 문제가 생겼어요
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {this.state.error?.message ?? "알 수 없는 오류가 발생했습니다"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-500 text-white font-bold py-3 px-6 rounded-2xl hover:bg-purple-600 transition-colors"
            >
              🔄 다시 시작하기
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* API 키 설정 화면 */}
          <Route path="/setup" element={<ApiKeySetup />} />

          {/* 메인 입력 화면 — API 키 필요 */}
          <Route
            path="/"
            element={
              <RequireApiKeys>
                <StoryInput />
              </RequireApiKeys>
            }
          />

          {/* 동화책 뷰어 — API 키 필요 */}
          <Route
            path="/book/:id"
            element={
              <RequireApiKeys>
                <BookViewer />
              </RequireApiKeys>
            }
          />

          {/* 이야기 목록 — API 키 필요 */}
          <Route
            path="/stories"
            element={
              <RequireApiKeys>
                <StoryList />
              </RequireApiKeys>
            }
          />

          {/* 기타 경로는 홈으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발 중에는 백엔드(4000)로 /api 프록시.
// 실제 토스 POS 탭앱은 POS 앱의 웹뷰 안에서 로드되므로,
// 배포 시 이 프론트 빌드 산출물을 탭앱 매니페스트가 가리키는 URL로 호스팅한다.
export default defineConfig({
  base: "./", // zip으로 배포되어 어떤 하위 경로에 호스팅될지 몰라 상대경로 사용
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});

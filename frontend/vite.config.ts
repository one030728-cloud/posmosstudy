import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// index.html을 public/ 안에 두는 요청에 맞춰 root를 public으로 옮김.
// 그래서 publicDir(정적 파일 그대로 복사되는 폴더)은 static/으로 재지정함
// (안 그러면 root=public일 때 기본 publicDir이 public/public이 되어버림).
// 개발 중에는 백엔드(4000)로 /api 프록시.
export default defineConfig({
  root: "public",
  publicDir: "../static",
  base: "./", // zip으로 배포되어 어떤 하위 경로에 호스팅될지 몰라 상대경로 사용
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    fs: {
      allow: [".."], // public 밖(../src)의 파일을 참조하므로 접근 허용 필요
    },
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});

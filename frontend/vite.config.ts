import { copyFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// index.html과 iframe-manifest.json을 둘 다 public/ 안에 같이 둔다
// (프로젝트를 통째로 압축해도 이 둘이 분리되지 않도록).
// root를 public으로 두면 Vite 기본 publicDir("<root>/public")이
// public/public이 되어버리므로 자동 복사는 끄고,
// iframe-manifest.json만 빌드 후 직접 dist로 복사한다.
function copyIframeManifest(): Plugin {
  return {
    name: "copy-iframe-manifest",
    closeBundle() {
      copyFileSync("public/iframe-manifest.json", "dist/iframe-manifest.json");
    },
  };
}

export default defineConfig({
  root: "public",
  envDir: "..", // root=public이라도 .env.production은 frontend/ 바로 아래서 찾도록
  publicDir: false,
  base: "./", // zip으로 배포되어 어떤 하위 경로에 호스팅될지 몰라 상대경로 사용
  plugins: [react(), copyIframeManifest()],
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

import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// 정적 zip으로 배포되어 서버 rewrite를 쓸 수 없으므로 HashRouter 사용
// (BrowserRouter는 /students/:id 같은 하위 경로 새로고침 시 404 발생)
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

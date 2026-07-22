import { NavLink, Route, Routes } from "react-router-dom";
import StudentList from "./pages/StudentList";
import StudentDetail from "./pages/StudentDetail";
import NewStudent from "./pages/NewStudent";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div>
      <header className="topbar">
        <span className="topbar-title">학원 관리</span>
        <nav className="tabbar">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            원생 목록
          </NavLink>
          <NavLink to="/new" className={({ isActive }) => (isActive ? "active" : "")}>
            원생 등록
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            대시보드
          </NavLink>
        </nav>
      </header>
      <div className="container">
        <Routes>
          <Route path="/" element={<StudentList />} />
          <Route path="/new" element={<NewStudent />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

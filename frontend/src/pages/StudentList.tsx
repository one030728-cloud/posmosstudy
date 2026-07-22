import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { posPluginSdk } from "@tossplace/pos-plugin-sdk";
import { api, Student } from "../lib/api";

function statusBadge(status?: string) {
  if (status === "SUCCESS") return <span className="badge success">결제완료</span>;
  if (status === "FAILED") return <span className="badge fail">결제실패</span>;
  return <span className="badge warn">미납</span>;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listStudents()
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "원생 목록을 불러오지 못했습니다";
        setError(message);
        setLoading(false);
        posPluginSdk.toast.error({ message });
      });
  }, []);

  if (loading) return <p>불러오는 중...</p>;
  if (error) return <p style={{ color: "#f04452" }}>에러: {error}</p>;
  if (students.length === 0) return <p>등록된 원생이 없습니다. "원생 등록" 탭에서 추가하세요.</p>;

  return (
    <div>
      {students.map((s) => (
        <Link key={s.id} to={`/students/${s.id}`} style={{ textDecoration: "none" }}>
          <div className="card">
            <div className="row">
              <div>
                <strong>{s.name}</strong>
                <div style={{ fontSize: 13, color: "#8b95a1" }}>
                  {s.courseName} · {s.monthlyFee.toLocaleString()}원
                </div>
              </div>
              {statusBadge(s.thisMonthStatus)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

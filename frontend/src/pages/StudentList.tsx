import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Student } from "../lib/api";

function statusBadge(status?: string) {
  if (status === "SUCCESS") return <span className="badge success">결제완료</span>;
  if (status === "FAILED") return <span className="badge fail">결제실패</span>;
  return <span className="badge warn">미납</span>;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listStudents().then((data) => {
      setStudents(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>불러오는 중...</p>;
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
            {s.billingKey?.status === "ACTIVE" && (
              <div style={{ fontSize: 12, color: "#3182f6", marginTop: 6 }}>
                정기결제 등록됨 (카드 •••• {s.billingKey.cardLast4 ?? "----"})
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

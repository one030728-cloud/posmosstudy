import { useEffect, useState } from "react";
import { posPluginSdk } from "@tossplace/pos-plugin-sdk";
import { api, DashboardData } from "../lib/api";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboard().then(setData).catch((err) => {
      const message = err instanceof Error ? err.message : "대시보드를 불러오지 못했습니다";
      setError(message);
      posPluginSdk.toast.error({ message });
    });
  }, []);

  if (error) return <p style={{ color: "#f04452" }}>에러: {error}</p>;
  if (!data) return <p>불러오는 중...</p>;

  return (
    <div>
      <div className="card">
        <strong>이번 달 미납 원생: {data.unpaidCount}명</strong>
        {data.unpaidStudents.map((s) => (
          <div key={s.id} className="row" style={{ marginTop: 8 }}>
            <span>{s.name}</span>
            <span>{s.monthlyFee.toLocaleString()}원</span>
          </div>
        ))}
        {data.unpaidCount === 0 && (
          <p style={{ color: "#8b95a1", fontSize: 13 }}>미납 원생이 없습니다.</p>
        )}
      </div>

      <div className="card">
        <strong>정기결제 실패 내역</strong>
        {data.recentFailures.length === 0 && (
          <p style={{ color: "#8b95a1", fontSize: 13 }}>이번 달 실패 건이 없습니다.</p>
        )}
        {data.recentFailures.map((f) => (
          <div key={f.id} style={{ marginTop: 8 }}>
            <div className="row">
              <span>{f.student.name}</span>
              <span className="badge fail">{f.amount.toLocaleString()}원</span>
            </div>
            <div style={{ fontSize: 12, color: "#8b95a1" }}>{f.failReason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { posPluginSdk } from "@tossplace/pos-plugin-sdk";
import { api, PaymentHistoryItem, PaymentLink, Student } from "../lib/api";

type Detail = Student & {
  paymentLinks: PaymentLink[];
  paymentHistory: PaymentHistoryItem[];
};

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Detail | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!id) return;
    try {
      const data = await api.getStudent(id);
      setStudent(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "학생 정보를 불러오지 못했습니다";
      setError(message);
      posPluginSdk.toast.error({ message });
    }
  }

  useEffect(() => {
    reload();
  }, [id]);

  if (error) return <p style={{ color: "#f04452" }}>에러: {error}</p>;
  if (!student) return <p>불러오는 중...</p>;

  async function sendLink() {
    if (!id || !amount || !reason) return;
    setBusy(true);
    try {
      await api.sendPaymentLink(id, Number(amount), reason);
      posPluginSdk.toast.success({ message: "결제링크를 발송했습니다." });
      setAmount("");
      setReason("");
      await reload();
    } catch (err) {
      posPluginSdk.toast.error({ message: err instanceof Error ? err.message : "결제링크 발송 실패" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="card">
        <strong>{student.name}</strong>
        <div style={{ fontSize: 13, color: "#8b95a1" }}>
          {student.courseName} · {student.monthlyFee.toLocaleString()}원 · {student.guardianPhone}
        </div>
      </div>

      <div className="card">
        <strong>결제링크 보내기</strong>
        <div style={{ marginTop: 10 }}>
          <label>금액 (원)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          <label>사유</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 교재비" />
          <button className="primary" onClick={sendLink} disabled={busy}>
            결제링크 발송
          </button>
        </div>
      </div>

      <div className="card">
        <strong>결제 이력</strong>
        {student.paymentHistory.length === 0 && (
          <p style={{ color: "#8b95a1", fontSize: 13 }}>결제 이력이 없습니다.</p>
        )}
        {student.paymentHistory.map((p) => (
          <div key={p.id} className="row" style={{ marginTop: 8 }}>
            <span>{new Date(p.paidAt).toLocaleDateString()}</span>
            <span className={`badge ${p.status === "SUCCESS" ? "success" : "fail"}`}>
              {p.amount.toLocaleString()}원 {p.status === "SUCCESS" ? "완료" : "실패"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

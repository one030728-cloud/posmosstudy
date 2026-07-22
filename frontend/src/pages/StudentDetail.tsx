import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { posPluginSdk } from "@tossplace/pos-plugin-sdk";
import { api, PaymentHistoryItem, PaymentLink, Student } from "../lib/api";

type Detail = Student & {
  paymentLinks: PaymentLink[];
  paymentHistory: PaymentHistoryItem[];
  billingSchedule?: { dueDay: number; active: boolean } | null;
};

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Detail | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueDay, setDueDay] = useState("10");
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

  async function registerBilling() {
    if (!id) return;
    setBusy(true);
    try {
      await api.registerBilling(id, Number(dueDay));
      posPluginSdk.toast.success({ message: "정기결제 등록창을 학부모에게 발송했습니다." });
      await reload();
    } catch (err) {
      posPluginSdk.toast.error({ message: err instanceof Error ? err.message : "정기결제 등록 실패" });
    } finally {
      setBusy(false);
    }
  }

  async function cancelBilling() {
    if (!id) return;
    setBusy(true);
    try {
      await api.cancelBilling(id);
      posPluginSdk.toast.success({ message: "정기결제를 해지했습니다." });
      await reload();
    } catch (err) {
      posPluginSdk.toast.error({ message: err instanceof Error ? err.message : "정기결제 해지 실패" });
    } finally {
      setBusy(false);
    }
  }

  const billingActive = student.billingSchedule?.active && student.billingKey?.status === "ACTIVE";

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
        <strong>정기결제 (자동 수강료 청구)</strong>
        {billingActive ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, color: "#4e5968" }}>
              매월 {student.billingSchedule?.dueDay}일 자동 청구 중 (카드 •••• {student.billingKey?.cardLast4})
            </div>
            <button className="secondary" style={{ marginTop: 10 }} onClick={cancelBilling} disabled={busy}>
              정기결제 해지
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <label>매월 결제일</label>
            <select value={dueDay} onChange={(e) => setDueDay(e.target.value)}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
            <button className="primary" onClick={registerBilling} disabled={busy}>
              정기결제 등록창 보내기
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <strong>결제 이력</strong>
        {student.paymentHistory.length === 0 && (
          <p style={{ color: "#8b95a1", fontSize: 13 }}>결제 이력이 없습니다.</p>
        )}
        {student.paymentHistory.map((p) => (
          <div key={p.id} className="row" style={{ marginTop: 8 }}>
            <span>
              {p.type === "LINKPAY" ? "결제링크" : "정기결제"} · {new Date(p.paidAt).toLocaleDateString()}
            </span>
            <span className={`badge ${p.status === "SUCCESS" ? "success" : "fail"}`}>
              {p.amount.toLocaleString()}원 {p.status === "SUCCESS" ? "완료" : "실패"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

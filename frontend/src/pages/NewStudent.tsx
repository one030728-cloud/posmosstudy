import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { posPluginSdk } from "@tossplace/pos-plugin-sdk";
import { api } from "../lib/api";

export default function NewStudent() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [courseName, setCourseName] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!name || !guardianPhone || !courseName || !monthlyFee) {
      posPluginSdk.toast.warn({ message: "모든 항목을 입력해주세요." });
      return;
    }
    setSubmitting(true);
    try {
      await api.createStudent({
        name,
        guardianPhone,
        courseName,
        monthlyFee: Number(monthlyFee),
      });
      posPluginSdk.toast.success({ message: "원생을 등록했습니다." });
      navigate("/");
    } catch (err) {
      posPluginSdk.toast.error({ message: err instanceof Error ? err.message : "원생 등록 실패" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <label>원생 이름</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>학부모 연락처</label>
      <input
        value={guardianPhone}
        onChange={(e) => setGuardianPhone(e.target.value)}
        placeholder="010-0000-0000"
      />

      <label>수강 강좌</label>
      <input value={courseName} onChange={(e) => setCourseName(e.target.value)} />

      <label>월 수강료 (원)</label>
      <input type="number" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} />

      <button className="primary" type="button" onClick={onSubmit} disabled={submitting}>
        {submitting ? "등록 중..." : "원생 등록"}
      </button>
    </div>
  );
}

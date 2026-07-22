import { FormEvent, useState } from "react";
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
    <form className="card" onSubmit={onSubmit}>
      <label>원생 이름</label>
      <input value={name} onChange={(e) => setName(e.target.value)} required />

      <label>학부모 연락처</label>
      <input
        value={guardianPhone}
        onChange={(e) => setGuardianPhone(e.target.value)}
        placeholder="010-0000-0000"
        required
      />

      <label>수강 강좌</label>
      <input value={courseName} onChange={(e) => setCourseName(e.target.value)} required />

      <label>월 수강료 (원)</label>
      <input
        type="number"
        value={monthlyFee}
        onChange={(e) => setMonthlyFee(e.target.value)}
        required
      />

      <button className="primary" type="submit" disabled={submitting}>
        {submitting ? "등록 중..." : "원생 등록"}
      </button>
    </form>
  );
}

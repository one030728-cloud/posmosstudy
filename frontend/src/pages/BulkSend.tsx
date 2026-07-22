import { useEffect, useState } from "react";
import { posPluginSdk } from "@tossplace/pos-plugin-sdk";
import { api, ScheduledBulkLink, Student } from "../lib/api";

export default function BulkSend() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<ScheduledBulkLink[]>([]);

  async function reload() {
    const [studentList, scheduledJobs] = await Promise.all([
      api.listStudents(),
      api.listScheduledBulkLinks(),
    ]);
    setStudents(studentList);
    setJobs(scheduledJobs);
  }

  useEffect(() => {
    reload().catch((err) => {
      posPluginSdk.toast.error({
        message: err instanceof Error ? err.message : "목록을 불러오지 못했습니다",
      });
    });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === students.length ? new Set() : new Set(students.map((s) => s.id))));
  }

  async function submit() {
    if (selected.size === 0 || !amount || !reason) {
      posPluginSdk.toast.warn({ message: "학생을 1명 이상 선택하고, 금액/사유를 입력해주세요." });
      return;
    }
    if (scheduleEnabled && !scheduledAt) {
      posPluginSdk.toast.warn({ message: "예약 발송 날짜/시간을 선택해주세요." });
      return;
    }

    setBusy(true);
    try {
      const result = await api.sendBulkPaymentLinks(
        Array.from(selected),
        Number(amount),
        reason,
        scheduleEnabled ? new Date(scheduledAt).toISOString() : undefined
      );
      if (result.scheduled) {
        posPluginSdk.toast.success({ message: "예약 발송이 등록되었습니다." });
      } else {
        posPluginSdk.toast.success({ message: `${result.sentCount}/${result.totalCount}명에게 발송했습니다.` });
      }
      setSelected(new Set());
      setAmount("");
      setReason("");
      setScheduledAt("");
      setScheduleEnabled(false);
      await reload();
    } catch (err) {
      posPluginSdk.toast.error({ message: err instanceof Error ? err.message : "발송 실패" });
    } finally {
      setBusy(false);
    }
  }

  async function cancelJob(id: string) {
    try {
      await api.cancelScheduledBulkLink(id);
      posPluginSdk.toast.success({ message: "예약을 취소했습니다." });
      await reload();
    } catch (err) {
      posPluginSdk.toast.error({ message: err instanceof Error ? err.message : "취소 실패" });
    }
  }

  return (
    <div>
      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <strong>대상 원생 선택 ({selected.size}/{students.length})</strong>
          <button className="secondary" onClick={toggleAll} type="button">
            전체선택
          </button>
        </div>
        {students.map((s) => (
          <label
            key={s.id}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 14 }}
          >
            <input
              type="checkbox"
              style={{ width: "auto", margin: 0 }}
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
            />
            {s.name} · {s.courseName}
          </label>
        ))}
        {students.length === 0 && (
          <p style={{ color: "#8b95a1", fontSize: 13 }}>등록된 원생이 없습니다.</p>
        )}
      </div>

      <div className="card">
        <strong>발송 내용</strong>
        <div style={{ marginTop: 10 }}>
          <label>금액 (원)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          <label>사유</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 이번달 수강료" />

          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              style={{ width: "auto", margin: 0 }}
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
            />
            날짜 지정해서 예약 발송
          </label>

          {scheduleEnabled && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{ marginTop: 8 }}
            />
          )}

          <button className="primary" onClick={submit} disabled={busy} style={{ marginTop: 10 }}>
            {busy ? "처리 중..." : scheduleEnabled ? "예약 등록" : "지금 발송"}
          </button>
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="card">
          <strong>예약된 발송</strong>
          {jobs.map((j) => (
            <div key={j.id} className="row" style={{ marginTop: 8 }}>
              <span style={{ fontSize: 13 }}>
                {new Date(j.scheduledAt).toLocaleString()} · {j.studentIds.length}명 · {j.amount.toLocaleString()}원
              </span>
              <button className="secondary" onClick={() => cancelJob(j.id)} type="button">
                취소
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { sendPaymentLinkToStudent } from "../services/paymentLinkService";

export const paymentLinksRouter = Router();

// 결제링크 발송 (단건)
paymentLinksRouter.post("/", async (req, res) => {
  const { studentId, amount, reason } = req.body;
  if (!studentId || !amount || !reason) {
    return res.status(400).json({ error: "studentId, amount, reason은 필수입니다." });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ error: "학생을 찾을 수 없습니다." });

  const link = await sendPaymentLinkToStudent(student, Number(amount), reason);
  res.status(201).json(link);
});

paymentLinksRouter.get("/", async (_req, res) => {
  const links = await prisma.paymentLink.findMany({
    include: { student: true },
    orderBy: { sentAt: "desc" },
  });
  res.json(links);
});

// 일괄 발송: scheduledAt이 없거나 이미 지난 시각이면 즉시 발송, 미래 시각이면 예약만 걸어둔다
// (실제 발송은 bulkLinkScheduler가 담당).
paymentLinksRouter.post("/bulk", async (req, res) => {
  const { studentIds, amount, reason, scheduledAt } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0 || !amount || !reason) {
    return res.status(400).json({ error: "studentIds(배열), amount, reason은 필수입니다." });
  }

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
  const isFuture = scheduledDate && scheduledDate.getTime() > Date.now();

  if (isFuture) {
    const scheduled = await prisma.scheduledBulkLink.create({
      data: { studentIds, amount: Number(amount), reason, scheduledAt: scheduledDate },
    });
    return res.status(201).json({ scheduled: true, job: scheduled });
  }

  const students = await prisma.student.findMany({ where: { id: { in: studentIds } } });
  const results = await Promise.allSettled(
    students.map((s) => sendPaymentLinkToStudent(s, Number(amount), reason))
  );
  const sentCount = results.filter((r) => r.status === "fulfilled").length;
  res.status(201).json({ scheduled: false, sentCount, totalCount: students.length });
});

// 예약된 일괄 발송 목록 (아직 안 보낸 것)
paymentLinksRouter.get("/scheduled", async (_req, res) => {
  const jobs = await prisma.scheduledBulkLink.findMany({
    where: { status: "PENDING" },
    orderBy: { scheduledAt: "asc" },
  });
  res.json(jobs);
});

// 예약 취소
paymentLinksRouter.delete("/scheduled/:id", async (req, res) => {
  await prisma.scheduledBulkLink.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

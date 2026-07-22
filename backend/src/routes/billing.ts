import { Router } from "express";
import { prisma } from "../lib/prisma";
import { issueBillingKeyRegistration } from "../lib/tossClient";

export const billingRouter = Router();

// 정기결제 등록 시작: 빌링키 등록창 URL 발급 (학부모에게 이 URL을 문자로 전달)
billingRouter.post("/register", async (req, res) => {
  const { studentId, dueDay } = req.body;
  if (!studentId || !dueDay) {
    return res.status(400).json({ error: "studentId, dueDay는 필수입니다." });
  }
  if (dueDay < 1 || dueDay > 28) {
    return res.status(400).json({ error: "dueDay는 1~28 사이여야 합니다 (월말 문제 방지)." });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ error: "학생을 찾을 수 없습니다." });

  const customerKey = studentId; // customerKey를 studentId로 고정 매핑

  const billingKey = await prisma.billingKey.upsert({
    where: { studentId },
    update: { status: "PENDING" },
    create: { studentId, customerKey, status: "PENDING" },
  });

  const nextRunAt = computeNextRunAt(dueDay);
  await prisma.billingSchedule.upsert({
    where: { studentId },
    update: { dueDay, nextRunAt, active: true },
    create: { studentId, dueDay, nextRunAt },
  });

  const { registrationUrl } = await issueBillingKeyRegistration({ studentId, customerKey });

  // TODO: 실제로는 여기서 student.guardianPhone 으로 registrationUrl 문자 발송
  console.log(`[문자 발송 (mock)] ${student.guardianPhone} 에게 빌링키 등록창 전송: ${registrationUrl}`);

  res.status(201).json({ billingKey, registrationUrl });
});

// 정기결제 해지
billingRouter.post("/:studentId/cancel", async (req, res) => {
  const { studentId } = req.params;
  await prisma.billingKey.update({
    where: { studentId },
    data: { status: "REVOKED" },
  });
  await prisma.billingSchedule.update({
    where: { studentId },
    data: { active: false },
  });
  res.status(204).send();
});

function computeNextRunAt(dueDay: number): Date {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), dueDay, 9, 0, 0);
  if (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

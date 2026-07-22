import { Router } from "express";
import { prisma } from "../lib/prisma";
import { createLinkPayProduct } from "../lib/tossClient";

export const paymentLinksRouter = Router();

// 결제링크 발송: LinkPay 상품 생성 → URL 저장 → (실제로는 여기서 SMS 발송)
paymentLinksRouter.post("/", async (req, res) => {
  const { studentId, amount, reason } = req.body;
  if (!studentId || !amount || !reason) {
    return res.status(400).json({ error: "studentId, amount, reason은 필수입니다." });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ error: "학생을 찾을 수 없습니다." });

  const { productKey, url } = await createLinkPayProduct({
    studentId,
    amount: Number(amount),
    reason,
  });

  const link = await prisma.paymentLink.create({
    data: {
      studentId,
      productKey,
      url,
      amount: Number(amount),
      reason,
    },
  });

  // TODO: 실제로는 여기서 학부모(student.guardianPhone)에게 문자 발송
  console.log(`[문자 발송 (mock)] ${student.guardianPhone} 에게 결제링크 전송: ${url}`);

  res.status(201).json(link);
});

paymentLinksRouter.get("/", async (_req, res) => {
  const links = await prisma.paymentLink.findMany({
    include: { student: true },
    orderBy: { sentAt: "desc" },
  });
  res.json(links);
});

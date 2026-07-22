import { Router } from "express";
import { prisma } from "../lib/prisma";

export const webhooksRouter = Router();

/**
 * 토스페이먼츠 LinkPay 결제 상태 웹훅.
 * live 모드에서는 요청 서명을 TOSS_WEBHOOK_SECRET으로 검증해야 한다 (지금은 mock이라 생략).
 * 예상 payload: { productKey, status: "PAID" | "CANCELED" | "EXPIRED" }
 */
webhooksRouter.post("/linkpay", async (req, res) => {
  const { productKey, status } = req.body;
  if (!productKey || !status) {
    return res.status(400).json({ error: "productKey, status는 필수입니다." });
  }

  const link = await prisma.paymentLink.findUnique({ where: { productKey } });
  if (!link) return res.status(404).json({ error: "해당 결제링크를 찾을 수 없습니다." });

  const updated = await prisma.paymentLink.update({
    where: { productKey },
    data: {
      status,
      ...(status === "PAID" && { paidAt: new Date() }),
    },
  });

  if (status === "PAID") {
    await prisma.paymentHistory.create({
      data: {
        studentId: link.studentId,
        amount: link.amount,
        status: "SUCCESS",
        paidAt: new Date(),
      },
    });
  }

  res.json(updated);
});

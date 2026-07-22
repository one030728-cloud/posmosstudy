import { Router } from "express";
import { prisma } from "../lib/prisma";

export const dashboardRouter = Router();

// 이번 달 미납자
dashboardRouter.get("/", async (_req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const activeStudents = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    include: { paymentHistory: { where: { paidAt: { gte: startOfMonth } } } },
  });

  const unpaid = activeStudents.filter(
    (s) => !s.paymentHistory.some((p) => p.status === "SUCCESS")
  );

  res.json({
    unpaidCount: unpaid.length,
    unpaidStudents: unpaid.map((s) => ({ id: s.id, name: s.name, monthlyFee: s.monthlyFee })),
  });
});

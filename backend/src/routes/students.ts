import { Router } from "express";
import { prisma } from "../lib/prisma";

export const studentsRouter = Router();

// 원생 목록 (이번 달 결제 상태 요약 포함)
studentsRouter.get("/", async (_req, res) => {
  const students = await prisma.student.findMany({
    include: { billingKey: true },
    orderBy: { createdAt: "desc" },
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await Promise.all(
    students.map(async (s) => {
      const latestPayment = await prisma.paymentHistory.findFirst({
        where: { studentId: s.id, paidAt: { gte: startOfMonth } },
        orderBy: { paidAt: "desc" },
      });
      return {
        ...s,
        thisMonthStatus: latestPayment
          ? latestPayment.status
          : "UNPAID",
      };
    })
  );

  res.json(result);
});

studentsRouter.get("/:id", async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      billingKey: true,
      billingSchedule: true,
      paymentLinks: { orderBy: { sentAt: "desc" } },
      paymentHistory: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!student) return res.status(404).json({ error: "학생을 찾을 수 없습니다." });
  res.json(student);
});

studentsRouter.post("/", async (req, res) => {
  const { name, guardianPhone, courseName, monthlyFee } = req.body;
  if (!name || !guardianPhone || !courseName || !monthlyFee) {
    return res.status(400).json({ error: "name, guardianPhone, courseName, monthlyFee는 필수입니다." });
  }
  const student = await prisma.student.create({
    data: { name, guardianPhone, courseName, monthlyFee: Number(monthlyFee) },
  });
  res.status(201).json(student);
});

studentsRouter.patch("/:id", async (req, res) => {
  const { name, guardianPhone, courseName, monthlyFee, status } = req.body;
  const student = await prisma.student.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(guardianPhone && { guardianPhone }),
      ...(courseName && { courseName }),
      ...(monthlyFee && { monthlyFee: Number(monthlyFee) }),
      ...(status && { status }),
    },
  });
  res.json(student);
});

studentsRouter.delete("/:id", async (req, res) => {
  await prisma.student.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendPaymentLinkToStudent } from "./paymentLinkService";

// 5분마다 예약 시각이 지난 건을 찾아서 실제로 발송한다.
export function startBulkLinkScheduler() {
  cron.schedule("*/5 * * * *", async () => {
    await runDueBulkLinks().catch((err) => {
      console.error("[bulkLinkScheduler] 실행 중 오류:", err);
    });
  });
  console.log("[bulkLinkScheduler] 스케줄러 시작됨 (5분마다 예약 발송 확인)");
}

export async function runDueBulkLinks() {
  const now = new Date();
  const jobs = await prisma.scheduledBulkLink.findMany({
    where: { status: "PENDING", scheduledAt: { lte: now } },
  });

  for (const job of jobs) {
    try {
      const students = await prisma.student.findMany({ where: { id: { in: job.studentIds } } });
      await Promise.allSettled(
        students.map((s) => sendPaymentLinkToStudent(s, job.amount, job.reason))
      );
      await prisma.scheduledBulkLink.update({ where: { id: job.id }, data: { status: "SENT" } });
    } catch (err) {
      console.error(`[bulkLinkScheduler] job ${job.id} 발송 실패:`, err);
      await prisma.scheduledBulkLink.update({ where: { id: job.id }, data: { status: "FAILED" } });
    }
  }

  return jobs.length;
}

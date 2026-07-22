import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { chargeWithBillingKey } from "../lib/tossClient";

const RETRY_AFTER_DAYS = 3;
const MAX_RETRY = 1;

/**
 * 매일 09:00에 실행: nextRunAt이 오늘 이전인 활성 스케줄을 찾아 자동 청구한다.
 * 성공하면 다음 달 같은 날짜로 nextRunAt을 미루고, 실패하면 RETRY_AFTER_DAYS 뒤 재시도 스케줄을 잡는다.
 */
export function startBillingScheduler() {
  cron.schedule("0 9 * * *", async () => {
    await runDueBillings().catch((err) => {
      console.error("[billingScheduler] 실행 중 오류:", err);
    });
  });
  console.log("[billingScheduler] 스케줄러 시작됨 (매일 09:00)");
}

export async function runDueBillings() {
  const now = new Date();
  const schedules = await prisma.billingSchedule.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    include: { student: { include: { billingKey: true } } },
  });

  for (const schedule of schedules) {
    const { student } = schedule;
    const billingKey = student.billingKey;

    if (!billingKey || billingKey.status !== "ACTIVE" || !billingKey.billingKey) {
      console.warn(`[billingScheduler] ${student.name}: 활성 빌링키 없음, 청구 스킵`);
      continue;
    }

    const result = await chargeWithBillingKey({
      customerKey: billingKey.customerKey,
      billingKey: billingKey.billingKey,
      amount: student.monthlyFee,
      orderName: `${student.courseName} 수강료`,
    });

    await prisma.paymentHistory.create({
      data: {
        studentId: student.id,
        type: "BILLING",
        amount: student.monthlyFee,
        status: result.success ? "SUCCESS" : "FAILED",
        failReason: result.failReason,
      },
    });

    if (result.success) {
      const next = new Date(schedule.nextRunAt);
      next.setMonth(next.getMonth() + 1);
      await prisma.billingSchedule.update({
        where: { id: schedule.id },
        data: { nextRunAt: next, retryCount: 0 },
      });
    } else if (schedule.retryCount < MAX_RETRY) {
      const retryAt = new Date(now);
      retryAt.setDate(retryAt.getDate() + RETRY_AFTER_DAYS);
      await prisma.billingSchedule.update({
        where: { id: schedule.id },
        data: { nextRunAt: retryAt, retryCount: schedule.retryCount + 1 },
      });
      // TODO: 실제로는 여기서 학부모에게 결제 실패 + 재시도 예정 안내 문자 발송
      console.log(`[문자 발송 (mock)] ${student.guardianPhone}: 결제 실패(${result.failReason}), ${RETRY_AFTER_DAYS}일 후 재시도 예정`);
    } else {
      // 재시도까지 실패 -> 다음 달로 미루고 카드 재등록 안내
      const next = new Date(schedule.nextRunAt);
      next.setMonth(next.getMonth() + 1);
      await prisma.billingSchedule.update({
        where: { id: schedule.id },
        data: { nextRunAt: next, retryCount: 0 },
      });
      console.log(`[문자 발송 (mock)] ${student.guardianPhone}: 결제 재시도까지 실패, 카드 재등록 필요`);
    }
  }

  return schedules.length;
}

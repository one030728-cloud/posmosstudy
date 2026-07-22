import { prisma } from "../lib/prisma";
import { createLinkPayProduct } from "../lib/tossClient";
import type { Student } from "@prisma/client";

// 결제링크 발송: LinkPay 상품 생성 → URL 저장 → (실제로는 여기서 SMS 발송)
// 단건 발송과 일괄/예약 발송(스케줄러)이 공통으로 쓰는 로직.
export async function sendPaymentLinkToStudent(student: Student, amount: number, reason: string) {
  const { productKey, url } = await createLinkPayProduct({
    studentId: student.id,
    amount,
    reason,
  });

  const link = await prisma.paymentLink.create({
    data: { studentId: student.id, productKey, url, amount, reason },
  });

  // TODO: 실제로는 여기서 student.guardianPhone 으로 문자 발송
  console.log(`[문자 발송 (mock)] ${student.guardianPhone} 에게 결제링크 전송: ${url}`);

  return link;
}

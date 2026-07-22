import crypto from "crypto";

// TOSS_MODE=mock 이면 실제 네트워크 호출 없이 로컬에서 그럴듯한 응답을 만들어낸다.
// live 로 바꾸면 실제 토스페이먼츠 API를 호출하도록 구현부만 교체하면 된다.
const MODE = process.env.TOSS_MODE === "live" ? "live" : "mock";

interface CreateLinkPayProductInput {
  studentId: string;
  amount: number;
  reason: string;
}

interface CreateLinkPayProductResult {
  productKey: string;
  url: string;
}

interface IssueBillingKeyInput {
  studentId: string;
  customerKey: string;
}

interface IssueBillingKeyResult {
  registrationUrl: string;
}

interface ChargeBillingInput {
  customerKey: string;
  billingKey: string;
  amount: number;
  orderName: string;
}

interface ChargeBillingResult {
  success: boolean;
  failReason?: string;
}

function assertLiveKeys() {
  if (!process.env.TOSSPAYMENTS_SECRET_KEY) {
    throw new Error(
      "TOSS_MODE=live 이지만 TOSSPAYMENTS_SECRET_KEY 가 설정되지 않았습니다. .env를 확인하세요."
    );
  }
}

/**
 * LinkPay 상품 생성 API 래퍼.
 * live 모드 구현 시 실제 엔드포인트: https://docs.tosspayments.com/guides/v2/linkpay 참고
 */
export async function createLinkPayProduct(
  input: CreateLinkPayProductInput
): Promise<CreateLinkPayProductResult> {
  if (MODE === "mock") {
    const productKey = `mock_product_${crypto.randomUUID()}`;
    return {
      productKey,
      url: `https://mock.tosspayments.local/linkpay/${productKey}`,
    };
  }

  assertLiveKeys();
  throw new Error(
    "TODO: 실제 토스페이먼츠 LinkPay 상품 생성 API 연동 (TOSSPAYMENTS_SECRET_KEY 발급 후 구현)"
  );
}

/**
 * 빌링키 등록창 URL 발급 (본인인증 포함 방식).
 * live 모드에서는 토스페이먼츠 결제위젯/SDK의 빌링 등록창 연동으로 대체된다.
 */
export async function issueBillingKeyRegistration(
  input: IssueBillingKeyInput
): Promise<IssueBillingKeyResult> {
  if (MODE === "mock") {
    return {
      registrationUrl: `https://mock.tosspayments.local/billing/register?customerKey=${input.customerKey}`,
    };
  }

  assertLiveKeys();
  throw new Error(
    "TODO: 실제 토스페이먼츠 빌링키 등록창 연동 (TOSSPAYMENTS_SECRET_KEY 발급 후 구현)"
  );
}

/**
 * 빌링키로 자동 결제 승인 요청.
 * mock 모드에서는 90% 확률로 성공하도록 시뮬레이션한다 (실패율이 높다는 문서 내용 반영).
 */
export async function chargeWithBillingKey(
  input: ChargeBillingInput
): Promise<ChargeBillingResult> {
  if (MODE === "mock") {
    const success = Math.random() < 0.9;
    return success
      ? { success: true }
      : { success: false, failReason: "CARD_LIMIT_EXCEEDED (mock)" };
  }

  assertLiveKeys();
  throw new Error(
    "TODO: 실제 토스페이먼츠 자동결제 승인 API 연동 (TOSSPAYMENTS_SECRET_KEY 발급 후 구현)"
  );
}

export const tossMode = MODE;

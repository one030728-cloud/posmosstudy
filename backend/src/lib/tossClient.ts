import crypto from "crypto";

// TOSS_MODE=mock 이면 실제 네트워크 호출 없이 로컬에서 그럴듯한 응답을 만들어낸다.
// live 로 바꾸면 실제 토스페이먼츠 API를 호출한다.
const MODE = process.env.TOSS_MODE === "live" ? "live" : "mock";

const TOSS_API_BASE = "https://api.tosspayments.com";

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
  amount: number;
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
  if (!process.env.PUBLIC_BASE_URL) {
    throw new Error(
      "TOSS_MODE=live 이지만 PUBLIC_BASE_URL 이 설정되지 않았습니다 (예: https://posmosstudy-1.onrender.com)."
    );
  }
}

function authHeader(): string {
  const secretKey = process.env.TOSSPAYMENTS_SECRET_KEY!;
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function tossRequest<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${TOSS_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const message = (json as { message?: string }).message ?? `토스페이먼츠 API 오류 (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

/**
 * LinkPay 상품 생성 API: https://docs.tosspayments.com/reference/linkpay
 * LinkPay는 토스페이먼츠와 별도 계약이 필요하다 (일반 결제 계약과 다름).
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
  const result = await tossRequest<{ productKey: string; url: string }>("/v1/products", {
    name: input.reason,
    amount: input.amount,
  });
  return { productKey: result.productKey, url: result.url };
}

/**
 * 빌링키 등록: 카드번호를 우리가 직접 받지 않고, 토스페이먼츠 SDK 등록창을
 * 여는 우리 쪽 정적 페이지(/billing-register)로 안내한다.
 * 학부모가 그 페이지에서 카드 정보를 입력하면 successUrl(/api/billing/callback/success)로
 * authKey가 돌아오고, 거기서 실제 빌링키 발급 API를 호출한다.
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
  const baseUrl = process.env.PUBLIC_BASE_URL!.replace(/\/$/, "");
  const params = new URLSearchParams({
    customerKey: input.customerKey,
    amount: String(input.amount),
    orderId: `billing-reg-${input.studentId}-${Date.now()}`,
  });
  return { registrationUrl: `${baseUrl}/billing-register?${params.toString()}` };
}

/** authKey + customerKey로 실제 빌링키를 발급받는다 (콜백 라우트에서만 호출됨). */
export async function issueBillingKeyFromAuthKey(
  authKey: string,
  customerKey: string
): Promise<{ billingKey: string; cardLast4?: string }> {
  assertLiveKeys();
  const result = await tossRequest<{
    billingKey: string;
    card?: { number?: string };
  }>("/v1/billing/authorizations/issue", { authKey, customerKey });
  const cardLast4 = result.card?.number?.slice(-4);
  return { billingKey: result.billingKey, cardLast4 };
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
  try {
    await tossRequest(`/v1/billing/${input.billingKey}`, {
      customerKey: input.customerKey,
      amount: input.amount,
      orderId: `billing-${input.customerKey}-${Date.now()}`,
      orderName: input.orderName,
    });
    return { success: true };
  } catch (err) {
    return { success: false, failReason: err instanceof Error ? err.message : "알 수 없는 오류" };
  }
}

export const tossMode = MODE;

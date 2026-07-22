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

function assertLiveKeys() {
  if (!process.env.TOSSPAYMENTS_SECRET_KEY) {
    throw new Error(
      "TOSS_MODE=live 이지만 TOSSPAYMENTS_SECRET_KEY 가 설정되지 않았습니다. .env를 확인하세요."
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

export const tossMode = MODE;

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { issueBillingKeyFromAuthKey } from "../lib/tossClient";

export const billingRegisterRouter = Router();

const PAGE_STYLE = "font-family: sans-serif; padding: 24px; text-align: center;";

// 학부모가 문자로 받은 링크를 열면 뜨는 카드 등록 페이지 (카드번호는 토스 SDK가 직접 처리, 우리 서버는 안 만짐)
billingRegisterRouter.get("/", (req, res) => {
  const { customerKey, amount, orderId } = req.query;
  if (!customerKey || !amount || !orderId) {
    return res.status(400).send("잘못된 접근입니다.");
  }
  const clientKey = process.env.TOSSPAYMENTS_CLIENT_KEY;
  if (!clientKey) {
    return res.status(500).send("결제 설정이 완료되지 않았습니다. 학원에 문의해주세요.");
  }

  res.send(`<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>정기결제 카드 등록</title>
<script src="https://js.tosspayments.com/v2/standard"></script>
</head>
<body style="${PAGE_STYLE}">
  <h2>정기결제 카드 등록</h2>
  <p>매월 자동으로 수강료가 결제될 카드를 등록해주세요.</p>
  <button id="registerBtn" style="padding: 12px 24px; font-size: 16px;">카드 등록하기</button>
  <script>
    const payment = TossPayments(${JSON.stringify(clientKey)});
    document.getElementById("registerBtn").addEventListener("click", () => {
      payment.requestBillingAuth({
        customerKey: ${JSON.stringify(String(customerKey))},
        amount: ${Number(amount)},
        orderId: ${JSON.stringify(String(orderId))},
        orderName: "정기결제 카드 등록",
        successUrl: window.location.origin + "/billing-register/success",
        failUrl: window.location.origin + "/billing-register/fail",
      });
    });
  </script>
</body>
</html>`);
});

// 카드 등록 성공 시 토스가 리다이렉트하는 콜백: authKey -> billingKey 교환
billingRegisterRouter.get("/success", async (req, res) => {
  const { authKey, customerKey } = req.query;
  if (!authKey || !customerKey) {
    return res.status(400).send("잘못된 요청입니다.");
  }

  try {
    const { billingKey, cardLast4 } = await issueBillingKeyFromAuthKey(
      String(authKey),
      String(customerKey)
    );
    await prisma.billingKey.update({
      where: { customerKey: String(customerKey) },
      data: { billingKey, cardLast4, status: "ACTIVE", issuedAt: new Date() },
    });
    res.send(`<!doctype html><html><body style="${PAGE_STYLE}">
      <h2>카드 등록 완료</h2><p>정기결제 카드 등록이 완료되었습니다. 이 창은 닫으셔도 됩니다.</p>
    </body></html>`);
  } catch (err) {
    console.error("[billing-register/success] 빌링키 발급 실패:", err);
    await prisma.billingKey
      .update({ where: { customerKey: String(customerKey) }, data: { status: "FAILED_REGISTRATION" } })
      .catch(() => {});
    res.status(500).send("카드 등록 처리 중 오류가 발생했습니다. 학원에 문의해주세요.");
  }
});

// 카드 등록 실패/취소 시 콜백
billingRegisterRouter.get("/fail", async (req, res) => {
  const { customerKey, errorMessage } = req.query;
  if (customerKey) {
    await prisma.billingKey
      .update({ where: { customerKey: String(customerKey) }, data: { status: "FAILED_REGISTRATION" } })
      .catch(() => {});
  }
  res.send(`<!doctype html><html><body style="${PAGE_STYLE}">
    <h2>카드 등록 실패</h2><p>${errorMessage ? String(errorMessage) : "카드 등록에 실패했습니다."}</p>
  </body></html>`);
});

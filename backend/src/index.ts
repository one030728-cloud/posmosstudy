import "dotenv/config";
import express from "express";
import cors from "cors";
import { studentsRouter } from "./routes/students";
import { paymentLinksRouter } from "./routes/paymentLinks";
import { billingRouter } from "./routes/billing";
import { billingRegisterRouter } from "./routes/billingRegister";
import { webhooksRouter } from "./routes/webhooks";
import { dashboardRouter } from "./routes/dashboard";
import { startBillingScheduler } from "./services/billingScheduler";
import { tossMode } from "./lib/tossClient";

const allowedOrigins = process.env.ALLOWED_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean);

const app = express();
app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins } : {}));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, tossMode }));

app.use("/api/students", studentsRouter);
app.use("/api/payment-links", paymentLinksRouter);
app.use("/api/billing", billingRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/billing-register", billingRegisterRouter); // 학부모가 SMS로 여는 카드 등록 페이지 (JSON API 아님)

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`[server] http://localhost:${port} (TOSS_MODE=${tossMode})`);
  startBillingScheduler();
});

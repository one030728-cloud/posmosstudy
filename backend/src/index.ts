import "dotenv/config";
import express from "express";
import cors from "cors";
import { studentsRouter } from "./routes/students";
import { paymentLinksRouter } from "./routes/paymentLinks";
import { billingRouter } from "./routes/billing";
import { webhooksRouter } from "./routes/webhooks";
import { dashboardRouter } from "./routes/dashboard";
import { startBillingScheduler } from "./services/billingScheduler";
import { tossMode } from "./lib/tossClient";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, tossMode }));

app.use("/api/students", studentsRouter);
app.use("/api/payment-links", paymentLinksRouter);
app.use("/api/billing", billingRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/dashboard", dashboardRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`[server] http://localhost:${port} (TOSS_MODE=${tossMode})`);
  startBillingScheduler();
});

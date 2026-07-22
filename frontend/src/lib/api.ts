export interface Student {
  id: string;
  name: string;
  guardianPhone: string;
  courseName: string;
  monthlyFee: number;
  status: string;
  thisMonthStatus?: string;
}

export interface PaymentLink {
  id: string;
  productKey: string;
  url: string;
  amount: number;
  reason: string;
  status: string;
  sentAt: string;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  failReason: string | null;
  paidAt: string;
}

export interface DashboardData {
  unpaidCount: number;
  unpaidStudents: { id: string; name: string; monthlyFee: number }[];
}

export interface ScheduledBulkLink {
  id: string;
  studentIds: string[];
  amount: number;
  reason: string;
  scheduledAt: string;
  status: string;
}

import { posPluginSdk } from "@tossplace/pos-plugin-sdk";

// 토스 POS 웹뷰(iframe) 안에서는 일반 fetch/XHR이 아니라
// posPluginSdk.http 브릿지로만 외부(우리 백엔드) 호출이 허용된다.
// 배포(zip)엔 프록시가 없으므로 백엔드 URL을 명시해야 함 (.env.production 참고).
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const JSON_HEADERS: [string, string][] = [["Content-Type", "application/json"]];

async function request<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const url = `${API_BASE}/api${path}`;
  const res =
    method === "GET"
      ? await posPluginSdk.http.get(url, JSON_HEADERS)
      : method === "DELETE"
        ? await posPluginSdk.http.delete(url, JSON_HEADERS)
        : method === "PATCH"
          ? await posPluginSdk.http.patch(url, body, JSON_HEADERS)
          : await posPluginSdk.http.post(url, body, JSON_HEADERS);

  if (res.code >= 400) {
    const parsed = safeParse<{ error?: string }>(res.body);
    throw new Error(parsed?.error || `요청 실패 (${res.code})`);
  }
  if (res.code === 204 || !res.body) return undefined as T;
  return JSON.parse(res.body) as T;
}

function safeParse<T>(body: string): T | undefined {
  try {
    return JSON.parse(body) as T;
  } catch {
    return undefined;
  }
}

export const api = {
  listStudents: () => request<Student[]>("/students"),
  getStudent: (id: string) =>
    request<
      Student & {
        paymentLinks: PaymentLink[];
        paymentHistory: PaymentHistoryItem[];
      }
    >(`/students/${id}`),
  createStudent: (data: Pick<Student, "name" | "guardianPhone" | "courseName" | "monthlyFee">) =>
    request<Student>("/students", "POST", data),
  deleteStudent: (id: string) => request<void>(`/students/${id}`, "DELETE"),
  sendPaymentLink: (studentId: string, amount: number, reason: string) =>
    request<PaymentLink>("/payment-links", "POST", { studentId, amount, reason }),
  sendBulkPaymentLinks: (studentIds: string[], amount: number, reason: string, scheduledAt?: string) =>
    request<{ scheduled: boolean; sentCount?: number; totalCount?: number; job?: ScheduledBulkLink }>(
      "/payment-links/bulk",
      "POST",
      { studentIds, amount, reason, scheduledAt }
    ),
  listScheduledBulkLinks: () => request<ScheduledBulkLink[]>("/payment-links/scheduled"),
  cancelScheduledBulkLink: (id: string) => request<void>(`/payment-links/scheduled/${id}`, "DELETE"),
  getDashboard: () => request<DashboardData>("/dashboard"),
};

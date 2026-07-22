export interface Student {
  id: string;
  name: string;
  guardianPhone: string;
  courseName: string;
  monthlyFee: number;
  status: string;
  thisMonthStatus?: string;
  billingKey?: { status: string; cardLast4: string | null } | null;
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
  type: string;
  amount: number;
  status: string;
  failReason: string | null;
  paidAt: string;
}

export interface DashboardData {
  unpaidCount: number;
  unpaidStudents: { id: string; name: string; monthlyFee: number }[];
  recentFailures: {
    id: string;
    amount: number;
    failReason: string | null;
    paidAt: string;
    student: { name: string };
  }[];
}

// 로컬 개발: Vite 프록시가 있어 비워두면 됨.
// 배포(zip): 토스 호스팅 도메인엔 /api 프록시가 없으므로 실제 백엔드 URL을 명시해야 함.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `요청 실패 (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listStudents: () => request<Student[]>("/students"),
  getStudent: (id: string) =>
    request<
      Student & {
        paymentLinks: PaymentLink[];
        paymentHistory: PaymentHistoryItem[];
        billingSchedule?: { dueDay: number; active: boolean } | null;
      }
    >(`/students/${id}`),
  createStudent: (data: Pick<Student, "name" | "guardianPhone" | "courseName" | "monthlyFee">) =>
    request<Student>("/students", { method: "POST", body: JSON.stringify(data) }),
  sendPaymentLink: (studentId: string, amount: number, reason: string) =>
    request<PaymentLink>("/payment-links", {
      method: "POST",
      body: JSON.stringify({ studentId, amount, reason }),
    }),
  registerBilling: (studentId: string, dueDay: number) =>
    request<{ registrationUrl: string }>("/billing/register", {
      method: "POST",
      body: JSON.stringify({ studentId, dueDay }),
    }),
  cancelBilling: (studentId: string) =>
    request<void>(`/billing/${studentId}/cancel`, { method: "POST" }),
  getDashboard: () => request<DashboardData>("/dashboard"),
};

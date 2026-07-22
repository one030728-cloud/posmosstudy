export const StudentStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export const BillingKeyStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  FAILED_REGISTRATION: "FAILED_REGISTRATION",
  REVOKED: "REVOKED",
} as const;

export const PaymentLinkStatus = {
  WAITING: "WAITING",
  PAID: "PAID",
  EXPIRED: "EXPIRED",
  CANCELED: "CANCELED",
} as const;

export const PaymentType = {
  LINKPAY: "LINKPAY",
  BILLING: "BILLING",
} as const;

export const PaymentStatus = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

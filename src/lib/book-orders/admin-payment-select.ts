export const adminPaymentSelect = {
  id: true, state: true, expiresAt: true, updatedAt: true, snapshot: true,
  submittedReference: true, senderPhone: true, submittedAt: true,
  verifiedReference: true, customerNote: true, reviewedBy: true, reviewedAt: true,
  events: { orderBy: { createdAt: "asc" as const }, select: { id: true, action: true, actor: true, details: true, createdAt: true } },
} as const;

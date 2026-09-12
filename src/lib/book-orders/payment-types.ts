import type { WhishSnapshot } from "./whish-config";
import type { WhishState } from "./whish-policy";
export type PaymentSummary = {
  reference: string; state: WhishState; orderStatus: string; amountCents: number; currency: string;
  bookCount: number; fulfillmentMethod: string; expiresAt: string; submittedAt: string | null;
  customerNote: string | null; submittedReference: string | null; supportPhone: string;
  instructions: WhishSnapshot | null;
  selectionMode?: string;
  books?: { id: string; title: string; titleAr: string | null; author: string | null; authorAr: string | null; coverImageUrl: string | null; isFreeExtra: boolean }[];
};
export type AdminWhishPayment = {
  id: string; state: WhishState; updatedAt: string; expiresAt: string;
  submittedReference: string | null; senderPhone: string | null; submittedAt: string | null;
  verifiedReference: string | null; customerNote: string | null; reviewedBy: string | null; reviewedAt: string | null;
  snapshot: WhishSnapshot;
  events: { id: string; action: string; actor: string; createdAt: string; details: Record<string, unknown> }[];
};

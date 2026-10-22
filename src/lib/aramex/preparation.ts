import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { canonicalLebanonCity } from "./cities";
import { shipmentStatusProblem } from "./eligibility";
import type { SubmissionView } from "./submission-status";

export type ShippingOrder = {
  id: string;
  reference: string;
  updatedAt: Date;
  purpose: string;
  status: string;
  fulfillmentMethod: string;
  paymentMethod: string;
  paymentStatus: string;
  priceCents: number;
  currency: string;
  requestedBookCount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  governorate: string | null;
  area: string | null;
  detailedAddress: string | null;
  whishPayment: { state: string } | null;
};

export function normalizeLebanonPhone(value: string): string | null {
  const digits = value.trim().replace(/[٠-٩۰-۹]/g, char => {
    const code = char.charCodeAt(0);
    return String(code >= 0x6f0 ? code - 0x6f0 : code - 0x660);
  });
  if (!/^\+?[\d\s()./-]+$/.test(digits)) return null;
  const compact = digits.replace(/[\s()./-]/g, "");
  const international = compact.startsWith("00") ? "+" + compact.slice(2)
    : compact.startsWith("961") ? "+" + compact : compact;
  const phone = parsePhoneNumberFromString(international, { defaultCountry: "LB", extract: false });
  return phone?.country === "LB" && phone.isValid() && !phone.ext ? phone.number : null;
}

const line = z.string().trim().max(50, "Each address line must be at most 50 characters.")
  .refine(value => !/[\r\n\x00-\x1f]/.test(value), "Use one line of address text.");

const dimensionKeys = ["lengthCm", "widthCm", "heightCm"] as const;
const dimension = z.number().finite().min(0.001).max(100).multipleOf(0.001).optional();
// Shipping manual Tables 22/27: dimensions are optional, but complete when supplied.
// Keeping the existing keys preserves previously saved fully measured drafts.
const parcelSchema = z.object({
  weightKg: z.number().finite().min(0.001).max(100).multipleOf(0.001),
  lengthCm: dimension, widthCm: dimension, heightCm: dimension,
}).strict().superRefine((parcel, ctx) => {
  if (!dimensionKeys.some(key => parcel[key] !== undefined)) return;
  for (const key of dimensionKeys) {
    if (parcel[key] === undefined) ctx.addIssue({
      code: "custom", path: [key],
      message: "Enter length, width and height together, or leave all three blank.",
    });
  }
});

export const preparationSchema = z.object({
  expectedUpdatedAt: z.string().datetime(),
  recipientName: z.string().trim().min(2).max(50)
    .refine(value => !/[\x00-\x1f]/.test(value), "Enter the recipient's name."),
  recipientPhone: z.string().trim().max(30)
    .refine(value => normalizeLebanonPhone(value) !== null, "Enter a valid Lebanese phone number.")
    .transform(value => normalizeLebanonPhone(value)!),
  // Optional pending Aramex's confirmation; missing email is flagged in the draft.
  recipientEmail: z.union([z.literal(""), z.string().trim().email().max(50)]),
  city: z.string().trim().min(1, "Enter a delivery city or area.").max(120)
    .refine(value => !/[\x00-\x1f]/.test(value), "Enter a city on one line.")
    .transform(value => canonicalLebanonCity(value) ?? value),
  addressLine1: line.min(4, "Enter a street and building address."),
  addressLine2: line,
  addressLine3: line,
  parcels: z.array(parcelSchema).min(1).max(100)
    .refine(parcels => parcels.reduce((total, parcel) => total + parcel.weightKg, 0) <= 100,
      "Total shipment weight must be at most 100 kg for this preparation workflow."),
}).strict();

export type PreparationInput = z.input<typeof preparationSchema>;
export type PreparationValues = z.output<typeof preparationSchema>;

export function orderProblems(order: ShippingOrder): string[] {
  const problems: string[] = [];
  if (order.fulfillmentMethod !== "DELIVERY") problems.push("Only delivery orders can be prepared for Aramex.");
  if (!["SELF", "GIFT"].includes(order.purpose)) problems.push("This order purpose is not supported for customer shipping.");
  const statusProblem = shipmentStatusProblem(order.status);
  if (statusProblem) problems.push(statusProblem);
  if (order.currency !== "USD" || !Number.isSafeInteger(order.priceCents) || order.priceCents <= 0) {
    problems.push("The order must have a valid positive USD total.");
  }
  if (!Number.isSafeInteger(order.requestedBookCount) || order.requestedBookCount < 1) {
    problems.push("The order must have a valid book count.");
  }
  if (!["CASH_ON_DELIVERY", "CASH_ARRANGEMENT", "WHISH", "BANK_AUDI"].includes(order.paymentMethod)) {
    problems.push("The order payment method is not supported.");
  } else if (["WHISH", "BANK_AUDI"].includes(order.paymentMethod)) {
    if (order.paymentStatus !== "PAID" || order.whishPayment?.state !== "VERIFIED") {
      problems.push("Verify the purchaser's payment before preparing this shipment.");
    }
  } else if (order.paymentMethod === "CASH_ARRANGEMENT") {
    if (order.paymentStatus !== "PAID") problems.push("Record payment from the purchaser before preparing this order. The recipient must not be charged.");
  } else if (order.purpose === "GIFT" && order.paymentStatus !== "PAID") {
    problems.push("Gift recipients must not be charged. Collect and record payment from the purchaser first.");
  } else if (!["PENDING", "PAID"].includes(order.paymentStatus)) {
    problems.push("Failed, refunded or cancelled payments cannot be prepared for shipping.");
  }
  return problems;
}

export function shippingCollection(order: ShippingOrder) {
  const problems = orderProblems(order);
  if (problems.length) return { amountCents: null, currency: "USD" as const, problems };
  return {
    amountCents: order.paymentMethod === "CASH_ON_DELIVERY" && order.paymentStatus === "PENDING"
      ? order.priceCents : 0,
    currency: "USD" as const,
    problems,
  };
}

// Preserve all text, including long addresses. The form asks staff to split/correct
// lines rather than silently truncating a customer's delivery instructions.
export function preparationDefaults(order: ShippingOrder) {
  const gift = order.purpose === "GIFT";
  return {
    expectedUpdatedAt: order.updatedAt.toISOString(),
    recipientName: (gift ? order.recipientName : order.customerName) || "",
    recipientPhone: (gift ? order.recipientPhone : order.customerPhone) || "",
    recipientEmail: gift ? "" : order.customerEmail || "",
    city: canonicalLebanonCity(order.area || "") ?? (order.area || ""),
    addressLine1: order.detailedAddress || "",
    addressLine2: "",
    addressLine3: "",
  };
}

export const pendingAramexConfirmations = [
  "API account and IP whitelisting",
  "Dispatch address and pickup arrangements",
  "Domestic service codes, transport charges and COD terms",
  "Recipient contact requirements and label format",
  "UAT test approval before production",
] as const;

// This is an internal review document, NOT an Aramex CreateShipments payload.
// It intentionally contains neither credentials nor guessed service settings.
export function prepareShipment(order: ShippingOrder, values: PreparationValues) {
  const collection = shippingCollection(order);
  if (collection.problems.length || collection.amountCents === null) {
    throw new Error("ORDER_NOT_ELIGIBLE");
  }
  if (values.expectedUpdatedAt !== order.updatedAt.toISOString()) throw new Error("STALE_ORDER");
  return {
    kind: "aramex-shipping-preparation" as const,
    version: 1,
    submissionEnabled: false as const,
    intendedEnvironment: "UAT" as const,
    orderReference: order.reference,
    orderUpdatedAt: order.updatedAt.toISOString(),
    orderTotalCents: order.priceCents,
    recipient: {
      name: values.recipientName,
      phone: values.recipientPhone,
      email: values.recipientEmail || null,
      countryCode: "LB",
      city: values.city,
      addressLines: [values.addressLine1, values.addressLine2, values.addressLine3].filter(Boolean),
    },
    contents: { description: "Books", bookCount: order.requestedBookCount },
    parcels: values.parcels,
    numberOfPieces: values.parcels.length,
    totalWeightKg: Number(values.parcels.reduce((total, parcel) => total + parcel.weightKg, 0).toFixed(3)),
    collection: {
      amountCents: collection.amountCents,
      currency: collection.currency,
      reason: collection.amountCents > 0 ? "Unpaid cash-on-delivery order total, including the customer's delivery fee."
        : "Purchaser payment recorded; collect nothing from the recipient.",
    },
    warnings: [
      ...(!canonicalLebanonCity(values.city) ? ["Custom city saved in this draft. Choose an approved delivery city before sending to Aramex."] : []),
      ...(!values.recipientEmail ? ["Recipient email is missing. Confirm Aramex's domestic requirement before submission."] : []),
      "Transport billing and COD remittance must be agreed separately with Aramex.",
      "Draft only. No shipment or pickup has been created. Recheck order/payment status before submission.",
    ],
    pendingConfirmations: [...pendingAramexConfirmations],
  };
}

export type ShipmentPreparation = ReturnType<typeof prepareShipment>;
export type SavedShippingDraft = {
  id: string;
  version: number;
  updatedAt: string;
  stale: boolean;
  editable: boolean;
  input: PreparationInput;
};
export type PreparationContext = {
  submission: SubmissionView;
  draftStorageAvailable: boolean;
  savedDraft: SavedShippingDraft | null;
  reference: string;
  status: string;
  purpose: string;
  paymentMethod: string;
  paymentStatus: string;
  bookCount: number;
  orderTotalCents: number;
  sourceAddress: string;
  defaults: ReturnType<typeof preparationDefaults>;
  collection: ReturnType<typeof shippingCollection>;
  cities: readonly string[];
  pendingConfirmations: readonly string[];
};

import { z } from "zod";
import { BOOK_PACKAGES, BOOK_PACKAGE_KEYS, LEBANON_GOVERNORATES } from "./config";

export const BOOK_ORDER_PURPOSES = ["SELF", "GIFT", "DONATION"] as const;
export const BOOK_SELECTION_MODES = ["CUSTOM", "LEE_CHOICE"] as const;
export const BOOK_FULFILLMENT_METHODS = ["DELIVERY", "PICKUP", "LEE_DISTRIBUTION"] as const;
export const BOOK_PAYMENT_METHODS = ["CASH_ON_DELIVERY", "CASH_ARRANGEMENT", "WHISH"] as const;

const optionalText = (max: number) => z.preprocess(
  (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().trim().max(max).optional()
);
const phone = z.string().trim().min(6, "Enter a valid phone number").max(30);

export const bookOrderSchema = z.object({
  locale: z.enum(["en", "ar"]),
  package: z.enum(BOOK_PACKAGE_KEYS as [string, ...string[]]),
  purpose: z.enum(BOOK_ORDER_PURPOSES),
  selectionMode: z.enum(BOOK_SELECTION_MODES),
  selectedBookIds: z.array(z.string().min(1)).max(22),
  customerName: z.string().trim().min(2, "Enter your name").max(120),
  customerPhone: phone,
  customerEmail: z.preprocess(
    (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
    z.string().trim().email().max(254).optional()
  ),
  fulfillmentMethod: z.enum(BOOK_FULFILLMENT_METHODS),
  governorate: optionalText(80),
  area: optionalText(120),
  detailedAddress: optionalText(500),
  recipientName: optionalText(120),
  recipientPhone: z.preprocess(
    (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
    phone.optional()
  ),
  giftMessage: optionalText(300),
  showSenderName: z.boolean().default(true),
  paymentMethod: z.enum(BOOK_PAYMENT_METHODS),
  website: optionalText(1),
}).superRefine((value, context) => {
  if (value.fulfillmentMethod === 'DELIVERY' && value.governorate && !LEBANON_GOVERNORATES.includes(value.governorate as (typeof LEBANON_GOVERNORATES)[number])) {
    context.addIssue({ code: 'custom', path: ['governorate'], message: 'Choose a Lebanese governorate' });
  }
  const packageDetails = BOOK_PACKAGES[value.package as keyof typeof BOOK_PACKAGES];
  if (new Set(value.selectedBookIds).size !== value.selectedBookIds.length) {
    context.addIssue({ code: "custom", path: ["selectedBookIds"], message: "A book can only be selected once" });
  }
  if (value.selectionMode === "CUSTOM" && value.selectedBookIds.length !== packageDetails.totalBooks) {
    context.addIssue({ code: "custom", path: ["selectedBookIds"], message: `Choose exactly ${packageDetails.totalBooks} books for this package` });
  }
  if (value.selectionMode === "LEE_CHOICE" && value.purpose !== "DONATION") {
    context.addIssue({ code: "custom", path: ["selectionMode"], message: "LEE Choice is only available for donations" });
  }
  if (value.selectionMode === "LEE_CHOICE" && value.selectedBookIds.length > 1) {
    context.addIssue({ code: "custom", path: ["selectedBookIds"], message: "Choose at most one preference" });
  }
  if (value.purpose === "SELF") {
    if (value.fulfillmentMethod === "LEE_DISTRIBUTION") context.addIssue({ code: "custom", path: ["fulfillmentMethod"], message: "Choose delivery or pickup" });
    if (value.paymentMethod !== "CASH_ON_DELIVERY") context.addIssue({ code: "custom", path: ["paymentMethod"], message: "Choose cash payment" });
  }
  if (value.purpose === "GIFT") {
    if (value.fulfillmentMethod !== "DELIVERY") context.addIssue({ code: "custom", path: ["fulfillmentMethod"], message: "Gift orders are delivered" });
    if (!value.recipientName) context.addIssue({ code: "custom", path: ["recipientName"], message: "Enter the recipient's name" });
    if (!value.recipientPhone) context.addIssue({ code: "custom", path: ["recipientPhone"], message: "Enter the recipient's phone" });
  }
  if (value.purpose === "DONATION" && value.fulfillmentMethod !== "LEE_DISTRIBUTION") {
    context.addIssue({ code: "custom", path: ["fulfillmentMethod"], message: "LEE distributes donated books" });
  }
  if (value.purpose !== "SELF" && value.paymentMethod !== "CASH_ARRANGEMENT") {
    context.addIssue({ code: "custom", path: ["paymentMethod"], message: "LEE will arrange payment with the purchaser" });
  }
  if (value.fulfillmentMethod === "DELIVERY") {
    if (!value.governorate) context.addIssue({ code: "custom", path: ["governorate"], message: "Enter the governorate" });
    if (!value.area) context.addIssue({ code: "custom", path: ["area"], message: "Enter the area" });
    if (!value.detailedAddress) context.addIssue({ code: "custom", path: ["detailedAddress"], message: "Enter the delivery address" });
  }
});

export type BookOrderInput = z.input<typeof bookOrderSchema>;


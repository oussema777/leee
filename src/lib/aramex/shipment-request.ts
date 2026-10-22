import { z } from "zod";
import { canonicalLebanonCity } from "./cities";
import { normalizeLebanonPhone, preparationSchema, type ShipmentPreparation } from "./preparation";

// Source: supplied Shipping API manual Tables 18–27 and UAT Postman examples.
// This mapper is credential-free; the default-off UAT route uses it through the transport.
const text = z.string().trim().min(1).max(50).refine(value => !/[\x00-\x1f]/.test(value));
const city = text.refine(value => canonicalLebanonCity(value) !== null)
  .transform(value => canonicalLebanonCity(value)!);
const phone = z.string().max(30).refine(value => normalizeLebanonPhone(value) !== null)
  .transform(value => normalizeLebanonPhone(value)!);
const address = z.object({
  line1: text.min(4), line2: text.optional(), line3: text.optional(), city,
}).strict();
const service = z.object({
  productType: z.string().regex(/^[A-Z0-9]{3}$/),
  // Transport charges belong to the shipper in this first implementation.
  // Collect/third-party billing needs its own account/amount mapping.
  paymentType: z.literal("P"),
  paymentOptions: z.enum(["", "CASH", "ACCT", "PPST", "CRDT"]),
  services: z.array(z.string().regex(/^[A-Z0-9]+$/)).refine(values => new Set(values).size === values.length)
    .refine(values => values.join(",").length <= 25),
}).strict();

export const shipmentSettingsSchema = z.object({
  environment: z.literal("UAT"),
  shipper: z.object({ name: text, company: text, phone, email: z.string().email().max(50), address }).strict(),
  goodsOriginCountry: z.string().regex(/^[A-Z]{2}$/),
  labelReportId: z.number().int().positive(),
  recipientEmailRequired: z.boolean(),
  prepaid: service.refine(value => !value.services.includes("COD")),
  cod: service.refine(value => value.services.includes("COD")),
}).strict();
export type ShipmentSettings = z.input<typeof shipmentSettingsSchema>;

const scheduleSchema = z.object({
  shippingAt: z.string().datetime({ offset: true }),
  dueAt: z.string().datetime({ offset: true }),
}).strict().refine(value => Date.parse(value.dueAt) >= Date.parse(value.shippingAt));

export class ShipmentMappingError extends Error {}

const credentialsSchema = z.object({
  environment: z.literal("UAT"),
  UserName: text, Password: z.string().min(1).max(50),
  AccountNumber: text, AccountPin: z.string().min(1).max(50),
  AccountEntity: z.string().regex(/^[A-Z0-9]{3}$/), AccountCountryCode: z.literal("LB"),
  Version: z.string().min(1).max(4), Source: z.number().int().nonnegative().default(24),
}).strict();

/** Server-side only: the result contains secrets and must never be logged,
 * stored in a draft/attempt, downloaded or returned to a browser. */
export function attachShipmentCredentials(
  request: ReturnType<typeof buildShipmentRequest>,
  credentials: z.input<typeof credentialsSchema>,
) {
  const ClientInfo = uatClientInfo(credentials);
  return { ...request, ClientInfo, Shipments: request.Shipments.map(shipment => ({
    ...shipment, Shipper: { ...shipment.Shipper, AccountNumber: ClientInfo.AccountNumber },
  })) };
}

export function uatClientInfo(credentials: z.input<typeof credentialsSchema>) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) throw new ShipmentMappingError("INVALID_UAT_CREDENTIALS");
  const { environment: _environment, ...ClientInfo } = parsed.data;
  return ClientInfo;
}

/** Returns the non-secret portion of one CreateShipments JSON request.
 * ClientInfo and Shipper.AccountNumber must be injected server-side by the
 * future transport. Never persist a credential-bearing request as a draft.
 */
export function buildShipmentRequest(
  draft: ShipmentPreparation,
  settingsInput: ShipmentSettings,
  scheduleInput: z.input<typeof scheduleSchema>,
  submissionKey: string,
) {
  const settingsResult = shipmentSettingsSchema.safeParse(settingsInput);
  if (!settingsResult.success) throw new ShipmentMappingError("INVALID_SHIPMENT_SETTINGS");
  const scheduleResult = scheduleSchema.safeParse(scheduleInput);
  if (!scheduleResult.success) throw new ShipmentMappingError("INVALID_SHIPPING_DATES");
  if (!/^[A-Za-z0-9-]{1,50}$/.test(submissionKey) || !/^[A-Za-z0-9-]{1,50}$/.test(draft.orderReference)) {
    throw new ShipmentMappingError("INVALID_SHIPMENT_REFERENCE");
  }
  if (draft.kind !== "aramex-shipping-preparation" || draft.intendedEnvironment !== "UAT" || draft.recipient.countryCode !== "LB") {
    throw new ShipmentMappingError("UNSUPPORTED_SHIPMENT");
  }
  const parsed = preparationSchema.safeParse({
    expectedUpdatedAt: draft.orderUpdatedAt,
    recipientName: draft.recipient.name, recipientPhone: draft.recipient.phone,
    recipientEmail: draft.recipient.email ?? "", city: draft.recipient.city,
    addressLine1: draft.recipient.addressLines[0] ?? "", addressLine2: draft.recipient.addressLines[1] ?? "",
    addressLine3: draft.recipient.addressLines[2] ?? "", parcels: draft.parcels,
  });
  if (!parsed.success || draft.recipient.addressLines.length > 3) throw new ShipmentMappingError("INVALID_SHIPMENT_DRAFT");
  const values = parsed.data;
  if (!canonicalLebanonCity(values.city)) throw new ShipmentMappingError("CITY_CONFIRMATION_REQUIRED");
  const settings = settingsResult.data;
  if (settings.recipientEmailRequired && !values.recipientEmail) throw new ShipmentMappingError("RECIPIENT_EMAIL_REQUIRED");
  const cents = draft.collection.amountCents;
  if (!Number.isSafeInteger(cents) || cents < 0 || draft.collection.currency !== "USD"
    || !Number.isSafeInteger(draft.orderTotalCents) || draft.orderTotalCents <= 0
    || (cents !== 0 && cents !== draft.orderTotalCents)) throw new ShipmentMappingError("INVALID_COLLECTION_AMOUNT");
  const selected = cents > 0 ? settings.cod : settings.prepaid;
  const measured = values.parcels.filter(parcel => parcel.lengthCm !== undefined);
  // The Postman MPS example describes complete pieces. Do not drop measurements
  // or invent dimensions for a partly measured multi-piece shipment.
  if (measured.length && measured.length !== values.parcels.length) throw new ShipmentMappingError("MIXED_PARCEL_DIMENSIONS_REQUIRE_REVIEW");
  const dimensions = (parcel: typeof values.parcels[number]) => ({
    Length: parcel.lengthCm!, Width: parcel.widthCm!, Height: parcel.heightCm!, Unit: "CM" as const,
  });
  const contact = (name: string, company: string, telephone: string, email: string) => ({
    PersonName: name, CompanyName: company, PhoneNumber1: telephone, CellPhone: telephone, EmailAddress: email,
  });
  return {
    Transaction: { Reference1: submissionKey, Reference2: draft.orderReference },
    LabelInfo: { ReportID: settings.labelReportId, ReportType: "URL" as const },
    Shipments: [{
      Reference1: draft.orderReference, Reference2: submissionKey,
      Shipper: {
        PartyAddress: { Line1: settings.shipper.address.line1, Line2: settings.shipper.address.line2 ?? "",
          Line3: settings.shipper.address.line3 ?? "", City: settings.shipper.address.city, CountryCode: "LB" },
        Contact: contact(settings.shipper.name, settings.shipper.company, settings.shipper.phone, settings.shipper.email),
      },
      Consignee: {
        PartyAddress: { Line1: values.addressLine1, Line2: values.addressLine2, Line3: values.addressLine3,
          City: values.city, CountryCode: "LB" },
        Contact: contact(values.recipientName, values.recipientName, values.recipientPhone, values.recipientEmail),
      },
      ShippingDateTime: `/Date(${Date.parse(scheduleResult.data.shippingAt)})/`,
      DueDate: `/Date(${Date.parse(scheduleResult.data.dueAt)})/`,
      Details: {
        ProductGroup: "DOM", ProductType: selected.productType,
        PaymentType: selected.paymentType, PaymentOptions: selected.paymentOptions, Services: selected.services.join(","),
        DescriptionOfGoods: "Books", GoodsOriginCountry: settings.goodsOriginCountry,
        NumberOfPieces: values.parcels.length,
        ActualWeight: { Unit: "KG", Value: Number(values.parcels.reduce((sum, parcel) => sum + parcel.weightKg, 0).toFixed(3)) },
        Dimensions: measured.length === 1 && values.parcels.length === 1 ? dimensions(measured[0]) : null,
        ...(measured.length > 1 ? { PieceDimensions: measured.map(parcel => ({
          ...dimensions(parcel), NumberOfPieces: 1, ActualWeight: { Unit: "KG", Value: parcel.weightKg },
        })) } : {}),
        CashOnDeliveryAmount: cents > 0 ? { CurrencyCode: "USD", Value: cents / 100 } : null,
      },
    }],
  };
}

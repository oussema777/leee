"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
  BOOK_LANGUAGES,
  GOVERNORATES,
  HANDOVER_METHODS,
} from "@/lib/book-restore/validation";

type Locale = "en" | "ar";
type BookState = {
  title: string;
  author: string;
  category: string;
  language: string;
  condition: string;
  frontCoverUrl: string;
  backCoverUrl: string;
};
type FormState = {
  fullName: string;
  phone: string;
  email: string;
  governorate: string;
  area: string;
  detailedAddress: string;
  books: BookState[];
  handoverMethod: string;
  notes: string;
  donationConsent: boolean;
  privacyConsent: boolean;
  acceptanceAcknowledged: boolean;
  website: string;
};

const emptyBook = (): BookState => ({
  title: "",
  author: "",
  category: "",
  language: "",
  condition: "",
  frontCoverUrl: "",
  backCoverUrl: "",
});

const initialForm: FormState = {
  fullName: "",
  phone: "",
  email: "",
  governorate: "",
  area: "",
  detailedAddress: "",
  books: [emptyBook()],
  handoverMethod: "",
  notes: "",
  donationConsent: false,
  privacyConsent: false,
  acceptanceAcknowledged: false,
  website: "",
};

const labels = {
  governorates: {
    AKKAR: ["Akkar", "Ø¹ÙƒØ§Ø±"], NORTH_LEBANON: ["North Lebanon", "Ø§Ù„Ø´Ù…Ø§Ù„"], SOUTH_LEBANON: ["South Lebanon", "Ø§Ù„Ø¬Ù†ÙˆØ¨"],
    BEIRUT: ["Beirut", "Ø¨ÙŠØ±ÙˆØª"], MOUNT_LEBANON: ["Mount Lebanon", "Ø¬Ø¨Ù„ Ù„Ø¨Ù†Ø§Ù†"], NABATIEH: ["Nabatieh", "Ø§Ù„Ù†Ø¨Ø·ÙŠØ©"],
    BEKAA: ["Bekaa", "Ø§Ù„Ø¨Ù‚Ø§Ø¹"], BAALBEK_HERMEL: ["Baalbek-Hermel", "Ø¨Ø¹Ù„Ø¨Ùƒ Ø§Ù„Ù‡Ø±Ù…Ù„"],
  },
  categories: {
    FICTION: ["Fiction", "Ø±ÙˆØ§ÙŠØ§Øª ÙˆÙ‚ØµØµ"], CHILDREN: ["Children", "Ø£Ø·ÙØ§Ù„"],
    UNIVERSITY: ["University", "Ø¬Ø§Ù…Ø¹ÙŠØ©"], BUSINESS: ["Business", "Ø£Ø¹Ù…Ø§Ù„"], SELF_DEVELOPMENT: ["Self-development", "ØªØ·ÙˆÙŠØ± Ø°Ø§ØªÙŠ"], OTHER: ["Other", "Ø£Ø®Ø±Ù‰"],
  },
  languages: { ARABIC: ["Arabic", "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©"], ENGLISH: ["English", "Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©"], FRENCH: ["French", "Ø§Ù„ÙØ±Ù†Ø³ÙŠØ©"], OTHER: ["Other", "Ø£Ø®Ø±Ù‰"] },
  conditions: { EXCELLENT: ["Excellent", "Ù…Ù…ØªØ§Ø²Ø©"], GOOD: ["Good", "Ø¬ÙŠØ¯Ø©"], ACCEPTABLE: ["Acceptable", "Ù…Ù‚Ø¨ÙˆÙ„Ø©"] },
  handover: { DROP_OFF: ["I can drop them off", "ÙŠÙ…ÙƒÙ†Ù†ÙŠ ØªØ³Ù„ÙŠÙ…Ù‡Ø§"], PICKUP: ["I need pickup", "Ø£Ø­ØªØ§Ø¬ Ø¥Ù„Ù‰ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù… Ù…Ù† Ù…ÙˆÙ‚Ø¹ÙŠ"] },
} as const;

const copy = {
  en: {
    formTitle: "Register a book donation", formIntro: "Estimates are fine. Required fields are marked with an asterisk.",
    steps: ["Your details", "The books", "Handover"], step: "Step", of: "of",
    fullName: "Full name", phone: "Phone / WhatsApp", email: "Email", optional: "Optional", governorate: "Governorate", chooseGovernorate: "Choose your governorate",
    area: "Area or locality", address: "Detailed pickup address", addressHint: "Required only when pickup is selected.",
    book: "Book", title: "Book title", author: "Author", category: "Category", language: "Language", condition: "Condition",
    frontCover: "Front cover", backCover: "Back cover", addBook: "Add Book", removeBook: "Remove Book",
    photoInstruction: "Photograph only the book. Keep people, identity documents, addresses, labels, and other personal information out of the image.",
    uploadImage: "Upload image", replaceImage: "Replace image", uploadingImage: "Uploadingâ€¦", imageFormats: "JPEG, PNG, or WebP, up to 5 MB.",
    handover: "Preferred handover", notes: "Notes for the team", notesHint: "Access details, preferred contact time, or anything else we should know.",
    donationConsent: "I confirm that I am donating these books free of charge and have the right to give them.",
    privacyConsent: "I agree that LEE may use these details to review and coordinate this donation.",
    acceptance: "I understand that submitting this form does not guarantee that every book will be accepted.",
    acceptanceAcknowledged: "I understand that submitting this form does not guarantee that every book will be accepted.",
    routing: "Books are reviewed and may be routed for resale, community use, or responsible recycling under the approved policy.",
    next: "Continue", back: "Back", submit: "Register donation", submitting: "Registeringâ€¦",
    required: "Please complete this field.", invalidEmail: "Enter a valid email address or leave it blank.",
    addressRequired: "Add the address where the books should be collected.", consentRequired: "Please confirm this acknowledgement.",
    imageRequired: "Upload this cover image.", imageType: "Choose a JPEG, PNG, or WebP image.", imageSize: "The image must be 5 MB or smaller.", imageUploadFailed: "The image could not be uploaded. Please try again.",
    server: "We could not register the donation. Please try again.", rate: "Too many attempts were made from this connection. Please try again later.",
    validation: "Please review the highlighted fields.", successTitle: "Your donation is registered", successBody: "Keep this reference. Our team will review your details and contact you to confirm the next step.", reference: "Donation reference", another: "Register another donation",
  },
  ar: {
    chooseGovernorate: "\u0627\u062e\u062a\u0631 \u0645\u062d\u0627\u0641\u0638\u062a\u0643",
    formTitle: "Ø³Ø¬Ù‘Ù„ ØªØ¨Ø±Ø¹Ø§Ù‹ Ø¨Ø§Ù„ÙƒØªØ¨", formIntro: "Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠØ© ÙƒØ§ÙÙŠØ©. Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ù…Ù…ÙŠØ²Ø© Ø¨Ù†Ø¬Ù…Ø©.",
    steps: ["Ø¨ÙŠØ§Ù†Ø§ØªÙƒ", "Ø§Ù„ÙƒØªØ¨", "Ø§Ù„ØªØ³Ù„ÙŠÙ…"], step: "Ø§Ù„Ø®Ø·ÙˆØ©", of: "Ù…Ù†",
    fullName: "Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„", phone: "Ø§Ù„Ù‡Ø§ØªÙ / ÙˆØ§ØªØ³Ø§Ø¨", email: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ", optional: "Ø§Ø®ØªÙŠØ§Ø±ÙŠ", governorate: "Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©",
    area: "Ø§Ù„Ù…Ù†Ø·Ù‚Ø© Ø£Ùˆ Ø§Ù„Ø¨Ù„Ø¯Ø©", address: "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù… Ø¨Ø§Ù„ØªÙØµÙŠÙ„", addressHint: "Ù…Ø·Ù„ÙˆØ¨ ÙÙ‚Ø· Ø¹Ù†Ø¯ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù… Ù…Ù† Ù…ÙˆÙ‚Ø¹Ùƒ.",
    book: "Ø§Ù„ÙƒØªØ§Ø¨", title: "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒØªØ§Ø¨", author: "Ø§Ø³Ù… Ø§Ù„Ù…Ø¤Ù„Ù", category: "Ø§Ù„ÙØ¦Ø©", language: "Ø§Ù„Ù„ØºØ©", condition: "Ø§Ù„Ø­Ø§Ù„Ø©",
    frontCover: "Ø§Ù„ØºÙ„Ø§Ù Ø§Ù„Ø£Ù…Ø§Ù…ÙŠ", backCover: "Ø§Ù„ØºÙ„Ø§Ù Ø§Ù„Ø®Ù„ÙÙŠ", addBook: "Ø¥Ø¶Ø§ÙØ© ÙƒØªØ§Ø¨", removeBook: "Ø¥Ø²Ø§Ù„Ø© Ø§Ù„ÙƒØªØ§Ø¨",
    photoInstruction: "ØµÙˆÙ‘Ø± Ø§Ù„ÙƒØªØ§Ø¨ ÙÙ‚Ø·. Ù„Ø§ ØªÙØ¸Ù‡Ø± Ø£Ø´Ø®Ø§ØµØ§Ù‹ Ø£Ùˆ ÙˆØ«Ø§Ø¦Ù‚ Ù‡ÙˆÙŠØ© Ø£Ùˆ Ø¹Ù†Ø§ÙˆÙŠÙ† Ø£Ùˆ Ù…Ù„ØµÙ‚Ø§Øª Ø£Ùˆ Ø£ÙŠ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø´Ø®ØµÙŠØ© Ø£Ø®Ø±Ù‰ ÙÙŠ Ø§Ù„ØµÙˆØ±Ø©.",
    uploadImage: "Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©", replaceImage: "Ø§Ø³ØªØ¨Ø¯Ø§Ù„ Ø§Ù„ØµÙˆØ±Ø©", uploadingImage: "Ø¬Ø§Ø±Ù Ø§Ù„Ø±ÙØ¹â€¦", imageFormats: "JPEG Ø£Ùˆ PNG Ø£Ùˆ WebPØŒ Ø¨Ø­Ø¬Ù… Ø£Ù‚ØµÙ‰ 5 Ù…ÙŠØºØ§Ø¨Ø§ÙŠØª.",
    handover: "Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„ØªØ³Ù„ÙŠÙ… Ø§Ù„Ù…ÙØ¶Ù„Ø©", notes: "Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ù„Ù„ÙØ±ÙŠÙ‚", notesHint: "ØªÙØ§ØµÙŠÙ„ Ø§Ù„ÙˆØµÙˆÙ„ Ø£Ùˆ ÙˆÙ‚Øª Ø§Ù„Ø§ØªØµØ§Ù„ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨ Ø£Ùˆ Ø£ÙŠ Ù…Ø¹Ù„ÙˆÙ…Ø© Ù…ÙÙŠØ¯Ø©.",
    donationConsent: "Ø£Ø¤ÙƒØ¯ Ø£Ù†Ù†ÙŠ Ø£ØªØ¨Ø±Ø¹ Ø¨Ù‡Ø°Ù‡ Ø§Ù„ÙƒØªØ¨ Ù…Ø¬Ø§Ù†Ø§Ù‹ ÙˆØ£Ù† Ù„Ø¯ÙŠ Ø§Ù„Ø­Ù‚ ÙÙŠ ØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§.",
    privacyConsent: "Ø£ÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø§Ø³ØªØ®Ø¯Ø§Ù… LEE Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ØªØ¨Ø±Ø¹ ÙˆØ§Ù„ØªÙ†Ø³ÙŠÙ‚ Ø¨Ø´Ø£Ù†Ù‡.",
    acceptance: "Ø£ÙÙ‡Ù… Ø£Ù† Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø§ ÙŠØ¶Ù…Ù† Ù‚Ø¨ÙˆÙ„ Ø¬Ù…ÙŠØ¹ Ø§Ù„ÙƒØªØ¨.",
    acceptanceAcknowledged: "Ø£ÙÙ‡Ù… Ø£Ù† Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø§ ÙŠØ¶Ù…Ù† Ù‚Ø¨ÙˆÙ„ Ø¬Ù…ÙŠØ¹ Ø§Ù„ÙƒØªØ¨.",
    routing: "ØªÙØ±Ø§Ø¬Ø¹ Ø§Ù„ÙƒØªØ¨ ÙˆÙ‚Ø¯ ØªÙÙˆØ¬Ù‘Ù‡ Ù„Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¨ÙŠØ¹ Ø£Ùˆ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ø¬ØªÙ…Ø¹ÙŠ Ø£Ùˆ Ø§Ù„ØªØ¯ÙˆÙŠØ± Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ ÙˆÙÙ‚ Ø§Ù„Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©.",
    next: "Ù…ØªØ§Ø¨Ø¹Ø©", back: "Ø§Ù„Ø³Ø§Ø¨Ù‚", submit: "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ØªØ¨Ø±Ø¹", submitting: "Ø¬Ø§Ø±Ù Ø§Ù„ØªØ³Ø¬ÙŠÙ„â€¦",
    required: "ÙŠØ±Ø¬Ù‰ Ø¥ÙƒÙ…Ø§Ù„ Ù‡Ø°Ø§ Ø§Ù„Ø­Ù‚Ù„.", invalidEmail: "Ø£Ø¯Ø®Ù„ Ø¨Ø±ÙŠØ¯Ø§Ù‹ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ§Ù‹ ØµØ­ÙŠØ­Ø§Ù‹ Ø£Ùˆ Ø§ØªØ±Ùƒ Ø§Ù„Ø­Ù‚Ù„ ÙØ§Ø±ØºØ§Ù‹.",
    addressRequired: "Ø£Ø¶Ù Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø°ÙŠ ÙŠØ¬Ø¨ Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„ÙƒØªØ¨ Ù…Ù†Ù‡.", consentRequired: "ÙŠØ±Ø¬Ù‰ ØªØ£ÙƒÙŠØ¯ Ù‡Ø°Ø§ Ø§Ù„Ø¥Ù‚Ø±Ø§Ø±.",
    imageRequired: "ÙŠØ±Ø¬Ù‰ Ø±ÙØ¹ ØµÙˆØ±Ø© Ù‡Ø°Ø§ Ø§Ù„ØºÙ„Ø§Ù.", imageType: "Ø§Ø®ØªØ± ØµÙˆØ±Ø© Ø¨ØµÙŠØºØ© JPEG Ø£Ùˆ PNG Ø£Ùˆ WebP.", imageSize: "ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØªØ¬Ø§ÙˆØ² Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø© 5 Ù…ÙŠØºØ§Ø¨Ø§ÙŠØª.", imageUploadFailed: "ØªØ¹Ø°Ù‘Ø± Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø¬Ø¯Ø¯Ø§Ù‹.",
    server: "ØªØ¹Ø°Ù‘Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ØªØ¨Ø±Ø¹. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø¬Ø¯Ø¯Ø§Ù‹.", rate: "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙƒØ«ÙŠØ±Ø© Ù…Ù† Ù‡Ø°Ø§ Ø§Ù„Ø§ØªØµØ§Ù„. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù„Ø§Ø­Ù‚Ø§Ù‹.",
    validation: "ÙŠØ±Ø¬Ù‰ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ù…ÙŠØ²Ø©.", successTitle: "ØªÙ… ØªØ³Ø¬ÙŠÙ„ ØªØ¨Ø±Ø¹Ùƒ", successBody: "Ø§Ø­ØªÙØ¸ Ø¨Ù‡Ø°Ø§ Ø§Ù„Ù…Ø±Ø¬Ø¹. Ø³ÙŠØ±Ø§Ø¬Ø¹ Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆÙŠØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ù„ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©.", reference: "Ù…Ø±Ø¬Ø¹ Ø§Ù„ØªØ¨Ø±Ø¹", another: "ØªØ³Ø¬ÙŠÙ„ ØªØ¨Ø±Ø¹ Ø¢Ø®Ø±",
  },
} as const;

const inputClass = "mt-2 w-full rounded-sm border border-surface-tertiary bg-white px-3.5 py-3 text-text-primary outline-none transition-colors placeholder:text-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100";

type CoverUploadProps = { id: string; label: string; instruction: string; formats: string; uploadLabel: string; replaceLabel: string; uploadingLabel: string; url: string; uploading: boolean; error?: string; onFile: (file?: File) => void };

function CoverUpload(props: CoverUploadProps) {
  return <div><p className="text-sm font-semibold text-text-primary">{props.label} <span className="text-red-600">*</span></p><p className="mt-1 text-xs leading-5 text-text-secondary">{props.instruction}</p><div className={cn("mt-3 overflow-hidden rounded-xl border bg-surface-primary", props.error ? "border-red-500" : "border-surface-tertiary")}>{props.url ? <img src={props.url} alt="" className="aspect-[4/3] w-full bg-white object-contain" /> : <div className="flex aspect-[4/3] items-center justify-center text-brand-blue"><ImagePlus className="size-9" aria-hidden="true" /></div>}<div className="border-t border-surface-tertiary bg-white p-3"><label htmlFor={props.id} className={cn("inline-flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold", props.uploading ? "cursor-wait bg-surface-secondary text-text-muted" : "bg-accent-navy text-white hover:bg-accent-slate")}>{props.uploading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{props.uploading ? props.uploadingLabel : props.url ? props.replaceLabel : props.uploadLabel}</label><input id={props.id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={props.uploading} onChange={(event) => { props.onFile(event.target.files?.[0]); event.target.value = ""; }} /><p className="mt-2 text-xs text-text-muted">{props.formats}</p></div></div>{props.error && <p className="mt-1.5 text-sm text-red-600">{props.error}</p>}</div>;
}

export function BookDonationForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const labelIndex = locale === "ar" ? 1 : 0;
  const [form, setForm] = useState<FormState>(initialForm);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [reference, setReference] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateBook = <K extends keyof BookState>(index: number, key: K, value: BookState[K]) => {
    setForm((current) => ({
      ...current,
      books: current.books.map((book, bookIndex) => bookIndex === index ? { ...book, [key]: value } : book),
    }));
    setErrors((current) => {
      const errorKey = `book-${index}-${key}`;
      if (!current[errorKey] && !current.books) return current;
      const next = { ...current };
      delete next[errorKey];
      delete next.books;
      return next;
    });
  };

  const addBook = () => {
    if (form.books.length >= 25) return;
    setForm((current) => ({ ...current, books: [...current.books, emptyBook()] }));
  };

  const removeBook = (index: number) => {
    if (form.books.length === 1) return;
    setForm((current) => ({ ...current, books: current.books.filter((_, bookIndex) => bookIndex !== index) }));
    setErrors({});
  };

  const uploadCover = async (index: number, side: "frontCoverUrl" | "backCoverUrl", file?: File) => {
    if (!file) return;
    const field = `book-${index}-${side}`;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((current) => ({ ...current, [field]: t.imageType }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, [field]: t.imageSize }));
      return;
    }

    setUploading((current) => ({ ...current, [field]: true }));
    setErrors((current) => { const next = { ...current }; delete next[field]; return next; });
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/public/book-restore/uploads", { method: "POST", body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.url !== "string") throw new Error("upload_failed");
      updateBook(index, side, result.url);
    } catch {
      setErrors((current) => ({ ...current, [field]: t.imageUploadFailed }));
    } finally {
      setUploading((current) => ({ ...current, [field]: false }));
    }
  };

  const focusFirstError = (nextErrors: Record<string, string>) => {
    const first = Object.keys(nextErrors)[0];
    if (first) requestAnimationFrame(() => document.getElementById(first)?.focus());
  };

  const getStepErrors = (currentStep: number) => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (form.fullName.trim().length < 2) nextErrors.fullName = t.required;
      if (form.phone.trim().length < 6) nextErrors.phone = t.required;
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = t.invalidEmail;
      if (!form.governorate) nextErrors.governorate = t.required;
      if (form.area.trim().length < 2) nextErrors.area = t.required;
    }
    if (currentStep === 1) {
      form.books.forEach((book, index) => {
        if (!book.title.trim()) nextErrors[`book-${index}-title`] = t.required;
        if (!book.category) nextErrors[`book-${index}-category`] = t.required;
        if (!book.language) nextErrors[`book-${index}-language`] = t.required;
        if (!book.condition) nextErrors[`book-${index}-condition`] = t.required;
        if (!book.frontCoverUrl) nextErrors[`book-${index}-frontCoverUrl`] = t.imageRequired;
        if (!book.backCoverUrl) nextErrors[`book-${index}-backCoverUrl`] = t.imageRequired;
      });
    }
    if (currentStep === 2) {
      if (!form.handoverMethod) nextErrors.handoverMethod = t.required;
      if (form.handoverMethod === "PICKUP" && !form.detailedAddress.trim()) nextErrors.detailedAddress = t.addressRequired;
      for (const key of ["donationConsent", "privacyConsent", "acceptanceAcknowledged"] as const) {
        if (!form[key]) nextErrors[key] = t.consentRequired;
      }
    }
    return nextErrors;
  };

  const validateStep = (currentStep: number) => {
    const nextErrors = getStepErrors(currentStep);
    setErrors(nextErrors);
    focusFirstError(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    setRequestError("");
    if (validateStep(step)) {
      setStep((current) => Math.min(2, current + 1));
      document.getElementById("donation-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequestError("");
    if (!validateStep(2)) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/public/book-restore/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.error === "validation") {
          const fieldErrors = Object.fromEntries(Object.keys(result.fields ?? {}).map((key) => [key, t.required]));
          setErrors(fieldErrors);
          const firstField = Object.keys(fieldErrors)[0];
          if (["fullName", "phone", "email", "governorate", "area"].includes(firstField)) setStep(0);
          else if (firstField === "books") setStep(1);
          focusFirstError(fieldErrors);
          throw new Error(t.validation);
        }
        throw new Error(result.error === "rate_limited" ? t.rate : t.server);
      }
      if (typeof result.reference !== "string") throw new Error(t.server);
      setReference(result.reference);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t.server);
    } finally {
      setSubmitting(false);
    }
  };

  if (reference) {
    return (
      <div className="py-8 text-center" aria-live="polite">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h2 className="mt-6 font-serif text-3xl text-accent-navy">{t.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-text-secondary">{t.successBody}</p>
        <div className="mx-auto mt-7 max-w-sm rounded-xl bg-brand-blue-light px-5 py-4">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-accent-steel">{t.reference}</span>
          <strong className="mt-1 block text-xl tabular-nums tracking-[0.04em] text-accent-navy" dir="ltr">{reference}</strong>
        </div>
        <button type="button" onClick={() => { setForm(initialForm); setStep(0); setReference(null); }} className="mt-7 text-sm font-semibold text-brand-blue underline decoration-brand-blue/35 underline-offset-4 hover:text-brand-blue-dark">
          {t.another}
        </button>
      </div>
    );
  }

  const errorText = (field: string) => errors[field] ? <p id={`${field}-error`} className="mt-1.5 text-sm text-red-600">{errors[field]}</p> : null;
  const describedBy = (field: string, hint?: boolean) => [hint ? `${field}-hint` : "", errors[field] ? `${field}-error` : ""].filter(Boolean).join(" ") || undefined;
  const optionLabel = (group: keyof typeof labels, value: string) => (labels[group] as Record<string, readonly [string, string]>)[value][labelIndex];
  const hasActiveUpload = Object.values(uploading).some(Boolean);
  const canContinue = Object.keys(getStepErrors(step)).length === 0 && !hasActiveUpload;

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl text-accent-navy tracking-[-0.02em]">{t.formTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{t.formIntro}</p>
      </div>

      <div className="mb-9" aria-label={`${t.step} ${step + 1} ${t.of} 3`}>
        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-text-secondary">
          <span>{t.steps[step]}</span><span>{t.step} {step + 1} {t.of} 3</span>
        </div>
        <ol className="grid grid-cols-3 gap-2">
          {t.steps.map((name, index) => (
            <li key={name} className="flex items-center gap-2">
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", index < step ? "bg-emerald-600 text-white" : index === step ? "bg-accent-navy text-white" : "bg-surface-secondary text-text-secondary")}>
                {index < step ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn("hidden text-xs sm:block", index === step ? "font-semibold text-accent-navy" : "text-text-secondary")}>{name}</span>
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} />
        </div>

        {step === 0 && (
          <fieldset className="space-y-5">
            <legend className="sr-only">{t.steps[0]}</legend>
            <div><label htmlFor="fullName" className="text-sm font-semibold text-text-primary">{t.fullName} <span className="text-red-600">*</span></label><input id="fullName" className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" aria-invalid={!!errors.fullName} aria-describedby={describedBy("fullName")} />{errorText("fullName")}</div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="phone" className="text-sm font-semibold text-text-primary">{t.phone} <span className="text-red-600">*</span></label><input id="phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" dir="ltr" aria-invalid={!!errors.phone} aria-describedby={describedBy("phone")} />{errorText("phone")}</div>
              <div><label htmlFor="email" className="text-sm font-semibold text-text-primary">{t.email} <span className="font-normal text-text-secondary">({t.optional})</span></label><input id="email" type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" dir="ltr" aria-invalid={!!errors.email} aria-describedby={describedBy("email")} />{errorText("email")}</div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="governorate" className="text-sm font-semibold text-text-primary">{t.governorate} <span className="text-red-600">*</span></label><select id="governorate" className={inputClass} value={form.governorate} onChange={(e) => update("governorate", e.target.value)} aria-invalid={!!errors.governorate} aria-describedby={describedBy("governorate")}><option value="">{t.chooseGovernorate}</option>{GOVERNORATES.map((value) => <option key={value} value={value}>{optionLabel("governorates", value)}</option>)}</select>{errorText("governorate")}</div>
              <div><label htmlFor="area" className="text-sm font-semibold text-text-primary">{t.area} <span className="text-red-600">*</span></label><input id="area" className={inputClass} value={form.area} onChange={(e) => update("area", e.target.value)} autoComplete="address-level2" aria-invalid={!!errors.area} aria-describedby={describedBy("area")} />{errorText("area")}</div>
            </div>
          </fieldset>
        )}
        {step === 1 && (
          <div className="space-y-7">
            {form.books.map((book, index) => <section key={index} className="rounded-xl border border-surface-tertiary bg-surface-primary p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4"><h3 className="font-serif text-xl text-accent-navy">{t.book} {index + 1}</h3>{form.books.length > 1 && <button type="button" onClick={() => removeBook(index)} className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800"><Trash2 className="size-4" aria-hidden="true" />{t.removeBook}</button>}</div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label htmlFor={`book-${index}-title`} className="text-sm font-semibold text-text-primary">{t.title} <span className="text-red-600">*</span></label><input id={`book-${index}-title`} className={inputClass} value={book.title} onChange={(event) => updateBook(index, "title", event.target.value)} aria-invalid={!!errors[`book-${index}-title`]} />{errorText(`book-${index}-title`)}</div>
                <div><label htmlFor={`book-${index}-author`} className="text-sm font-semibold text-text-primary">{t.author} <span className="font-normal text-text-secondary">({t.optional})</span></label><input id={`book-${index}-author`} className={inputClass} value={book.author} onChange={(event) => updateBook(index, "author", event.target.value)} /></div>
                <div><label htmlFor={`book-${index}-category`} className="text-sm font-semibold text-text-primary">{t.category} <span className="text-red-600">*</span></label><select id={`book-${index}-category`} className={inputClass} value={book.category} onChange={(event) => updateBook(index, "category", event.target.value)} aria-invalid={!!errors[`book-${index}-category`]}><option value="">—</option>{BOOK_CATEGORIES.map((value) => <option key={value} value={value}>{optionLabel("categories", value)}</option>)}</select>{errorText(`book-${index}-category`)}</div>
                <div><label htmlFor={`book-${index}-language`} className="text-sm font-semibold text-text-primary">{t.language} <span className="text-red-600">*</span></label><select id={`book-${index}-language`} className={inputClass} value={book.language} onChange={(event) => updateBook(index, "language", event.target.value)} aria-invalid={!!errors[`book-${index}-language`]}><option value="">—</option>{BOOK_LANGUAGES.map((value) => <option key={value} value={value}>{optionLabel("languages", value)}</option>)}</select>{errorText(`book-${index}-language`)}</div>
                <div className="sm:col-span-2"><label htmlFor={`book-${index}-condition`} className="text-sm font-semibold text-text-primary">{t.condition} <span className="text-red-600">*</span></label><select id={`book-${index}-condition`} className={inputClass} value={book.condition} onChange={(event) => updateBook(index, "condition", event.target.value)} aria-invalid={!!errors[`book-${index}-condition`]}><option value="">—</option>{BOOK_CONDITIONS.map((value) => <option key={value} value={value}>{optionLabel("conditions", value)}</option>)}</select>{errorText(`book-${index}-condition`)}</div>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <CoverUpload id={`book-${index}-frontCoverUrl`} label={t.frontCover} instruction={t.photoInstruction} formats={t.imageFormats} uploadLabel={t.uploadImage} replaceLabel={t.replaceImage} uploadingLabel={t.uploadingImage} url={book.frontCoverUrl} uploading={!!uploading[`book-${index}-frontCoverUrl`]} error={errors[`book-${index}-frontCoverUrl`]} onFile={(file) => uploadCover(index, "frontCoverUrl", file)} />
                <CoverUpload id={`book-${index}-backCoverUrl`} label={t.backCover} instruction={t.photoInstruction} formats={t.imageFormats} uploadLabel={t.uploadImage} replaceLabel={t.replaceImage} uploadingLabel={t.uploadingImage} url={book.backCoverUrl} uploading={!!uploading[`book-${index}-backCoverUrl`]} error={errors[`book-${index}-backCoverUrl`]} onFile={(file) => uploadCover(index, "backCoverUrl", file)} />
              </div>
            </section>)}
            <button type="button" onClick={addBook} disabled={form.books.length >= 25} className="inline-flex items-center gap-2 rounded-sm border-2 border-brand-blue px-5 py-2.5 text-sm font-semibold text-brand-blue hover:bg-brand-blue hover:text-white disabled:cursor-not-allowed disabled:border-surface-tertiary disabled:text-text-muted"><Plus className="size-4" aria-hidden="true" />{t.addBook}</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-7">
            <fieldset><legend className="text-sm font-semibold text-text-primary">{t.handover} <span className="text-red-600">*</span></legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{HANDOVER_METHODS.map((value) => <label key={value} className={cn("cursor-pointer rounded-sm border px-4 py-4 text-sm transition-colors", form.handoverMethod === value ? "border-brand-blue bg-brand-blue-light font-semibold text-accent-navy" : "border-surface-tertiary hover:border-brand-blue/60")}><input id={value === HANDOVER_METHODS[0] ? "handoverMethod" : undefined} type="radio" name="handover" checked={form.handoverMethod === value} onChange={() => update("handoverMethod", value)} className="me-2 accent-[#5895D0]" aria-invalid={!!errors.handoverMethod} />{optionLabel("handover", value)}</label>)}</div>{errorText("handoverMethod")}</fieldset>
            {form.handoverMethod === "PICKUP" && <div><label htmlFor="detailedAddress" className="text-sm font-semibold text-text-primary">{t.address} <span className="text-red-600">*</span></label><p id="detailedAddress-hint" className="mt-1 text-sm text-text-secondary">{t.addressHint}</p><textarea id="detailedAddress" rows={3} className={inputClass} value={form.detailedAddress} onChange={(e) => update("detailedAddress", e.target.value)} autoComplete="street-address" aria-invalid={!!errors.detailedAddress} aria-describedby={describedBy("detailedAddress", true)} />{errorText("detailedAddress")}</div>}
            <div><label htmlFor="notes" className="text-sm font-semibold text-text-primary">{t.notes} <span className="font-normal text-text-secondary">({t.optional})</span></label><p id="notes-hint" className="mt-1 text-sm text-text-secondary">{t.notesHint}</p><textarea id="notes" rows={4} maxLength={2000} className={inputClass} value={form.notes} onChange={(e) => update("notes", e.target.value)} aria-describedby="notes-hint" /></div>
            <div className="rounded-xl bg-brand-blue-light p-5"><p className="text-sm leading-6 text-accent-navy">{t.routing}</p><div className="mt-5 space-y-4">{(["donationConsent", "privacyConsent", "acceptanceAcknowledged"] as const).map((key) => <div key={key}><label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-text-primary"><input id={key} type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)} className="mt-1 size-4 shrink-0 accent-[#5895D0]" aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} /><span>{t[key]} <span className="text-red-600">*</span></span></label>{errorText(key)}</div>)}</div></div>
          </div>
        )}

        <div className="mt-8 min-h-6" aria-live="assertive">{requestError && <p role="alert" className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-700">{requestError}</p>}</div>
        <div className="mt-4 flex items-center justify-between border-t border-surface-secondary pt-6">
          {step > 0 ? <button type="button" onClick={() => { setErrors({}); setRequestError(""); setStep((current) => current - 1); }} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-text-secondary hover:text-accent-navy"><ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />{t.back}</button> : <span />}
          {step < 2 ? <button type="button" onClick={nextStep} disabled={!canContinue} className={cn("inline-flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold", canContinue ? "bg-brand-blue-dark text-white hover:bg-brand-blue-deeper" : "cursor-not-allowed bg-surface-secondary text-text-muted")}>{t.next}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></button> : <button type="submit" disabled={submitting || !canContinue} className={cn("inline-flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold", canContinue && !submitting ? "bg-brand-blue-dark text-white hover:bg-brand-blue-deeper" : "cursor-not-allowed bg-surface-secondary text-text-muted")}>{submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{submitting ? t.submitting : t.submit}</button>}
        </div>
      </form>
    </div>
  );
}

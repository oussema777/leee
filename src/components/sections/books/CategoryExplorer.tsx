"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Atom, BookOpen, BriefcaseBusiness, Check, ChevronDown, Compass, Feather, Globe, GraduationCap, Heart, Landmark, LibraryBig, Palette, Search, Shapes, Sparkles, Sprout, UserRound, X } from "lucide-react";
import { bookCategoryLabel, MAX_BOOK_CATEGORIES } from "@/lib/book-inventory/categories";

function categoryIcon(category: string) {
  const name = category.toLowerCase();
  if (/child|kid|أطفال/.test(name)) return Shapes;
  if (/biograph|memoir|true story/.test(name)) return UserRound;
  if (/scien|physic|math|medic/.test(name)) return Atom;
  if (/travel|geograph|world/.test(name)) return Globe;
  if (/romance|love/.test(name)) return Heart;
  if (/art|design/.test(name)) return Palette;
  if (/fiction|novel|روايات/.test(name)) return Feather;
  if (/univers|educat|school|تعليم/.test(name)) return GraduationCap;
  if (/business|account|econom|management|أعمال/.test(name)) return BriefcaseBusiness;
  if (/history|politic|تاريخ/.test(name)) return Landmark;
  if (/self|develop|تطوير/.test(name)) return Sprout;
  if (/relig|spirit|دين/.test(name)) return Sparkles;
  if (/poet|شعر/.test(name)) return Feather;
  return BookOpen;
}

interface Props {
  categories: string[];
  selected: string[];
  match: "any" | "all";
  isArabic: boolean;
  pending: boolean;
  onApply: (categories: string[], match: "any" | "all") => void;
}

export function CategoryExplorer({ categories, selected, match, isArabic, pending, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);
  const [draftMatch, setDraftMatch] = useState(match);
  const [query, setQuery] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { setDraft(selected); setDraftMatch(match); }, [selected, match]);
  const options = [...new Set([...categories, ...selected])];
  const filtered = options.filter(category => bookCategoryLabel(category, isArabic).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) || bookCategoryLabel(category).toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (category: string) => setDraft(values => values.includes(category) ? values.filter(value => value !== category) : values.length < MAX_BOOK_CATEGORIES ? [...values, category] : values);
  const focusStyle = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2";

  return <div className="mt-5 overflow-hidden rounded-2xl border border-white/20 bg-white text-accent-navy shadow-lg">
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={open ? "category-explorer" : undefined} onClick={() => setOpen(!open)} className={`flex w-full items-center gap-4 p-5 text-start transition-colors hover:bg-accent-ice sm:px-6 ${focusStyle}`}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-light"><Compass className="size-6" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block font-serif text-xl">{isArabic ? "اختر رفوفك المفضلة" : "Find your kind of story"}</span><span className="mt-1 block text-xs text-text-secondary sm:text-sm">{selected.length ? (isArabic ? `${selected.length} تصنيفات محددة` : `${selected.length} categories selected`) : (isArabic ? "استكشف التصنيفات واختر ما يثير فضولك" : "Explore categories. Follow more than one curiosity.")}</span></span>
      <span className="hidden text-xs font-semibold sm:block">{isArabic ? "تصفّح التصنيفات" : "Explore categories"}</span>
      <ChevronDown aria-hidden="true" className={`size-5 shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
    </button>

    {open && <div id="category-explorer" className="border-t border-surface-tertiary">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <p className="max-w-md text-sm leading-6 text-text-secondary">{isArabic ? "اختر تصنيفاً أو أكثر، ثم طبّق اختيارك على رف الكتب." : "Build your reading shelf: select a few interests, then apply your selection."}</p>
        <label className="relative w-full sm:w-64">
          <span className="sr-only">{isArabic ? "البحث عن تصنيف" : "Find a category"}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-brand-blue-deeper" />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={isArabic ? "ابحث عن تصنيف…" : "Find an interest…"} className={`min-h-11 w-full rounded-xl border border-surface-tertiary bg-accent-ice pe-3 ps-10 text-sm ${focusStyle}`} />
        </label>
      </div>

      <fieldset className="max-h-80 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
        <legend className="sr-only">{isArabic ? "اختر التصنيفات" : "Choose categories"}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(category => {
            const Icon = categoryIcon(category);
            const checked = draft.includes(category);
            return <label key={category} className={`relative grid min-h-28 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-brand-blue focus-within:ring-offset-2 sm:flex sm:min-h-24 sm:p-4 ${checked ? "border-accent-navy bg-accent-navy text-white" : "border-surface-tertiary bg-white hover:border-brand-blue hover:bg-accent-ice"}`}>
              <input type="checkbox" checked={checked} disabled={!checked && draft.length >= MAX_BOOK_CATEGORIES} onChange={() => toggle(category)} className="peer sr-only" />
              <Icon aria-hidden="true" strokeWidth={1.5} className={`size-6 shrink-0 ${checked ? "text-brand-blue-light" : "text-brand-blue-deeper"}`} />
              <span dir="auto" className="order-last col-span-2 min-w-0 flex-1 break-words text-start text-sm font-semibold peer-disabled:opacity-50 sm:order-none">{bookCategoryLabel(category, isArabic)}</span>
              <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${checked ? "border-white bg-white text-accent-navy" : "border-surface-tertiary"}`}>{checked && <Check className="size-3.5" />}</span>
            </label>;
          })}
        </div>
        {!filtered.length && <div className="py-8 text-center"><LibraryBig aria-hidden="true" className="mx-auto mb-3 size-7 text-brand-blue-deeper" /><p className="text-sm text-text-secondary">{isArabic ? "لا توجد تصنيفات مطابقة." : "No categories match this search."}</p>{query && <button type="button" onClick={() => setQuery("")} className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold underline ${focusStyle}`}>{isArabic ? "مسح البحث" : "Clear category search"}</button>}</div>}
      </fieldset>

      <div className="border-t border-surface-tertiary bg-accent-ice px-5 py-4 sm:px-6">
        {draft.length > 0 && <ul aria-label={isArabic ? "التصنيفات المحددة" : "Selected interests"} className="mb-4 flex flex-wrap gap-2">{draft.map(category => <li key={category}><button type="button" onClick={() => toggle(category)} aria-label={`${isArabic ? "إزالة" : "Remove"} ${bookCategoryLabel(category, isArabic)}`} className={`inline-flex min-h-9 items-center gap-2 rounded-full border border-surface-tertiary bg-white px-3 text-xs font-semibold ${focusStyle}`}>{bookCategoryLabel(category, isArabic)}<X aria-hidden="true" className="size-3.5" /></button></li>)}</ul>}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="mb-2 text-xs text-text-secondary">{isArabic ? "طريقة مطابقة التصنيفات" : "How should your interests match?"}</legend>
            {(["any", "all"] as const).map(value => <label key={value} className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold focus-within:ring-2 focus-within:ring-brand-blue ${draftMatch === value ? "border-accent-navy bg-white text-accent-navy" : "border-transparent text-text-secondary"}`}><input type="radio" name="category-match" value={value} checked={draftMatch === value} onChange={() => setDraftMatch(value)} className="me-2 accent-accent-navy" />{value === "any" ? (isArabic ? "أي تصنيف محدد" : "Any selected interest") : (isArabic ? "جميع التصنيفات معاً" : "All selected interests")}</label>)}
          </fieldset>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
            <button type="button" onClick={() => { setDraft([]); setDraftMatch("any"); }} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${focusStyle}`}>{isArabic ? "مسح الاختيار" : "Clear selection"}</button>
            <button type="button" disabled={pending} onClick={() => { onApply(draft, draftMatch); setOpen(false); trigger.current?.focus(); }} className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent-navy px-5 text-sm font-semibold text-white hover:bg-brand-blue-deeper disabled:opacity-60 ${focusStyle}`}>{isArabic ? "تطبيق الاختيار" : "Apply selection"}{draft.length > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{draft.length}</span>}<ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" /></button>
          </div>
        </div>
        <p role="status" className="mt-3 text-xs text-text-secondary">{draft.length >= MAX_BOOK_CATEGORIES ? (isArabic ? `يمكن اختيار ${MAX_BOOK_CATEGORIES} تصنيفاً كحد أقصى.` : `You can choose up to ${MAX_BOOK_CATEGORIES} interests.`) : draftMatch === "all" ? (isArabic ? "تظهر الكتب التي تحمل كل التصنيفات المحددة." : "Books must belong to every selected category.") : (isArabic ? "تظهر الكتب التي تحمل أي تصنيف محدد." : "Books can belong to any of your selected categories.")}</p>
      </div>
    </div>}
    {!open && selected.length > 0 && <div className="flex flex-wrap items-center gap-2 border-t border-surface-tertiary px-5 py-3 sm:px-6"><span className="me-1 text-xs text-text-secondary">{match === "all" ? (isArabic ? "الكل:" : "Match all:") : (isArabic ? "أي منها:" : "Match any:")}</span>{selected.map(category => <button key={category} type="button" disabled={pending} aria-label={`${isArabic ? "إزالة" : "Remove"} ${bookCategoryLabel(category, isArabic)}`} onClick={() => onApply(selected.filter(value => value !== category), match)} className={`inline-flex min-h-9 items-center gap-2 rounded-full bg-brand-blue-light px-3 text-xs font-semibold disabled:opacity-60 ${focusStyle}`}>{bookCategoryLabel(category, isArabic)}<X aria-hidden="true" className="size-3.5" /></button>)}</div>}
  </div>;
}

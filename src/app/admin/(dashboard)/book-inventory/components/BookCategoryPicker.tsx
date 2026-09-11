"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { MAX_BOOK_CATEGORIES, bookCategoryLabel, getBookCategoryOptions, normalizeBookCategory } from "@/lib/book-inventory/categories";

interface Props {
  value: string[];
  savedCategories: string[];
  onChange: (categories: string[]) => void;
  error?: string;
}

export default function BookCategoryPicker({ value, savedCategories, onChange, error }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const categories = useMemo(() => getBookCategoryOptions([...savedCategories, ...value]), [savedCategories, value]);
  const normalizedQuery = normalizeBookCategory(query);
  const filtered = categories.filter((category) =>
    bookCategoryLabel(category).toLowerCase().includes(query.trim().toLowerCase())
    || category.toLowerCase().includes(normalizedQuery.toLowerCase())
  );
  const canCreate = Boolean(normalizedQuery)
    && !["OTHER", "CHILDREN", "RELIGION"].includes(normalizedQuery)
    && !categories.some((category) => category.toLowerCase() === normalizedQuery.toLowerCase());
  const atLimit = value.length >= MAX_BOOK_CATEGORIES;

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const choose = (category: string) => {
    if (value.includes(category)) onChange(value.filter((selected) => selected !== category));
    else if (!atLimit) onChange([...value, category]);
    else return;
    setQuery("");
    close();
  };

  return (
    <div
      ref={rootRef}
      className="min-w-0 space-y-2"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (!open) return;
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const choices = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-category-option]:not(:disabled)") || []);
          if (!choices.length) return;
          const index = choices.indexOf(document.activeElement as HTMLElement);
          const next = event.key === "ArrowDown" ? (index + 1) % choices.length : (index < 0 ? choices.length - 1 : (index - 1 + choices.length) % choices.length);
          choices[next].focus();
        } else if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type === "checkbox") {
          event.preventDefault();
          event.target.click();
        }
      }}
    >
      <label htmlFor="book-categories" className="text-sm font-medium text-gray-300">
        Categories <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <button
          ref={triggerRef}
          id="book-categories"
          type="button"
          aria-expanded={open}
          aria-controls={open ? "book-category-options" : undefined}
          aria-describedby={error ? "book-categories-error" : "book-categories-help"}
          aria-invalid={Boolean(error)}
          onClick={() => { setQuery(""); setOpen(!open); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              event.stopPropagation();
              setQuery(""); setOpen(true);
            }
          }}
          className={"flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-[#0f172a] px-4 py-2.5 text-left text-sm text-gray-200 transition-colors hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue " + (error ? "border-red-400" : open ? "border-brand-blue" : "border-gray-700/50")}
        >
          <span>{value.length ? "Add another category" : "Select categories"}</span>
          <ChevronDown aria-hidden="true" className={"h-4 w-4 shrink-0 text-gray-400 " + (open ? "rotate-180" : "")} />
        </button>
        {open && (
          <div id="book-category-options" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-gray-600 bg-[#0f172a] shadow-xl shadow-black/30">
            <div className="relative border-b border-gray-700 p-2">
              <Search aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                aria-label="Search categories"
                type="text"
                autoComplete="off"
                maxLength={80}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (!event.nativeEvent.isComposing && normalizedQuery) {
                      if (canCreate) choose(normalizedQuery);
                      else if (filtered.length === 1) choose(filtered[0]);
                    }
                  }
                }}
                placeholder="Search or add a category..."
                className="min-h-11 w-full rounded-lg bg-[#1e293b] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <fieldset className="max-h-60 overflow-y-auto overscroll-contain p-1.5">
              <legend className="sr-only">Available book categories</legend>
              {filtered.map((category) => {
                const selected = value.includes(category);
                return (
                  <label key={category} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-200 hover:bg-[#263b53] focus-within:bg-[#263b53]">
                    <input
                      data-category-option
                      type="checkbox"
                      checked={selected}
                      disabled={atLimit && !selected}
                      onChange={() => choose(category)}
                      className="h-4 w-4 shrink-0 accent-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50"
                    />
                    <span className="min-w-0 break-words">{bookCategoryLabel(category)}</span>
                  </label>
                );
              })}
              {canCreate && (
                <button
                  data-category-option
                  type="button"
                  disabled={atLimit}
                  onClick={() => choose(normalizedQuery)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-blue-200 hover:bg-[#263b53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50"
                >
                  <Plus aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">Create &ldquo;{normalizedQuery}&rdquo;</span>
                </button>
              )}
              {!filtered.length && !canCreate && <p className="px-3 py-3 text-sm text-gray-400">No matching categories. Try a different name.</p>}
            </fieldset>
            {atLimit && <p className="border-t border-gray-700 px-4 py-3 text-xs text-gray-300">You can select up to {MAX_BOOK_CATEGORIES} categories.</p>}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <ul aria-label="Selected categories" className="flex flex-wrap gap-2">
          {value.map((category) => (
            <li key={category} className="inline-flex max-w-full items-center gap-1 rounded-lg border border-brand-blue/40 bg-brand-blue/15 py-1 pl-3 pr-1 text-sm text-blue-200">
              <span className="min-w-0 break-words">{bookCategoryLabel(category)}</span>
              <button
                type="button"
                aria-label={"Remove " + bookCategoryLabel(category) + " category"}
                onClick={() => { onChange(value.filter((selected) => selected !== category)); triggerRef.current?.focus(); }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-blue-200 hover:bg-brand-blue/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p id="book-categories-help" className="text-xs leading-5 text-gray-400">Choose one or more categories. Type a new name to create one.</p>
      <span role="status" className="sr-only">{value.length} {value.length === 1 ? "category" : "categories"} selected.</span>
      {error && <p id="book-categories-error" role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

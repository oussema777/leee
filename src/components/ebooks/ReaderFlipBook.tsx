"use client";
/*! Flip engine: @gullabs/flipbook-core 3.2.2. License and source: /third-party/ebook-reader-notices.txt */
import { useEffect, useRef } from "react";
import { PageFlip } from "@gullabs/flipbook-core";
import type { ReaderSheet } from "./reader-pages";
import s from "./reader.module.css";

type Props = { count: number; page: number; rtl: boolean; spread: boolean; motion: boolean; ar: boolean;
  ready: Map<number, ReaderSheet>; marks: { page: number }[]; onPage: (page: number) => void;
  onBookmark: (page: number, saved: boolean) => void; onBusy: (busy: boolean) => void };

export function ReaderFlipBook(props: Props) {
  const host = useRef<HTMLDivElement>(null), engine = useRef<PageFlip | null>(null);
  const leaves = useRef<HTMLElement[]>([]), latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const elements = Array.from({ length: props.count }, (_, index) => {
      const leaf = document.createElement("div"); leaf.className = s.flipLeaf;
      const face = document.createElement("div"); face.className = s.flipFace;
      const placeholder = document.createElement("div"); placeholder.className = s.flipPlaceholder;
      placeholder.textContent = `${props.ar ? "صفحة" : "Page"} ${index + 1}`;
      face.append(placeholder); leaf.append(face); container.append(leaf);
      return leaf;
    });
    leaves.current = elements;
    const width = Math.max(100, container.clientWidth / (props.spread ? 2 : 1));
    const book = new PageFlip(container, { width, height: width / .7048, sizing: "fixed", initialPage: props.page - 1,
      hardCovers: true, usePortrait: true, autoSize: false, readingDirection: props.rtl ? "rtl" : "ltr",
      flippingTime: props.motion ? 600 : 0, maxShadowOpacity: .32, flipOnClick: "corners",
      foldCornerOnHover: props.motion, respectReducedMotion: true, allowTouchScroll: false });
    engine.current = book;
    book.on("flip", ({ data }) => latest.current.onPage(data.page + 1));
    book.on("changeState", ({ data }) => { container.dataset.turnState = data.state; latest.current.onBusy(data.state !== "read" && data.state !== "fold_corner"); });
    container.dataset.turnState = "read";
    book.loadFromHTML(elements);
    // Keep deliberate swipes usable when animations are disabled. The engine's
    // fast-swipe recognizer otherwise ignores slow gestures in reduced-motion mode.
    let gesture: { x: number; y: number; page: number; pointerId: number } | null = null;
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      if ((event.target as HTMLElement).closest("button,a,input")) return;
      gesture = { x: event.clientX, y: event.clientY, page: book.getCurrentPageIndex(), pointerId: event.pointerId };
    };
    const up = (event: PointerEvent) => {
      if (gesture?.pointerId !== event.pointerId) return;
      const from = gesture; gesture = null;
      if (!from || (latest.current.motion && !matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
      const dx = event.clientX - from.x, dy = event.clientY - from.y;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || book.getCurrentPageIndex() !== from.page) return;
      if ((dx > 0) === latest.current.rtl) book.flipNext(); else book.flipPrev();
    };
    const cancel = () => { gesture = null; };
    container.addEventListener("pointerdown", down, true); container.addEventListener("pointerup", up);
    container.addEventListener("pointercancel", cancel);
    let lastWidth = width;
    const resize = new ResizeObserver(() => {
      const w = Math.max(100, container.clientWidth / (latest.current.spread ? 2 : 1));
      if (w !== lastWidth) { lastWidth = w; book.updateSettings({ width: w, height: w / .7048 }); }
    });
    resize.observe(container);
    return () => { resize.disconnect(); container.removeEventListener("pointerdown", down, true); container.removeEventListener("pointerup", up); container.removeEventListener("pointercancel", cancel); book.destroy(); engine.current = null; container.replaceChildren(); leaves.current = []; };
    // Geometry/direction changes create one new engine, not one engine per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.count, props.rtl, props.spread, props.ar]);
  useEffect(() => {
    leaves.current.forEach((leaf, index) => {
      const face = leaf.firstElementChild as HTMLElement;
      const sheet = props.ready.get(index + 1);
      const existing = face.querySelector("img");
      if (sheet && existing?.getAttribute("src") !== sheet.url) {
        face.replaceChildren();
        const image = document.createElement("img"); image.src = sheet.url;
        image.alt = `${props.ar ? "صفحة" : "Page"} ${index + 1}`; image.draggable = false; face.append(image);
      } else if (!sheet && existing) {
        face.replaceChildren();
        const placeholder = document.createElement("div"); placeholder.className = s.flipPlaceholder;
        placeholder.textContent = `${props.ar ? "صفحة" : "Page"} ${index + 1}`; face.append(placeholder);
      }
      if (sheet) {
        let button = face.querySelector("button");
        if (!button) { button = document.createElement("button"); button.className = s.ribbon; face.append(button); }
        const marked = props.marks.some(m => m.page === index + 1);
        const label = props.ar ? `${marked ? "إلغاء حفظ" : "حفظ"} الصفحة ${index + 1}` : `${marked ? "Unbookmark" : "Bookmark"} page ${index + 1}`;
        button.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
        button.setAttribute("aria-label", label); button.title = label;
        button.setAttribute("aria-pressed", String(marked));
        button.onclick = () => latest.current.onBookmark(index + 1, marked);
      }
    });
  }, [props.ready, props.marks, props.count, props.spread, props.rtl, props.ar]);
  useEffect(() => {
    const book = engine.current;
    if (!book) return;
    book.updateSettings({ flippingTime: props.motion ? 600 : 0, foldCornerOnHover: props.motion });
    if (book.getCurrentPageIndex() === props.page - 1) return;
    if (Math.abs(book.getCurrentPageIndex() - (props.page - 1)) <= 2 && props.motion) book.flipToPage(props.page - 1);
    else book.turnToPage(props.page - 1);
  }, [props.page, props.motion]);
  return <div className={s.flipHost} ref={host} data-reader-flipbook="true" data-spread={props.spread} data-cover={props.page === 1 ? "front" : props.page === props.count ? "back" : "none"} data-rtl={props.rtl} dir="ltr" />;
}

"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, BookOpen, Check, ChevronLeft, ChevronRight, Focus, List, LoaderCircle, Maximize, Minimize, Moon, Settings2, Sun, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { EbookClientError, ebookFetch } from "./client";
import { ReaderLogin } from "./ReaderLogin";
import { ReaderAccount } from "./ReaderAccount";
import s from "./reader.module.css";
import { ReaderPages, type ReaderSheet } from "./reader-pages";
import { ReaderFlipBook } from "./ReaderFlipBook";

type Mark = { page: number; label: string };
type Info = { reader?: { email: string }; titleEn: string; titleAr: string; author?: string; direction: string; pageCount: number; versionId: string; lastPage: number; bookmarks: Mark[]; preview?: boolean };
type Sheet = { page: number; url: string };
type Panel = "bookmarks" | "pages" | "settings" | null;
export function EbookReader({ locale, id }: { locale: string; id: string }) {
  const ar = locale === "ar", t = (en: string, arabic: string) => ar ? arabic : en;
  const [auth, setAuth] = useState<boolean | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [page, setPage] = useState(1), [jump, setJump] = useState("1");
  const [zoom, setZoom] = useState(100), [theme, setTheme] = useState("dark");
  const [dockOpen, setDockOpen] = useState(true), [dockActivity, setDockActivity] = useState(0);
  const dock = useRef<HTMLDivElement>(null), dockHovered = useRef(false);
  const [wide, setWide] = useState(false), [spread, setSpread] = useState(true);
  const [motion, setMotion] = useState(true), [focused, setFocused] = useState(false), [fullscreen, setFullscreen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]), [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(new Map<number, ReaderSheet>());
  const [flipping, setFlipping] = useState(false);
  const cache = useRef<ReaderPages | null>(null);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0), [saved, setSaved] = useState(true);
  const [marks, setMarks] = useState<Mark[]>([]), [markBusy, setMarkBusy] = useState(false), [label, setLabel] = useState("");
  const root = useRef<HTMLDivElement>(null), viewport = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null), panelTrigger = useRef<HTMLButtonElement | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const double = wide && spread && zoom === 100, rtl = info?.direction === "rtl";
  const start = double && page > 1 && page !== info?.pageCount ? page - page % 2 : page;
  const end = double && start > 1 && start < (info?.pageCount || 1) ? Math.min(start + 1, (info?.pageCount || 1) - 1) : start;
  const shown = sheets[0]?.page ?? page, bookmarked = marks.some(m => m.page === shown);

  const load = useCallback(async () => {
    setError(""); setLoading(true);
    try {
      const data = await ebookFetch<Info>(`/api/ebooks/read/${id}`);
      setAuth(true); setInfo(data); setMarks(data.bookmarks || []);
      setPage(data.lastPage); setJump(String(data.lastPage));
    } catch (e) {
      if (e instanceof EbookClientError && e.status === 401) setAuth(false);
      else setError((e as Error).message);
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!dockOpen || flipping) return;
    const timer = setTimeout(() => {
      if (!dockHovered.current && !dock.current?.querySelector(":focus-visible")) setDockOpen(false);
    }, 2600);
    return () => clearTimeout(timer);
  }, [dockOpen, dockActivity, fullscreen, flipping]);
  useEffect(() => {
    const query = matchMedia("(min-width: 1000px)");
    const change = () => setWide(query.matches);
    change(); query.addEventListener("change", change);
    try {
      const prefs = JSON.parse(localStorage.getItem("lee-reader-preferences") || "{}");
      if (["light", "warm", "dark"].includes(prefs.theme)) setTheme(prefs.theme);
      if (typeof prefs.spread === "boolean") setSpread(prefs.spread);
      if (typeof prefs.motion === "boolean") setMotion(prefs.motion);
    } catch { /* Storage is optional. */ }
    const full = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", full);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const outside = new Map<HTMLElement, boolean>();
    const isolate = () => {
      let branch: HTMLElement | null = root.current;
      while (branch && branch !== document.body) {
        for (const sibling of Array.from(branch.parentElement?.children || [])) {
          if (sibling !== branch && sibling instanceof HTMLElement && !outside.has(sibling)) {
            outside.set(sibling, sibling.inert); sibling.inert = true;
          }
        }
        branch = branch.parentElement;
      }
    };
    isolate();
    const observer = new MutationObserver(isolate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      query.removeEventListener("change", change); document.removeEventListener("fullscreenchange", full);
      document.body.style.overflow = oldOverflow;
      observer.disconnect(); outside.forEach((inert, el) => { el.inert = inert; });
    };
  }, []);
  function preference(next: { theme?: string; spread?: boolean; motion?: boolean }) {
    const prefs = { theme, spread, motion, ...next };
    setTheme(prefs.theme); setSpread(prefs.spread); setMotion(prefs.motion);
    try { localStorage.setItem("lee-reader-preferences", JSON.stringify(prefs)); } catch { /* Optional. */ }
  }
  const navigate = useCallback((target: number) => {
    if (!info) return;
    const value = Math.max(1, Math.min(info.pageCount, target));
    setPage(value); setJump(String(value));
  }, [info]);
  const next = useCallback(() => navigate(end + 1), [navigate, end]);
  const previous = useCallback(() => navigate(start - 1), [navigate, start]);
  useEffect(() => {
    const buffer = new ReaderPages(id, () => setReady(buffer.snapshot()), error => {
      setSheets([]); setError(error.message);
      if (error.status === 401) { setAuth(false); setInfo(null); }
    });
    cache.current = buffer;
    return () => { buffer.clear(); cache.current = null; };
  }, [id, info?.versionId]);
  useEffect(() => {
    if (!info || auth !== true) return;
    let active = true;
    const check = async () => {
      if (document.hidden) return;
      try {
        const current = await ebookFetch<Info>(`/api/ebooks/read/${id}`);
        if (active && current.versionId !== info.versionId) { cache.current?.clear(); setSheets([]); setInfo(current); setPage(current.lastPage); }
      } catch (e) {
        if (active && e instanceof EbookClientError && [401, 403].includes(e.status)) {
          cache.current?.clear(); setSheets([]); setError(e.message);
          if (e.status === 401) { setAuth(false); setInfo(null); }
        }
      }
    };
    const timer = setInterval(() => void check(), 20000);
    document.addEventListener("visibilitychange", check);
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", check); };
  }, [id, info, auth]);
  useEffect(() => {
    if (!info || auth !== true) return;
    let active = true;
    setLoading(true); setError("");
    void (async () => {
      try {
        const buffer = cache.current;
        if (!buffer) return;
        const requested = (start === end ? [start] : [start, end]).map(number => buffer.get(number));
        const incoming = await Promise.all(requested);
        if (!active) return;
        setSheets(incoming); setLoading(false); setJump(String(start)); viewport.current?.scrollTo(0, 0);
        buffer.trim(start, end);
        buffer.warm(start, end, info.pageCount);
        setSaved(false);
        // Serialize writes: a slow save must not overwrite a later page.
        saveQueue.current = saveQueue.current.catch(() => {}).then(async () => {
          if (!active) return;
          try { await ebookFetch(`/api/ebooks/read/${id}`, { page: start, versionId: info.versionId }, "PUT"); if (active) setSaved(true); }
          catch { if (active) setSaved(false); }
        });
      } catch (e) {
        if (active) {
          setLoading(false);
          if ((e as Error).name !== "AbortError") setError((e as Error).message);
        }
      }
    })();
    return () => { active = false; };
  }, [id, info, auth, start, end, retry]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { setPanel(null); setFocused(false); return; }
      if (panel || !info || event.ctrlKey || event.metaKey || event.altKey || /INPUT|SELECT|TEXTAREA/.test((event.target as HTMLElement)?.tagName) || (event.target as HTMLElement)?.isContentEditable) return;
      if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) { event.preventDefault(); next(); }
      if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) { event.preventDefault(); previous(); }
      if (event.key === "Home") { event.preventDefault(); navigate(1); }
      if (event.key === "End") { event.preventDefault(); navigate(info.pageCount); }
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [info, rtl, next, previous, navigate, panel]);
  useEffect(() => {
    if (!panel) { panelTrigger.current?.focus(); return; }
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [panel]);
  function openPanel(value: Exclude<Panel, null>, target: HTMLButtonElement) {
    panelTrigger.current = target; setPanel(value); setLabel(marks.find(m => m.page === shown)?.label || "");
  }
  async function bookmark(number: number, action: "save" | "remove", name = "") {
    if (!info || markBusy) return;
    setMarkBusy(true); setNotice("");
    try {
      await ebookFetch(`/api/ebooks/read/${id}`, { action, page: number, label: name, versionId: info.versionId }, "PATCH");
      setMarks(old => [...old.filter(m => m.page !== number), ...(action === "save" ? [{ page: number, label: name.trim() }] : [])].sort((a, b) => a.page - b.page));
      setNotice(action === "save" ? t("Bookmark saved to your account", "تم حفظ العلامة في حسابك") : t("Bookmark removed", "تم حذف العلامة"));
    } catch (e) { setNotice((e as Error).message); }
    finally { setMarkBusy(false); }
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen();
      else setFocused(value => !value);
    } catch { setNotice(t("Fullscreen is unavailable. Try focus mode instead.", "وضع ملء الشاشة غير متاح. جرّب وضع التركيز.")); }
  }
  const PageArrow = rtl ? ChevronLeft : ChevronRight, BackArrow = rtl ? ChevronRight : ChevronLeft;
  const title = info ? (ar ? info.titleAr || info.titleEn : info.titleEn) : t("Your reading space", "مساحة القراءة الخاصة بك");
  const progress = info ? Math.round((sheets.at(-1)?.page || page) / info.pageCount * 100) : 0;
  return <div ref={root} className={s.reader} data-theme={theme} data-focus={focused} data-fullscreen={fullscreen} dir={ar ? "rtl" : "ltr"}>
    <header className={s.header}>
      <Link className={s.library} href={`/${locale}/ebooks/library`} title={t("My library", "مكتبتي")}><BookOpen size={21} /><span>{t("My library", "مكتبتي")}</span></Link>
      <div className={s.title}><span>{t("THE LEE READING ROOM", "مساحة القراءة • LEE")}</span><h1>{title}</h1></div>
      <div className={s.actions}>
        <button aria-label={t("Bookmarks", "العلامات المرجعية")} title={t("Bookmarks", "العلامات المرجعية")} onClick={e => openPanel("bookmarks", e.currentTarget)} disabled={!info}><Bookmark size={20} />{marks.length > 0 && <sup>{marks.length}</sup>}</button>
        <button aria-label={t("Reading settings", "إعدادات القراءة")} title={t("Reading settings", "إعدادات القراءة")} onClick={e => openPanel("settings", e.currentTarget)}><Settings2 size={20} /></button>
        <button className={s.desktop} aria-label={t(fullscreen ? "Exit fullscreen" : "Fullscreen", fullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة")} title={t("Fullscreen", "ملء الشاشة")} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
        {auth && info?.reader && <ReaderAccount email={info.reader.email} locale={locale} compact onSignOut={() => {
          cache.current?.clear(); setSheets([]); setInfo(null); setMarks([]); setPanel(null); setFocused(false); setAuth(false); setError("");
        }} />}
      </div>
    </header>
    {auth === false ? <div className={s.login}><ReaderLogin locale={locale} onSuccess={() => void load()} /></div> : <>
      <div className={s.context}><span>{info?.author || t("A little reading, every day.", "قليل من القراءة، كل يوم.")}</span><span>{info?.preview ? t("LOCAL TEST PREVIEW", "معاينة محلية تجريبية") : t("ONLINE EDITION", "نسخة إلكترونية")}</span></div>
      <div className={s.stage} data-flipping={flipping}>
        <button className={s.edge} aria-label={t("Previous page", "الصفحة السابقة")} disabled={!info || start <= 1} onClick={previous} style={{ order: rtl ? 3 : 1 }}><BackArrow /></button>
        <div className={s.viewport} ref={viewport} style={{ order: 2 }}>
          <div className={s.book} data-spread={double} data-motion={motion} data-direction={rtl ? "rtl" : "ltr"} style={{ "--zoom": zoom / 100 } as React.CSSProperties} aria-busy={loading}
            onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>
            {sheets.length && info && zoom === 100 ? <ReaderFlipBook count={info.pageCount} page={shown} rtl={!!rtl} spread={double} motion={motion} ar={ar} ready={ready} marks={marks} onPage={number => { if (!loading) { setPage(number); setJump(String(number)); } }} onBookmark={(number, marked) => void bookmark(number, marked ? "remove" : "save")} onBusy={setFlipping} /> : sheets.length ? <div key={sheets.map(sheet => sheet.url).join()} className={s.leaves} dir={rtl ? "rtl" : "ltr"}>
              {sheets.map(sheet => {
                const marked = marks.some(mark => mark.page === sheet.page);
                return <div className={s.sheet} key={sheet.page}>
                  <img src={sheet.url} alt={`${t("Page", "صفحة")} ${sheet.page}`} draggable={false} />
                  <button className={s.ribbon} aria-pressed={marked} disabled={markBusy || loading}
                    aria-label={t(`${marked ? "Unbookmark" : "Bookmark"} page ${sheet.page}`, `${marked ? "إلغاء حفظ" : "حفظ"} الصفحة ${sheet.page}`)}
                    title={t(`${marked ? "Unbookmark" : "Bookmark"} page ${sheet.page}`, `${marked ? "إلغاء حفظ" : "حفظ"} الصفحة ${sheet.page}`)}
                    onClick={() => void bookmark(sheet.page, marked ? "remove" : "save")}>
                    {marked ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
                  </button>
                  <span className={s.folio}>{sheet.page}</span>
                </div>;
              })}
            </div> : <div className={s.paperSkeleton} role="status"><BookOpen size={32} /><span>{error ? t("Your book couldn’t be opened", "تعذر فتح الكتاب") : t("Opening your book…", "جارٍ فتح كتابك…")}</span>{!error && <div className={s.skeletonLines}><i /><i /><i /><i /><i /></div>}</div>}
          </div>
        </div>
        <button className={s.edge} aria-label={t("Next page", "الصفحة التالية")} disabled={!info || end >= info.pageCount} onClick={next} style={{ order: rtl ? 1 : 3 }}><PageArrow /></button>
        {loading && sheets.length > 0 && <div className={s.loadingPill} role="status"><LoaderCircle size={15} className={s.spin} />{t("Turning the page…", "جارٍ تحميل الصفحة…")}</div>}
        {error && <div className={s.error} role="alert">{error}<button onClick={() => info ? setRetry(value => value + 1) : void load()}>{t("Try again", "حاول مجدداً")}</button></div>}
      </div>
      <div ref={dock} className={s.footerDock} data-open={dockOpen} data-reader-dock="true"
        onPointerEnter={e => { if (e.pointerType === "mouse") { dockHovered.current = true; setDockOpen(true); } }}
        onPointerLeave={() => { dockHovered.current = false; setDockActivity(n => n + 1); }}
        onFocusCapture={() => setDockActivity(n => n + 1)} onBlurCapture={() => setDockActivity(n => n + 1)}>
      <button className={s.dockHandle} aria-expanded={dockOpen} aria-controls="reader-controls"
        aria-label={t(dockOpen ? "Hide reading controls" : "Show reading controls", dockOpen ? "إخفاء أدوات القراءة" : "إظهار أدوات القراءة")}
        onClick={() => { setDockOpen(value => !value); setDockActivity(n => n + 1); }}>
        <span className={s.handleLine} aria-hidden="true" /><span>{dockOpen ? t("Hide controls", "إخفاء الأدوات") : t("Reading controls", "أدوات القراءة")}</span>
        <span className={s.handlePage}>{shown} / {info?.pageCount || "—"}</span>
      </button>
      <div className={s.dockBody} id="reader-controls" inert={!dockOpen}>
      <footer className={s.footer} aria-label={t("Reading controls", "أدوات القراءة")}>
        <div className={s.toolbar}>
          <div className={s.toolGroup}><button onClick={e => openPanel("pages", e.currentTarget)} disabled={!info} aria-label={t("Go to page", "الانتقال إلى صفحة")} title={t("Go to page", "الانتقال إلى صفحة")}><List size={20} /><span className={s.desktop}>{t("Pages", "الصفحات")}</span></button><button disabled={!sheets.length || markBusy || loading} aria-pressed={bookmarked} aria-label={t(bookmarked ? "Remove bookmark" : "Bookmark this page", bookmarked ? "حذف العلامة" : "حفظ هذه الصفحة")} title={t("Bookmark this page", "حفظ هذه الصفحة")} onClick={() => void bookmark(shown, bookmarked ? "remove" : "save")}>{markBusy ? <LoaderCircle className={s.spin} size={20} /> : bookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}</button></div>
          <div className={s.pageControl} style={{ flexDirection: rtl ? "row-reverse" : "row" }}><button aria-label={t("Back", "السابق")} disabled={!info || start <= 1} onClick={previous}><BackArrow size={19} /></button><span aria-live="polite">{sheets.length > 1 ? `${shown}–${sheets.at(-1)?.page}` : shown}<small> / {info?.pageCount || "—"}</small></span><button aria-label={t("Forward", "التالي")} disabled={!info || end >= info.pageCount} onClick={next}><PageArrow size={19} /></button></div>
          <div className={s.toolGroup}><button className={s.desktop} disabled={zoom <= 100} aria-label={t("Zoom out", "تصغير")} title={t("Zoom out", "تصغير")} onClick={() => setZoom(z => Math.max(100, z - 25))}><ZoomOut size={19} /></button><button className={s.zoom} onClick={() => setZoom(z => z === 100 ? 150 : 100)} title={t("Toggle zoom", "تغيير التكبير")} aria-label={t(`Zoom ${zoom}%`, `التكبير ${zoom}%`)}>{zoom}%</button><button className={s.desktop} disabled={zoom >= 200} aria-label={t("Zoom in", "تكبير")} title={t("Zoom in", "تكبير")} onClick={() => setZoom(z => Math.min(200, z + 25))}><ZoomIn size={19} /></button><button aria-pressed={focused} aria-label={t("Focus mode", "وضع التركيز")} title={t("Focus mode", "وضع التركيز")} onClick={() => setFocused(value => !value)}><Focus size={20} /></button></div>
        </div>
        <input className={s.scrubber} aria-label={t("Reading progress", "تقدم القراءة")} type="range" min="1" max={info?.pageCount || 1} value={page} disabled={!info} onChange={e => navigate(Number(e.target.value))} style={{ "--progress": `${progress}%` } as React.CSSProperties} />
        <div className={s.status}><span>{progress}% {t("complete", "مكتمل")}</span><span role="status">{notice || (saved ? t("Your place is saved", "تم حفظ موضع القراءة") : loading ? t("Loading…", "جارٍ التحميل…") : t("Position not synced yet", "لم تتم مزامنة الموضع بعد"))}</span><span className={s.desktop}>{t("Arrow keys to turn pages", "استخدم الأسهم لتقليب الصفحات")}</span></div>
      </footer>
      </div>
      </div>
    </>}
    {focused && <button className={s.exitFocus} onClick={() => setFocused(false)}><X size={18} />{t("Exit focus", "إنهاء التركيز")}</button>}
    {panel && <div className={s.panelBackdrop} onClick={e => { if (e.target === e.currentTarget) setPanel(null); }}>
      <aside className={s.panel} ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="reader-panel-title" onKeyDown={e => {
        if (e.key !== "Tab") return;
        const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, [tabindex="0"]') || []).filter(el => el.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }}>
        <div className={s.panelHead}><div><span>{t("MAKE IT YOURS", "مساحة تناسبك")}</span><h2 id="reader-panel-title">{panel === "settings" ? t("Reading settings", "إعدادات القراءة") : panel === "bookmarks" ? t("Your bookmarks", "علاماتك المرجعية") : t("Find your page", "انتقل إلى صفحتك")}</h2></div><button onClick={() => setPanel(null)} aria-label={t("Close panel", "إغلاق اللوحة")}><X size={21} /></button></div>
        {panel === "settings" && <div className={s.settings}>
          <fieldset><legend>{t("Reading atmosphere", "أجواء القراءة")}</legend><div className={s.choices}>{[["light", t("Light", "فاتح")], ["warm", t("Warm", "دافئ")], ["dark", t("Dark", "داكن")]].map(([value, name]) => <button key={value} data-swatch={value} aria-pressed={theme === value} onClick={() => preference({ theme: value })}>{value === "dark" ? <Moon size={19} /> : <Sun size={19} />}{name}{theme === value && <Check size={14} />}</button>)}</div><p>{t("Changes the reading space; the original page artwork stays intact.", "تتغير أجواء مساحة القراءة مع الحفاظ على تصميم صفحات الكتاب.")}</p></fieldset>
          <fieldset><legend>{t("Page layout", "تخطيط الصفحات")}</legend><div className={s.choices}><button aria-pressed={!spread} onClick={() => preference({ spread: false })}>{t("Single page", "صفحة واحدة")}</button><button aria-pressed={spread} onClick={() => preference({ spread: true })}><BookOpen size={18} />{t("Book spread", "صفحتان")}</button></div><p>{t("Two pages on wide screens at 100% zoom. A single page on mobile.", "صفحتان على الشاشات الواسعة عند تكبير 100٪، وصفحة واحدة على الهاتف.")}</p></fieldset>
          <fieldset><legend>{t("Page turns", "تقليب الصفحات")}</legend><label className={s.toggle}><span>{t("Animate page turns", "تحريك تقليب الصفحات")}</span><input type="checkbox" checked={motion} onChange={e => preference({ motion: e.target.checked })} /></label></fieldset>
          <fieldset><legend>{t("Page size", "حجم الصفحة")}</legend><div className={s.choices}>{[100, 125, 150, 200].map(value => <button key={value} aria-pressed={zoom === value} onClick={() => setZoom(value)}>{value === 100 ? t("Fit", "احتواء") : `${value}%`}</button>)}</div></fieldset>
          <button className={s.primary} onClick={() => { setPanel(null); setFocused(true); }}><Focus size={18} />{t("Enter focus mode", "بدء وضع التركيز")}</button>
        </div>}
        {panel === "pages" && <><p>{t("Jump to any page, or use the progress bar below the book.", "انتقل إلى أي صفحة، أو استخدم شريط التقدم أسفل الكتاب.")}</p><form className={s.jump} onSubmit={e => { e.preventDefault(); const value = Number(jump); if (Number.isInteger(value) && value >= 1 && value <= (info?.pageCount || 1)) { navigate(value); setPanel(null); } }}><label>{t("Page number", "رقم الصفحة")}<input type="number" min={1} max={info?.pageCount} required value={jump} onChange={e => setJump(e.target.value)} /></label><button className={s.primary} type="submit">{t("Go to page", "انتقال")}</button></form><div className={s.pageGrid}>{Array.from({ length: info?.pageCount || 0 }, (_, i) => i + 1).map(number => <button key={number} aria-label={`${t("Page", "صفحة")} ${number}`} aria-current={number >= start && number <= end ? "page" : undefined} onClick={() => { navigate(number); setPanel(null); }}>{number}{marks.some(m => m.page === number) && <Bookmark size={10} />}</button>)}</div></>}
        {panel === "bookmarks" && <><p>{t("Saved to your account, ready on your next visit.", "محفوظة في حسابك لزيارتك القادمة.")}</p><form className={s.markForm} onSubmit={e => { e.preventDefault(); void bookmark(shown, "save", label); }}><label>{t(`Bookmark page ${shown}`, `حفظ الصفحة ${shown}`)}<input maxLength={120} value={label} onChange={e => setLabel(e.target.value)} placeholder={t("Add a short label (optional)", "أضف عنواناً قصيراً (اختياري)")} /></label><button className={s.primary} disabled={markBusy || !sheets.length || loading}><Bookmark size={17} />{t("Save bookmark", "حفظ العلامة")}</button></form>{notice && <p role="status">{notice}</p>}{marks.length === 0 ? <div className={s.empty}><Bookmark size={34} /><h3>{t("Keep the pages that matter", "احتفظ بالصفحات المهمة")}</h3><p>{t("Save an idea, a favourite passage, or a page to return to.", "احفظ فكرة أو مقطعاً مفضلاً أو صفحة للعودة إليها.")}</p></div> : <div className={s.marks}>{marks.map(mark => <div key={mark.page}><button onClick={() => { navigate(mark.page); setPanel(null); }}><span className={s.markNumber}>{mark.page}</span><span>{mark.label || t(`Page ${mark.page}`, `صفحة ${mark.page}`)}<small>{t("Return to this page", "العودة إلى هذه الصفحة")}</small></span></button><button disabled={markBusy} aria-label={t(`Remove bookmark on page ${mark.page}`, `حذف علامة الصفحة ${mark.page}`)} onClick={() => void bookmark(mark.page, "remove")}><Trash2 size={17} /></button></div>)}</div>}</>}
      </aside>
    </div>}
  </div>;
}

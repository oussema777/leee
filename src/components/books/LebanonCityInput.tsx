"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { lebanonCities } from "@/lib/aramex/cities";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  theme?: "light" | "dark";
  locale?: "en" | "ar";
  onValueChange?: (value: string) => void;
};

export function LebanonCityInput({ theme = "light", locale = "en", onValueChange, ...props }: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(String(props.defaultValue ?? ""));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const value = props.value === undefined ? text : String(props.value);
  const query = value.trim().toLowerCase();
  const matches = lebanonCities.filter(city => city.toLowerCase().includes(query))
    .sort((a, b) => Number(b.toLowerCase().startsWith(query)) - Number(a.toLowerCase().startsWith(query)));
  const suggestions = matches.slice(0, 30);
  const custom = query && !lebanonCities.some(city => city.toLowerCase() === query) ? value.trim() : null;
  const choices = custom ? [...suggestions, custom] : suggestions;
  const dark = theme === "dark";
  const ar = locale === "ar";
  const expanded = open && !props.disabled && !props.readOnly;
  const choose = (city: string) => {
    setText(city);
    onValueChange?.(city);
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  };
  useEffect(() => {
    if (expanded && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, expanded, listId]);

  return <div className="relative min-w-0" dir={ar ? "rtl" : undefined}>
    <div className="relative">
      <input {...props} ref={inputRef} defaultValue={undefined} value={value}
        className={`${props.className ?? ""} pe-11`} autoComplete="off"
        role="combobox" aria-autocomplete="list" aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        onFocus={event => { setOpen(true); props.onFocus?.(event); }}
        onBlur={event => { setOpen(false); setActive(-1); props.onBlur?.(event); }}
        onChange={event => {
          setText(event.target.value); onValueChange?.(event.target.value);
          setOpen(true); setActive(-1); props.onChange?.(event);
        }}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); setOpen(true);
            setActive(index => choices.length ? (event.key === "ArrowDown" ? (index + 1) % choices.length : (index <= 0 ? choices.length - 1 : index - 1)) : -1);
          } else if (event.key === "Enter" && expanded && value.trim()) {
            event.preventDefault(); choose(active >= 0 && choices[active] ? choices[active] : value.trim());
          } else if (event.key === "Escape" && expanded) {
            event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1);
          }
          props.onKeyDown?.(event);
        }} />
      <ChevronDown aria-hidden="true" size={17} className={`pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
    </div>
    {expanded && <div className={`absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border shadow-xl ${dark ? "border-slate-600 bg-[#172338] text-slate-100 shadow-black/25" : "border-slate-200 bg-white text-slate-800 shadow-slate-900/10"}`}>
      <div className={`flex items-center gap-2 border-b px-4 py-3 text-xs font-semibold ${dark ? "border-slate-700 text-slate-400" : "border-slate-100 text-slate-500"}`}>
        <Search size={14} aria-hidden="true" />{ar ? "اقتراحات المدن" : "City suggestions"}
        <span className="ms-auto font-normal" aria-live="polite">{matches.length}</span>
      </div>
      <ul id={listId} role="listbox" aria-label={ar ? "المدن" : "Cities"} className="max-h-60 overflow-y-auto overscroll-contain p-1.5">
        {choices.map((city, index) => <li key={city} id={`${listId}-${index}`} role="option" aria-selected={city !== custom && value.toLowerCase() === city.toLowerCase()}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(city)}
          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active === index ? (dark ? "bg-slate-700" : "bg-blue-50") : (dark ? "hover:bg-slate-700/70" : "hover:bg-slate-50")}`}>
          <MapPin size={16} aria-hidden="true" className="shrink-0 text-slate-400" />
          <span className="min-w-0 break-words">{city === custom ? <>
            <span>{ar ? "استخدم" : "Use"} “<bdi>{city}</bdi>”</span>
            <span className={`mt-1 block text-xs font-normal ${dark ? "text-slate-400" : "text-slate-500"}`}>{ar ? "اضغط Enter أو انقر لاستخدام هذه المنطقة." : "Press Enter or tap to use this area."}</span>
          </> : <span dir="ltr">{city}</span>}</span>
          {city !== custom && value.toLowerCase() === city.toLowerCase() && <Check size={16} aria-hidden="true" className="ms-auto text-sky-500" />}
        </li>)}
      </ul>
      <div className={`border-t px-4 py-3 text-xs leading-relaxed ${dark ? "border-slate-700 text-slate-400" : "border-slate-100 text-slate-500"}`}>
        {custom ? (ar ? "يمكنك استخدام منطقتك حتى إن لم تظهر في الاقتراحات." : "Your area doesn’t need to be in the suggestions.") : (ar ? "اختر مدينة أو اكتب منطقتك." : "Choose a city or type your own area.")}
        {matches.length > suggestions.length && <span className="block">{ar ? "اكتب المزيد لتضييق النتائج." : "Type more letters to narrow the list."}</span>}
      </div>
    </div>}
  </div>;
}

"use client";
import { useCallback, useState } from "react";
import s from "./loading.module.css";

export function EbookImage({ src, alt, ar, className, lazy = false }: { src: string; alt: string; ar: boolean; className?: string; lazy?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const imageRef = useCallback((node: HTMLImageElement | null) => { if (node?.complete && node.naturalWidth) setLoaded(true); }, []);
  return <div className={`${s.image} ${className || ""}`}>
    {!loaded && !failed && <div className={`${s.block} ${s.imagePlaceholder}`} role="status" aria-label={ar ? "جارٍ تحميل الصورة" : "Loading image"} />}
    <img key={attempt} src={src} alt={alt} loading={lazy ? "lazy" : "eager"} decoding="async" fetchPriority={lazy ? "auto" : "high"}
      ref={imageRef}
      onLoad={() => setLoaded(true)} onError={() => setFailed(true)} style={{ opacity: loaded ? 1 : 0 }} />
    {failed && <div className={s.imageError} role="status"><span>{ar ? "تعذّر تحميل الصورة" : "Image couldn’t load"}</span><button type="button" onClick={() => { setFailed(false); setLoaded(false); setAttempt(value => value + 1); }}>{ar ? "إعادة المحاولة" : "Retry image"}</button></div>}
  </div>;
}

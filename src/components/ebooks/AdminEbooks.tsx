"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/app/admin/components/ImageUploader";
import { ebookFetch, money } from "./client";
import s from "./ebooks.module.css";
type Version = {
  id: string;
  label: string;
  pageCount: number;
  ready: boolean;
  _count: { pages: number };
};
type Ebook = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  author: string;
  descriptionEn: string;
  descriptionAr: string;
  coverUrl: string;
  priceCents: number;
  direction: string;
  language: string;
  categories: string[];
  published: boolean;
  activeVersionId: string | null;
  updatedAt: string;
  versions: Version[];
  activeVersion?: { label: string; pageCount: number };
};
const blank = {
  slug: "",
  titleEn: "",
  titleAr: "",
  author: "",
  descriptionEn: "",
  descriptionAr: "",
  coverUrl: "",
  priceCents: 500,
  direction: "rtl",
  language: "ARABIC",
  categories: [] as string[],
  published: false,
};
export function AdminEbookList() {
  const [books, setBooks] = useState<Ebook[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    ebookFetch<Ebook[]>("/api/admin/ebooks")
      .then(setBooks)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  return (
    <main className={`${s.shell} ${s.admin}`}>
      <div className={s.top}>
        <div>
          <span className={s.eyebrow}>Digital publishing</span>
          <h1>Ebook catalog</h1>
          <p className={s.muted}>
            Manage online editions independently from Book Restore inventory.
          </p>
        </div>
        <Link href="/admin/ebooks/new" className={s.button}>
          Add ebook
        </Link>
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error} <button onClick={load}>Retry</button>
        </p>
      )}
      {!books ? (
        <p className={s.loading}>Loading catalog…</p>
      ) : !books.length ? (
        <div className={`${s.card} ${s.empty}`}>
          <h2>Your first ebook starts here.</h2>
          <p className={s.muted}>
            Create a draft, prepare the approved PDF, preview the pages, then
            publish.
          </p>
          <Link href="/admin/ebooks/new" className={s.button}>
            Create ebook
          </Link>
        </div>
      ) : (
        <div className={s.grid}>
          {books.map((b) => (
            <article key={b.id} className={s.card}>
              {b.coverUrl && (
                <img src={b.coverUrl} alt="" className={s.cover} />
              )}
              <span className={s.badge}>
                {b.published ? "Published" : "Draft"}
              </span>
              <h2>{b.titleEn}</h2>
              <p className={s.muted}>
                {b.author} · {money(b.priceCents)}
              </p>
              <p className={s.muted}>
                {b.activeVersion
                  ? `${b.activeVersion.pageCount} pages · ${b.activeVersion.label}`
                  : "No active reading version"}
              </p>
              <Link href={`/admin/ebooks/${b.id}`} className={s.secondary}>
                Manage ebook
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
export function AdminEbookEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [data, setData] = useState(blank);
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState("");
  const [preview, setPreview] = useState<Version | null>(null);
  const [page, setPage] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [prepared, setPrepared] = useState<File[]>([]);
  const load = useCallback(async () => {
    if (!id) return;
    const record = await ebookFetch<Ebook>(`/api/admin/ebooks/${id}`);
    setEbook(record);
    setData(record);
  }, [id]);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  const field = (key: keyof typeof blank, value: string | number | boolean | string[]) =>
    setData((d) => ({ ...d, [key]: value }));
  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const record = await ebookFetch<Ebook>(
        id ? `/api/admin/ebooks/${id}` : "/api/admin/ebooks",
        { ...data, categories: [...new Set(data.categories.map(c => c.trim()).filter(Boolean))], expectedUpdatedAt: ebook?.updatedAt },
        id ? "PUT" : "POST",
      );
      if (!id) router.push(`/admin/ebooks/${record.id}`);
      else {
        await load();
        setMessage("Ebook saved.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function prepare() {
    if (!file || !id) return;
    if (file.size > 150 * 1024 * 1024) {
      setError("Choose a PDF smaller than 150 MB.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    setProgress("Opening the approved PDF in your browser…");
    let task: ReturnType<typeof import("pdfjs-dist").getDocument> | undefined;
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        useSystemFonts: true,
      });
      const document = await task.promise;
      if (document.numPages > 2000)
        throw Error("This PDF exceeds the 2000-page limit.");
      const version = await ebookFetch<Version>(
        `/api/admin/ebooks/${id}/versions`,
        {
          label: file.name.replace(/\.pdf$/i, ""),
          pageCount: document.numPages,
        },
      );
      for (let number = 1; number <= document.numPages; number++) {
        setProgress(
          `Preparing and uploading page ${number} of ${document.numPages}. Keep this tab open.`,
        );
        const page = await document.getPage(number);
        const unit = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: Math.min(1600 / unit.width, 2400 / unit.height),
        });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, viewport }).promise;
        const image = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (blob) =>
              blob ? resolve(blob) : reject(Error("Page conversion failed")),
            "image/webp",
            0.86,
          ),
        );
        const form = new FormData();
        form.set("file", image, `${number}.webp`);
        await ebookFetch(
          `/api/admin/ebooks/${id}/versions/${version.id}/pages/${number}`,
          form,
        );
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
      }
      setProgress("");
      setMessage(
        "Pages prepared. Preview this version, then activate it below.",
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
      setProgress("");
    } finally {
      await task?.destroy();
      setBusy(false);
    }
  }
  async function uploadPrepared() {
    if (!id || !prepared.length) return;
    const files = [...prepared].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    if (
      files.some(
        (f, i) =>
          Number(f.name.replace(/\.[^.]+$/, "")) !== i + 1 ||
          f.size > 2 * 1024 * 1024,
      )
    ) {
      setError(
        "Select consecutively numbered pages starting at 0001, each under 2 MB.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const version = await ebookFetch<Version>(
        `/api/admin/ebooks/${id}/versions`,
        {
          label: "Prepared pages · " + new Date().toISOString().slice(0, 10),
          pageCount: files.length,
        },
      );
      for (let i = 0; i < files.length; i++) {
        setProgress(
          `Uploading prepared page ${i + 1} of ${files.length}. Keep this tab open.`,
        );
        const form = new FormData();
        form.set("file", files[i]);
        await ebookFetch(
          `/api/admin/ebooks/${id}/versions/${version.id}/pages/${i + 1}`,
          form,
        );
      }
      await load();
      setMessage(
        "Prepared pages uploaded. Preview and activate the new version.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }
  async function activate() {
    if (!preview || !confirmed) return;
    setBusy(true);
    setError("");
    try {
      await ebookFetch(
        `/api/admin/ebooks/${id}/versions`,
        { versionId: preview.id, previewConfirmed: true },
        "PUT",
      );
      await load();
      setMessage(
        "Reading version activated. Publication is controlled separately above.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={`${s.shell} ${s.admin}`}>
      <div className={s.top}>
        <div>
          <Link className={s.eyebrow} href="/admin/ebooks">
            Ebook catalog
          </Link>
          <h1>{id ? "Manage ebook" : "Create ebook"}</h1>
        </div>
        {ebook?.published && (
          <Link
            target="_blank"
            href={`/en/ebooks/${ebook.slug}`}
            className={s.secondary}
          >
            View public page
          </Link>
        )}
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className={s.notice} role="status">
          {message}
        </p>
      )}
      <form
        className={`${s.form} ${s.card}`}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className={s.split}>
          <label>
            English title
            <input
              required
              maxLength={200}
              value={data.titleEn}
              onChange={(e) => field("titleEn", e.target.value)}
            />
          </label>
          <label>
            Arabic title
            <input
              dir="rtl"
              value={data.titleAr}
              onChange={(e) => field("titleAr", e.target.value)}
            />
          </label>
          <label>
            Author
            <input
              required
              value={data.author}
              onChange={(e) => field("author", e.target.value)}
            />
          </label>
          <label>
            URL slug
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={data.slug}
              onChange={(e) => field("slug", e.target.value)}
              placeholder="manal-366-days"
            />
          </label>
          <label>
            Price (USD)
            <input
              type="number"
              required
              min={1}
              max={10000}
              step="0.01"
              value={data.priceCents / 100}
              onChange={(e) =>
                field("priceCents", Math.round(Number(e.target.value) * 100))
              }
            />
          </label>
          <label>
            Book reading direction
            <select
              value={data.direction}
              onChange={(e) => field("direction", e.target.value)}
            >
              <option value="rtl">Right to left (Arabic)</option>
              <option value="ltr">Left to right</option>
            </select>
          </label>
          <label>
            Book language
            <select value={data.language} onChange={(e) => field("language", e.target.value)}>
              <option value="ARABIC">Arabic</option>
              <option value="ENGLISH">English</option>
              <option value="FRENCH">French</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>
            Store categories (one per line)
            <textarea value={data.categories.join("\n")} onChange={(e) => field("categories", e.target.value.split("\n"))} placeholder="BUSINESS" />
          </label>
          <label>
            English description
            <textarea
              value={data.descriptionEn}
              onChange={(e) => field("descriptionEn", e.target.value)}
            />
          </label>
          <label>
            Arabic description
            <textarea
              dir="rtl"
              value={data.descriptionAr}
              onChange={(e) => field("descriptionAr", e.target.value)}
            />
          </label>
        </div>
        <ImageUploader
          value={data.coverUrl}
          onChange={(url) => field("coverUrl", url)}
          onRemove={() => field("coverUrl", "")}
          folder="ebook-covers"
          label="Public cover image only"
        />
        <label className={s.check}>
          <input
            type="checkbox"
            checked={data.published}
            disabled={!ebook?.activeVersionId}
            onChange={(e) => field("published", e.target.checked)}
          />
          Published in the book store. Unpublishing stops new sales; existing
          readers retain access.
        </label>
        <button className={s.button} disabled={busy}>
          {busy ? "Working…" : "Save ebook"}
        </button>
      </form>
      {id && (
        <>
          <section className={`${s.card} ${s.list}`}>
            <h2>Reading versions</h2>
            <p className={s.muted}>
              Prepare the approved PDF as private page images. The original PDF
              stays on your computer. Only a complete, previewed version can
              become the reader’s active edition.
            </p>
            <div className={s.form}>
              <label>
                Approved PDF
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={busy}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <button
                className={s.button}
                disabled={!file || busy}
                onClick={() => void prepare()}
              >
                Prepare reading pages
              </button>
            </div>
            {progress && (
              <p className={s.notice} role="status">
                {progress}
              </p>
            )}
            <details className={s.version}>
              <summary>Upload already optimized page images</summary>
              <p className={s.help}>
                Select all numbered WebP files from a prepared edition
                (0001.webp, 0002.webp, …). They remain private.
              </p>
              <div className={s.form}>
                <label>
                  Prepared page files
                  <input
                    type="file"
                    multiple
                    accept="image/webp"
                    disabled={busy}
                    onChange={(e) =>
                      setPrepared(Array.from(e.target.files || []))
                    }
                  />
                </label>
                <button
                  className={s.secondary}
                  disabled={busy || !prepared.length}
                  onClick={() => void uploadPrepared()}
                >
                  Upload prepared pages
                </button>
              </div>
            </details>
            {ebook?.versions.map((v) => (
              <div key={v.id} className={s.version}>
                <div className={s.row}>
                  <strong>{v.label}</strong>
                  <span className={s.badge}>
                    {ebook.activeVersionId === v.id
                      ? "Active"
                      : v.ready
                        ? "Ready"
                        : `${v._count.pages}/${v.pageCount} uploaded`}
                  </span>
                </div>
                <p className={s.muted}>{v.pageCount} pages</p>
                <button
                  className={s.secondary}
                  disabled={!v._count.pages || busy}
                  onClick={() => {
                    setPreview(v);
                    setPage(1);
                    setConfirmed(false);
                  }}
                >
                  Preview version
                </button>
              </div>
            ))}
          </section>
          {preview && (
            <section className={`${s.card} ${s.list}`}>
              <h2>Preview: {preview.label}</h2>
              <div className={s.row}>
                <button
                  className={s.secondary}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <label>
                  Page{" "}
                  <input
                    className={s.input}
                    style={{ width: 90 }}
                    type="number"
                    min={1}
                    max={preview.pageCount}
                    value={page}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      if (p >= 1 && p <= preview.pageCount) setPage(p);
                    }}
                  />
                </label>
                <span>of {preview.pageCount}</span>
                <button
                  className={s.secondary}
                  disabled={page >= preview.pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
              <img
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  margin: "20px auto",
                }}
                src={`/api/admin/ebooks/${id}/versions/${preview.id}/pages/${page}`}
                alt={`Book preview page ${page}`}
              />
              {ebook?.activeVersionId !== preview.id && (
                <div className={s.form}>
                  <label className={s.check}>
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    I reviewed the pages and confirm this is the approved
                    reading version.
                  </label>
                  <button
                    className={s.button}
                    disabled={
                      !confirmed ||
                      busy ||
                      preview._count.pages !== preview.pageCount
                    }
                    onClick={() => void activate()}
                  >
                    Activate this version
                  </button>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}

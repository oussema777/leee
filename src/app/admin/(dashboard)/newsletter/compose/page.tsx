"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Monitor, Smartphone } from "lucide-react";
import AdminPageHeader from "../../../components/AdminPageHeader";
import AdminModal from "../../../components/AdminModal";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

interface Campaign {
  id: string;
  subject: string;
  html: string;
  locale: string;
  targetTags: string[];
  status: string;
  lastTestedAt: string | null;
}

const inputClass =
  "w-full px-4 py-2.5 bg-[#1e293b] border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue";

function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );
}

export default function ComposeNewsletterPage() {
  const toast = useToast();
  const router = useRouter();

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [locale, setLocale] = useState<"EN" | "AR">("EN");
  const [html, setHtml] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [testAddresses, setTestAddresses] = useState("");

  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [debouncedHtml, setDebouncedHtml] = useState("");

  const [recipientCount, setRecipientCount] = useState(0);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const targetTags = useMemo(() => parseTags(tagsInput), [tagsInput]);

  // Changing subject or html re-locks the test gate (mirrors server behavior).
  const onSubjectChange = (v: string) => {
    setSubject(v);
    setLastTestedAt(null);
  };
  const onHtmlChange = (v: string) => {
    setHtml(v);
    setLastTestedAt(null);
  };

  // Debounced live preview (~300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedHtml(html), 300);
    return () => clearTimeout(t);
  }, [html]);

  // Debounced recipient count (~400ms) — only when tags are non-empty.
  const tagsKey = targetTags.join(",");
  useEffect(() => {
    if (targetTags.length === 0) {
      setRecipientCount(0);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await adminPost<{ count: number }>("/newsletter/recipients/preview", {
          tags: targetTags,
        });
        setRecipientCount(res.count);
      } catch {
        setRecipientCount(0);
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsKey]);

  // Persist the draft: create on first save, update afterwards. Returns the id.
  const persistDraft = useCallback(async (): Promise<string> => {
    const body = { subject, html, locale, targetTags };
    if (campaignId) {
      const c = await adminPut<Campaign>(`/newsletter/campaigns/${campaignId}`, body);
      setLastTestedAt(c.lastTestedAt);
      return campaignId;
    }
    const c = await adminPost<Campaign>("/newsletter/campaigns", body);
    setCampaignId(c.id);
    setLastTestedAt(c.lastTestedAt);
    return c.id;
  }, [campaignId, subject, html, locale, targetTags]);

  const handleSave = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    setSaving(true);
    try {
      await persistDraft();
      toast.success("Draft saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    const addresses = parseTags(testAddresses);
    if (addresses.length < 1 || addresses.length > 3) {
      toast.error("Enter 1 to 3 test email addresses (comma-separated)");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    setTesting(true);
    try {
      const id = await persistDraft();
      await adminPost(`/newsletter/campaigns/${id}/test`, { addresses });
      toast.success(`Test sent to ${addresses.length} address${addresses.length > 1 ? "es" : ""}`);
      setLastTestedAt(new Date().toISOString());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test");
    } finally {
      setTesting(false);
    }
  };

  const handleSend = async () => {
    if (!campaignId) return;
    setSending(true);
    try {
      // Persist the CURRENT tags (and only tags) right before enqueueing so the
      // server targets exactly the group shown in the count/modal. Sending only
      // targetTags — not subject/html — keeps the server's lastTestedAt intact,
      // so the send still passes the test-gate check.
      await adminPut(`/newsletter/campaigns/${campaignId}`, { targetTags });
      await adminPost(`/newsletter/campaigns/${campaignId}/send`, {});
      toast.success("Newsletter send enqueued");
      setShowSendModal(false);
      router.push("/admin/newsletter/campaigns");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send newsletter");
    } finally {
      setSending(false);
    }
  };

  const gateUnlocked = !!lastTestedAt;
  const previewWidth = previewMode === "desktop" ? "640px" : "375px";

  return (
    <div>
      <AdminPageHeader title="Compose Newsletter" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: editor */}
        <div className="space-y-5">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Email subject line"
              className={inputClass}
            />
          </div>

          {/* Locale toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Locale</label>
            <div className="inline-flex rounded-xl bg-[#1e293b] border border-gray-700/50 p-1">
              {(["EN", "AR"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    locale === l ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* HTML */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email HTML</label>
            <p className="text-xs text-gray-500 mb-2">
              Images must use full public URLs (e.g. https://theleeexperience.com/images/...). Use
              email-safe HTML — start from the last newsletter as a template.
            </p>
            <textarea
              value={html}
              onChange={(e) => onHtmlChange(e.target.value)}
              rows={16}
              spellCheck={false}
              placeholder="<html>…</html>"
              className={`${inputClass} font-mono leading-relaxed resize-y`}
            />
          </div>

          {/* Group selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Send to groups (tags)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. investors, partners, alumni"
              className={inputClass}
            />
            <p className="mt-2 text-sm text-gray-400">
              Sending to <span className="font-semibold text-white">{recipientCount}</span> contacts
            </p>
          </div>

          {/* Test send */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Test send (1–3 emails)</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={testAddresses}
                onChange={(e) => setTestAddresses(e.target.value)}
                placeholder="you@example.com, colleague@example.com"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex shrink-0 items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Send size={16} />
                {testing ? "Sending..." : "Send test"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save draft"}
            </button>
            <button
              type="button"
              onClick={() => setShowSendModal(true)}
              disabled={!gateUnlocked || sending}
              title={gateUnlocked ? undefined : "Send a successful test first to unlock"}
              className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Send size={16} />
              Send to group
            </button>
            {!gateUnlocked && (
              <span className="text-xs text-gray-500">Send a test before sending to your group.</span>
            )}
          </div>
        </div>

        {/* Right: live preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-300">Live preview</label>
            <div className="inline-flex rounded-xl bg-[#1e293b] border border-gray-700/50 p-1">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  previewMode === "desktop" ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Monitor size={14} /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  previewMode === "mobile" ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Smartphone size={14} /> Mobile
              </button>
            </div>
          </div>
          <div className="flex justify-center bg-[#0f172a] border border-gray-700/50 rounded-xl p-4 overflow-auto">
            <iframe
              title="Newsletter preview"
              sandbox=""
              srcDoc={debouncedHtml || "<p style='font-family:sans-serif;color:#94a3b8;padding:24px'>Preview will appear here…</p>"}
              style={{ width: previewWidth, maxWidth: "100%", height: "600px" }}
              className="bg-white rounded-lg border-0"
            />
          </div>
        </div>
      </div>

      <AdminModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onConfirm={handleSend}
        title="Send newsletter"
        message={`Send "${subject || "(no subject)"}" to ${recipientCount} contacts? This cannot be undone.`}
        confirmLabel="Send now"
        confirmVariant="primary"
        loading={sending}
      />
    </div>
  );
}

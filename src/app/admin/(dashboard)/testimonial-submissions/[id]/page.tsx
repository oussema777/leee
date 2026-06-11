"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, CheckCircle2, XCircle } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import AdminModal from "../../../components/AdminModal";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-api";

interface Submission {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  governorate: string | null;
  program: string | null;
  quote: string;
  locale: string;
  consent: boolean;
  consentTextVersion: string | null;
  photoUrl: string | null;
  motivation: string | null;
  challenges: string | null;
  skillsGained: string | null;
  valuableLesson: string | null;
  lifeImpact: string | null;
  results: string | null;
  successStory: string | null;
  adviceToOthers: string | null;
  additionalComments: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  publishedTestimonialId: string | null;
  isRead: boolean;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_VARIANT = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const;

const SURVEY_FIELDS: { key: keyof Submission; label: string }[] = [
  { key: "motivation", label: "Motivation to join" },
  { key: "challenges", label: "Challenges before participating" },
  { key: "skillsGained", label: "Skills / knowledge / support gained" },
  { key: "valuableLesson", label: "Most valuable lesson" },
  { key: "lifeImpact", label: "Impact on personal / professional life" },
  { key: "results", label: "Results or milestones achieved" },
  { key: "successStory", label: "Success story" },
  { key: "adviceToOthers", label: "Advice to others" },
  { key: "additionalComments", label: "Additional comments" },
];

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    adminGet<Submission>(`/testimonial-submissions/${id}`)
      .then((d) => {
        setData(d);
        if (!d.isRead) adminPatch(`/testimonial-submissions/${id}`, { isRead: true }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleReject = async () => {
    try {
      const updated = await adminPatch<Submission>(`/testimonial-submissions/${id}`, { status: "REJECTED" });
      setData(updated);
      setShowReject(false);
      toast.success("Submission rejected");
    } catch { toast.error("Failed to reject"); }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;
  if (!data) return <div className="text-gray-400 p-8">Not found.</div>;

  const canApprove = data.consent && data.status !== "APPROVED";
  const surveyEntries = SURVEY_FIELDS.filter((f) => data[f.key]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/testimonial-submissions" className="p-2 text-gray-400 hover:text-white transition-colors"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-white">Testimonial Submission</h1>
        </div>
        <button onClick={() => setShowDelete(true)} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={20} /></button>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge label={data.status} variant={STATUS_VARIANT[data.status]} />
            <StatusBadge label={data.consent ? "Consent: Yes" : "Consent: No"} variant={data.consent ? "success" : "danger"} />
            <StatusBadge label={data.locale === "ar" ? "Arabic" : "English"} variant="info" />
          </div>
          <span className="text-sm text-gray-400">{new Date(data.createdAt).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-gray-500 uppercase">Name</label><p className="text-white">{data.fullName}</p></div>
          <div><label className="text-xs text-gray-500 uppercase">Email (internal)</label><p className="text-white">{data.email}</p></div>
          {data.phone && <div><label className="text-xs text-gray-500 uppercase">Phone (internal)</label><p className="text-white">{data.phone}</p></div>}
          {data.businessName && <div><label className="text-xs text-gray-500 uppercase">Business / Project</label><p className="text-white">{data.businessName}</p></div>}
          {data.governorate && <div><label className="text-xs text-gray-500 uppercase">Governorate</label><p className="text-white">{data.governorate}</p></div>}
          {data.program && <div><label className="text-xs text-gray-500 uppercase">Program</label><p className="text-white">{data.program}</p></div>}
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase">Quote (for publication)</label>
          <p className="text-gray-200 whitespace-pre-wrap mt-1 text-lg leading-relaxed" dir={data.locale === "ar" ? "rtl" : "ltr"}>
            &ldquo;{data.quote}&rdquo;
          </p>
        </div>

        {data.photoUrl && (
          <div>
            <label className="text-xs text-gray-500 uppercase">Photo</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photoUrl} alt={data.fullName} className="mt-2 w-32 h-32 object-cover rounded-xl border border-gray-700/50" />
          </div>
        )}

        {surveyEntries.length > 0 && (
          <div className="border-t border-gray-700/50 pt-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Impact Survey (internal)</h2>
            {surveyEntries.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 uppercase">{f.label}</label>
                <p className="text-gray-300 whitespace-pre-wrap mt-1" dir={data.locale === "ar" ? "rtl" : "ltr"}>{String(data[f.key])}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-700/50 pt-5 flex items-center gap-3 flex-wrap">
          {canApprove ? (
            <Link
              href={`/admin/testimonials/new?fromSubmission=${data.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white text-sm font-medium rounded-xl hover:bg-brand-blue/90 transition-colors"
            >
              <CheckCircle2 size={16} /> Approve &amp; Publish
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700/40 text-gray-500 text-sm font-medium rounded-xl cursor-not-allowed" title={!data.consent ? "No publish consent" : "Already approved"}>
              <CheckCircle2 size={16} /> Approve &amp; Publish
            </span>
          )}
          {data.status === "PENDING" && (
            <button onClick={() => setShowReject(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors">
              <XCircle size={16} /> Reject
            </button>
          )}
          {!data.consent && <p className="text-xs text-gray-500 w-full">Publishing is disabled — the beneficiary did not consent. The submission remains internal impact data.</p>}
          {data.status === "APPROVED" && data.publishedTestimonialId && (
            <Link href={`/admin/testimonials/${data.publishedTestimonialId}/edit`} className="text-sm text-brand-blue hover:underline">
              View published testimonial →
            </Link>
          )}
        </div>
      </div>

      <AdminModal isOpen={showReject} onClose={() => setShowReject(false)} onConfirm={handleReject}
        title="Reject Submission" message="The submission will be kept as internal impact data but cannot be published." confirmLabel="Reject"
      />
      <AdminModal isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          try { await adminDelete(`/testimonial-submissions/${id}`); toast.success("Deleted"); router.push("/admin/testimonial-submissions"); }
          catch { toast.error("Failed to delete"); }
        }}
        title="Delete Submission" message="This permanently removes the submission, including its survey data. This cannot be undone." confirmLabel="Delete"
      />
    </div>
  );
}

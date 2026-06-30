"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import AdminModal from "../../../components/AdminModal";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPost } from "@/lib/admin-api";

interface Submission {
  id: string;
  name: string;
  title: string;
  locale: "en" | "ar";
  photoUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedMemberId: string | null;
  isRead: boolean;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_VARIANT = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const;

export default function TeamSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondName, setSecondName] = useState("");
  const [secondTitle, setSecondTitle] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [alreadyProcessed, setAlreadyProcessed] = useState(false);

  useEffect(() => {
    adminGet<Submission>(`/team-submissions/${id}`)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!data) return;
    setProcessing(true);
    setAlreadyProcessed(false);
    try {
      await adminPost(`/team-submissions/${id}/approve`, { secondName, secondTitle });
      toast.success("Team member approved and published");
      router.push("/admin/team-submissions");
    } catch (e) {
      if (e instanceof Error && e.message === "Already processed") {
        setAlreadyProcessed(true);
      } else {
        toast.error("Failed to approve submission");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    setAlreadyProcessed(false);
    try {
      await adminPost(`/team-submissions/${id}/reject`, {});
      toast.success("Submission rejected");
      router.push("/admin/team-submissions");
    } catch (e) {
      if (e instanceof Error && e.message === "Already processed") {
        setAlreadyProcessed(true);
        setShowReject(false);
      } else {
        toast.error("Failed to reject submission");
      }
    } finally {
      setProcessing(false);
      setShowReject(false);
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;
  if (!data) return <div className="text-gray-400 p-8">Not found.</div>;

  const isPending = data.status === "PENDING";
  const oppositeLabel = data.locale === "en" ? "Arabic" : "English";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/team-submissions" className="p-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Team Submission</h1>
      </div>

      {alreadyProcessed && (
        <div className="mb-4 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
          This submission has already been processed.
        </div>
      )}

      <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 p-6 space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge label={data.status} variant={STATUS_VARIANT[data.status]} />
            <StatusBadge label={data.locale === "ar" ? "Arabic" : "English"} variant="info" />
          </div>
          <span className="text-sm text-gray-400">{new Date(data.createdAt).toLocaleString()}</span>
        </div>

        {/* Photo */}
        {data.photoUrl && (
          <div>
            <label className="text-xs text-gray-500 uppercase">Photo</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.photoUrl}
              alt={data.name}
              className="mt-2 w-24 h-24 object-cover rounded-full border border-gray-700/50"
            />
          </div>
        )}

        {/* Name + Title */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase">Name</label>
            <p className="text-white">{data.name}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Title / Role</label>
            <p className="text-white">{data.title}</p>
          </div>
        </div>

        {/* Social links */}
        {(data.linkedinUrl || data.twitterUrl || data.instagramUrl || data.websiteUrl) && (
          <div className="grid grid-cols-2 gap-4">
            {data.linkedinUrl && (
              <div>
                <label className="text-xs text-gray-500 uppercase">LinkedIn</label>
                <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline text-sm truncate block">
                  {data.linkedinUrl}
                </a>
              </div>
            )}
            {data.twitterUrl && (
              <div>
                <label className="text-xs text-gray-500 uppercase">Twitter / X</label>
                <a href={data.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline text-sm truncate block">
                  {data.twitterUrl}
                </a>
              </div>
            )}
            {data.instagramUrl && (
              <div>
                <label className="text-xs text-gray-500 uppercase">Instagram</label>
                <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline text-sm truncate block">
                  {data.instagramUrl}
                </a>
              </div>
            )}
            {data.websiteUrl && (
              <div>
                <label className="text-xs text-gray-500 uppercase">Website</label>
                <a href={data.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline text-sm truncate block">
                  {data.websiteUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Opposite-language translation inputs — only shown for pending submissions */}
        {isPending && (
          <div className="border-t border-gray-700/50 pt-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              {oppositeLabel} Translation (required to publish)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase block mb-1">{oppositeLabel} Name</label>
                <input
                  type="text"
                  value={secondName}
                  onChange={(e) => setSecondName(e.target.value)}
                  placeholder={`Enter ${oppositeLabel} name`}
                  className="w-full px-3 py-2.5 bg-[#0f172a] border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase block mb-1">{oppositeLabel} Title</label>
                <input
                  type="text"
                  value={secondTitle}
                  onChange={(e) => setSecondTitle(e.target.value)}
                  placeholder={`Enter ${oppositeLabel} title`}
                  className="w-full px-3 py-2.5 bg-[#0f172a] border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="border-t border-gray-700/50 pt-5 flex items-center gap-3 flex-wrap">
          {isPending ? (
            <>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white text-sm font-medium rounded-xl hover:bg-brand-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={16} />
                {processing ? "Approving..." : "Approve & Publish"}
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={processing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={16} /> Reject
              </button>
            </>
          ) : (
            <span className="text-sm text-gray-500">
              {data.status === "APPROVED" ? "Approved" : "Rejected"} on{" "}
              {data.reviewedAt ? new Date(data.reviewedAt).toLocaleString() : "—"}
            </span>
          )}
        </div>
      </div>

      <AdminModal
        isOpen={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={handleReject}
        title="Reject Submission"
        message="The applicant will not be added to the team. This marks the submission as rejected."
        confirmLabel="Reject"
        loading={processing}
      />
    </div>
  );
}

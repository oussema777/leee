"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import AdminModal from "../../../components/AdminModal";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-api";

interface Submission {
  id: string;
  fullName: string;
  professionalTitle: string;
  countries: string[];
  phone: string;
  email: string;
  linkedinUrl: string | null;
  photoUrl: string | null;
  photoConsent: boolean;
  degrees: string[];
  degreeDetails: string;
  majorFieldOfStudy: string;
  yearsExperience: string;
  certifications: string;
  licensesMemberships: string | null;
  shortBio: string;
  expertiseKeywords: string;
  notableWork: string | null;
  languages: string;
  availableForEngagements: string;
  dailyRate: string;
  publishConsent: boolean;
  status: "NEW" | "SHORTLISTED" | "CONTACTED" | "ARCHIVED" | "REJECTED";
  isRead: boolean;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_VARIANT = {
  NEW: "info",
  SHORTLISTED: "warning",
  CONTACTED: "success",
  ARCHIVED: "neutral",
  REJECTED: "danger",
} as const;

const STATUSES = ["NEW", "SHORTLISTED", "CONTACTED", "ARCHIVED", "REJECTED"] as const;

export default function ExpertSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    adminGet<Submission>(`/expert-submissions/${id}`)
      .then((d) => {
        setData(d);
        setNotes(d.adminNotes ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: Submission["status"]) => {
    try {
      const updated = await adminPatch<Submission>(`/expert-submissions/${id}`, { status });
      setData(updated);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const updated = await adminPatch<Submission>(`/expert-submissions/${id}`, { adminNotes: notes });
      setData(updated);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;
  if (!data) return <div className="text-gray-400 p-8">Not found.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/expert-submissions" className="p-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Expert Application</h1>
        </div>
        <button onClick={() => setShowDelete(true)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 p-6 space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge label={data.status} variant={STATUS_VARIANT[data.status]} />
            <StatusBadge
              label={data.publishConsent ? "Publish: Yes" : "Publish: No"}
              variant={data.publishConsent ? "success" : "danger"}
            />
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
              alt={data.fullName}
              className="mt-2 w-24 h-24 object-cover rounded-xl border border-gray-700/50"
            />
          </div>
        )}

        {/* Section 1 — Personal Information */}
        <div className="border-t border-gray-700/50 pt-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Full Name</label>
              <p className="text-white">{data.fullName}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Professional Title</label>
              <p className="text-white">{data.professionalTitle}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Countries</label>
              <p className="text-white">{data.countries.join(", ")}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Phone (internal)</label>
              <p className="text-white">{data.phone}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Email (internal)</label>
              <p className="text-white">{data.email}</p>
            </div>
            {data.linkedinUrl && (
              <div>
                <label className="text-xs text-gray-500 uppercase">LinkedIn</label>
                <a
                  href={data.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline text-sm truncate block"
                >
                  {data.linkedinUrl}
                </a>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 uppercase">Photo Consent</label>
              <p className="text-white">{data.photoConsent ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* Section 2 — Academic Degrees */}
        <div className="border-t border-gray-700/50 pt-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Academic Degrees</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Degree(s)</label>
              <p className="text-white">{data.degrees.join(", ")}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Major / Field of Study</label>
              <p className="text-white">{data.majorFieldOfStudy}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Degree Details</label>
            <p className="text-gray-300 whitespace-pre-wrap mt-1">{data.degreeDetails}</p>
          </div>
        </div>

        {/* Section 3 — Professional Experience & Credentials */}
        <div className="border-t border-gray-700/50 pt-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Professional Experience &amp; Credentials
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Years of Experience</label>
              <p className="text-white">{data.yearsExperience}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Short Bio</label>
            <p className="text-gray-300 whitespace-pre-wrap mt-1">{data.shortBio}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Certifications</label>
            <p className="text-gray-300 whitespace-pre-wrap mt-1">{data.certifications}</p>
          </div>
          {data.licensesMemberships && (
            <div>
              <label className="text-xs text-gray-500 uppercase">Licenses &amp; Memberships</label>
              <p className="text-gray-300 whitespace-pre-wrap mt-1">{data.licensesMemberships}</p>
            </div>
          )}
        </div>

        {/* Section 4 — Area of Expertise */}
        <div className="border-t border-gray-700/50 pt-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Area of Expertise</h2>
          <div>
            <label className="text-xs text-gray-500 uppercase">Expertise Keywords</label>
            <p className="text-gray-300 mt-1">{data.expertiseKeywords}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Languages</label>
            <p className="text-white mt-1">{data.languages}</p>
          </div>
          {data.notableWork && (
            <div>
              <label className="text-xs text-gray-500 uppercase">Notable Work</label>
              <p className="text-gray-300 whitespace-pre-wrap mt-1">{data.notableWork}</p>
            </div>
          )}
        </div>

        {/* Section 5 — Publishing Consent & Availability */}
        <div className="border-t border-gray-700/50 pt-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Publishing Consent &amp; Availability
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Available For Engagements</label>
              <p className="text-white">{data.availableForEngagements}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Daily Rate</label>
              <p className="text-white">{data.dailyRate}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Publish Consent</label>
              <p className="text-white">{data.publishConsent ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* Review controls */}
        <div className="border-t border-gray-700/50 pt-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Review</h2>
          <div>
            <label className="text-xs text-gray-500 uppercase block mb-1">Status</label>
            <select
              value={data.status}
              onChange={(e) => handleStatusChange(e.target.value as Submission["status"])}
              className="px-3 py-2.5 bg-[#0f172a] border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-brand-blue"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase block mb-1">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add internal notes..."
              className="w-full px-3 py-2.5 bg-[#0f172a] border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 px-5 py-2.5 bg-brand-blue text-white text-sm font-medium rounded-xl hover:bg-brand-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
          {data.reviewedAt && (
            <p className="text-xs text-gray-500">
              Reviewed on {new Date(data.reviewedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <AdminModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          try {
            await adminDelete(`/expert-submissions/${id}`);
            toast.success("Deleted");
            router.push("/admin/expert-submissions");
          } catch {
            toast.error("Failed to delete");
          }
        }}
        title="Delete Application"
        message="This permanently removes the expert application. This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}

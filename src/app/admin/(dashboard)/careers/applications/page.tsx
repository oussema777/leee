import Link from "next/link";
import { db } from "@/lib/db";
import { CoverLetterDialog } from "./CoverLetterDialog";

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default async function CareerApplicationsPage() {
  const applications = await db.careerApplication.findMany({
    include: { career: { select: { id: true, slug: true, titleEn: true, titleAr: true, isActive: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Career Applications</h1>
        <Link href="/admin/careers" className="text-sm text-brand-blue hover:underline">
          ← Back to Careers
        </Link>
      </div>

      <div className="overflow-x-auto bg-[#1e293b] border border-white/10 rounded-xl">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-400">Applicant</th>
              <th className="px-4 py-3 font-semibold text-gray-400">Email</th>
              <th className="px-4 py-3 font-semibold text-gray-400">Phone</th>
              <th className="px-4 py-3 font-semibold text-gray-400">Position</th>
              <th className="px-4 py-3 font-semibold text-gray-400">Submitted</th>
              <th className="px-4 py-3 font-semibold text-gray-400">Resume</th>
              <th className="px-4 py-3 font-semibold text-gray-400">Cover Letter</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No applications yet.
                </td>
              </tr>
            ) : (
              applications.map((a) => (
                <tr key={a.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{a.fullName}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${a.email}`} className="text-brand-blue hover:underline">
                      {a.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{a.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/careers/${a.career.id}/edit`} className="text-brand-blue hover:underline">
                      {a.career.titleEn}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatRelative(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    {a.resumeUrl ? (
                      <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                        Open ↗
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CoverLetterDialog fullName={a.fullName} coverLetter={a.coverLetter} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";

export function CoverLetterDialog({ fullName, coverLetter }: { fullName: string; coverLetter: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="text-brand-blue hover:underline"
      >
        View
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          // close on backdrop click
          if (e.target === ref.current) ref.current?.close();
        }}
        className="p-0 rounded-lg shadow-2xl max-w-xl w-[90vw] backdrop:bg-black/40"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Cover Letter — {fullName}</h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="text-text-muted hover:text-text-primary text-sm"
            >
              Close
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm text-text-secondary max-h-[60vh] overflow-y-auto">
            {coverLetter}
          </div>
        </div>
      </dialog>
    </>
  );
}

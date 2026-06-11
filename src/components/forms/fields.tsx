"use client";

import { cn } from "@/lib/utils";

export function FormField({
  label,
  value,
  onChange,
  error,
  required,
  optional,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  optional?: string;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
        {optional && !required && (
          <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all",
          error ? "border-red-400" : "border-gray-200"
        )}
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  optional?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {optional && <span className="text-gray-400 text-xs ms-1.5">({optional})</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  optional,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  optional?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
        {optional && !required && (
          <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
        )}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none",
          error ? "border-red-400" : "border-gray-200"
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

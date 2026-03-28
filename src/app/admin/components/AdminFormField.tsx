"use client";

import { cn } from "@/lib/utils";

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type: "text" | "email" | "url" | "number" | "date" | "password";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: "select";
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}

interface ToggleFieldProps extends BaseFieldProps {
  type: "toggle";
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

type AdminFormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps | ToggleFieldProps;

export default function AdminFormField(props: AdminFormFieldProps) {
  const { label, error, required, className } = props;

  if (props.type === "toggle") {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div>
          <label className="text-sm font-medium text-gray-300">{label}</label>
          {props.description && (
            <p className="text-xs text-gray-500 mt-0.5">{props.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => props.onChange(!props.value)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
            props.value ? "bg-brand-blue" : "bg-gray-600"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-white transition-transform mt-0.5",
              props.value ? "translate-x-5 ml-0.5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {props.type === "textarea" ? (
        <textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows || 4}
          className={cn(
            "w-full px-4 py-2.5 bg-[#0f172a] border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors resize-none",
            error ? "border-red-500" : "border-gray-700/50"
          )}
        />
      ) : props.type === "select" ? (
        <select
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className={cn(
            "w-full px-4 py-2.5 bg-[#0f172a] border rounded-xl text-sm text-white focus:outline-none focus:border-brand-blue transition-colors",
            error ? "border-red-500" : "border-gray-700/50"
          )}
        >
          <option value="">Select...</option>
          {props.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={props.type}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          className={cn(
            "w-full px-4 py-2.5 bg-[#0f172a] border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors",
            error ? "border-red-500" : "border-gray-700/50"
          )}
        />
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

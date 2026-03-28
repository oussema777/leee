"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { adminUpload } from "@/lib/admin-api";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  label?: string;
  accept?: string;
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
  folder = "uploads",
  label = "Upload Image",
  accept,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files[0]) return;
      setUploading(true);
      setError("");
      try {
        const { url } = await adminUpload(files[0], folder);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".svg"] },
    maxFiles: 1,
    disabled: uploading,
  });

  if (value) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <div className="relative group w-fit">
          <img
            src={value}
            alt="Preview"
            className="h-32 w-auto rounded-xl border border-gray-700/50 object-cover"
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          {...getRootProps()}
          className="text-xs text-brand-blue hover:underline"
        >
          Replace
          <input {...getInputProps()} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-brand-blue bg-brand-blue/5"
            : "border-gray-700/50 hover:border-gray-600"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <div className="animate-spin h-6 w-6 border-2 border-brand-blue border-t-transparent rounded-full" />
          ) : (
            <Upload size={24} className="text-gray-500" />
          )}
          <p className="text-sm text-gray-400">
            {uploading ? "Uploading..." : isDragActive ? "Drop here" : "Drag & drop or click to upload"}
          </p>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

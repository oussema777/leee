"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BlogForm from "../../components/BlogForm";
import { adminGet } from "@/lib/admin-api";

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGet(`/blog/${id}`).then((d: any) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;
  if (!data) return <div className="text-gray-400 p-8">Not found.</div>;
  return <BlogForm initial={data} />;
}

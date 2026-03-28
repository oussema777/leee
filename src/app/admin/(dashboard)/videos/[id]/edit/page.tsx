"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VideoForm from "../../components/VideoForm";
import { adminGet } from "@/lib/admin-api";

export default function EditVideoPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGet(`/videos/${id}`).then((d: any) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;
  if (!data) return <div className="text-gray-400 p-8">Not found.</div>;
  return <VideoForm initial={data} />;
}

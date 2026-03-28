"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CareerForm from "../../components/CareerForm";
import { adminGet } from "@/lib/admin-api";

export default function EditCareerPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGet(`/careers/${id}`).then((d: any) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;
  if (!data) return <div className="text-gray-400 p-8">Not found.</div>;
  return <CareerForm initial={data} />;
}

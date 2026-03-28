"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SliderForm from "../../components/SliderForm";
import { adminGet } from "@/lib/admin-api";

export default function EditSliderPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGet(`/sliders/${id}`)
      .then((d: any) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-gray-400 p-8">Loading...</div>;
  }

  if (!data) {
    return <div className="text-gray-400 p-8">Slider not found.</div>;
  }

  return <SliderForm initial={data} />;
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BookInventoryForm from "../../components/BookInventoryForm";
import { adminGet } from "@/lib/admin-api";

export default function EditBookInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminGet('/book-inventory/' + id).then(setData).catch(() => {}).finally(() => setLoading(false)); }, [id]);
  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!data) return <div className="p-8 text-gray-400">Not found.</div>;
  return <BookInventoryForm initial={data} />;
}

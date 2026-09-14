"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminGet } from "@/lib/admin-api";
import BookDonorForm, { type DonorFormData } from "../../components/BookDonorForm";
export default function EditBookDonorPage() { const { id } = useParams<{ id: string }>(); const [donor, setDonor] = useState<DonorFormData | null>(null); useEffect(() => { adminGet<DonorFormData>(`/book-donors/${id}`).then(setDonor); }, [id]); return donor ? <BookDonorForm initial={donor} /> : <p className="p-8 text-gray-400">Loading donor…</p>; }

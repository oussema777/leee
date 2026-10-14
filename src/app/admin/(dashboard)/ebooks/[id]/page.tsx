import { AdminEbookEditor } from "@/components/ebooks/AdminEbooks";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <AdminEbookEditor {...await params} />; }

import { AdminEbookOrder } from "@/components/ebooks/AdminEbookOrders";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <AdminEbookOrder {...await params} />; }

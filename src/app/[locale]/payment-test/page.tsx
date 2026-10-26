import type { Metadata } from 'next';
import { ReviewerCheckout } from '@/components/books/ReviewerCheckout';

export const metadata: Metadata = { title: 'Payment integration review | The LEE Experience', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function PaymentTestPage() { return <ReviewerCheckout />; }

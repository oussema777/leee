import type { Metadata } from 'next';
import { WhishReviewer } from '@/components/books/WhishReviewer';
export const metadata: Metadata = { title: 'Whish Pay integration review | LEE', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <WhishReviewer />; }

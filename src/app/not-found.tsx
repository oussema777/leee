import Link from "next/link";

/**
 * Global 404 page.
 *
 * The root layout (src/app/layout.tsx) is a pass-through that renders bare
 * `children` — the <html>/<body> tags live in the [locale] layout. Unmatched
 * routes (e.g. /en/some-typo) fall back to THIS boundary, which renders inside
 * the root layout only, so it must supply its own <html>/<body>. Without this
 * file Next.js throws "Missing <html> and <body> tags in the root layout".
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-md">
          <p className="text-7xl font-extrabold text-brand-blue">404</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Page not found
          </h1>
          <p className="mt-3 text-gray-600 leading-relaxed">
            The page you’re looking for doesn’t exist or may have moved.
          </p>
          <Link
            href="/en"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
          >
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}

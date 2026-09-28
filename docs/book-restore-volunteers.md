# Book Restore volunteer intake

Prepared 28 September 2026. The local build includes a bilingual volunteer page at `/en/book-restore/volunteer` and `/ar/book-restore/volunteer`, a section and CTA on the Book Restore donation page, and a Phoenix volunteer CTA to the same form.

Applicants can choose book collection, order preparation, street interviews, video/content, community outreach, or another activity. The form captures contact details, location, availability, optional experience and notes, and explicit contact consent. It states that applying is not a commitment or permission to use the applicant's image in videos.

The submission endpoint validates and rate limits input, discards honeypot submissions, stores the application with a reference and consent version, and sends a team notification through the existing `EMAIL_TO` configuration. A notification failure does not discard a stored application. The admin inbox at `/admin/book-volunteers` supports search, status filters, details, read state, follow-up status, and internal notes. Applicants are not automatically marked onboarded.

The additive [volunteer database patch](../prisma/patches/20260928_book_volunteers.sql) was applied on 28 September 2026 to the Supabase database configured identically in `.env` and `.env.local`. It created the dedicated table and status enum with row-level security enabled. The existing Book Restore tables were already present.

An authorized test application submitted through the local HTTP endpoint returned `201`, was found in the new database table with both selected activities, and appeared in Resend's email list with a `delivered` event. The clearly marked test record was then deleted from the table. The production website code has not been deployed by this database step.

Local verification: Prisma schema validation, TypeScript, 209 automated tests, and a full Next.js production build passed. The tests include field and consent validation, data storage, notification, admin access, and stale follow-up protection.

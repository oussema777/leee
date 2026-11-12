# Physical book pricing — 12 November 2026

Physical books move from USD 5 to USD 9. The existing package structure is retained: 1 book $9, 5 books $45, 10 + 1 free $90, 20 + 2 free $180. Delivery remains $4 for a single book and free for the existing multi-book bundles. Manal's ebook remains $9.99; ebook code and saved order amounts are unchanged.

The release is based on live production commit `ebe81aa`, in the isolated `books-nine-dollars-20261112` branch. Do not deploy the older independently modified `leee-experience` worktree.

`BOOK_UNIT_PRICE_CENTS` drives checkout packages, the bilingual product-page price and new-inventory form defaults. Cash, live Whish and live Audi order creation already calculate totals from that shared configuration. Existing payment sessions resume their saved order amounts.

Run `node scripts/update-physical-book-prices.mjs --env <environment-file>` to inspect. Add `--apply` only at rollout. The script updates only physical inventory at USD 5, rejects unexpected prices or currencies, writes a local backup, uses a serializable transaction, and verifies ebook and saved order prices are unchanged. It is safe to rerun after success. Backups are excluded from Git and deployment uploads.

Initial audit: 258 physical inventory records at USD 5 (257 published, one unpublished); one published ebook, `manal-366-days`, at 999 cents. Public catalogue, book detail and Phoenix pages read inventory dynamically.

Validation includes the existing book/payment/ebook suites plus 26 focused checks through both live order creators: package and delivery totals, server rejection of caller-supplied prices, free-extra counts, and preservation of historical $5 orders. Database integration suites require their dedicated local PostgreSQL instances and must never use production credentials.

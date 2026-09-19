# Media optimization workflow

Static images are kept under an enforced deployment budget: at most 2560 px on
either side and 1.5 MB per file. Existing URLs and filename extensions stay the
same, so database records and seeded content do not need migration.

## Before committing new images

```bash
npm run assets:optimize
npm run assets:check
```

`assets:optimize` processes Git-tracked images plus new, non-ignored files in
`public/`. It skips ignored source-media folders and non-image files. The build
runs `assets:check` automatically and fails with the exact oversized paths.

JPEGs are resized and encoded as progressive MozJPEG. PNG and WebP files are
resized and recompressed in their existing format. The original Git revision is
the recovery copy if an image ever needs to be restored.

## Runtime uploads

Admin images, testimonial photos, and book-cover photos are verified, stripped
of metadata, constrained to 1800–2000 px, and stored as WebP. This prevents the
Supabase uploads bucket from accumulating full-resolution originals.

## Video policy

Do not commit videos to `public/`. Upload them to a video/CDN service and store
the remote URL in content data. Large local video folders are ignored because
Vercel deployment bundles are not an appropriate video origin.

/**
 * Create the Storage buckets the app needs. Idempotent — safe to re-run.
 *
 * Run:  npm run setup:storage
 *
 * `avatars` is public-read. Profile pictures are low-sensitivity and a public
 * bucket means <Image src> works with no signing round-trip. Writes are NOT
 * public: every upload goes through a server action that first checks the actor
 * may edit that profile, using the service role. The trade-off is that an avatar
 * URL, once known, is readable by anyone — acceptable for a profile picture,
 * and the reason payslips and sick certificates will need a private bucket.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. See README.md.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const BUCKETS = [
  {
    name: "avatars",
    options: {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024, // 2 MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    },
  },
];

const { data: existing, error: listError } = await admin.storage.listBuckets();
if (listError) {
  console.error("Could not list buckets:", listError.message);
  process.exit(1);
}

for (const { name, options } of BUCKETS) {
  const found = existing.find((b) => b.name === name);
  if (found) {
    const { error } = await admin.storage.updateBucket(name, options);
    console.log(error ? `  ✗ ${name} — ${error.message}` : `  ↻ ${name} exists, settings synced`);
    continue;
  }
  const { error } = await admin.storage.createBucket(name, options);
  console.log(error ? `  ✗ ${name} — ${error.message}` : `  ✓ ${name} created (public read, 2MB, images only)`);
}

const { data: after } = await admin.storage.listBuckets();
console.log("\nbuckets:", after.map((b) => `${b.name}${b.public ? " (public)" : ""}`).join(", ") || "none");

// Crée le bucket Supabase Storage "product-images" (public).
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const url = /NEXT_PUBLIC_SUPABASE_URL=(.+)/.exec(env)[1].trim();
const key = /SUPABASE_SERVICE_ROLE_KEY=(.+)/.exec(env)[1].trim();

(async () => {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.storage.createBucket("product-images", {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/avif"],
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error("ERREUR:", error.message);
    process.exit(1);
  }
  console.log("✅ bucket product-images prêt", data ?? "(déjà existant)");
  const { data: buckets } = await sb.storage.listBuckets();
  console.log("buckets:", buckets?.map((b) => `${b.name}${b.public ? " (public)" : ""}`).join(", "));
})();

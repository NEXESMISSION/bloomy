// Exécute un fichier SQL sur Supabase via l'API de gestion.
// Usage: node scripts/db.cjs <chemin.sql>   |   node scripts/db.cjs --q "select ..."
const fs = require("fs");
const path = require("path");

const secrets = fs.readFileSync(path.join(__dirname, "..", "supabase", ".secrets.local"), "utf8");
const REF = /SUPABASE_PROJECT_REF=(.+)/.exec(secrets)[1].trim();
const TOKEN = /SUPABASE_ACCESS_TOKEN=(.+)/.exec(secrets)[1].trim();

async function runSql(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await r.text();
  return { status: r.status, text };
}

(async () => {
  const arg = process.argv[2];
  let sql;
  if (arg === "--q") sql = process.argv[3];
  else sql = fs.readFileSync(path.resolve(arg), "utf8");
  const res = await runSql(sql);
  console.log(res.status, res.text.slice(0, 1500));
  if (res.status >= 300) process.exit(1);
})();

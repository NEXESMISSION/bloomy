import QRCode from "qrcode";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getGoldenBatch, getGoldenTickets } from "@/lib/data/golden";
import { site } from "@/lib/site";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

/**
 * Base URL des QR codes. Priorité :
 *  1. NEXT_PUBLIC_SITE_URL si défini et ≠ localhost  → domaine canonique (ex. https://bloomy.tn)
 *  2. sinon le domaine RÉEL de la requête en cours    → jamais "localhost" en prod (ex. *.vercel.app)
 * Ainsi, le jour du passage à bloomy.tn : on fixe NEXT_PUBLIC_SITE_URL et on réimprime.
 */
function resolveBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (env && !env.includes("localhost")) return env;

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return env || site.url.replace(/\/$/, "");
}

export default async function GoldenPrintPage({ params }: { params: { id: string } }) {
  const batch = await getGoldenBatch(params.id);
  if (!batch) notFound();
  const tickets = await getGoldenTickets(params.id);
  const base = resolveBaseUrl();

  const qrs = await Promise.all(
    tickets.map(async (t, i) => ({
      n: i + 1,
      svg: await QRCode.toString(`${base}/g/${t.token}`, { type: "svg", margin: 1, width: 150 }),
    })),
  );

  return (
    <div className="qr-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .qr-page { padding: 24px; background:#fff; color:#17171b; font-family: system-ui, sans-serif; }
        .qr-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
        .qr-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .qr-cell { border:1px dashed #c9c8c4; border-radius:10px; padding:10px; text-align:center; break-inside:avoid; }
        .qr-cell svg { width:100%; height:auto; }
        .qr-cell .cap { margin-top:6px; font-size:11px; font-weight:600; letter-spacing:.04em; }
        @media (max-width:640px){ .qr-grid { grid-template-columns: repeat(2,1fr);} }
        @media print {
          .no-print { display:none !important; }
          .qr-page { padding:0; }
          .qr-grid { grid-template-columns: repeat(3, 1fr); gap:8px; }
          .qr-cell { border-color:#bbb; }
        }
      `,
        }}
      />

      <div className="qr-toolbar no-print">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{batch.name} — QR codes</h1>
          <p style={{ margin: "4px 0 0", color: "#76757b", fontSize: 14 }}>
            {tickets.length} tickets · lot : {batch.prize_label}. Imprimez, découpez et distribuez.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            <span style={{ color: "#76757b" }}>Les QR pointent vers : </span>
            <span style={{ fontWeight: 600, color: "#17171b" }}>{base}/g/…</span>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="qr-grid">
        {qrs.map((q) => (
          <div className="qr-cell" key={q.n}>
            <div dangerouslySetInnerHTML={{ __html: q.svg }} />
            <p className="cap">BLOOMY · #{q.n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

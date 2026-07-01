import QRCode from "qrcode";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listShops } from "@/lib/data/consignment";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

function resolveBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (env && !env.includes("localhost")) return env;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return env || "http://localhost:3000";
}

export default async function AllQrPage() {
  const base = resolveBaseUrl();
  const shops = (await listShops()).filter((s) => s.status !== "removed");
  const cards = await Promise.all(
    shops.map(async (s) => ({
      name: s.name,
      svg: await QRCode.toString(`${base}/crm/depot/boutiques/${s.id}`, { type: "svg", margin: 1, width: 150 }),
    })),
  );

  return (
    <div className="qr-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .qr-page { padding:24px; background:#fff; color:#17171b; font-family:system-ui,sans-serif; }
        .qr-top { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
        .qr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .qr-cell { border:1px dashed #c9c8c4; border-radius:12px; padding:12px; text-align:center; break-inside:avoid; }
        .qr-cell svg { width:100%; height:auto; max-width:150px; }
        .qr-cell .nm { margin-top:8px; font-size:13px; font-weight:600; }
        .qr-cell .hint { font-size:10px; color:#76757b; }
        @media (max-width:640px){ .qr-grid{ grid-template-columns:repeat(2,1fr);} }
        @media print { .no-print{ display:none !important; } .qr-page{ padding:0; } .qr-grid{ grid-template-columns:repeat(3,1fr);} }
      `,
        }}
      />
      <div className="qr-top no-print">
        <div>
          <Link href="/crm/depot/boutiques" style={{ color: "#76757b", textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center", fontSize: 14 }}>
            <ArrowLeft size={16} /> Boutiques
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: "6px 0 0" }}>QR de toutes les boutiques</h1>
          <p style={{ margin: "4px 0 0", color: "#76757b", fontSize: 14 }}>Imprimez, découpez, collez chaque QR sur le display de la boutique. Scannez pour compter.</p>
        </div>
        <PrintButton />
      </div>

      {cards.length === 0 ? (
        <p style={{ color: "#76757b", textAlign: "center", padding: 40 }}>Aucune boutique.</p>
      ) : (
        <div className="qr-grid">
          {cards.map((c, i) => (
            <div className="qr-cell" key={i}>
              <div dangerouslySetInnerHTML={{ __html: c.svg }} />
              <p className="nm">{c.name}</p>
              <p className="hint">Scannez pour compter</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

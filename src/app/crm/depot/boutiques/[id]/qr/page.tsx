import QRCode from "qrcode";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getShop } from "@/lib/data/consignment";
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

export default async function ShopQrPage({ params }: { params: { id: string } }) {
  const shop = await getShop(params.id);
  if (!shop) notFound();
  const base = resolveBaseUrl();
  const url = `${base}/crm/depot/boutiques/${params.id}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 340 });

  return (
    <div className="qr-wrap">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .qr-wrap { min-height:100vh; background:#fff; color:#17171b; font-family:system-ui,sans-serif; padding:24px; }
        .qr-card { max-width:420px; margin:24px auto; border:1px solid #e6e5e1; border-radius:20px; padding:28px; text-align:center; }
        .qr-card svg { width:280px; height:280px; }
        @media print { .no-print{ display:none !important; } .qr-card{ border:none; } }
      `,
        }}
      />
      <div className="no-print" style={{ maxWidth: 420, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href={`/crm/depot/boutiques/${params.id}`} style={{ color: "#76757b", textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center", fontSize: 14 }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <PrintButton />
      </div>

      <div className="qr-card">
        <p style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#76757b", margin: 0 }}>Bloomy · Dépôt-vente</p>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "6px 0 4px" }}>{shop.name}</h1>
        <p style={{ color: "#76757b", fontSize: 14, margin: "0 0 18px" }}>Scannez avec l'appareil photo du téléphone pour compter cette boutique.</p>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <p style={{ marginTop: 14, fontSize: 12, color: "#a3a2a0", wordBreak: "break-all" }}>{url}</p>
      </div>
    </div>
  );
}

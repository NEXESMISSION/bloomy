import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Bloomy",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white text-ink">{children}</div>;
}

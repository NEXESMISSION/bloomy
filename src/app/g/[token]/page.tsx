import type { Metadata } from "next";
import { getGoldenPublicState } from "@/lib/data/golden";
import GoldenReveal from "@/components/GoldenReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Golden Ticket",
  robots: { index: false, follow: false },
};

export default async function GoldenTokenPage({ params }: { params: { token: string } }) {
  const state = await getGoldenPublicState(params.token);
  return <GoldenReveal token={params.token} initial={state} />;
}

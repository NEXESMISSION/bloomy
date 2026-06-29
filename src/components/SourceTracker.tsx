"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Mémorise la provenance (?ref= / ?source= / ?utm_source=) pour le suivi des leads. */
export default function SourceTracker() {
  const params = useSearchParams();
  useEffect(() => {
    const s = params.get("ref") || params.get("source") || params.get("utm_source");
    if (s) {
      try {
        localStorage.setItem("bloomy_source", s.slice(0, 60));
      } catch {}
    }
  }, [params]);
  return null;
}

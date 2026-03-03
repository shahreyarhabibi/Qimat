"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) {
      return;
    }

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: pathname,
        referrer: document.referrer || null,
      }),
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  }, [pathname]);

  return null;
}

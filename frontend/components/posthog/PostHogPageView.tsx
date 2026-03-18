"use client";

import { usePathname } from "next/navigation";
import { useEffect, Suspense } from "react";
import posthog from "posthog-js";

function PostHogPageViewInner() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.origin + pathname;
      if (window.location.search) {
        url += window.location.search;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname]);

  return null;
}

export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewInner />
    </Suspense>
  );
}

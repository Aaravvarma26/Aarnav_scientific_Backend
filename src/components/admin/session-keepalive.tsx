"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The access token cookie only lives 15 minutes, backed by a 30-day refresh
// token/session that nothing was ever using. Without this, an admin gets
// bounced to the login screen every 15 minutes even mid-session. This quietly
// renews the access token in the background so the session lasts as long as
// the underlying 30-day session does, for as long as the admin panel stays open.
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // refresh every 10 minutes, comfortably inside the 15-minute TTL

export function SessionKeepAlive() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!res.ok && !cancelled) {
          // Refresh token/session has genuinely expired or was revoked — send them to log in again.
          router.push("/admin/login");
        }
      } catch {
        // Network hiccup — don't force a logout over a transient failure; the next interval tick will retry.
      }
    }

    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router]);

  return null;
}

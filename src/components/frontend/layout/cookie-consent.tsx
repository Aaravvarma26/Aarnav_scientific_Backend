"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("as_cookie_consent")) setVisible(true);
  }, []);

  if (pathname?.startsWith("/admin") || !visible) return null;

  function accept() {
    localStorage.setItem("as_cookie_consent", "accepted");
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-navy-100 bg-white/95 p-5 shadow-premium backdrop-blur-md sm:inset-x-6 sm:bottom-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-navy-700">
          We use cookies to improve your experience and analyze site traffic. By continuing, you
          agree to our{" "}
          <Link href="/privacy-policy" className="font-semibold text-teal-700 underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button onClick={accept} className="btn-primary flex-shrink-0 !px-5 !py-2 text-xs">
          Accept
        </button>
      </div>
    </div>
  );
}

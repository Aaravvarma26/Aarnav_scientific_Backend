"use client";

import { usePathname } from "next/navigation";
import { siteConfig } from "@/common/site-config";

export function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <a
      href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
        "Hello Aarnav Scientific, I would like to enquire about your products."
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-premium transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
        <path d="M16.004 2.667c-7.364 0-13.333 5.97-13.333 13.333 0 2.352.615 4.646 1.782 6.667L2.667 29.333l6.822-1.79a13.28 13.28 0 0 0 6.515 1.71h.006c7.363 0 13.332-5.97 13.332-13.333S23.367 2.667 16.004 2.667Zm0 24.4h-.005a11.05 11.05 0 0 1-5.63-1.54l-.404-.24-4.05 1.062 1.082-3.95-.264-.406a11.02 11.02 0 0 1-1.696-5.86c0-6.106 4.966-11.07 11.072-11.07 2.958 0 5.738 1.154 7.829 3.246a10.99 10.99 0 0 1 3.24 7.83c-.003 6.104-4.969 11.068-11.174 11.068Zm6.075-8.284c-.333-.167-1.966-.97-2.27-1.08-.305-.11-.527-.166-.75.167-.222.333-.86 1.08-1.055 1.303-.194.222-.388.25-.72.083-.334-.167-1.41-.52-2.686-1.657-.993-.886-1.663-1.98-1.858-2.313-.194-.333-.02-.514.146-.68.15-.15.334-.389.5-.583.167-.194.222-.333.334-.556.11-.222.055-.417-.028-.583-.083-.167-.75-1.807-1.028-2.474-.27-.65-.545-.562-.75-.573-.194-.01-.417-.012-.64-.012-.222 0-.583.083-.888.417-.305.333-1.166 1.14-1.166 2.78 0 1.64 1.194 3.223 1.36 3.446.167.222 2.35 3.587 5.694 5.03.796.343 1.417.548 1.9.702.798.254 1.524.218 2.098.132.64-.096 1.966-.804 2.244-1.58.278-.777.278-1.443.194-1.58-.083-.14-.305-.222-.638-.39Z" />
      </svg>
    </a>
  );
}

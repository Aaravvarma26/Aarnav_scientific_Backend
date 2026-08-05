"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  FolderTree,
  Inbox,
  Newspaper,
  Users,
  Image as ImageIcon,
  Award,
  Quote,
  Handshake,
  Settings,
  ScrollText,
  Home,
} from "lucide-react";
import { cn } from "@/common/utils";
import { siteConfig } from "@/common/site-config";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "EDITOR", "SALES"] },
  { href: "/admin/products", label: "Products", icon: FlaskConical, roles: ["ADMIN", "EDITOR", "SALES"] },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox, roles: ["ADMIN", "EDITOR", "SALES"] },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/certificates", label: "Certificates", icon: Award, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/testimonials", label: "Testimonials", icon: Quote, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/partners", label: "Partners", icon: Handshake, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/users", label: "Users & Roles", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["ADMIN"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
];

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-navy-100 bg-white lg:flex">
      <Link href="/" className="flex items-center gap-2.5 border-b border-navy-100 px-6 py-5">
        <Image src="/images/logo/logo-a-mark.png" alt={siteConfig.name} width={32} height={32} className="h-8 w-auto" />
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-navy-900">{siteConfig.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-teal-600">Admin Panel</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {nav
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-teal-50 text-teal-700" : "text-navy-600 hover:bg-navy-50"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-navy-100 p-4">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy-500 hover:bg-navy-50">
          <Home className="h-4.5 w-4.5" /> View Website
        </Link>
      </div>
    </aside>
  );
}
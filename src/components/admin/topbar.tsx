"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserCircle2, Menu } from "lucide-react";
import { useState } from "react";

export function AdminTopbar({ user }: { user: { name?: string; email: string; role: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy-100 bg-white/90 px-6 backdrop-blur-md">
      <button className="rounded-lg p-2 text-navy-600 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-navy-700">
          <UserCircle2 className="h-5 w-5 text-navy-400" />
          <span className="font-medium">{user.email}</span>
          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-navy-600">
            {user.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-navy-200 px-3.5 py-2 text-xs font-semibold text-navy-600 hover:border-red-300 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </header>
  );
}

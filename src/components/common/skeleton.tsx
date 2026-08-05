import { cn } from "@/common/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-navy-100", className)} />;
}

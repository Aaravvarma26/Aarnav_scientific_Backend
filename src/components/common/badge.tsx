import { cn } from "@/common/utils";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "teal" | "outline" | "navy";
}) {
  const variants = {
    default: "bg-navy-100 text-navy-800",
    teal: "bg-teal-50 text-teal-700",
    outline: "border border-navy-200 text-navy-700",
    navy: "bg-navy-900 text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

import { forwardRef } from "react";
import { cn } from "@/common/utils";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900",
        "transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

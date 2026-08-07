import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function PageContainer({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

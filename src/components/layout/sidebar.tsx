"use client";

import { navIcons } from "@/components/icons";
import { cn } from "@/lib/cn";
import { DEMO_COMPANY_NAME, isNavActive, MAIN_NAV } from "@/lib/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[var(--sidebar-width)] flex-col border-r border-border-default bg-bg-surface",
        className,
      )}
    >
      <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-border-default px-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-subtle text-sm font-semibold text-primary"
          aria-hidden
        >
          PX
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            Quote Generator
          </p>
          <p className="truncate text-xs text-text-muted">Project X</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
        {MAIN_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = navIcons[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors duration-150",
                active
                  ? "bg-primary-subtle font-semibold text-primary"
                  : "font-medium text-text-secondary hover:bg-bg-muted hover:text-text-primary",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="shrink-0 text-base" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-default p-4">
        <p className="text-xs font-medium text-text-muted">Demo company</p>
        <p className="mt-1 truncate text-sm text-text-secondary">
          {DEMO_COMPANY_NAME}
        </p>
      </div>
    </aside>
  );
}

"use client";

import {
  IconBell,
  IconBuilding,
  IconMenu,
  IconSearch,
  IconSettings,
} from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { DEMO_COMPANY_NAME } from "@/lib/navigation";
import Link from "next/link";

type TopBarProps = {
  onMenuClick: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b border-border-default bg-bg-surface px-3 sm:px-4 lg:px-6">
      <IconButton
        label="Open navigation"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <IconMenu />
      </IconButton>

      <div className="hidden min-w-0 items-center gap-2.5 md:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-primary-subtle text-primary">
          <IconBuilding className="text-base" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {DEMO_COMPANY_NAME}
          </p>
          <p className="truncate text-xs text-text-muted">Dallas, TX (Demo)</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-1 sm:px-2">
        <div
          className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-bg-muted/70 px-3 text-text-muted"
          role="search"
          aria-label="Global search (coming soon)"
        >
          <IconSearch className="shrink-0 text-base" />
          <span className="truncate text-sm">
            Search customers &amp; quotes…
          </span>
          <span className="ml-auto hidden rounded border border-border-default bg-bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted sm:inline">
            Soon
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <IconButton label="Notifications (coming soon)" disabled>
          <IconBell />
        </IconButton>
        <Link
          href="/settings"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary"
          aria-label="Company Settings"
          title="Company Settings"
        >
          <IconSettings className="text-[1.15rem]" />
        </Link>
        <div
          className="ml-1 flex items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-bg-surface py-1 pr-2.5 pl-1"
          title="Demo user — authentication not enabled"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-text-inverse">
            NS
          </span>
          <span className="hidden text-sm font-medium text-text-primary sm:inline">
            Demo User
          </span>
        </div>
      </div>
    </header>
  );
}

"use client";

import {
  IconBell,
  IconBuilding,
  IconMenu,
  IconSettings,
} from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCompanySettingsSession } from "@/components/session/company-settings-session-provider";
import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import { hasRegisteredUnsavedChanges } from "@/lib/navigation/unsaved-changes";
import { formatCompanyCityState } from "@/types/company";
import { userInitials } from "@/types/user";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TopBarProps = {
  onMenuClick: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter();
  const { ready, settings } = useCompanySettingsSession();
  const { currentUser, capabilities, signOut } = useDemoAuthSession();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const companyName = ready
    ? settings.companyName
    : "Project X Mechanical Services";
  const location = ready
    ? formatCompanyCityState(settings.city, settings.state)
    : "";
  const logo = ready ? settings.logo : null;

  function performSignOut() {
    setConfirmSignOut(false);
    signOut();
    router.replace("/login");
  }

  function handleSignOut() {
    if (hasRegisteredUnsavedChanges()) {
      setConfirmSignOut(true);
      return;
    }
    performSignOut();
  }

  return (
    <>
      <header className="flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b border-border-default bg-bg-surface px-3 sm:px-4 lg:px-6">
        <IconButton
          label="Open navigation"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <IconMenu />
        </IconButton>

        <div className="hidden min-w-0 items-center gap-2.5 md:flex">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- session data URL logo
            <img
              src={logo.dataUrl}
              alt=""
              className="h-8 w-8 rounded-[var(--radius-md)] object-contain"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-primary-subtle text-primary">
              <IconBuilding className="text-base" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {companyName}
            </p>
            {location ? (
              <p className="truncate text-xs text-text-muted">{location}</p>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1" aria-hidden />

        <div className="flex shrink-0 items-center gap-1">
          <IconButton label="Notifications (coming soon)" disabled>
            <IconBell />
          </IconButton>
          {capabilities.canManageSettings ? (
            <Link
              href="/settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary"
              aria-label="Company Settings"
              title="Company Settings"
            >
              <IconSettings className="text-[1.15rem]" />
            </Link>
          ) : null}
          <div className="ml-1 flex items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-bg-surface py-1 pr-1.5 pl-1">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-text-inverse"
              aria-hidden
            >
              {currentUser ? userInitials(currentUser.fullName) : "?"}
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-text-primary">
                {currentUser?.fullName ?? "User"}
              </p>
              <p className="truncate text-[11px] text-text-muted">
                {currentUser?.role ?? ""}
                <span className="text-text-muted"> · Demo</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-[var(--radius-md)] px-2 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={confirmSignOut}
        title="Discard unsaved changes?"
        description="You have unsaved edits. Signing out will discard them."
        confirmLabel="Discard and sign out"
        tone="danger"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={performSignOut}
      />
    </>
  );
}

"use client";

import { Logo } from "@/components/layout/logo";
import { UserDropdown } from "@/components/layout/user-dropdown";

type DashboardHeaderProps = {
  title?: string;
  subtitle: string;
  userName: string;
  userRole: string;
  onLogout: () => void;
};

export function DashboardHeader({
  title = "CHMP",
  subtitle,
  userName,
  userRole,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
      <div className="flex flex-1 items-center gap-3">
        <Logo />
        <div>
          <h1 className="font-semibold leading-none tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <UserDropdown name={userName} role={userRole} onLogout={onLogout} />
      </div>
    </header>
  );
}

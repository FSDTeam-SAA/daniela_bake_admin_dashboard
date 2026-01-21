"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";

interface DashboardShellProps {
  user: any;
  children: ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          sidebarOpen ? "flex" : "hidden"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative z-10 h-full w-72 max-w-[80vw] bg-white shadow-xl">
          <DashboardSidebar
            user={user}
            onNavigate={() => setSidebarOpen(false)}
            className="h-full"
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar user={user} className="h-screen" />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardHeader
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

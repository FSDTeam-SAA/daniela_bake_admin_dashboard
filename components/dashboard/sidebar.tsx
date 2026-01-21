"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Tags,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Package, label: "Product Lists", href: "/dashboard/products" },
  { icon: ShoppingCart, label: "Order Lists", href: "/dashboard/orders" },
  { icon: ShoppingCart, label: "Paid Orders", href: "/dashboard/paid-orders" },
  { icon: Package, label: "Special Items", href: "/dashboard/special-items" },
  { icon: Users, label: "Customer Lists", href: "/dashboard/customers" },
  { icon: Tags, label: "Category Lists", href: "/dashboard/categories" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
];

interface DashboardSidebarProps {
  user: any;
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSidebar({
  user,
  onNavigate,
  className = "",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleConfirmLogout = async () => {
    // optional: close modal immediately for snappier UI
    setLogoutOpen(false);
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <aside
      className={cn(
        "w-64 bg-white border-r border-gray-200 flex flex-col h-full",
        className
      )}
    >
      <div className="p-6 border-b border-gray-200">
        <Image
          src="/logo.png"
          alt="User Avatar"
          width={160}
          height={80}
          className="w-[160px] h-[80px]"
        />
      </div>

      <nav className="space-y-2 px-4 flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Fix: your original startsWith check was incorrect.
          // This will highlight nested routes properly: /dashboard/orders/123 etc.
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-[#5B9FED] text-white font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              className="w-full justify-start gap-3 bg-red-50 text-red-600 hover:bg-red-100 text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              {/* NO button */}
              <AlertDialogCancel> No </AlertDialogCancel>

              {/* YES button */}
              <AlertDialogAction onClick={handleConfirmLogout}>
                Yes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}

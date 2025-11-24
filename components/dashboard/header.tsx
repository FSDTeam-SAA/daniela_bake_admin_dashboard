"use client";

import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/lib/auth-api";
import { toast } from "sonner";

export function DashboardHeader({ user }: { user: any }) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authAPI.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: () => {
      toast.error("Failed to change password");
    },
  });

  const handleChangePassword = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button onClick={() => setShowPasswordDialog(true)}>
                <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarFallback className="bg-[#5B9FED] text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    currentPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="w-full gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
            >
              {changePasswordMutation.isPending
                ? "Changing..."
                : "Change Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

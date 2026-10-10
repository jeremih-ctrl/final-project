"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell,
  Key,
  ArrowLeft,
  Info,
  CheckCircle2,
  Download,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSharedApplication } from "@/lib/vendor-application-state";

export default function SettingsPage() {
  const { application } = useSharedApplication();

  // Notification toggles
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Password modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Feedback notification
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const vendorEmail =
    application.vendor?.email ||
    application.email ||
    "maria.santos@email.com";
  const vendorPhone =
    application.vendor?.phone ||
    application.contactNumber ||
    "09181234567";
  const appNumber = application.applicationNumber || application.id;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordError("");
    setPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setFeedbackNotice("Password updated successfully.");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackNotice("Notification preferences updated.");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleDownloadMyData = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(application, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute(
      "download",
      `my_vendor_application_${appNumber}.json`
    );
    dlAnchor.click();

    setFeedbackNotice("Application data summary downloaded.");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Account Settings
            </h2>
            <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">
              Vendor Profile & Security
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your credentials, notification channels, and registration data privacy.
          </p>
        </div>

        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5 self-start sm:self-auto"
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Live Feedback Notice */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedbackNotice}</span>
        </div>
      )}

      {/* Under Review Notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm text-blue-950 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-900">Application Status Connection:</span>
          <p className="text-blue-800/90 mt-0.5">
            Your vendor account is linked to reference number{" "}
            <span className="font-mono font-bold">({appNumber})</span>. Official updates from the City Government of Butuan Licensing Division are dispatched to your verified channels below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & Password */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
              <Key className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Security & Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800 block">Registered Email</span>
                  <span className="text-slate-600 text-xs font-mono">{vendorEmail}</span>
                </div>
                <Badge variant="outline" className="text-[11px] text-emerald-700 bg-emerald-50 border-emerald-200 font-bold">
                  Verified
                </Badge>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800 block">Account Password</span>
                  <span className="text-slate-500 text-xs">••••••••••••</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPasswordError("");
                    setPasswordModalOpen(true);
                  }}
                  className="text-xs font-semibold"
                >
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Identity Verification</span>
                  <span className="text-slate-500 text-xs">PhilSys National ID</span>
                </div>
                <Badge className="bg-blue-100 text-blue-900 border-blue-200 text-[11px]">
                  On File
                </Badge>
              </div>
            </CardContent>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              256-Bit SSL Encrypted
            </span>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <form onSubmit={handleSaveNotifications}>
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
              <Bell className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Notification Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs sm:text-sm">
              <label className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 cursor-pointer">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-800">SMS Direct Alerts</span>
                  </div>
                  <span className="text-slate-500 text-xs block mt-0.5 font-mono">
                    Sent to {vendorPhone}
                  </span>
                </div>
                <Checkbox
                  checked={smsEnabled}
                  onCheckedChange={(c) => setSmsEnabled(Boolean(c))}
                />
              </label>

              <label className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 cursor-pointer">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-800">Email Notifications</span>
                  </div>
                  <span className="text-slate-500 text-xs block mt-0.5 font-mono">
                    Sent to {vendorEmail}
                  </span>
                </div>
                <Checkbox
                  checked={emailEnabled}
                  onCheckedChange={(c) => setEmailEnabled(Boolean(c))}
                />
              </label>

              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 block">Status Change Pings</span>
                  <span className="text-slate-500 text-xs block mt-0.5">
                    Receive immediate updates when review status changes
                  </span>
                </div>
                <Checkbox
                  checked={pushEnabled}
                  onCheckedChange={(c) => setPushEnabled(Boolean(c))}
                />
              </label>
            </CardContent>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5">
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Data Privacy & Export */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
          <Download className="w-4 h-4 text-slate-700" />
          <CardTitle className="text-base font-bold text-slate-900">
            Data Portability & Records Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Download Your Submitted Registration Record
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Under Philippine Republic Act 10173 (Data Privacy Act of 2012), you may download a copy of your stored vendor data.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadMyData}
            className="text-xs font-semibold gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download My Record (JSON)</span>
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
              <Key className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Change Account Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Enter your current password and choose a secure new password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 py-2">
            {passwordError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
                {passwordError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Current Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="text-xs h-9 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">New Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="text-xs h-9 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="text-xs h-9 bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? "Hide" : "Show"} passwords</span>
              </button>
            </div>

            <DialogFooter className="mt-4 pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

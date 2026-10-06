"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Bell, Key, ArrowLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Settings
            </h2>
            <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">
              Account Preferences
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your account preferences, security credentials, and system alerts.
          </p>
        </div>

        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "text-xs font-medium text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Under Review Notice */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-amber-950 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900">Account Configuration Limited:</span>
          <p className="text-amber-800/90 mt-0.5">
            Full account administration settings will unlock once your vendor application{" "}
            <span className="font-semibold">(BVR-2026-001248)</span> has completed review and approval.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & Password */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
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
                <span className="text-slate-500 text-xs">juan@email.com</span>
              </div>
              <Badge variant="outline" className="text-[11px] text-emerald-700 bg-emerald-50 border-emerald-200">
                Verified
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Password</span>
                <span className="text-slate-500 text-xs">Last updated on registration</span>
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
            <Bell className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-base font-bold text-slate-900">
              Notification Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">SMS Alerts</span>
                <span className="text-slate-500 text-xs">Sent to 09XXXXXXXXX</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px]">
                Enabled
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Email Notices</span>
                <span className="text-slate-500 text-xs">Sent to juan@email.com</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px]">
                Enabled
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

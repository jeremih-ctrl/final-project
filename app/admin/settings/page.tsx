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
  ArrowLeft,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
  Database,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getApplications,
} from "@/lib/application-store";

export default function AdminSettingsPage() {

  // Settings state
  const [lguName, setLguName] = useState("City Government of Butuan");
  const [departmentName, setDepartmentName] = useState(
    "City Economic Enterprises & Business Licensing Division"
  );
  const [prefix, setPrefix] = useState("BVR-2026-");
  const [slaHours, setSlaHours] = useState("48");

  // Credential policy toggles
  const [reqGovId, setReqGovId] = useState(true);
  const [reqBarangay, setReqBarangay] = useState(true);
  const [reqSanitary, setReqSanitary] = useState(true);
  const [reqDti, setReqDti] = useState(false);

  // Notifications
  const [notifyNewApp, setNotifyNewApp] = useState(true);
  const [notifyCorrection, setNotifyCorrection] = useState(true);
  const [notifySlaWarning, setNotifySlaWarning] = useState(true);

  // Dialogs & Feedback
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackNotice("System settings updated successfully.");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleExportBackup = () => {
    const apps = getApplications();
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(apps, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute(
      "download",
      `butuan_vendor_system_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    dlAnchor.click();

    setFeedbackNotice("System backup exported as JSON.");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Admin Portal Settings
            </h2>
            <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">
              System Configuration
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage municipal licensing parameters, review requirements, and system maintenance.
          </p>
        </div>

        <Link
          href="/admin"
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

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Municipal Jurisdictional Configuration */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-base font-bold text-slate-900">
              Municipal Jurisdiction & Department Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">LGU Authority Name</label>
                <Input
                  value={lguName}
                  onChange={(e) => setLguName(e.target.value)}
                  className="text-xs sm:text-sm h-10 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Licensing Department Division</label>
                <Input
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="text-xs sm:text-sm h-10 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Application Number Prefix</label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="text-xs sm:text-sm h-10 bg-slate-50 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Format for newly registered vendors (e.g. BVR-2026-001249)
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Processing SLA Target (Hours)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={slaHours}
                    onChange={(e) => setSlaHours(e.target.value)}
                    className="text-xs sm:text-sm h-10 bg-slate-50 font-mono w-28"
                  />
                  <span className="text-xs text-slate-600">Hours from submission</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Credential Verification Checklist Policy */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-700" />
            <CardTitle className="text-base font-bold text-slate-900">
              Required Credential Checklist Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-3">
            <p className="text-xs text-slate-600">
              Select which documents are required for vendors registering in Butuan City:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
                <Checkbox
                  checked={reqGovId}
                  onCheckedChange={(c) => setReqGovId(Boolean(c))}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    Philippine National ID / Government ID
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Mandatory PhilSys, Driver&apos;s License, or Voter&apos;s ID to verify applicant identity.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
                <Checkbox
                  checked={reqBarangay}
                  onCheckedChange={(c) => setReqBarangay(Boolean(c))}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    Barangay Business Clearance
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Locational clearance from the vendor&apos;s designated operating barangay.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
                <Checkbox
                  checked={reqSanitary}
                  onCheckedChange={(c) => setReqSanitary(Boolean(c))}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    Sanitary & Health Permit
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Required for food preparation, snacks, fresh meat, and produce vendors.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
                <Checkbox
                  checked={reqDti}
                  onCheckedChange={(c) => setReqDti(Boolean(c))}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    DTI Business Name Registration
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Optional accreditation for micro enterprises and ambulant vendors.
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Notification Alerts Configuration */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Administrative Notification Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <Checkbox
                  checked={notifyNewApp}
                  onCheckedChange={(c) => setNotifyNewApp(Boolean(c))}
                />
                <span className="font-medium">
                  Trigger high-priority bell alert when a new vendor application is submitted
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <Checkbox
                  checked={notifyCorrection}
                  onCheckedChange={(c) => setNotifyCorrection(Boolean(c))}
                />
                <span className="font-medium">
                  Notify admin evaluators immediately when a vendor resubmits requested corrections
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <Checkbox
                  checked={notifySlaWarning}
                  onCheckedChange={(c) => setNotifySlaWarning(Boolean(c))}
                />
                <span className="font-medium">
                  Highlight applications nearing the 48-hour processing turnaround SLA
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-10 px-5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </form>

      {/* Section 4: System Data Maintenance & Emergency Tools */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
          <Database className="w-4 h-4 text-slate-700" />
          <CardTitle className="text-base font-bold text-slate-900">
            Data Maintenance & Backup Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Administrative utility for data backup and record archiving:
          </p>

          <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2 max-w-md">
            <span className="text-xs font-bold text-slate-900 block">Export Full JSON Backup</span>
            <p className="text-[11px] text-slate-500">
              Download a complete JSON snapshot of all active vendor applications and history.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportBackup}
              className="text-xs font-semibold gap-1.5 mt-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup (JSON)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

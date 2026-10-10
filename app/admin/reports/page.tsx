"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  BarChart3,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  MapPin,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoredApplications } from "@/lib/application-store";

export default function AdminReportsPage() {
  const storedApplications = useStoredApplications();
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Dynamic calculations based solely on stored applications
  const stats = useMemo(() => {
    let approved = 0;
    let underReview = 0;
    let needsCorrection = 0;
    let submitted = 0;
    let rejected = 0;

    storedApplications.forEach((app) => {
      const s = app.status.toLowerCase();
      if (s === "approved") approved += 1;
      else if (s === "under_review" || s === "correction_submitted") underReview += 1;
      else if (s === "needs_correction") needsCorrection += 1;
      else if (s === "rejected") rejected += 1;
      else if (s === "submitted") submitted += 1;
      else underReview += 1;
    });

    const total = approved + underReview + needsCorrection + submitted + rejected;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";

    return {
      total,
      approved,
      underReview,
      needsCorrection,
      submitted,
      rejected,
      approvalRate,
    };
  }, [storedApplications]);

  // Dynamic Barangays Distribution
  const barangayDistribution = useMemo(() => {
    if (storedApplications.length === 0) return [];
    const counts: Record<string, number> = {};
    storedApplications.forEach((app) => {
      const b = app.address.barangay || "Unspecified";
      counts[b] = (counts[b] || 0) + 1;
    });

    const total = storedApplications.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
        status: count > 3 ? "High Concentration" : "Registered Zone",
      }));
  }, [storedApplications]);

  // Dynamic Business Category Distribution
  const categoryDistribution = useMemo(() => {
    if (storedApplications.length === 0) return [];
    const counts: Record<string, number> = {};
    storedApplications.forEach((app) => {
      const cat = app.business.category || "General Vending";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const total = storedApplications.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        percent: `${((count / total) * 100).toFixed(1)}%`,
      }));
  }, [storedApplications]);

  // CSV Generator Helper
  const triggerCSVDownload = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice(`Export completed: "${filename}" downloaded.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const handleExportSummaryCSV = () => {
    const headers = ["Metric", "Count", "Percentage"];
    const rows = [
      ["Total Applications", stats.total, "100.0%"],
      ["Approved Vendors", stats.approved, `${((stats.approved / stats.total) * 100).toFixed(1)}%`],
      ["Under Review", stats.underReview, `${((stats.underReview / stats.total) * 100).toFixed(1)}%`],
      ["Needs Correction", stats.needsCorrection, `${((stats.needsCorrection / stats.total) * 100).toFixed(1)}%`],
      ["Submitted Pending", stats.submitted, `${((stats.submitted / stats.total) * 100).toFixed(1)}%`],
      ["Rejected / Non-Compliant", stats.rejected, `${((stats.rejected / stats.total) * 100).toFixed(1)}%`],
    ];
    triggerCSVDownload(
      `butuan_vendor_applications_summary_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  const handleExportBarangayCSV = () => {
    const headers = ["Barangay", "Registered Vendors", "Percentage of Total", "Zone Classification"];
    const rows = barangayDistribution.map((b) => [
      `"${b.name}"`,
      b.count,
      `${b.percentage}%`,
      `"${b.status}"`,
    ]);
    triggerCSVDownload(
      `butuan_barangay_vendor_density_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Reports & Municipal Analytics
            </h2>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-semibold">
              Official City Data
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Official vendor registration statistics, barangay distributions, and compliance analytics for Butuan City.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.print();
              }
            }}
            className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>

          <Link
            href="/admin"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
            )}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Download Notification Banner */}
      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{downloadNotice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Applications Processed
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.total}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Cumulative citywide volume</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approval Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">{stats.approvalRate}%</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{stats.approved} approved accreditations</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Average Turnaround
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-2">
            {stats.total > 0 ? "Under 48h" : "—"}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Municipal target standing</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Barangay Coverage
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-700 mt-2">
            {barangayDistribution.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Active registered reach</p>
        </Card>
      </div>

      {/* Visual Analytics Grid: Status Distribution & Export Downloads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution (2 Columns) */}
        <Card className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Application Lifecycle Breakdown
              </CardTitle>
              <p className="text-xs text-slate-500">
                Detailed distribution of all {stats.total} municipal applications by status
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportSummaryCSV}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Multi-Segment Horizontal Bar */}
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                title={`Approved: ${stats.approved}`}
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${stats.total > 0 ? (stats.underReview / stats.total) * 100 : 0}%` }}
                title={`Under Review: ${stats.underReview}`}
              />
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${stats.total > 0 ? (stats.needsCorrection / stats.total) * 100 : 0}%` }}
                title={`Needs Correction: ${stats.needsCorrection}`}
              />
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0}%` }}
                title={`Submitted: ${stats.submitted}`}
              />
              <div
                className="bg-slate-400 h-full"
                style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                title={`Rejected: ${stats.rejected}`}
              />
            </div>

            {/* Status Breakdown Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="text-xs font-bold text-slate-700 py-2.5">Status Tier</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-2.5 text-right">Volume</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-2.5 text-right">Ratio</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-2.5">Classification Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="py-2.5 font-semibold text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Approved (Accredited)</span>
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs font-bold text-emerald-800">
                      {stats.approved}
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs text-slate-600">
                      {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">Issued Official Vendor ID</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="py-2.5 font-semibold text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Under Administrative Review</span>
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs font-bold text-amber-800">
                      {stats.underReview}
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs text-slate-600">
                      {stats.total > 0 ? ((stats.underReview / stats.total) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">Assigned Evaluator Active</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="py-2.5 font-semibold text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Needs Correction</span>
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs font-bold text-rose-800">
                      {stats.needsCorrection}
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs text-slate-600">
                      {stats.total > 0 ? ((stats.needsCorrection / stats.total) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">Pending Vendor Correction</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="py-2.5 font-semibold text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Submitted (New Intake)</span>
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs font-bold text-blue-800">
                      {stats.submitted}
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs text-slate-600">
                      {stats.total > 0 ? ((stats.submitted / stats.total) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">In Intake Queue</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="py-2.5 font-semibold text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>Rejected</span>
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs font-bold text-slate-800">
                      {stats.rejected}
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-xs text-slate-600">
                      {stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">Zoning Non-Compliance</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Report Download Suite (1 Column) */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Municipal Export Suite
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500">
              Generate official datasets for City Council and Economic Planning Division
            </p>
          </CardHeader>

          <CardContent className="p-5 space-y-3 flex-1">
            <button
              type="button"
              onClick={handleExportSummaryCSV}
              className="w-full text-left p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-900">
                  Application Audit Summary
                </span>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                CSV of status counts, approval ratios, and intake volume.
              </p>
            </button>

            <button
              type="button"
              onClick={handleExportBarangayCSV}
              className="w-full text-left p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-900">
                  Barangay Density Census
                </span>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                CSV breakdown of vendor concentrations across all 86 barangays.
              </p>
            </button>

            <Link
              href="/admin/vendors"
              className="block w-full text-left p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-900">
                  Certified Vendors Masterfile
                </span>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Comprehensive vendor directory with Vendor IDs and stall addresses.
              </p>
            </Link>
          </CardContent>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Encoding: UTF-8 (CSV)</span>
            <span>Refreshed Live</span>
          </div>
        </Card>
      </div>

      {/* Barangay Density & Business Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Barangay Vendor Concentrations */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Barangay Vendor Density
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-50">
              {barangayDistribution.length} {barangayDistribution.length === 1 ? "Barangay" : "Barangays"}
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {barangayDistribution.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No vendor records available for barangay distribution.
              </div>
            ) : (
              barangayDistribution.slice(0, 6).map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="font-mono text-slate-600">
                      {item.count} vendors ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.percentage * 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Business Category Breakdown */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Business Categories Distribution
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-50">
              {categoryDistribution.length} {categoryDistribution.length === 1 ? "Category" : "Categories"}
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            {categoryDistribution.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No vendor records available for business category distribution.
              </div>
            ) : (
              categoryDistribution.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{cat.category}</span>
                    <span className="text-[11px] text-slate-500">Declared vending activity</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-900 block">{cat.count}</span>
                    <span className="text-[11px] text-emerald-700 font-semibold">{cat.percent}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

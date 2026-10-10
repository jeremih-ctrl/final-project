"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Store,
  ArrowLeft,
  Users,
  Search,
  CheckCircle2,
  MapPin,
  Phone,
  ExternalLink,
  Download,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  Printer,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoredApplications } from "@/lib/application-store";

interface CertifiedVendorRecord {
  id: string; // Vendor ID e.g. BUT-V-001248
  applicationNumber: string;
  businessName: string;
  ownerName: string;
  category: string;
  barangay: string;
  street: string;
  contactNumber: string;
  emailAddress: string;
  certifiedDate: string;
  expiryDate: string;
  status: "Certified Active" | "Pending Renewal";
}

export default function AdminVendorsPage() {
  const storedApplications = useStoredApplications();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Certificate Modal State
  const [selectedVendor, setSelectedVendor] = useState<CertifiedVendorRecord | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Derive certified vendors purely from approved stored applications
  const combinedVendors: CertifiedVendorRecord[] = useMemo(() => {
    const list: CertifiedVendorRecord[] = [];
    const seenVendorIds = new Set<string>();

    storedApplications.forEach((app) => {
      if (app.status === "approved" || app.verificationStatus === "Verified") {
        const vendorId = app.vendorId || "Pending Assignment";
        const key = app.applicationNumber || app.id;
        if (!seenVendorIds.has(key)) {
          seenVendorIds.add(key);
          list.push({
            id: vendorId,
            applicationNumber: app.applicationNumber || app.id,
            businessName: app.business.businessName || "Registered Business",
            ownerName: app.owner.ownerName || "Registered Vendor",
            category: app.business.category || "General Vending",
            barangay: app.address.barangay || "Butuan City",
            street: `${app.address.houseNo || ""} ${app.address.street || ""}`.trim() || "Butuan City",
            contactNumber: app.contact.contactNumber || "N/A",
            emailAddress: app.contact.emailAddress || "N/A",
            certifiedDate: "Accredited",
            expiryDate: "Dec 31, 2026",
            status: "Certified Active",
          });
        }
      }
    });

    return list;
  }, [storedApplications]);

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return combinedVendors.filter((vendor) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        vendor.id.toLowerCase().includes(q) ||
        vendor.businessName.toLowerCase().includes(q) ||
        vendor.ownerName.toLowerCase().includes(q) ||
        vendor.barangay.toLowerCase().includes(q) ||
        vendor.contactNumber.includes(q);

      const matchesBarangay =
        selectedBarangay === "All" ||
        vendor.barangay.toLowerCase() === selectedBarangay.toLowerCase();

      const matchesCategory =
        selectedCategory === "All" ||
        vendor.category.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesBarangay && matchesCategory;
    });
  }, [combinedVendors, searchQuery, selectedBarangay, selectedCategory]);

  const handleCopy = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenCertificate = (vendor: CertifiedVendorRecord) => {
    setSelectedVendor(vendor);
    setIsCertificateOpen(true);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      "Vendor ID",
      "Application Number",
      "Business Name",
      "Proprietor Name",
      "Category",
      "Barangay",
      "Operating Address",
      "Contact Number",
      "Email Address",
      "Certification Date",
      "Validity Expiry",
      "Status",
    ];

    const rows = filteredVendors.map((v) => [
      v.id,
      v.applicationNumber,
      `"${v.businessName.replace(/"/g, '""')}"`,
      `"${v.ownerName.replace(/"/g, '""')}"`,
      `"${v.category.replace(/"/g, '""')}"`,
      `"${v.barangay.replace(/"/g, '""')}"`,
      `"${v.street.replace(/"/g, '""')}"`,
      v.contactNumber,
      v.emailAddress,
      v.certifiedDate,
      v.expiryDate,
      v.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `butuan_city_certified_vendors_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Certified Vendors Registry
            </h2>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold">
              {combinedVendors.length} {combinedVendors.length === 1 ? "Active Accreditation" : "Active Accreditations"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Official municipal census and directory of verified and licensed vendors in Butuan City.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registry (CSV)</span>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Active Vendors
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{combinedVendors.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Licensed & accredited</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Covered Barangays
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2">
            {new Set(combinedVendors.map((v) => v.barangay).filter(Boolean)).size}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Butuan City barangays</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Compliance Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-700 mt-2">
            {combinedVendors.length > 0 ? "100%" : "—"}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Active permit standing</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Accredited Records
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-2">{combinedVendors.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Accredited vendor stalls</p>
        </Card>
      </div>

      {/* Search and Filters Toolbar */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by Vendor ID, Business Name, Proprietor, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:bg-white"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            {/* Barangay Filter */}
            <Select value={selectedBarangay} onValueChange={(val) => setSelectedBarangay(val || "All")}>
              <SelectTrigger className="w-[170px] h-10 text-xs rounded-xl bg-slate-50 border-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <SelectValue placeholder="All Barangays" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="All">All Barangays</SelectItem>
                <SelectItem value="Urduja">Urduja</SelectItem>
                <SelectItem value="Baan KM 3">Baan KM 3</SelectItem>
                <SelectItem value="Ampayon">Ampayon</SelectItem>
                <SelectItem value="Libertad">Libertad</SelectItem>
                <SelectItem value="San Vicente">San Vicente</SelectItem>
                <SelectItem value="Villa Kananga">Villa Kananga</SelectItem>
                <SelectItem value="Doongan">Doongan</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || "All")}>
              <SelectTrigger className="w-[170px] h-10 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Produce">Produce & Snacks</SelectItem>
                <SelectItem value="Dry Goods">Dry Goods</SelectItem>
                <SelectItem value="Food">Food & Beverage</SelectItem>
                <SelectItem value="Fish">Fish & Seafood</SelectItem>
                <SelectItem value="Bakery">Bakery & Pastries</SelectItem>
                <SelectItem value="Services">Services & Crafts</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors",
                  viewMode === "table" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                )}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors",
                  viewMode === "cards" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                )}
                title="Cards view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Vendor Table View */}
      {viewMode === "table" ? (
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Vendor Registry Directory
              </CardTitle>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredVendors.length} of {combinedVendors.length} vendors
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Vendor ID</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Trade / Business Name</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Proprietor Name</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Location</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Category</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Accreditation</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-44 text-center">
                        <div className="flex flex-col items-center justify-center p-6 space-y-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-700">
                            {combinedVendors.length === 0
                              ? "No certified vendors registered yet."
                              : "No vendors match your search filters."}
                          </p>
                          <p className="text-xs text-slate-500">
                            {combinedVendors.length === 0
                              ? "Approved applications will appear here once accreditation is granted."
                              : "Try adjusting your search criteria."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {vendor.id}
                            </span>
                            {vendor.id !== "Pending Assignment" && (
                              <button
                                type="button"
                                onClick={() => handleCopy(vendor.id)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Copy Vendor ID"
                              >
                                {copiedId === vendor.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </TableCell>

                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-slate-900 block">
                            {vendor.businessName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Ref: {vendor.applicationNumber}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-700 font-medium py-3.5">
                        {vendor.ownerName}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{vendor.barangay}, Butuan City</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <Badge variant="outline" className="text-[11px] font-semibold bg-slate-50 text-slate-700">
                          {vendor.category}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold gap-1 py-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Certified Active</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCertificate(vendor)}
                            className="h-8 text-xs font-semibold text-blue-700 hover:text-blue-800 border-blue-200 hover:bg-blue-50 gap-1"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </Button>

                          <Link
                            href={`/admin/applications/${vendor.applicationNumber}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                              "h-8 text-xs text-slate-600 hover:text-slate-900 gap-1"
                            )}
                          >
                            <span>Record</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Vendor Cards Grid View */
        filteredVendors.length === 0 ? (
          <Card className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Users className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                {combinedVendors.length === 0
                  ? "No certified vendors registered yet."
                  : "No vendors match your search filters."}
              </p>
              <p className="text-xs text-slate-500">
                {combinedVendors.length === 0
                  ? "Approved applications will appear here once accreditation is granted."
                  : "Try adjusting your search criteria."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="bg-white border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow rounded-2xl overflow-hidden flex flex-col justify-between">
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {vendor.id}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold py-0 h-5">
                        Active
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-slate-600">
                      {vendor.category}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {vendor.businessName}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                      <span>Proprietor:</span>
                      <strong className="text-slate-900">{vendor.ownerName}</strong>
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs text-slate-600 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{vendor.street}, {vendor.barangay}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{vendor.contactNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Valid until {vendor.expiryDate}
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenCertificate(vendor)}
                    className="h-8 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Card</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Official Vendor Certificate Modal */}
      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
        <DialogContent className="max-w-xl p-0 rounded-2xl overflow-hidden">
          {selectedVendor && (
            <div>
              {/* Civic Blue Top Border */}
              <div className="h-2 bg-gradient-to-r from-blue-700 via-sky-600 to-emerald-600" />

              <DialogHeader className="p-6 pb-2 text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mx-auto mb-1 border-2 border-blue-300">
                  <ShieldCheck className="w-7 h-7 text-blue-700" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-blue-900">
                  Republic of the Philippines • City Government of Butuan
                </div>
                <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                  Certificate of Vendor Accreditation
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600">
                  Economic Enterprises & Business Licensing Division
                </DialogDescription>
              </DialogHeader>

              {/* Certificate Inner Card */}
              <div className="p-6 space-y-4">
                <div className="border-2 border-slate-300 rounded-xl p-5 bg-gradient-to-br from-amber-50/30 via-white to-blue-50/30 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Assigned Vendor ID
                      </span>
                      <span className="font-mono text-base font-extrabold text-blue-900">
                        {selectedVendor.id}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Accreditation Status
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold py-0.5">
                        Active & Certified
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Business Name</span>
                      <span className="font-extrabold text-slate-900 text-sm">{selectedVendor.businessName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Registered Proprietor</span>
                      <span className="font-bold text-slate-800">{selectedVendor.ownerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Designated Barangay</span>
                      <span className="font-medium text-slate-800">{selectedVendor.barangay}, Butuan City</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Stall / Street Address</span>
                      <span className="font-medium text-slate-800">{selectedVendor.street}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500">
                        <strong>Certification Date:</strong> {selectedVendor.certifiedDate}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        <strong>Expiration Date:</strong> {selectedVendor.expiryDate}
                      </div>
                    </div>

                    {/* Simulated Verification QR Code */}
                    <div className="w-16 h-16 border border-slate-300 rounded-lg p-1 bg-white flex flex-col items-center justify-center text-center shadow-xs">
                      <QrCode className="w-10 h-10 text-slate-800" />
                      <span className="text-[7px] font-mono text-slate-500 font-bold uppercase">LGU-VERIFIED</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-row items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCertificateOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(selectedVendor.id)}
                    className="text-xs font-semibold gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy ID</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.print();
                      }
                    }}
                    className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Card</span>
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

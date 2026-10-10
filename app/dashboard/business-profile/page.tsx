"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Lock,
  Edit3,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSharedApplication } from "@/lib/vendor-application-state";
import { updateApplication } from "@/lib/application-store";

export default function BusinessProfilePage() {
  const { application } = useSharedApplication();

  // 1. Business Info State
  const [businessInfo, setBusinessInfo] = useState({
    businessName:
      application.business?.businessName ||
      application.vendor?.businessName ||
      application.businessName ||
      "",
    ownerName:
      application.vendor?.name ||
      application.ownerName ||
      "",
    businessDescription:
      application.business?.description ||
      "",
  });
  const [tempBusinessInfo, setTempBusinessInfo] = useState(businessInfo);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);

  // 2. Contact Info State
  const [contactInfo, setContactInfo] = useState({
    contactNumber:
      application.vendor?.phone ||
      application.contactNumber ||
      "",
    email:
      application.vendor?.email ||
      application.email ||
      "",
  });
  const [tempContactInfo, setTempContactInfo] = useState(contactInfo);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  // 3. Address Info State
  const [addressInfo, setAddressInfo] = useState({
    houseNo:
      application.business?.houseNumber ||
      application.houseNumber ||
      "",
    street:
      application.business?.street ||
      application.street ||
      "",
    barangay:
      application.business?.barangay ||
      application.barangay ||
      "",
  });
  const [tempAddressInfo, setTempAddressInfo] = useState(addressInfo);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);

  // Notification feedback banner for local edits
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessInfo(tempBusinessInfo);
    setBusinessDialogOpen(false);
    updateApplication(application.applicationNumber || application.id, {
      business: {
        businessName: tempBusinessInfo.businessName,
        businessDescription: tempBusinessInfo.businessDescription,
      },
      owner: {
        ownerName: tempBusinessInfo.ownerName,
      },
    });
    setSavedFeedback("Business information updated successfully.");
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactInfo(tempContactInfo);
    setContactDialogOpen(false);
    updateApplication(application.applicationNumber || application.id, {
      contact: {
        contactNumber: tempContactInfo.contactNumber,
        emailAddress: tempContactInfo.email,
      },
    });
    setSavedFeedback("Contact information updated successfully.");
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressInfo(tempAddressInfo);
    setAddressDialogOpen(false);
    updateApplication(application.applicationNumber || application.id, {
      address: {
        houseNo: tempAddressInfo.houseNo,
        street: tempAddressInfo.street,
        barangay: tempAddressInfo.barangay,
      },
    });
    setSavedFeedback("Operating address updated successfully.");
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  // Fixed Jurisdiction constants (Cannot be changed by vendor)
  const JURISDICTION = {
    city: "Butuan City",
    province: "Agusan del Norte",
    region: "Caraga",
    country: "Philippines",
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Business Profile
            </h2>
            {application.status === "approved" ? (
              <Badge className="bg-emerald-100 text-emerald-950 border-emerald-300 text-xs font-bold">
                ● Approved (Certified)
              </Badge>
            ) : application.status === "needs-correction" ? (
              <Badge className="bg-orange-100 text-orange-950 border-orange-300 text-xs font-bold">
                ● Needs Correction
              </Badge>
            ) : application.status === "rejected" ? (
              <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-xs font-semibold">
                ● Not Approved
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold">
                ● Under Review
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            View and manage your registered business information.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/application-status"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs font-medium text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
            )}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Track Application Status
          </Link>
        </div>
      </div>

      {/* Temporary Success Feedback */}
      {savedFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{savedFeedback}</span>
        </div>
      )}

      {/* Top Banner: Application Identifiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Application Number
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-slate-900">
            {application.applicationNumber || application.id || "Pending Submission"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Vendor ID
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              {application.vendorId || (application.status === "approved" ? "Assigned upon release" : "Not assigned yet")}
            </span>
            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50">
              {application.vendorId ? "Assigned" : "Pending Approval"}
            </Badge>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Jurisdiction
          </span>
          <span className="text-xs sm:text-sm font-bold text-blue-900">
            City of Butuan, Caraga
          </span>
        </div>
      </div>

      {!businessInfo.businessName && !businessInfo.ownerName && !contactInfo.contactNumber && !addressInfo.street && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Complete your business profile to view your registered business information.
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              You haven&apos;t set up your vendor registration profile yet. Enter your business, contact, and vending address details below.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Card: Business Information */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Business Information
              </CardTitle>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTempBusinessInfo(businessInfo)}
                    className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Profile</span>
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Business Profile</DialogTitle>
                  <DialogDescription>
                    Update your registered trade name, owner details, and description.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveBusiness} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="biz-name"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Business Name <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="biz-name"
                      value={tempBusinessInfo.businessName}
                      onChange={(e) =>
                        setTempBusinessInfo({
                          ...tempBusinessInfo,
                          businessName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="biz-owner"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Owner Name <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="biz-owner"
                      value={tempBusinessInfo.ownerName}
                      onChange={(e) =>
                        setTempBusinessInfo({
                          ...tempBusinessInfo,
                          ownerName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="biz-desc"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Business Description
                    </label>
                    <Textarea
                      id="biz-desc"
                      rows={3}
                      value={tempBusinessInfo.businessDescription}
                      onChange={(e) =>
                        setTempBusinessInfo({
                          ...tempBusinessInfo,
                          businessDescription: e.target.value,
                        })
                      }
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <DialogClose render={<Button variant="outline" type="button" />}>
                      Cancel
                    </DialogClose>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 block">
                Business Name
              </span>
              <span className="text-base font-bold text-slate-900 block">
                {businessInfo.businessName || "Not yet provided"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 block">
                Owner Name
              </span>
              <span className="text-sm font-semibold text-slate-800 block">
                {businessInfo.ownerName || "Not yet provided"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 block">
                Business Description
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                {businessInfo.businessDescription ? `“${businessInfo.businessDescription}”` : "No description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Card: Contact Information */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Contact Information
              </CardTitle>
            </div>

            {/* Edit Contact Dialog */}
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTempContactInfo(contactInfo)}
                    className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Contact Information</span>
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Contact Information</DialogTitle>
                  <DialogDescription>
                    Provide valid contact information for official verification and municipal notifications.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveContact} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-phone"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Contact Number <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="contact-phone"
                      value={tempContactInfo.contactNumber}
                      onChange={(e) =>
                        setTempContactInfo({
                          ...tempContactInfo,
                          contactNumber: e.target.value,
                        })
                      }
                      required
                    />
                    <p className="text-[11px] text-slate-500">
                      Format: 11-digit Philippine mobile number (e.g. 09171234567)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-email"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={tempContactInfo.email}
                      onChange={(e) =>
                        setTempContactInfo({
                          ...tempContactInfo,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <DialogClose render={<Button variant="outline" type="button" />}>
                      Cancel
                    </DialogClose>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-500 block">
                  Contact Number
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 block font-mono">
                  {contactInfo.contactNumber || "Not yet provided"}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Verified for SMS notifications
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-500 block">
                  Email Address
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 block">
                  {contactInfo.email || "Not yet provided"}
                </span>
                <span className="text-[11px] text-slate-500">
                  Primary channel for official notices and receipts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Card: Business Address (with Read-only Jurisdiction) */}
        <Card className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Business Address
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-xs font-semibold gap-1">
                <Lock className="w-3 h-3" />
                Local Jurisdiction Locked
              </Badge>

              {/* Edit Address Dialog */}
              <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTempAddressInfo(addressInfo)}
                      className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Address</span>
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Operating Address</DialogTitle>
                    <DialogDescription>
                      You can update your stall or building location. City and Province jurisdiction are fixed to Butuan City.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSaveAddress} className="space-y-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="addr-house"
                          className="text-xs font-semibold text-slate-700"
                        >
                          House/Building No.
                        </label>
                        <Input
                          id="addr-house"
                          value={tempAddressInfo.houseNo}
                          onChange={(e) =>
                            setTempAddressInfo({
                              ...tempAddressInfo,
                              houseNo: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="addr-street"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Street
                        </label>
                        <Input
                          id="addr-street"
                          value={tempAddressInfo.street}
                          onChange={(e) =>
                            setTempAddressInfo({
                              ...tempAddressInfo,
                              street: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label
                          htmlFor="addr-brgy"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Barangay
                        </label>
                        <Input
                          id="addr-brgy"
                          value={tempAddressInfo.barangay}
                          onChange={(e) =>
                            setTempAddressInfo({
                              ...tempAddressInfo,
                              barangay: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* Fixed Jurisdiction Fields Notice */}
                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/90 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Fixed System Jurisdiction (Read-Only)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block">City:</span>
                          <span className="font-semibold text-slate-800">{JURISDICTION.city}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Province:</span>
                          <span className="font-semibold text-slate-800">{JURISDICTION.province}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Region:</span>
                          <span className="font-semibold text-slate-800">{JURISDICTION.region}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Country:</span>
                          <span className="font-semibold text-slate-800">{JURISDICTION.country}</span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="pt-2">
                      <DialogClose render={<Button variant="outline" type="button" />}>
                        Cancel
                      </DialogClose>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Editable Fields Section */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Local Stall / Establishment Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium block">House/Building No.:</span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {addressInfo.houseNo || "—"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium block">Street:</span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {addressInfo.street || "Not yet provided"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium block">Barangay:</span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {addressInfo.barangay || "Not yet provided"}
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only Jurisdiction Fields */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Fixed Location Jurisdiction (Read-Only)
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Configured by System Policy
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium block">City:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <span>{JURISDICTION.city}</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium block">Province:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <span>{JURISDICTION.province}</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium block">Region:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <span>{JURISDICTION.region}</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium block">Country:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <span>{JURISDICTION.country}</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Informational Note about Fixed Jurisdiction */}
              <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  The vendor registration portal is restricted to local businesses operating within the jurisdiction of the City Government of Butuan, Agusan del Norte. Fixed jurisdiction fields cannot be altered.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

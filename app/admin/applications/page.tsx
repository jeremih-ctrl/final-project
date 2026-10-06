"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FileCheck2, ArrowLeft, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Vendor Applications
            </h2>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold">
              84 Pending
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review, evaluate, and certify pending local vendor registrations.
          </p>
        </div>

        <Link
          href="/admin"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "text-xs font-medium text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-blue-700" />
          <CardTitle className="text-base font-bold text-slate-900">
            Application Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Full Application Processing Module
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            This module will include detailed application filtering, document verification checklists, and administrative approval workflows.
          </p>
          <div className="pt-2">
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              )}
            >
              Return to Admin Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

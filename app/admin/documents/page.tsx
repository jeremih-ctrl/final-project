"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Files, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Document Verification
            </h2>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
              Compliance Review
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review uploaded government IDs, barangay clearances, and business credentials.
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
          <Files className="w-4 h-4 text-blue-700" />
          <CardTitle className="text-base font-bold text-slate-900">
            Document Repository & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Document Verification Desk
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Review uploaded vendor documentation, inspect scan legibility, and flag files needing replacement.
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

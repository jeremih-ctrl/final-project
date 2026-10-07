import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Vendor Portal Login | City Government of Butuan",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50/60 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xs font-bold text-blue-700 tracking-wider uppercase">
            Vendor Portal
          </h2>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-600">
            Sign in to your Vendor Portal account.
          </p>
        </div>

        <Card className="shadow-md border-slate-200 bg-white">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
              Vendor authentication will be configured in the next step.
            </div>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-center font-medium"
              )}
            >
              Return to Homepage
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

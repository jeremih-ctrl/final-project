import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Admin Portal Login | City Government of Butuan",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin Portal
          </h1>
          <p className="text-sm text-slate-400">
            Authorized City Government personnel only.
          </p>
        </div>

        <Card className="shadow-xl border-slate-800 bg-slate-950/80 text-slate-100">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              Administrative authentication will be configured in the next step.
            </div>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-center bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white font-medium"
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

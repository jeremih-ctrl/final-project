import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function CtaSection() {
  return (
    <section id="register" className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 shadow-xl">
          {/* Subtle Glow & Background Accent */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs sm:text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-300" />
              <span>Official City Government of Butuan Portal</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Start Your Vendor Registration Today
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              Register your local business operating in Butuan City. Experience a simple, transparent, and paperless application process.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-6 text-base shadow-lg shadow-blue-900/30 gap-2"
                )}
              >
                Register as a Vendor
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>

              <Link
                href="#how-it-works"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto bg-transparent border-slate-700 hover:bg-white/10 text-slate-200 hover:text-white font-medium px-8 py-6 text-base"
                )}
              >
                Learn How It Works
              </Link>
            </div>

            <p className="text-xs text-slate-400 pt-2">
              Registration is free and dedicated to local vendors within Butuan City, Agusan del Norte.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

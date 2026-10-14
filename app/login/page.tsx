"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, SignOutButton } from "@clerk/nextjs";
import { useAppRole } from "@/lib/clerk-roles";
import {
  Shield,
  ArrowLeft,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Search,
  FileCheck2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");
  const authRedirectTarget = redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")
    ? `/auth-redirect?redirect_url=${encodeURIComponent(redirectUrl)}`
    : "/auth-redirect";
  const { isLoaded, isSignedIn, isAdmin, isVendor, isUnauthorized, email } = useAppRole();

  // If already signed in via Clerk, automatically redirect to the permitted portal
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (isAdmin) {
        router.replace("/admin");
      } else {
        router.replace(authRedirectTarget);
      }
    }
  }, [isLoaded, isSignedIn, isAdmin, router, authRedirectTarget]);

  return (
    <main className="min-h-screen bg-slate-50/60 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding - Unified Portal Access for Vendors & LGU Administrators */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors mb-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold uppercase tracking-wider">
            <span>City Government of Butuan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In / Sign Up
          </h1>
          <p className="text-sm text-slate-600">
            One unified entry point for registered vendors and authorized LGU personnel.
          </p>
        </div>

        {/* STATE A: User signed in as Administrator (shown briefly or if redirecting) */}
        {isLoaded && isSignedIn && isAdmin && (
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs space-y-3 shadow-md">
            <div className="flex items-center gap-2 font-bold text-blue-800 text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
              <span>Signed In As Administrator</span>
            </div>
            <p className="text-blue-800/90 text-xs leading-relaxed">
              You are currently signed in as <strong className="underline">{email}</strong> with Administrator clearance.
            </p>
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <Link
                href="/admin"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors text-center"
              >
                <span>Go to Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <SignOutButton redirectUrl="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto h-9 border-blue-300 bg-white hover:bg-blue-50 text-blue-800 font-semibold text-xs rounded-xl cursor-pointer gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Account</span>
                </Button>
              </SignOutButton>
            </div>
          </div>
        )}

        {/* STATE B: User signed in as Vendor (shown briefly while redirecting) */}
        {isLoaded && isSignedIn && isVendor && (
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs space-y-3 shadow-md">
            <div className="flex items-center gap-2 font-bold text-blue-800 text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
              <span>Signed In As Vendor</span>
            </div>
            <p className="text-blue-800/90 text-xs leading-relaxed">
              You are currently signed in as <strong className="underline">{email}</strong> with Vendor permissions. Redirecting to your dashboard...
            </p>
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors text-center"
              >
                <span>Go to Vendor Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <SignOutButton redirectUrl="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto h-9 border-blue-300 bg-white hover:bg-blue-50 text-blue-800 font-semibold text-xs rounded-xl cursor-pointer gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Account</span>
                </Button>
              </SignOutButton>
            </div>
          </div>
        )}

        {/* STATE C: User signed in but NO valid assigned role (Unauthorized state) */}
        {isLoaded && isSignedIn && isUnauthorized && (
          <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-4 shadow-md">
            <div className="flex items-center gap-2.5 font-bold text-amber-800 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
              <span>No Valid Role Assigned</span>
            </div>
            <p className="text-amber-900/90 text-xs leading-relaxed">
              You have successfully authenticated with Clerk as <strong className="underline text-amber-950">{email}</strong>. However, this account does not currently have an authorized <strong>Vendor</strong> or <strong>Administrator</strong> role in the Butuan Vendors Registration System.
            </p>

            <div className="space-y-2 pt-1 border-t border-amber-200/80">
              <p className="text-[11px] text-amber-800 font-medium">
                Safe next steps:
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9.5 rounded-xl cursor-pointer justify-center"
                  )}
                >
                  <FileCheck2 className="w-4 h-4 mr-1.5" />
                  <span>Complete Vendor Registration</span>
                </Link>

                <Link
                  href="/application-status"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full border-amber-300 bg-white hover:bg-amber-100/50 text-amber-900 font-semibold text-xs h-9.5 rounded-xl cursor-pointer justify-center"
                  )}
                >
                  <Search className="w-4 h-4 mr-1.5 text-amber-700" />
                  <span>Track Application Without Login</span>
                </Link>

                <SignOutButton redirectUrl="/login">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-9 text-slate-600 hover:text-slate-900 hover:bg-amber-100/50 font-medium text-xs rounded-xl cursor-pointer gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out &amp; Use Another Account</span>
                  </Button>
                </SignOutButton>
              </div>
            </div>
          </div>
        )}

        {/* Unified Clerk-Powered Sign-In Component (shown when not signed in) */}
        {!isSignedIn && (
          <div className="w-full flex justify-center">
            <SignIn
              routing="hash"
              fallbackRedirectUrl={authRedirectTarget}
              forceRedirectUrl={authRedirectTarget}
              signUpUrl="/sign-up"
              appearance={{
                variables: {
                  colorPrimary: "#2563eb",
                  colorPrimaryForeground: "#ffffff",
                  colorForeground: "#0f172a",
                  colorMutedForeground: "#475569",
                  colorBackground: "#ffffff",
                  colorInput: "#f8fafc",
                  colorInputForeground: "#0f172a",
                  borderRadius: "0.75rem",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                },
                elements: {
                  rootBox: "w-full",
                  cardBox:
                    "w-full shadow-md rounded-2xl border border-slate-200 bg-white overflow-hidden",
                  card: "w-full bg-white border-0 shadow-none p-6 sm:p-8 space-y-4",
                  header: "hidden",
                  formButtonPrimary:
                    "w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-xs transition-colors",
                  formFieldInput:
                    "h-10 text-sm bg-slate-50/60 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 rounded-xl w-full transition-colors",
                  formFieldLabel:
                    "text-xs font-bold text-slate-700 uppercase tracking-wider",
                  socialButtonsBlockButton:
                    "w-full h-10 border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl cursor-pointer shadow-2xs transition-colors",
                  socialButtonsBlockButtonText:
                    "text-slate-800 font-semibold text-xs sm:text-sm",
                  dividerLine: "bg-slate-200",
                  dividerText:
                    "text-slate-500 font-semibold text-[11px] uppercase tracking-wider bg-white px-2",
                  footer: "pt-3 border-t border-slate-100 text-center",
                  footerAction: "text-xs sm:text-sm text-slate-600",
                  footerActionText: "text-xs sm:text-sm text-slate-600",
                  footerActionLink:
                    "font-semibold text-blue-700 hover:text-blue-900 hover:underline",
                  formFieldAction:
                    "text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline",
                  identityPreviewText: "text-slate-700 font-medium text-sm",
                  identityPreviewEditButton:
                    "text-blue-600 hover:text-blue-800 text-xs font-semibold hover:underline",
                },
              }}
            />
          </div>
        )}

        {/* Vendor Registration & Track Application Guidance Links */}
        <div className="space-y-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Use your registered Google account or email credentials to access your portal.</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 px-1">
            <span>
              Applying for a new permit?{" "}
              <Link
                href="/register"
                className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
              >
                Register
              </Link>
            </span>
            <span>
              Need status lookup?{" "}
              <Link
                href="/application-status"
                className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Track Status
              </Link>
            </span>
          </div>
        </div>

        {/* Return to Public Homepage navigation */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Return to Public Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Loading portal login...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

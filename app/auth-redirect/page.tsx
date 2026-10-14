"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppRole } from "@/lib/clerk-roles";

function AuthRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");
  const { isLoaded, isSignedIn, isAdmin, isVendor } = useAppRole();
  const [checkingApp, setCheckingApp] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    if (isAdmin) {
      router.replace("/admin");
      return;
    }

    // For any non-admin authenticated user, check if they already have a linked application
    let isCancelled = false;
    setCheckingApp(true);

    async function checkApplicationAndRoute() {
      try {
        const res = await fetch("/api/vendor/application", {
          cache: "no-store",
        });

        if (isCancelled) return;

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.application) {
            // Existing application linked to this Google/Clerk account found
            if (!isVendor) {
              // Ensure vendor role is synchronized on Clerk
              await fetch("/api/auth/set-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: "vendor" }),
              }).catch(() => {});
            }
            router.replace("/dashboard");
            return;
          }
        }

        // No linked application exists for this Google/Clerk account
        // Route to vendor registration flow (or specified local redirect_url)
        const safeDestination =
          redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")
            ? redirectUrl
            : "/register";
        router.replace(safeDestination);
      } catch (err) {
        console.error("Auth redirect error:", err);
        if (!isCancelled) {
          if (isVendor) {
            router.replace("/dashboard");
          } else {
            router.replace("/register");
          }
        }
      }
    }

    checkApplicationAndRoute();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, isAdmin, isVendor, router, redirectUrl]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">
          {checkingApp
            ? "Checking your registered vendor application..."
            : "Verifying account clearance and routing to portal..."}
        </p>
      </div>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Loading account session...</p>
          </div>
        </div>
      }
    >
      <AuthRedirectContent />
    </Suspense>
  );
}

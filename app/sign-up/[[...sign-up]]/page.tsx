import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-slate-50/60 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors mb-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xs font-bold text-blue-700 tracking-wider uppercase">
            Portal Access
          </h2>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-sm text-slate-600">
            Create an account to access the Butuan City services and portals.
          </p>
        </div>

        <div className="w-full flex justify-center">
          <SignUp
            routing="hash"
            signInUrl="/login"
            fallbackRedirectUrl="/auth-redirect"
            forceRedirectUrl="/auth-redirect"
            signInFallbackRedirectUrl="/auth-redirect"
            signInForceRedirectUrl="/auth-redirect"
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
              },
            }}
          />
        </div>

        <div className="space-y-3">
          <div className="text-center text-xs text-slate-500">
            Applying for a municipal vendor permit?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
            >
              Start Registration Application
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

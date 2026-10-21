"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900">Completing Google Authentication</h2>
          <p className="text-xs text-slate-500">
            Please wait while we verify your Google credentials with the City of Butuan Vendor Portal...
          </p>
        </div>
      </div>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/auth-redirect"
        signInFallbackRedirectUrl="/auth-redirect"
        signUpForceRedirectUrl="/auth-redirect"
        signUpFallbackRedirectUrl="/auth-redirect"
        continueSignUpUrl="/auth-redirect"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { setAdminSession } from "@/lib/demo-auth";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // Forgot password dialog state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [forgotEmailError, setForgotEmailError] = useState("");

  const validateEmail = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Official email address is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address.";
    }
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) {
      return "Password is required.";
    }
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(val) }));
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      return;
    }

    setIsSubmitting(true);

    // Save demo admin session
    setAdminSession({
      email: email.trim(),
      name: "Administrator",
      title: "City Licensing",
      role: "admin",
    });

    // Frontend demo sign-in transition to Admin Dashboard
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/admin");
    }, 400);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(forgotEmail);
    if (err) {
      setForgotEmailError(err);
      return;
    }
    setForgotEmailError("");
    setForgotEmailSent(true);
  };

  const handleCloseForgotDialog = () => {
    setForgotPasswordOpen(false);
    setForgotEmailSent(false);
    setForgotEmail("");
    setForgotEmailError("");
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding - Clearly distinguishes Admin Portal */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-[11px] font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>City Government of Butuan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin Portal
          </h1>
          <p className="text-sm text-slate-400">
            Authorized City Government personnel only.
          </p>
        </div>

        {/* Login Form Card - Dark Security Aesthetic */}
        <Card className="shadow-2xl border-slate-800 bg-slate-950/90 text-slate-100 rounded-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email Address Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider"
                >
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@butuan.gov.ph"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "admin-email-error" : undefined}
                    className={cn(
                      "pl-10 h-10 text-sm bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:bg-slate-900 focus:border-blue-500 rounded-xl w-full transition-colors",
                      errors.email &&
                        "border-rose-500 focus:border-rose-500 bg-rose-950/20 text-rose-100"
                    )}
                  />
                </div>
                {errors.email && (
                  <p
                    id="admin-email-error"
                    role="alert"
                    className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-bold text-slate-300 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotPasswordOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your admin password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "admin-password-error" : undefined}
                    className={cn(
                      "pl-10 pr-10 h-10 text-sm bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:bg-slate-900 focus:border-blue-500 rounded-xl w-full transition-colors",
                      errors.password &&
                        "border-rose-500 focus:border-rose-500 bg-rose-950/20 text-rose-100"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:text-slate-100 p-1.5 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="admin-password-error"
                    role="alert"
                    className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  {isSubmitting ? "Authenticating..." : "Sign In"}
                </Button>
              </div>
            </form>

            {/* Prototype / Demo Mode Note */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Demo Mode: Enter any valid email and password to proceed to Admin Portal.</span>
            </div>

            {/* Return Link */}
            <div className="pt-2 border-t border-slate-900 text-center">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Return to Public Homepage
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-2xl border border-slate-800">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center mb-1">
              <Lock className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Admin Password Recovery
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-400">
              Enter your official government email address to receive password recovery instructions or contact the City ICTD helpdesk.
            </DialogDescription>
          </DialogHeader>

          {forgotEmailSent ? (
            <div className="py-3 space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-100">Recovery instructions dispatched</p>
                  <p className="text-emerald-300 text-xs mt-0.5">
                    If an administrative record matches <span className="font-medium underline">{forgotEmail}</span>, instructions have been sent to your government inbox.
                  </p>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  onClick={handleCloseForgotDialog}
                  className="w-full text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="py-2 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-forgot-email"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider"
                >
                  Official Government Email
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="admin-forgot-email"
                    type="email"
                    placeholder="admin@butuan.gov.ph"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotEmailError) setForgotEmailError("");
                    }}
                    className={cn(
                      "pl-10 h-10 text-sm bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:bg-slate-950 focus:border-blue-500 rounded-xl w-full",
                      forgotEmailError && "border-rose-500 focus:border-rose-500"
                    )}
                  />
                </div>
                {forgotEmailError && (
                  <p role="alert" className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{forgotEmailError}</span>
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                <span>Direct support: For urgent administrative lockout, contact the City ICTD Administrator at ictd@butuan.gov.ph.</span>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForgotDialog}
                  className="text-xs font-semibold rounded-xl h-9 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 cursor-pointer"
                >
                  Send Recovery Link
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

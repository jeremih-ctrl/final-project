"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
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
import { setVendorSession } from "@/lib/demo-auth";

export default function LoginPage() {
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
      return "Email address is required.";
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

    // Save demo vendor session
    setVendorSession({
      email: email.trim(),
      name: "Juan Dela Cruz",
      role: "Local Vendor",
    });

    // Frontend demo sign-in transition
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/dashboard");
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
    <main className="min-h-screen bg-slate-50/60 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
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
            Vendor Portal
          </h2>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-600">
            Sign in to your Vendor Portal account.
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="shadow-md border-slate-200 bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email Address Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="vendor-email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="vendor-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="juan@email.com"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "vendor-email-error" : undefined}
                    className={cn(
                      "pl-10 h-10 text-sm bg-slate-50/60 border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl w-full transition-colors",
                      errors.email &&
                        "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20"
                    )}
                  />
                </div>
                {errors.email && (
                  <p
                    id="vendor-email-error"
                    role="alert"
                    className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium"
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
                    htmlFor="vendor-password"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotPasswordOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
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
                    id="vendor-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "vendor-password-error" : undefined}
                    className={cn(
                      "pl-10 pr-10 h-10 text-sm bg-slate-50/60 border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl w-full transition-colors",
                      errors.password &&
                        "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:text-slate-700 p-1.5 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    id="vendor-password-error"
                    role="alert"
                    className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium"
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
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </form>

            {/* Registration link */}
            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                >
                  Register here
                </Link>
              </p>
            </div>

            {/* Demo / Prototype Note */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Demo Mode: Enter any valid email and password to proceed.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-1">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Reset Your Password
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              Enter your registered vendor email address and we will send you a password recovery link.
            </DialogDescription>
          </DialogHeader>

          {forgotEmailSent ? (
            <div className="py-3 space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Password reset email sent!</p>
                  <p className="text-emerald-800 text-xs mt-0.5">
                    If an account exists for <span className="font-medium underline">{forgotEmail}</span>, instructions have been sent to your inbox.
                  </p>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  onClick={handleCloseForgotDialog}
                  className="w-full text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="py-2 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="juan@email.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotEmailError) setForgotEmailError("");
                    }}
                    className={cn(
                      "pl-10 h-10 text-sm bg-slate-50 border-slate-300 rounded-xl w-full",
                      forgotEmailError && "border-rose-400 focus:border-rose-500"
                    )}
                  />
                </div>
                {forgotEmailError && (
                  <p role="alert" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{forgotEmailError}</span>
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForgotDialog}
                  className="text-xs font-semibold rounded-xl h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9"
                >
                  Send Reset Link
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

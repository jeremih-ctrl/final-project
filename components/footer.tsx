import Link from "next/link";
import { Store, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Butuan Vendors Registration System
              </span>
            </div>

            <p className="text-sm font-medium text-blue-400">
              Local Vendor Registration • Butuan City, Philippines
            </p>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The official digital registry for micro, small, and street vendors operating within the jurisdiction of Butuan City, Agusan del Norte.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors text-slate-400">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors text-slate-400">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#requirements" className="hover:text-white transition-colors text-slate-400">
                  Requirements
                </Link>
              </li>
              <li>
                <Link href="#login" className="hover:text-white transition-colors text-slate-400">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / LGU Information */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Contact & Support
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>City Hall Complex, J.P. Rosales Ave., Butuan City, 8600 Agusan del Norte</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>vendors-support@butuan.gov.ph</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>(085) 341-2000 / Local 104</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Policy Row */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <p>© 2026 City Government of Butuan. All rights reserved.</p>
          </div>

          {/* Required Policy Links */}
          <div className="flex flex-wrap items-center gap-6">
            <Link href="#privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="#terms-and-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="#contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

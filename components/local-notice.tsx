import { MapPin, Info } from "lucide-react";

export function LocalNotice() {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50/60 to-blue-50 border border-blue-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-700" />
                Local Jurisdiction Notice
              </span>
              <span className="text-xs text-slate-500 hidden md:inline">
                City Ordinance & Guidelines
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
              This registration system is intended for local vendors operating within{" "}
              <strong className="text-blue-900 font-semibold">Butuan City, Agusan del Norte, Philippines.</strong>
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Eligible businesses include public market vendors, street vendors, small retail stalls, and micro-enterprises operating across all 86 barangays of Butuan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

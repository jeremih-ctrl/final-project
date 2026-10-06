import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Lock,
  AlertCircle
} from "lucide-react";

export function RequirementsSection() {
  const requirements = [
    {
      title: "Business Name",
      description: "Registered trade name, business title, or market stall name.",
      icon: Building,
      isOptional: false,
    },
    {
      title: "Owner Name",
      description: "Full legal name of the business owner or primary operator.",
      icon: User,
      isOptional: false,
    },
    {
      title: "Contact Number",
      description: "Active mobile phone number (+63) for SMS status alerts and notices.",
      icon: Phone,
      isOptional: false,
    },
    {
      title: "Email Address",
      description: "Valid personal or business email to receive registration updates.",
      icon: Mail,
      isOptional: false,
    },
    {
      title: "Business Address",
      description: "Physical stall, shop, or operating address located within Butuan City.",
      icon: MapPin,
      isOptional: false,
    },
    {
      title: "Government ID",
      description:
        "PhilSys National ID, Driver's License, Voter's ID, or Postal ID. Can be uploaded now or submitted later.",
      icon: IdCard,
      isOptional: true, // Clearly marked as Optional
    },
    {
      title: "Password",
      description: "A secure password to access your vendor account and monitor your application.",
      icon: Lock,
      isOptional: false,
    },
  ];

  return (
    <section id="requirements" className="py-16 sm:py-20 bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider">
            Preparation Checklist
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Initial Registration Requirements
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Have the following basic information ready before starting. The process is quick, simple, and takes only a few minutes.
          </p>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((req) => {
            const Icon = req.icon;
            return (
              <Card
                key={req.title}
                className={`bg-white border rounded-2xl shadow-xs transition-all hover:shadow-sm ${
                  req.isOptional
                    ? "border-blue-300/80 bg-blue-50/20 ring-1 ring-blue-500/10"
                    : "border-slate-200/90"
                }`}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        req.isOptional
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {req.isOptional ? (
                      <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2.5 py-0.5 text-xs">
                        Optional
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 border-slate-200 text-xs">
                        Required
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {req.title}
                    {req.isOptional && (
                      <span className="text-xs font-normal text-amber-700">
                        (Optional)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-0">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {req.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Informative Note Box */}
        <div className="mt-10 rounded-xl bg-white border border-slate-200 p-4 sm:p-5 flex items-start sm:items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong className="text-slate-900 font-semibold">Note on Government ID:</strong> Providing a valid government ID during registration accelerates verification, but you may proceed without one and submit it at a later date when requested by the administrator.
          </p>
        </div>
      </div>
    </section>
  );
}

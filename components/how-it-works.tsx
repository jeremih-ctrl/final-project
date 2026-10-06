import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ClipboardEdit, SearchCheck, CheckCircle2, ArrowRight } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Register",
      tagline: "Submit your vendor information.",
      description:
        "Fill out the simplified registration form with your business details, contact information, and local address within Butuan City.",
      icon: ClipboardEdit,
      color: "blue",
    },
    {
      number: "02",
      title: "Application Review",
      tagline: "Your application is reviewed by the administrator.",
      description:
        "City LGU administrators review your information to ensure completeness, validity, and alignment with local business guidelines.",
      icon: SearchCheck,
      color: "amber",
    },
    {
      number: "03",
      title: "Get Approved",
      tagline: "Receive your vendor registration status.",
      description:
        "Receive your vendor registration status, reference code, and official verification to conduct business with confidence.",
      icon: CheckCircle2,
      color: "emerald",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white border-y border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider">
            Clear & Simple Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Follow these three straightforward steps to get your vendor business registered with the City Government of Butuan.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative group">
                <Card className="h-full bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between">
                  <div>
                    <CardHeader className="p-6 pb-4">
                      {/* Step Number & Icon Row */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                            step.color === "blue"
                              ? "bg-blue-600 text-white shadow-xs"
                              : step.color === "amber"
                              ? "bg-amber-600 text-white shadow-xs"
                              : "bg-emerald-600 text-white shadow-xs"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-mono text-3xl font-extrabold text-slate-200 group-hover:text-blue-100 transition-colors">
                          {step.number}
                        </span>
                      </div>

                      <CardTitle className="text-xl font-bold text-slate-900">
                        {step.title}
                      </CardTitle>

                      <CardDescription className="text-sm font-semibold text-blue-700 mt-1">
                        {step.tagline}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-6 pb-6 pt-0">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </div>
                </Card>

                {/* Arrow connector for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

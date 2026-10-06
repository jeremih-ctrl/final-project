import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { LocalNotice } from "@/components/local-notice";
import { HowItWorks } from "@/components/how-it-works";
import { RequirementsSection } from "@/components/requirements-section";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 5. Local Vendor Notice */}
        <div className="py-2">
          <LocalNotice />
        </div>

        {/* 3. How It Works */}
        <HowItWorks />

        {/* 4. Requirements */}
        <RequirementsSection />

        {/* Summary Call to Action */}
        <CtaSection />
      </main>

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}

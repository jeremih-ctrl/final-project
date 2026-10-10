import { Navbar } from "@/components/navbar";
import { HomeHero } from "@/components/home/HomeHero";
import { LocalNotice } from "@/components/local-notice";
import { HowItWorks } from "@/components/how-it-works";
import { RequirementsSection } from "@/components/requirements-section";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section with OGL Subtle Background */}
        <HomeHero />

        {/* 3. Local Vendor Notice */}
        <LocalNotice />

        {/* 4. How It Works */}
        <HowItWorks />

        {/* 5. Requirements Checklist */}
        <RequirementsSection />

        {/* 6. Summary Call to Action */}
        <CtaSection />
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}

import { FaqSection } from "@/components/lander/faq";
import { FeaturesSection } from "@/components/lander/features";
import { Footer } from "@/components/lander/footer";
import { Hero } from "@/components/lander/hero";
import { Navbar } from "@/components/lander/navbar";
import { PricingSection } from "@/components/lander/pricing";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        <FeaturesSection />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

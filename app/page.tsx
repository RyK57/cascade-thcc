import { FaqSection } from "@/components/lander/faq";
import { Footer } from "@/components/lander/footer";
import { Hero } from "@/components/lander/hero";
import { HowItWorksSection } from "@/components/lander/how-it-works";
import { Navbar } from "@/components/lander/navbar";
import { PricingSection } from "@/components/lander/pricing";
import { StackSection } from "@/components/lander/stack";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="flex flex-1 flex-col">
        <Hero />
        <HowItWorksSection />
        <StackSection />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

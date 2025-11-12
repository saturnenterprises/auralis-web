import HeroSection from "@/components/HeroSection";
import Header from "@/components/Header";
import UseCasesSection from "@/components/UseCasesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import TeamSection from "@/components/TeamSection";
import FAQSection from "@/components/FAQSection";
import EnterpriseGrid from "@/components/EnterpriseGrid";
import LogoCarousel from "@/components/LogoCarousel";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <UseCasesSection />
      <HowItWorksSection />
      <FeaturesSection />
      {/* Integration Section */}
      <section className="pt-8 pb-16 bg-white-50">
        <div className="container mx-auto px-6 text-center">
         
          <div className="pt-4">
            <LogoCarousel />
          </div>
        </div>
      </section>

      <TeamSection />
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-medium text-gray-800 mb-8">Build Enterprise-grade Agents At scale</h2>
          <EnterpriseGrid />
        </div>
      </section>
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;

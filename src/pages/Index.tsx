import Header from '@/components/landing/layout/Header';
import HeroSection from '@/components/landing/sections/HeroSection';
import UseCasesSection from '@/components/landing/sections/UseCasesSection';
import HowItWorksSection from '@/components/landing/sections/HowItWorksSection';
import FeaturesSection from '@/components/landing/sections/FeaturesSection';
import TeamSection from '@/components/landing/sections/TeamSection';
import FAQSection from '@/components/landing/sections/FAQSection';
import EnterpriseGrid from '@/components/landing/sections/EnterpriseGrid';
import LogoCarousel from '@/components/landing/sections/LogoCarousel';
import Footer from '@/components/landing/layout/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <UseCasesSection />
      <HowItWorksSection />
      <FeaturesSection />
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

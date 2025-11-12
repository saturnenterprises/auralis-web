import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import Orb from "@/components/ui/orb";

const FAQSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [moveAmount, setMoveAmount] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.5;
      
      sectionRef.current.style.setProperty('--scroll-offset', `${parallax * 0.1}px`);
      
      // Calculate scroll velocity
      const currentVelocity = scrolled - lastScrollY;
      setScrollVelocity(currentVelocity);
      setLastScrollY(scrolled);
      setScrollY(scrolled);
      
      // Check if user has reached the bottom of FAQ section
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;
      const distanceFromBottom = (sectionTop + sectionHeight) - windowHeight;
      
      // Start moving only when user has completely reached the bottom of FAQ section
      if (distanceFromBottom <= 0 && distanceFromBottom >= -300) {
        // Calculate movement based on scroll velocity and distance
        const baseMovement = Math.abs(distanceFromBottom) * 1.5;
        const velocityMultiplier = Math.min(Math.abs(currentVelocity) * 0.5, 3); // Cap velocity multiplier
        const calculatedMoveAmount = Math.max(0, Math.min(200, baseMovement * velocityMultiplier));
        
        setMoveAmount(calculatedMoveAmount);
        setIsRevealing(calculatedMoveAmount > 0);
      } else {
        // Immediately reset when scrolling back up or out of range
        setMoveAmount(0);
        setIsRevealing(false);
      }
    };

    const throttledScroll = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [lastScrollY]);

  const faqs = [
    {
      question: "What is Auralis and how does it work?",
      answer: "Auralis is a cutting-edge AI-powered voice calling center platform that revolutionizes how businesses handle customer interactions, sales calls, and support operations. Our intelligent voice agents deliver human-like conversations at scale using advanced natural language processing and voice synthesis."
    },
    {
      question: "What are the key features of Auralis?",
      answer: "Auralis offers smart voice agents with natural language processing, omnichannel integration with CRM systems, customizable call flows with drag-and-drop builder, and advanced analytics with real-time performance metrics and ROI tracking."
    },
    {
      question: "What use cases does Auralis support?",
      answer: "Auralis supports sales & lead qualification, customer support operations, marketing & surveys, and healthcare & appointment management. Our platform is designed to handle complex conversations across various business scenarios."
    },
    {
      question: "How secure is Auralis?",
      answer: "Auralis implements enterprise-grade security with end-to-end encryption for all communications, GDPR, HIPAA, and PCI DSS compliance, secure data storage and processing, plus regular security audits and penetration testing."
    },
    {
      question: "What are the pricing plans for Auralis?",
      answer: "We offer three plans: Starter Plan at ₹9,999/month (up to 1,000 minutes), Professional Plan at ₹24,999/month (up to 5,000 minutes with advanced features), and Enterprise Plan with custom pricing for unlimited minutes and white-label solutions."
    },
    {
      question: "What technology powers Auralis?",
      answer: "Auralis is powered by advanced AI & machine learning including Natural Language Understanding (NLU), text-to-speech with human-like voice synthesis, speech-to-text with noise cancellation, and machine learning algorithms for continuous improvement."
    },
    {
      question: "How can Auralis reduce costs?",
      answer: "Auralis can reduce staffing costs by up to 70%, increase efficiency with 24/7 availability, improve customer satisfaction with consistent service quality, and provide scalability to handle varying call volumes without additional staffing."
    },
    {
      question: "Can I integrate Auralis with my existing systems?",
      answer: "Yes! Auralis offers seamless integration with popular business tools including Salesforce, HubSpot, and Zendesk. We support various CRM platforms and provide custom integrations and API access for enterprise customers."
    }
  ];

   return (
     <section 
       ref={sectionRef} 
       className="py-10 pb-6 bg-white relative overflow-hidden rounded-b-[3rem] border-b-4 border-x-2 border-l-gray-200 border-r-gray-200 border-b-gray-200"
       style={{
         zIndex: 10
       }}
     >
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 parallax-slow">
        <div className="absolute top-10 left-10 w-32 h-32 bg-Buddhi-cyan/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-Buddhi-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Title and Description */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-medium text-foreground leading-tight">
              Everything You Need to Know About Buddhi's AI Voice Agents
            </h2>
            
            {/* Orb Animation */}
            <div className="w-32 h-32 ml-auto lg:ml-12">
              <Orb 
                hoverIntensity={0.25} 
                rotateOnHover={true}
                forceHoverState={false}
              />
            </div>
          </div>
          
          {/* Right Column - FAQ Accordion */}
          <div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-border rounded-lg"
                >
                  <AccordionTrigger className="text-left font-semibold text-lg text-foreground px-6 py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed px-6 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
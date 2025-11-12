import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import customerSupportImage from "@/assets/customer-support.jpg";
import healthcareVoiceImage from "@/assets/healthcare-voice.jpg";
import salesLeadImage from "@/assets/sales-lead.jpg";

const UseCasesSection = () => {
  const [activeUseCase, setActiveUseCase] = useState("sales-lead");
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.2;

      sectionRef.current.style.setProperty(
        "--scroll-offset",
        `${parallax * 0.1}px`
      );
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const useCases = [
    {
      id: "sales-lead",
      title: "Sales & Lead Qualification",
      description:
        "Automated lead qualification and scoring with follow-up calls for warm prospects, product demonstrations and appointment scheduling.",
      image: salesLeadImage,
      features: [
        "Lead Qualification",
        "Follow-up Calls",
        "Product Demos",
        "Appointment Confirmation",
      ],
    },
    {
      id: "customer-support",
      title: "Customer Support",
      description:
        "24/7 first-level technical support with order status inquiries, billing management, and complaint resolution.",
      image: customerSupportImage,
      features: [
        "24/7 Support",
        "Order Inquiries",
        "Billing Management",
        "Complaint Resolution",
      ],
    },
    {
      id: "marketing-surveys",
      title: "Marketing & Surveys",
      description:
        "Market research and customer feedback collection, event invitations, satisfaction surveys, and brand awareness campaigns.",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
      features: [
        "Market Research",
        "Event Management",
        "Customer Surveys",
        "Brand Campaigns",
      ],
    },
    {
      id: "healthcare",
      title: "Healthcare & Appointments",
      description:
        "Patient appointment scheduling and reminders, medication adherence follow-ups, post-treatment check-ins, and insurance verification.",
      image: healthcareVoiceImage,
      features: [
        "Appointment Scheduling",
        "Medication Follow-ups",
        "Check-ins",
        "Insurance Verification",
      ],
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="mt-[140px] sm:mt-[100px] lg:mt-[300px] xl:mt-[550px] pb-0 bg-white"
    >
      <div className="container mx-auto px-6">
        {/* Enhanced Use Cases Tabs */}
        <div className="mb-20">
          <h2 className="text-4xl font-medium text-center text-foreground mb-12 animate-fade-in">
            Use Cases
          </h2>
          <Tabs
            value={activeUseCase}
            onValueChange={setActiveUseCase}
            className="w-full"
          >
            {/* Tabs Navigation */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-12 max-w-5xl mx-auto">
              {useCases.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => setActiveUseCase(useCase.id)}
                  className={`
                    px-5 py-3 rounded-full font-medium text-sm
                    transition-all duration-300 cursor-pointer
                    ${
                      activeUseCase === useCase.id
                        ? "bg-gradient-to-r from-white to-blue-100 text-blue-800 shadow-lg"
                        : "bg-white text-gray-700"
                    }
                    shadow-md border border-blue-100
                  `}
                >
                  {useCase.title}
                </button>
              ))}
            </div>

            {/* Tabs Content */}
            {useCases.map((useCase) => (
              <TabsContent key={useCase.id} value={useCase.id} className="mt-8">
                <Card className="border border-border transition-all duration-500 ease-in-out animate-fade-in">
                  <CardContent className="p-10">
                    <div className="grid lg:grid-cols-2 gap-10 items-center">
                      {/* Text Side */}
                      <div className="space-y-6 transform transition-all duration-500 ease-in-out">
                        <h3 className="text-3xl font-bold text-foreground">
                          {useCase.title}
                        </h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {useCase.description}
                        </p>

                        {/* Feature List */}
                        <div className="grid grid-cols-2 gap-3">
                          {useCase.features.map((feature, i) => (
                            <div
                              key={i}
                              className="flex items-center space-x-2 transform transition-all duration-300 ease-in-out hover:translate-x-1"
                            >
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span className="text-sm text-muted-foreground">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          className="border-2 border-primary text-primary px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105"
                        >
                          Learn More
                        </Button>
                      </div>

                      {/* Image Side */}
                      <div className="relative transform transition-all duration-500 ease-in-out">
                        <img
                          src={useCase.image}
                          alt={useCase.title}
                          className="w-full h-80 object-cover rounded-2xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;

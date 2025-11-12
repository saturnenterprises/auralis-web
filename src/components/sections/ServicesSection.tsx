import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, Cloud, Users, BarChart3 } from 'lucide-react';

export const ServicesSection = () => {
  const services = [
    {
      icon: <Phone className="h-8 w-8 text-white" />,
      title: "Cloud Telephony",
      description: "Scalable cloud-based phone systems with advanced call routing and management features.",
      color: "bg-yellow-500",
      features: ["Advanced Call Routing", "Auto Attendant", "Call Recording", "Analytics Dashboard"]
    },
    {
      icon: <Cloud className="h-8 w-8 text-white" />,
      title: "Cloud PBX",
      description: "Complete business communication solution with unified messaging and collaboration tools.",
      color: "bg-red-500", 
      features: ["Unified Communications", "Video Conferencing", "Team Collaboration", "Mobile Integration"]
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Contact Center",
      description: "Omnichannel contact center platform with AI-powered customer service capabilities.",
      color: "bg-blue-500",
      features: ["Omnichannel Support", "AI Chatbots", "Queue Management", "Real-time Monitoring"]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-secondary to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 fade-in">
          <h2 className="text-4xl font-bold text-voxbay-gray mb-6">
            Comprehensive Communication Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our range of cutting-edge products designed to enhance communication 
            efficiency and streamline call management for businesses of all sizes.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="floating-card p-8 text-center space-y-6 group hover:scale-105 transition-all duration-300"
            >
              <div className={`w-16 h-16 ${service.color} rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                {service.icon}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-voxbay-gray">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </div>

              <div className="space-y-3">
                {service.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-voxbay-gray">{feature}</span>
                  </div>
                ))}
              </div>

              <Button variant="coral-outline" className="w-full group-hover:bg-primary group-hover:text-white transition-all duration-300">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button variant="coral" size="lg" className="px-12 py-4 text-lg">
            Explore All Products
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
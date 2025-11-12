import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { BookOpen, Phone, Calendar, Navigation } from "lucide-react";

const AgentFeaturesSection = () => {
  const [selectedFeature, setSelectedFeature] = useState(0);

  const features = [
    {
      id: "knowledge-base",
      title: "Auto-Sync Knowledge Base",
      description: "Automatically synchronize and update your knowledge base with the latest information to provide accurate responses.",
      icon: BookOpen,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
    },
    {
      id: "call-transfer",
      title: "Powerful Call Transfer Feature",
      description: "Seamlessly transfer calls to the right department or agent when complex issues require human intervention.",
      icon: Phone,
      image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&h=400&fit=crop"
    },
    {
      id: "appointment-booking",
      title: "Easy Appointment Booking",
      description: "Enable customers to book appointments effortlessly through natural conversation with your AI agent.",
      icon: Calendar,
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop"
    },
    {
      id: "navigate-ivr",
      title: "Navigate IVR",
      description: "When encounter IVR systems, Auralis Agents has the ability to press the correct digits to the right destination.",
      icon: Navigation,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
    }
  ];

  return (
    <Card className="border border-gray-300 max-w-6xl mx-auto">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 min-h-[500px]">
          {/* Left side - Features list */}
          <div className="p-8 space-y-4">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={() => setSelectedFeature(index)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                    selectedFeature === index 
                      ? 'border-gray-400 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className={`w-6 h-6 mt-1 transition-colors duration-200 ${
                      selectedFeature === index ? 'text-blue-400' : 'text-gray-600'
                    }`} />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      {selectedFeature === index && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right side - Image/Content */}
          <div className="bg-white p-8 flex items-center justify-center">
            <div className="relative">
              <img 
                src={features[selectedFeature].image}
                alt={features[selectedFeature].title}
                className="w-full max-w-sm h-80 object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentFeaturesSection;
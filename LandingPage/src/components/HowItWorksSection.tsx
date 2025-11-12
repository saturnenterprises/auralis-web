import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import buildWorkflow from "@/assets/build-workflow.gif";
import testConversation from "@/assets/test-conversation.gif";
import deployChannels from "@/assets/deploy-channels.gif";
import monitorAnalytics from "@/assets/monitor-analytics.gif";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Build",
      description:
        "Utilize the voice AI API and our intuitive agent builder to create custom voice AI callers effortlessly.",
      gif: buildWorkflow,
    },
    {
      number: "02",
      title: "Test",
      description:
        "Perform comprehensive agent testing with built-in LLM features to ensure seamless handling of edge cases.",
      gif: testConversation,
    },
    {
      number: "03",
      title: "Deploy",
      description:
        "Easily deploy your agents for AI phone calls, web calls, SMS, chat, and more.",
      gif: deployChannels,
    },
    {
      number: "04",
      title: "Monitor",
      description:
        "Artificial Intelligence tracks success rates, latency, and user sentiment through call history dashboard. Quickly identify failed calls.",
      gif: monitorAnalytics,
    },
  ];

  return (
    <section className="py-6 md:py-15 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Added slightly more bottom margin below heading */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-5xl font-medium text-foreground mb-2 md:mb-3">
            How it Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <Card
              key={step.number}
              className="border border-border bg-card flex flex-col h-full min-h-[460px]"
            >
              <CardContent className="p-6 text-center flex flex-col flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6 mt-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base mb-4 md:mb-6 flex-1">
                  {step.description}
                </p>
                <div className="w-full rounded-lg overflow-hidden border border-border/50 h-48 sm:h-56 md:h-64">
                  <img
                    src={step.gif}
                    alt={`${step.title} demonstration`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

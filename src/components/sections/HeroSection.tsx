import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { VercelOptimizedVideo } from '@/components/ui/vercel-optimized-video';

export const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-br from-background to-secondary overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 fade-in">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-voxbay-gray">Empowering Every</span>
                <br />
                <span className="text-voxbay-gray">Interaction.</span>
                <br />
                <span className="text-voxbay-gray">Transforming</span>
                <br />
                <span className="text-gradient">Customer Experience</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Revolutionize your business communications with our cutting-edge 
                cloud-based telephony solutions designed for the modern enterprise.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="coral" size="lg" className="text-lg px-8 py-4">
                Start your free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="coral-outline" size="lg" className="text-lg px-8 py-4">
                Schedule Demo
              </Button>
            </div>

            <div className="flex items-center space-x-6 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10M+</div>
                <div className="text-sm text-muted-foreground">Calls Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Enterprise Clients</div>
              </div>
            </div>
          </div>

          {/* Right Content - 4 Video Grid Layout */}
          <div className="relative h-[600px] w-full">
            {/* 2x2 Grid Container */}
            <div className="grid grid-cols-2 gap-8 h-full p-4">
              {/* Top Left - Sentiment Analysis */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-40 h-40 floating-card overflow-hidden rounded-2xl">
                  <VercelOptimizedVideo 
                    src="/videos/gif-1.mp4"
                    className="w-full h-full"
                    priority="high"
                  />
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>😊</span>
                  <span>Sentiment Analysis</span>
                </div>
              </div>

              {/* Top Right - Call Barging */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-40 h-40 floating-card overflow-hidden rounded-2xl">
                  <VercelOptimizedVideo 
                    src="/videos/gif-2.mp4"
                    className="w-full h-full"
                    priority="high"
                  />
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>👂</span>
                  <span>Call Barging</span>
                </div>
              </div>

              {/* Bottom Left - Number Privacy */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-40 h-40 floating-card overflow-hidden rounded-2xl">
                  <VercelOptimizedVideo 
                    src="/videos/gif-3.mp4"
                    className="w-full h-full"
                    priority="medium"
                  />
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Number Privacy</span>
                </div>
              </div>

              {/* Bottom Right - Deep Data Learning */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-40 h-40 floating-card overflow-hidden rounded-2xl">
                  <VercelOptimizedVideo 
                    src="/videos/gif-4.mp4"
                    className="w-full h-full"
                    priority="medium"
                  />
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>🏢</span>
                  <span>Deep Data Learning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
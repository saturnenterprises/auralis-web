import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, MessageCircle, Mail } from 'lucide-react';
import { CallInterface } from './CallInterface';

export const CTASection = () => {
  return (
    <section className="py-20 bg-voxbay-dark text-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            Ready to Transform Your
            <span className="text-gradient"> Communication?</span>
          </h2>
          
          <p className="text-xl opacity-90 leading-relaxed">
            Join thousands of businesses worldwide who trust Auralis to power their 
            customer communications. Start your free trial today and experience the difference.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Button variant="coral" size="lg" className="px-8 py-4 text-lg">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-voxbay-dark">
              Schedule a Demo
              <Phone className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Call Interface Section */}
          <div className="pt-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-center mb-6">
                Try Auralis AI Right Now
              </h3>
              <p className="text-center text-white/80 mb-8">
                Enter your phone number and experience our AI assistant in a real phone call
              </p>
              <CallInterface />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <Phone className="h-8 w-8 text-voxbay-coral" />
              </div>
              <h3 className="text-xl font-semibold">24/7 Support</h3>
              <p className="opacity-80">Expert assistance whenever you need it</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 w-8 text-voxbay-coral" />
              </div>
              <h3 className="text-xl font-semibold">Easy Integration</h3>
              <p className="opacity-80">Seamlessly connect with your existing tools</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-voxbay-coral" />
              </div>
              <h3 className="text-xl font-semibold">Enterprise Ready</h3>
              <p className="opacity-80">Scalable solutions for businesses of all sizes</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
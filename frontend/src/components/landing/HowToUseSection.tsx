import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Calendar, PhoneCall, MessageCircle, CheckCircle, Volume2, Loader2 } from 'lucide-react';
import { useMurfAI } from '@/hooks/useMurfAI';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Account',
    description: 'Sign up for a patient account using your email address and phone number.',
    color: 'bg-blue-100 text-blue-600',
    speakText: 'Step 1: Create Account. Sign up for a patient account using your email address and phone number.',
  },
  {
    icon: Calendar,
    title: 'Book Appointment',
    description: 'Choose your preferred department, doctor, date, and time for your visit.',
    color: 'bg-emerald-100 text-emerald-600',
    speakText: 'Step 2: Book Appointment. Choose your preferred department, doctor, date, and time for your visit.',
  },
  {
    icon: PhoneCall,
    title: 'Get Confirmation',
    description: 'Receive instant confirmation via call or message with appointment details.',
    color: 'bg-purple-100 text-purple-600',
    speakText: 'Step 3: Get Confirmation. Receive instant confirmation via call or message with your appointment details.',
  },
  {
    icon: MessageCircle,
    title: 'Use AI Assistant',
    description: 'Chat with Maya, our AI assistant, for quick answers and guidance.',
    color: 'bg-amber-100 text-amber-600',
    speakText: 'Step 4: Use AI Assistant. Chat with Maya, our AI assistant, for quick answers and guidance on your health concerns.',
  },
  {
    icon: CheckCircle,
    title: 'Visit Hospital',
    description: 'Arrive at your scheduled time with your confirmation details.',
    color: 'bg-rose-100 text-rose-600',
    speakText: 'Step 5: Visit Hospital. Arrive at your scheduled time with your confirmation details and our team will take care of you.',
  },
];


const HowToUseSection = () => {
  const { speak, speaking, stop } = useMurfAI();

  const handleStepClick = (speakText: string) => {
    if (speaking) {
      stop();
      return;
    }
    speak({ text: speakText, voiceId: 'en-US-natalie', rate: 1.0, pitch: 0 });
  };

  return (
    <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">How to Use Our Services</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Getting started is easy. Follow these simple steps to book your appointment and access our healthcare services.
          </p>
          <p className="text-xs text-primary/70 mt-2 flex items-center justify-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            Click any step to hear it read aloud by our AI voice assistant
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {steps.map((step, index) => (
            <Card
              key={step.title}
              className="relative overflow-hidden cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-300 group border-border/50 hover:border-primary/30"
              onClick={() => handleStepClick(step.speakText)}
            >
              <div className="absolute top-0 left-0 w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm rounded-br-lg z-10">
                {index + 1}
              </div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="pt-10 pb-2">
                <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center mb-3 group-hover:animate-bounce transition-all`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  {speaking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Speaking… (click to stop)</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Click to listen</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToUseSection;

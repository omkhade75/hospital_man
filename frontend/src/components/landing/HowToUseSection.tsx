import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Calendar, PhoneCall, MessageCircle, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Account',
    description: 'Sign up for a patient account using your email address and phone number.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Calendar,
    title: 'Book Appointment',
    description: 'Choose your preferred department, doctor, date, and time for your visit.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: PhoneCall,
    title: 'Get Confirmation',
    description: 'Receive instant confirmation via call or message with appointment details.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: MessageCircle,
    title: 'Use AI Assistant',
    description: 'Chat with Maya, our AI assistant, for quick answers and guidance.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: CheckCircle,
    title: 'Visit Hospital',
    description: 'Arrive at your scheduled time with your confirmation details.',
    color: 'bg-rose-100 text-rose-600',
  },
];


const HowToUseSection = () => {
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a nice female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How to Use Our Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Getting started is easy. Follow these simple steps to book your appointment and access our healthcare services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <Card
              key={step.title}
              className="relative overflow-hidden cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-300 group"
              onClick={() => speak(`${step.title}. ${step.description}`)}
            >
              <div className="absolute top-0 left-0 w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm rounded-br-lg z-10">
                {index + 1}
              </div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="pt-10 pb-2">
                <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center mb-3 group-hover:animate-bounce`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Click to listen</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToUseSection;

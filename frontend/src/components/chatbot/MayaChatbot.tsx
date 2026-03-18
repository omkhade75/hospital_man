import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, User, Mic, Volume2, Phone, PhoneCall } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// TypeScript declarations for Speech APIs
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor;
    SpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGE_LENGTH = 1000;

const MayaChatbot = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Maya, your dedicated health assistant. How can I help you today? You can ask me about appointments, reports, or check doctor availability." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [bookingState, setBookingState] = useState<{ step: 'none' | 'doctor_name'; data?: Record<string, unknown> }>({ step: 'none' });
  const [language, setLanguage] = useState<"en" | "hi" | "mr">("en");
  const [isCallActive, setIsCallActive] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      let voice = null;
      if (language === 'hi') {
        voice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi') || v.name.includes('India'));
      } else if (language === 'mr') {
        voice = voices.find(v => v.lang.includes('mr') || v.name.includes('Marathi'));
      } else {
        voice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'));
      }

      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // If we are in active call mode, automatically start listening again when the bot finishes talking!
        if (isCallActive) {
          setTimeout(() => autoNativeListen(), 300);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Text-to-Speech not supported",
        description: "Your browser doesn't support voice output.",
        variant: "destructive"
      });
    }
  }, [language, toast, isCallActive]);

  const autoNativeListen = useCallback(() => {
    if (!isCallActive) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'mr' ? 'mr-IN' : 'en-US');
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim().length > 0) {
          triggerSendMessage(transcript);
        }
      };
      recognition.start();
    } catch (e) {
      console.log("Speech recognition error:", e);
    }
  }, [isCallActive, language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleMayaNotification = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      setIsOpen(true);

      const newMessage: Message = { role: "assistant", content: detail.message };
      setMessages((prev) => [...prev, newMessage]);

      if (detail.message) {
        setTimeout(() => speak(detail.message), 500);
      }
    };

    window.addEventListener('maya-notification', handleMayaNotification);
    return () => window.removeEventListener('maya-notification', handleMayaNotification);
  }, [speak]);

  useEffect(() => {
    const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY || "demo-key");
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setIsCallActive(true);
      setIsSpeaking(false);
      window.speechSynthesis.cancel();
      toast({
        title: "Call Started",
        description: "Connected to Maya Voice Assistant.",
      });
    });

    vapi.on("call-end", () => {
      setIsCallActive(false);
      toast({
        title: "Call Ended",
        description: "Voice session finished.",
      });
    });

    vapi.on("error", (err: any) => {
      setIsCallActive(false);
      console.error("Vapi Call Error:", err);
      toast({
        title: "Call Error",
        description: err?.error?.message || err?.message || "The voice assistant encountered an error and could not reply.",
        variant: "destructive",
      });
    });

    vapi.on("message", (msg: any) => {
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        setMessages((prev) => [
          ...prev,
          {
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.transcript
          }
        ]);
      }
    });

    return () => {
      vapi.stop();
    };
  }, [toast]);

  // Custom highly reliable AI Voice Loop (Bypasses Vapi Dashboard broken token issue)
  const toggleVapiCall = () => {
    if (isCallActive) {
      setIsCallActive(false);
      setIsListening(false);
      window.speechSynthesis.cancel();
      toast({
        title: "Call Ended",
        description: "Voice session finished.",
      });
      return;
    }

    setIsCallActive(true);
    toast({
      title: "Call Started",
      description: "Connected to Maya Voice Assistant.",
    });

    // Start conversation Loop natively!
    const initialGreeting = language === 'hi' ? "हाँ जी, मैं आपकी कैसे मदद कर सकती हूँ?" :
      (language === 'mr' ? "हो नक्कीच, मी तुमची कशी मदत करू शकते?" :
        "Hello, I am Maya. How can I help you today?");

    setMessages(prev => [...prev, { role: "assistant", content: initialGreeting }]);

    // Speak first message, then listen!
    speak(initialGreeting);

    // We will automatically start listening after speaking using the utterance.onend hook inside `speak()`
    // We modify `speak()` slightly below to handle auto-listening if in call mode!
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const getResponse = (input: string, lang: "en" | "hi" | "mr") => {
    const lowerInput = input.toLowerCase();

    const responses = {
      en: {
        greeting: "Hello! I'm Maya, your Medicare assistant. How can I help you regarding your health or our hospital services today?",
        appointment: "I can help you book an appointment. Which doctor would you like to consult?",
        doctor: "We have world-class specialists. Please tell me the name of the doctor you are looking for.",
        report: "Your medical reports are secure with us. You can access and download them from the 'Reports' tab. Do you want me to find a specific report?",
        billing: "You can track all your payments and insurance claims in the 'Billing' section.",
        emergency: "🚨 EMERGENCY ALERT: If this is a life-threatening emergency, please call 102 or our Hotline at +91-123-456-7890 IMMEDIATELY.",
        default: "I'm listening. Could you please provide more details so I can assist you better?"
      },
      hi: {
        greeting: "नमस्ते! मैं माया हूँ, आपकी मेडिकेयर सहायक। आज मैं आपकी स्वास्थ्य या अस्पताल सेवाओं के संबंध में कैसे मदद कर सकती हूँ?",
        appointment: "मैं अपॉइंटमेंट बुक करने में आपकी मदद कर सकती हूँ। आप किस डॉक्टर से परामर्श करना चाहेंगे?",
        doctor: "हमारे पास विश्व स्तरीय विशेषज्ञ हैं। कृपया मुझे उस डॉक्टर का नाम बताएं जिसे आप ढूंढ रहे हैं।",
        report: "आपकी मेडिकल रिपोर्ट हमारे पास सुरक्षित हैं।",
        billing: "आप 'बिलिंग' अनुभाग में अपने सभी भुगतान ट्रैक कर सकते हैं।",
        emergency: "🚨 आपातकालीन चेतावनी: कृपया तुरंत 102 पर कॉल करें।",
        default: "मैं सुन रही हूँ। कृपया अधिक विवरण दें।"
      },
      mr: {
        greeting: "नमस्कार! मी माया आहे. मी तुम्हाला कशी मदत करू शकते?",
        appointment: "मी तुम्हाला अपॉइंटमेंट बुक करण्यात मदत करू शकते. तुम्हाला कोणत्या डॉक्टरांचा सल्ला घ्यायचा आहे?",
        doctor: "आमच्याकडे जागतिक दर्जाचे तज्ञ आहेत. कृपया मला त्या डॉक्टरांचे नाव सांगा ज्यांना तुम्ही शोधत आहात.",
        report: "तुमचे वैद्यकीय अहवाल सुरक्षित आहेत.",
        billing: "तुम्ही 'बिलिंग' विभागात तुमचे पेमेंट पाहू शकता.",
        emergency: "🚨 तातडीची सूचना: कृपया त्वरित १०२ वर कॉल करा.",
        default: "मी ऐकत आहे. कृपया अधिक तपशील द्या."
      }
    };

    const r = responses[lang];

    if (lowerInput.match(/\b(hi|hello|hey|namaste|namaskar|greetings)\b/)) return r.greeting;
    if (lowerInput.includes("appointment") || lowerInput.includes("book") || lowerInput.includes("schedule")) return "APPOINTMENT_TRIGGER";
    if (lowerInput.includes("doctor") || lowerInput.includes("specialist")) return r.doctor;
    if (lowerInput.includes("report") || lowerInput.includes("result")) return r.report;
    if (lowerInput.includes("bill") || lowerInput.includes("payment")) return r.billing;
    if (lowerInput.includes("emergency") || lowerInput.includes("urgent")) return r.emergency;

    return r.default;
  };

  const processDoctorSearch = async (doctorName: string) => {
    try {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*')
        .ilike('name', `%${doctorName}%`);

      if (error || !doctors || doctors.length === 0) {
        return { found: false, message: "I couldn't find a doctor by that name. Please check the spelling or try another name." };
      }

      const doctor = doctors[0];

      if (doctor.available) {
        const confirmationMsg = `Great news! Dr. ${doctor.name} is available. Your appointment has been confirmed for the next available slot.`;
        return { found: true, message: confirmationMsg };
      } else {
        const nextSlot = "tomorrow at 10:00 AM";
        const busyMsg = `Sorry, Dr. ${doctor.name} is currently unavailable/on leave. The next available slot is ${nextSlot}. Would you like to book that?`;
        return { found: true, message: busyMsg };
      }
    } catch {
      return { found: false, message: "I'm having trouble connecting to the schedule database right now." };
    }
  };

  const triggerSendMessage = async (textInput: string) => {
    if (!textInput.trim() || isLoading) return;

    const trimmedInput = textInput.trim().slice(0, MAX_MESSAGE_LENGTH);
    const userMessage: Message = { role: "user", content: trimmedInput };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let responseText = "";

      if (bookingState.step === 'doctor_name') {
        const result = await processDoctorSearch(trimmedInput);
        responseText = result.message;
        setBookingState({ step: 'none' });
      } else {
        const initialResponse = getResponse(trimmedInput, language);

        if (initialResponse === "APPOINTMENT_TRIGGER") {
          responseText = language === 'en' ? "Sure, I can help. Which doctor would you like to see?" :
            (language === 'hi' ? "ज़रूर, मैं मदद कर सकती हूँ। आप किस डॉक्टर को दिखाना चाहेंगे?" : "हो नक्कीच. तुम्हाला कोणत्या डॉक्टरांकडे जायचे आहे?");
          setBookingState({ step: 'doctor_name' });
        } else {
          responseText = initialResponse;
        }
      }

      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
        setIsLoading(false);
        speak(responseText);
      }, 800);

    } catch {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    triggerSendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border-4 border-white dark:border-gray-800",
          isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-gradient-to-tr from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 animate-pulse"
        )}
      >
        {isOpen ? <X className="w-8 h-8 text-white" /> : (
          <div className="relative">
            <Bot className="w-8 h-8 text-white" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
          </div>
        )}
      </Button>

      <div
        className={cn(
          "fixed bottom-28 right-6 z-50 w-[380px] bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden transition-all duration-500 origin-bottom-right backdrop-blur-xl",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10 pointer-events-none"
        )}
      >
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 backdrop-blur-md shadow-inner relative overflow-hidden group">
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="w-2 h-2 bg-white rounded-full absolute left-3 top-4 animate-blink"></div>
              <div className="w-2 h-2 bg-white rounded-full absolute right-3 top-4 animate-blink"></div>
              <div className="w-4 h-2 border-b-2 border-white rounded-full absolute bottom-3"></div>
            </div>
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-lg">MAYA AI</h3>
            <p className="text-xs text-white/80">Always here to help</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              className="bg-white/20 text-white text-xs rounded border-none p-1 focus:ring-0 cursor-pointer"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "hi" | "mr")}
            >
              <option value="en" className="text-black">English</option>
              <option value="hi" className="text-black">हिंदी</option>
              <option value="mr" className="text-black">मराठी</option>
            </select>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => window.speechSynthesis.cancel()}>
              <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse text-yellow-300")} />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px] p-4 bg-muted/30" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-white dark:bg-gray-800 text-foreground rounded-bl-none border border-border/50"
                  )}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 border border-border/50 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-0"></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-4 py-2 bg-background flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            "Book Appointment",
            "View Reports",
            "Insurance Info",
            "Visiting Hours",
            "Emergency Contact"
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="secondary"
              size="sm"
              className="whitespace-nowrap rounded-full text-xs h-7 bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border/50"
              onClick={() => setInput(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>

        <div className="p-4 bg-background border-t border-border pt-2">
          {import.meta.env.VITE_VAPI_PHONE_NUMBER_ID && import.meta.env.VITE_HOSPITAL_PHONE_NUMBER && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3 text-xs text-blue-800">
              <Phone className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-semibold">Call us directly:</p>
                <p>{import.meta.env.VITE_HOSPITAL_PHONE_NUMBER}</p>
              </div>
            </div>
          )}

          {messages.length > 2 && (
            <a
              href={`https://wa.me/${(import.meta.env.VITE_HOSPITAL_PHONE_NUMBER || "").replace(/[^0-9]/g, "") || "911234567890"}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full mb-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
            >
              <Phone className="w-3 h-3" />
              Chat with us on WhatsApp
            </a>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={startListening}
              className={cn("shrink-0 rounded-full", isListening && "border-red-500 text-red-500 animate-pulse")}
              title="Voice Typing"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVapiCall}
              className={cn("shrink-0 rounded-full transition-all duration-300", isCallActive ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" : "border-green-500 text-green-600 hover:bg-green-50")}
              title="Start Voice Call"
            >
              {isCallActive ? <PhoneCall className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 rounded-full px-4"
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon" className="shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MayaChatbot;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Stethoscope, MapPin, Phone, Clock, Shield, Award, Building2, ChevronRight, Newspaper, ArrowRight, Facebook, Twitter, Instagram, Linkedin, Mail, LogIn, Search, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PhoneCall } from 'lucide-react';
import LoginPromptModal from '@/components/landing/LoginPromptModal';
import DoctorCard from '@/components/landing/DoctorCard';
import NewsCard from '@/components/landing/NewsCard';
import HowToUseSection from '@/components/landing/HowToUseSection';
import HealthPackages from '@/components/landing/HealthPackages';
import Testimonials from '@/components/landing/Testimonials';
import SymptomChecker from '@/components/landing/SymptomChecker';
import { ModeToggle } from '@/components/ui/mode-toggle';
const newsArticles = [{
  title: 'New Cardiac Care Wing Opens',
  excerpt: 'Medicare Hospital is proud to announce the opening of our new cardiac care wing, equipped with the latest diagnostic and treatment technologies.',
  date: 'Jan 15, 2026',
  category: 'Hospital News',
  url: 'https://news.google.com/search?q=cardiac+care+hospital'
}, {
  title: 'Free Health Checkup Camp',
  excerpt: 'Join us for a comprehensive free health checkup camp including blood pressure, diabetes screening, and general health assessment.',
  date: 'Jan 12, 2026',
  category: 'Events',
  url: 'https://news.google.com/search?q=health+camp'
}, {
  title: 'Winter Health Tips',
  excerpt: 'Our doctors share essential tips for staying healthy during the cold season, including nutrition advice and exercise recommendations.',
  date: 'Jan 10, 2026',
  category: 'Health Tips',
  url: 'https://news.google.com/search?q=winter+health+tips'
}];

const PortalSelect = () => {
  const navigate = useNavigate();

  // Callback State
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackEmail, setCallbackEmail] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [callbackReason, setCallbackReason] = useState('');

  // Request callback mutation
  const requestCallbackMutation = useMutation({
    mutationFn: async () => {
      if (!callbackName || !callbackPhone) {
        throw new Error('Please provide your name and phone number');
      }

      const { data, error } = await supabase.from('callback_requests').insert({
        name: callbackName,
        phone: callbackPhone,
        preferred_time: callbackTime || null,
        reason: callbackReason || null,
        status: 'pending'
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Callback request submitted! Our AI agent will call you shortly.');
      setCallbackOpen(false);
      setCallbackName('');
      setCallbackPhone('');
      setCallbackEmail('');
      setCallbackTime('');
      setCallbackReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Removed local backend connection test as it's no longer used

  // Hardcoded doctors for display
  const doctors = [
    { id: '101', name: 'Dr. Sarah Johnson', specialty: 'Cardiology', experience: '15 years', rating: 4.9, available: true },
    { id: '102', name: 'Dr. James Smith', specialty: 'Neurology', experience: '12 years', rating: 4.8, available: true },
    { id: '103', name: 'Dr. Emily Chen', specialty: 'Pediatrics', experience: '10 years', rating: 4.9, available: true },
    { id: '104', name: 'Dr. Michael Brown', specialty: 'Orthopedics', experience: '18 years', rating: 4.7, available: true },
  ];

  const isDoctorsLoading = false;

  // Hardcoded departments for display
  const departments = [
    { id: '1', name: 'Cardiology', doctors_count: 5 },
    { id: '2', name: 'Neurology', doctors_count: 4 },
    { id: '3', name: 'Orthopedics', doctors_count: 6 },
    { id: '4', name: 'Oncology', doctors_count: 3 },
    { id: '5', name: 'Pediatrics', doctors_count: 4 },
    { id: '6', name: 'Emergency', doctors_count: 10 },
  ];

  const handleNewsClick = (url: string) => {
    window.open(url, '_blank');
  };

  return <div className="min-h-screen bg-background font-sans">
    {/* Timed Login Popup - 5 seconds delay */}
    <LoginPromptModal delaySeconds={5} />

    {/* Header */}
    <header className="bg-card shadow-md sticky top-0 z-50 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <img src="/logo.png" alt="Medicare Hospital Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Medicare Hospital</span>
              <p className="text-xs text-muted-foreground hidden sm:block tracking-wide">Excellence in Healthcare</p>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-6">
            <div className="mr-2">
              <ModeToggle />
            </div>
            {/* Socials & Email - Hidden on mobile, visible on md+ */}
            <div className="hidden lg:flex items-center gap-4 border-r pr-6 border-border">
              <div className="flex items-center gap-3">
                <Link to="/social-coming-soon" className="text-muted-foreground hover:text-[#0077b5] transition-colors"><Linkedin className="h-5 w-5" /></Link>
                <Link to="/social-coming-soon" className="text-muted-foreground hover:text-[#E4405F] transition-colors"><Instagram className="h-5 w-5" /></Link>
                <Link to="/social-coming-soon" className="text-muted-foreground hover:text-[#1DA1F2] transition-colors"><Twitter className="h-5 w-5" /></Link>
                <Link to="/social-coming-soon" className="text-muted-foreground hover:text-[#1877F2] transition-colors"><Facebook className="h-5 w-5" /></Link>
              </div>

            </div>

            {/* Login Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <DropdownMenuItem onClick={() => navigate('/patient/login')} className="cursor-pointer py-3 px-3 focus:bg-primary/10">
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-medium">Patient Login</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/staff/login')} className="cursor-pointer py-3 px-3 focus:bg-emerald-50 text-emerald-700">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  <span className="font-medium">Staff Login</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/login')} className="cursor-pointer py-3 px-3 focus:bg-purple-50 text-purple-700">
                  <Shield className="mr-2 h-4 w-4" />
                  <span className="font-medium">Admin Login</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>

    {/* Hero Section */}
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center opacity-5" />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-sm px-6 py-2 rounded-full uppercase tracking-wider font-semibold">
          Trusted by 50,000+ Patients
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight tracking-tight">
          Your Health, Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Commitment</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          Experience world-class healthcare at Medicare Hospital. Our expert team and advanced technology ensure the best care for you and your family.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <Button size="lg" className="h-16 px-10 text-xl rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300" onClick={() => navigate('/patient/register')}>
            <Users className="h-6 w-6 mr-2" />
            Book Appointment
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-16 px-10 text-xl rounded-full border-2 bg-transparent hover:scale-95 hover:bg-gradient-to-r hover:from-red-500 hover:via-yellow-500 hover:to-green-500 hover:text-white hover:border-transparent hover:shadow-2xl transition-all duration-300 transform"
            asChild
          >
            <a href="#contact">
              <Phone className="h-6 w-6 mr-2 animate-bounce" />
              Contact Us
            </a>
          </Button>
        </div>
      </div>
    </section>

    {/* How to Use Section */}
    <HowToUseSection />



    {/* Our Doctors */}
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-3">Our Expert Doctors</h2>
            <p className="text-muted-foreground text-lg">Meet our team of experienced healthcare professionals</p>
          </div>
          <Button variant="outline" className="hidden md:flex gap-2" onClick={() => navigate('/patient/login')}>
            View All Doctors <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {isDoctorsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden h-[140px] animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 h-full">
                    <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                      <div className="h-4 w-1/4 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {doctors.map(doctor => (
              <DoctorCard key={doctor.id} name={doctor.name} specialty={doctor.specialty} experience={doctor.experience || undefined} rating={doctor.rating || 4.5} available={doctor.available ?? true} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <Stethoscope className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">Doctors Directory Updating</h3>
            <p className="text-muted-foreground">We are currently updating our doctor profiles. Please check back shortly.</p>
          </Card>
        )}
      </div>
    </section>

    {/* Departments */}
    <section className="py-20 px-4 bg-blue-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Center of Excellence</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Specialized departments equipped with advanced technology and staffed by leading specialists.</p>
        </div>

        {departments.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {departments.map(dept => (
              <Card
                key={dept.id}
                className="text-center p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-transparent hover:border-primary/20 group bg-card/50 hover:bg-card"
                onClick={() => {
                  window.open(`https://en.wikipedia.org/wiki/${dept.name}`, '_blank');
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{dept.name}</h3>
                {dept.doctors_count && dept.doctors_count > 0 && <p className="text-sm text-muted-foreground mt-2">{dept.doctors_count} Specialists</p>}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border-2 border-dashed border-primary/20 rounded-3xl bg-white/50">
            <Building2 className="w-16 h-16 mx-auto text-primary/30 mb-4" />
            <h3 className="text-xl font-semibold text-primary/60">Departments Coming Soon</h3>
            <p className="text-muted-foreground mt-2">We are currently updating our department list.</p>
          </div>
        )}
      </div>
    </section>

    {/* AI Symptom Checker Button Section */}
    <section className="py-16 px-4 bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Unsure about your symptoms?</h2>
          <p className="text-muted-foreground text-lg">Use our AI-powered tool to find the right specialist for you.</p>
        </div>
        <SymptomChecker />
      </div>
    </section>

    {/* Testimonials */}
    <Testimonials />

    {/* Contact & Location */}
    <section id="contact" className="py-20 px-4 bg-slate-900 text-white relative overflow-hidden">
      {/* Abstract shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-6 backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-blue-100">Visit Us Today</span>
            </div>
            <h2 className="text-4xl font-bold mb-8 text-white">Contact & Location</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors border border-white/5">
                  <MapPin className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Main Campus</h3>
                  <p className="text-slate-300 leading-relaxed">123 Healthcare Avenue, Koregaon Park<br />Pune, Maharashtra 411001</p>
                </div>
              </div>
              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors border border-white/5">
                  <Phone className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">24/7 Support</h3>
                  <p className="text-slate-300 mb-1">Emergency: <span className="text-white font-mono font-medium">+91 98765 43210</span></p>
                  <p className="text-slate-300">Appointments: <span className="text-white font-mono font-medium">+91 88888 88888</span></p>
                </div>
              </div>
              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors border border-white/5">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Working Hours</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-slate-300">
                    <span>Mon - Sat:</span>
                    <span className="text-white">9:00 AM - 8:00 PM</span>
                    <span>Sunday:</span>
                    <span className="text-white">10:00 AM - 2:00 PM</span>
                    <span>Emergency:</span>
                    <span className="text-green-400 font-bold flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> 24 / 7 Open</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <Dialog open={callbackOpen} onOpenChange={setCallbackOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border border-white/10">
                    <PhoneCall className="mr-3 h-5 w-5 animate-pulse" />
                    Request a Free Callback
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white text-slate-900 border-none">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">Request a Callback</DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Leave your details and our team will contact you shortly.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Full Name *</Label>
                      <Input
                        placeholder="Enter your name"
                        className="bg-slate-50 border-slate-200 focus:border-blue-500"
                        value={callbackName}
                        onChange={(e) => setCallbackName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Phone Number *</Label>
                      <Input
                        placeholder="Enter your phone number"
                        className="bg-slate-50 border-slate-200 focus:border-blue-500"
                        value={callbackPhone}
                        onChange={(e) => setCallbackPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Preferred Time</Label>
                      <Select value={callbackTime} onValueChange={setCallbackTime}>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Select best time to call" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                          <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                          <SelectItem value="anytime">Anytime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Reason (Optional)</Label>
                      <Textarea
                        placeholder="How can we help?"
                        className="bg-slate-50 border-slate-200 focus:border-blue-500"
                        value={callbackReason}
                        onChange={(e) => setCallbackReason(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => requestCallbackMutation.mutate()} disabled={requestCallbackMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                      {requestCallbackMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-center text-slate-400 text-xs mt-3 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Typical response time: 10-15 mins
              </p>
            </div>
          </div>

          {/* Map Container - Simplified and Robust */}
          <div className="w-full h-[350px] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-20">
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50 backdrop-blur-sm p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
              <p className="text-xl font-semibold text-white mb-2">Location Map</p>
              <p className="text-slate-400">Interactive hospital map coming soon.</p>
              <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500">
                <p>123 Healthcare Avenue, Koregaon Park</p>
                <p>Pune, Maharashtra 411001</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-slate-950 text-slate-200 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-white">Medicare Hospital</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Excellence in healthcare since 2001. We are committed to providing world-class medical services with compassion and advanced technology.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="icon" className="rounded-full border-slate-700 bg-slate-900 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300" onClick={() => { }}>
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-slate-700 bg-slate-900 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all duration-300" onClick={() => { }}>
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-slate-700 bg-slate-900 hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-all duration-300" onClick={() => { }}>
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-slate-700 bg-slate-900 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all duration-300" onClick={() => { }}>
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/patient/login" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  Patient Portal
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  Staff Portal
                </Link>
              </li>
              <li>
                <a href="#contact" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  Contact Us
                </a>
              </li>
              <li>
                <Link to="/admin/login" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Departments */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Departments</h4>
            <ul className="space-y-3">
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Cardiology</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Neurology</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Orthopedics</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Pediatrics</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Emergency Care</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Get In Touch</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-500 mt-1" />
                <span className="text-slate-400 text-sm">Pune, Maharashtra 411001</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <a href="mailto:info@medicarehospital.com" className="text-slate-400 text-sm hover:text-blue-400">info@medicarehospital.com</a>
              </div>
              <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Subscribe to our newsletter</p>
                <div className="flex gap-2">
                  <input type="email" placeholder="Email address" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-500 text-white" />
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2026 Medicare Hospital. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  </div>;
};

export default PortalSelect;
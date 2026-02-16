import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Heart, LogOut, Calendar as CalendarIcon, Phone, MapPin,
  Clock, MessageCircle, Stethoscope, Building2, PhoneCall,
  FileText, CreditCard, Shield, Activity, Receipt, Ambulance
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MayaChatbot from '@/components/chatbot/MayaChatbot';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsuranceClaimForm from "@/components/forms/InsuranceClaimForm";

const PatientDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Welcome Overlay State
  const [showWelcome, setShowWelcome] = useState(true);

  // Appointment booking state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [ambulanceOpen, setAmbulanceOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date>();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  // Callback request state
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackEmail, setCallbackEmail] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [callbackReason, setCallbackReason] = useState('');

  // Ambulance state
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');

  // Placeholder for missing realtime - could use polling if needed
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    }, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user, queryClient]);

  useEffect(() => {
    // Show welcome message for 5 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['public-departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ['public-doctors', selectedDepartment],
    queryFn: async () => {
      let query = supabase.from('doctors').select('*');
      if (selectedDepartment && selectedDepartment !== 'all') {
        query = query.eq('department_id', selectedDepartment);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user's appointments
  const { data: myAppointments = [] } = useQuery({
    queryKey: ['my-appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('*, doctors(name, specialty)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!user || !appointmentDate || !patientName || !patientPhone) {
        throw new Error('Please fill in all required fields');
      }

      const { error } = await supabase.from('patient_appointments').insert({
        user_id: user.id,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: user.email,
        doctor_id: selectedDoctor || null,
        department_id: selectedDepartment || null,
        preferred_date: appointmentDate.toISOString(),
        preferred_time: appointmentTime || null,
        appointment_type: appointmentType,
        notes: appointmentNotes || null,
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Appointment request submitted!');
      setBookingOpen(false);
      resetBookingForm();
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });

      // Trigger Maya Confirmation
      const event = new CustomEvent('maya-notification', {
        detail: {
          message: `Your appointment with ${selectedDoctor ? 'the specialist' : 'us'} on ${appointmentDate ? format(appointmentDate, 'PPP') : 'the requested date'} has been successfully booked and confirmed. Your allotment ID is #${Math.floor(Math.random() * 10000)}. We look forward to seeing you.`,
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Request callback mutation
  const requestCallbackMutation = useMutation({
    mutationFn: async () => {
      let finalPhone = callbackPhone;

      if (!callbackName || !finalPhone) {
        throw new Error('Please provide your name and a phone number');
      }

      const { error } = await supabase.from('callback_requests').insert({
        user_id: user?.id,
        name: callbackName,
        phone: finalPhone,
        preferred_time: callbackTime || null,
        reason: callbackReason || null,
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Callback request submitted! We will call you soon.');
      setCallbackOpen(false);
      resetCallbackForm();

      // Simulate AI calling back
      setTimeout(() => {
        toast.info("📞 Incoming Call: Medicare AI Assistant", {
          description: "Connecting you to our automated support line...",
          duration: 5000,
          action: {
            label: "Answer",
            onClick: () => {
              toast.success("Connected! (Simulated Voice Call)");
              speak("Hello! This is Maya from Medicare Hospital. I received your callback request. How can I assist you today?");
            }
          }
        });

        // Also trigger voice if supported
        const speak = (text: string) => {
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'));
            if (femaleVoice) utterance.voice = femaleVoice;
            window.speechSynthesis.speak(utterance);
          }
        };
      }, 3000);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetBookingForm = () => {
    setAppointmentDate(undefined);
    setSelectedDepartment('');
    setSelectedDoctor('');
    setAppointmentTime('');
    setAppointmentType('consultation');
    setAppointmentNotes('');
    setPatientName('');
    setPatientPhone('');
  };

  const resetCallbackForm = () => {
    setCallbackName('');
    setCallbackPhone('');
    setCallbackEmail('');
    setCallbackTime('');
    setCallbackReason('');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBookAmbulance = () => {
    setLocationStatus('locating');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationStatus('success');
          // Start simulated reverse geocoding or just use coords
          setLocationAddress(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          console.error("Error getting location", error);
          setLocationStatus('error');
          toast.error("Could not fetch location. Please enable location services.");
        }
      );
    } else {
      setLocationStatus('error');
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  const confirmAmbulanceBooking = () => {
    // Simulate API call
    setTimeout(() => {
      toast.success("Ambulance dispatched! It will arrive at your location shortly.");
      setAmbulanceOpen(false);
      setLocationStatus('idle');
    }, 1500);
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-500">
        <img src="/logo.png" alt="Medicare Logo" className="w-16 h-16 object-contain mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold font-heading text-primary mb-4 text-center">
          Welcome to Medicare Hospital
        </h1>
        <p className="text-xl text-muted-foreground font-medium text-center max-w-lg">
          "To keep you safe is our duty."
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Medicare Logo" className="h-8 w-8 object-contain" />
              <span className="text-2xl font-bold text-primary">Medicare</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {user?.fullName || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto h-auto gap-2 bg-transparent p-0">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-white h-12">
              <Activity className="w-4 h-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-white h-12">
              <FileText className="w-4 h-4 mr-2" /> Reports
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-white h-12">
              <CreditCard className="w-4 h-4 mr-2" /> Billing
            </TabsTrigger>
            <TabsTrigger value="insurance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-white h-12">
              <Shield className="w-4 h-4 mr-2" /> Insurance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 animate-fade-in">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Book Appointment */}
              <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
                    <CardHeader className="text-center">
                      <CalendarIcon className="h-12 w-12 text-primary mx-auto mb-2" />
                      <CardTitle>Book Appointment</CardTitle>
                      <CardDescription>Schedule a visit with our doctors</CardDescription>
                    </CardHeader>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Book an Appointment</DialogTitle>
                    <DialogDescription>Fill in the details to request an appointment</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your Name *</Label>
                      <Input
                        placeholder="Enter your full name"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <Input
                        placeholder="Enter your phone number"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Department (Optional)</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Doctor</Label>
                      <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doc: any) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.name} - {doc.specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left", !appointmentDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {appointmentDate ? format(appointmentDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={appointmentDate}
                            onSelect={setAppointmentDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Time</Label>
                      <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                          <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Appointment Type</Label>
                      <Select value={appointmentType} onValueChange={setAppointmentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">General Consultation</SelectItem>
                          <SelectItem value="followup">Follow-up Visit</SelectItem>
                          <SelectItem value="checkup">Health Checkup</SelectItem>
                          <SelectItem value="specialist">Specialist Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Notes</Label>
                      <Textarea
                        placeholder="Any specific concerns or requirements..."
                        value={appointmentNotes}
                        onChange={(e) => setAppointmentNotes(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => bookAppointmentMutation.mutate()}
                      disabled={bookAppointmentMutation.isPending}
                    >
                      {bookAppointmentMutation.isPending ? 'Submitting...' : 'Book Appointment'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Request Callback */}
              <Dialog open={callbackOpen} onOpenChange={setCallbackOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500">
                    <CardHeader className="text-center">
                      <PhoneCall className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <CardTitle>Request Callback</CardTitle>
                      <CardDescription>We'll call you back at your convenience</CardDescription>
                    </CardHeader>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request a Callback</DialogTitle>
                    <DialogDescription>Fill in your details and we'll call you back</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your Name *</Label>
                      <Input
                        placeholder="Enter your full name"
                        value={callbackName}
                        onChange={(e) => setCallbackName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="Enter your phone number (Optional)"
                        value={callbackPhone}
                        onChange={(e) => setCallbackPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (Optional)</Label>
                      <Input
                        placeholder="Enter your email"
                        value={callbackEmail}
                        onChange={(e) => setCallbackEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Time</Label>
                      <Select value={callbackTime} onValueChange={setCallbackTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                          <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                          <SelectItem value="anytime">Anytime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reason for Callback</Label>
                      <Textarea
                        placeholder="Tell us why you'd like to be contacted..."
                        value={callbackReason}
                        onChange={(e) => setCallbackReason(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => requestCallbackMutation.mutate()}
                      disabled={requestCallbackMutation.isPending}
                    >
                      {requestCallbackMutation.isPending ? 'Submitting...' : 'Request Callback'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Book Ambulance - Updated from Maya Chat */}
              <Dialog open={ambulanceOpen} onOpenChange={setAmbulanceOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-red-500 animate-pulse bg-red-50">
                    <CardHeader className="text-center">
                      <Ambulance className="h-12 w-12 text-red-600 mx-auto mb-2" />
                      <CardTitle className="text-red-700">Emergency Ambulance</CardTitle>
                      <CardDescription>Book an ambulance to your current location</CardDescription>
                    </CardHeader>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                      <Ambulance className="w-5 h-5" /> Emergency Ambulance Booking
                    </DialogTitle>
                    <DialogDescription>
                      We need to access your location to send an ambulance immediately.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {locationStatus === 'idle' && (
                      <Button onClick={handleBookAmbulance} className="w-full h-16 text-lg bg-red-600 hover:bg-red-700 animate-pulse">
                        <MapPin className="w-6 h-6 mr-2" />
                        Get My Location & Book
                      </Button>
                    )}

                    {locationStatus === 'locating' && (
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                        <p>Fetching your exact location...</p>
                      </div>
                    )}

                    {locationStatus === 'success' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Location Detected
                          </h4>
                          <p className="text-sm text-green-700 mt-1">{locationAddress}</p>
                          <p className="text-xs text-muted-foreground mt-2">Coordinates: {currentLocation?.lat}, {currentLocation?.lng}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Emergency Details (Optional)</Label>
                          <Textarea placeholder="Briefly describe the emergency..." />
                        </div>
                      </div>
                    )}

                    {locationStatus === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-red-600">Could not fetch location automatically.</p>
                        <Button variant="outline" onClick={() => setLocationStatus('idle')} className="mt-2">Try Again</Button>
                      </div>
                    )}
                  </div>

                  {locationStatus === 'success' && (
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAmbulanceOpen(false)}>Cancel</Button>
                      <Button onClick={confirmAmbulanceBooking} className="bg-red-600 hover:bg-red-700">
                        Confirm Ambulance
                      </Button>
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>

            </div>

            {/* My Appointments */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  My Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    You haven't booked any appointments yet. Book one above!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {myAppointments.map((apt: any) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{apt.appointment_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(apt.preferred_date), 'PPP')}
                            {apt.preferred_time && ` - ${apt.preferred_time}`}
                          </div>
                          {apt.doctors && (
                            <div className="text-sm text-muted-foreground">
                              Dr. {apt.doctors.name} ({apt.doctors.specialty})
                            </div>
                          )}
                        </div>
                        <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hospital Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    About MediCare Hospital
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    MediCare Hospital is a state-of-the-art healthcare facility providing
                    comprehensive medical services with a focus on patient-centered care.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      <span className="text-sm">50+ Specialist Doctors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">15 Medical Departments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm">24/7 Emergency Services</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Contact & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          123 Healthcare Avenue, Medical District, City 12345
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium">Hours</p>
                        <p className="text-sm text-muted-foreground">
                          OPD: Mon-Sat 9AM-8PM<br />
                          Emergency: 24/7
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d121059.04360432657!2d73.86296739999999!3d18.5246036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2bf2e67461101%3A0x828d43bf9d9ee343!2sPune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1705662000000!5m2!1sen!2sin"
                      width="100%"
                      height="150"
                      style={{ border: 0, borderRadius: '8px' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Medical Reports</CardTitle>
                <CardDescription>View and download your medical reports here.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p>No reports available yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Payments</CardTitle>
                <CardDescription>Manage your payments and view invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mb-4 opacity-50" />
                  <p>No billing history found.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurance">
            <div className="max-w-2xl mx-auto">
              <InsuranceClaimForm />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Maya Chatbot */}
      <MayaChatbot />
    </div>
  );
};

export default PatientDashboard;

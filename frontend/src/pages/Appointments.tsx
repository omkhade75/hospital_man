import { useState } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Clock, User, Stethoscope, MoreHorizontal, Loader2, CheckCircle, XCircle, Phone, Bell, CalendarDays, Mail, PhoneCall } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppointments, useUpdateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import { usePatientAppointments, useUpdatePatientAppointment } from "@/hooks/usePatientAppointments";
import AddAppointmentModal from "@/components/modals/AddAppointmentModal";
import { useVapiCall } from "@/hooks/useVapiCall";

const statusStyles = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-info/10 text-info border-info/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-muted text-muted-foreground border-muted",
};

const Appointments = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("scheduled");

  const selectedDate = date ? format(date, "yyyy-MM-dd") : undefined;
  const { data: appointments, isLoading } = useAppointments(selectedDate);
  const { data: patientAppointments, isLoading: isLoadingPatientAppts } = usePatientAppointments();
  const updateAppointment = useUpdateAppointment();
  const updatePatientAppointment = useUpdatePatientAppointment();
  const deleteAppointment = useDeleteAppointment();
  const vapiCall = useVapiCall();

  const pendingPatientAppointments = patientAppointments?.filter(a => a.status === "pending") || [];
  const confirmedPatientAppointments = patientAppointments?.filter(a => a.status === "confirmed") || [];

  const handleAICall = async (appointmentId: string, action: 'confirm' | 'reminder' | 'cancel') => {
    await vapiCall.mutateAsync({ appointmentId, action });
  };

  const filteredAppointments = appointments?.filter((apt) => {
    const patientName = apt.patients?.name?.toLowerCase() || "";
    const doctorName = apt.doctors?.name?.toLowerCase() || "";
    const matchesSearch = 
      patientName.includes(searchQuery.toLowerCase()) ||
      doctorName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    total: appointments?.length || 0,
    confirmed: appointments?.filter(a => a.status === "confirmed").length || 0,
    pending: appointments?.filter(a => a.status === "pending").length || 0,
    cancelled: appointments?.filter(a => a.status === "cancelled").length || 0,
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateAppointment.mutateAsync({ id, status });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAppointment.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handlePatientAppointmentStatus = async (id: string, status: string) => {
    await updatePatientAppointment.mutateAsync({ id, status });
  };

  return (
    <DashboardLayout title="Appointments" subtitle="Schedule and manage patient appointments">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Calendar & Stats */}
        <div className="space-y-6">
          <Card className="card-shadow border-border/50">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          <Card className="card-shadow border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Today's Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge variant="secondary">{statusCounts.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confirmed</span>
                <Badge className="bg-success/10 text-success border-success/20">{statusCounts.confirmed}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending</span>
                <Badge className="bg-warning/10 text-warning border-warning/20">{statusCounts.pending}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cancelled</span>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">{statusCounts.cancelled}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Appointments List */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <TabsList>
                <TabsTrigger value="scheduled" className="gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Scheduled
                </TabsTrigger>
                <TabsTrigger value="requests" className="gap-2">
                  <User className="w-4 h-4" />
                  Patient Requests
                  {pendingPatientAppointments.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingPatientAppointments.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>

            <TabsContent value="scheduled" className="mt-6 space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search appointments..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduled Appointments List */}
              <Card className="card-shadow border-border/50">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg">
                    Appointments for {date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredAppointments?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No appointments for this date. Schedule one to get started.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredAppointments?.map((apt) => (
                        <div key={apt.id} className="p-4 hover:bg-muted/30 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg min-w-[80px]">
                                <Clock className="w-4 h-4 text-muted-foreground mb-1" />
                                <span className="text-sm font-medium">{formatTime(apt.appointment_time)}</span>
                                <span className="text-xs text-muted-foreground">{apt.duration} min</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                                    {apt.patients?.name?.split(" ").map(n => n[0]).join("") || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 text-muted-foreground" />
                                    <p className="font-medium text-foreground">{apt.patients?.name || "Unknown"}</p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Stethoscope className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">{apt.doctors?.name || "Unknown"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <Badge variant="secondary" className="mb-1">{apt.type}</Badge>
                                <Badge variant="outline" className={statusStyles[apt.status as keyof typeof statusStyles] || statusStyles.pending}>
                                  {apt.status}
                                </Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleAICall(apt.id, "confirm")} disabled={vapiCall.isPending}>
                                    <Phone className="w-4 h-4 mr-2 text-primary" />
                                    AI Confirm Call
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAICall(apt.id, "reminder")} disabled={vapiCall.isPending}>
                                    <Bell className="w-4 h-4 mr-2 text-info" />
                                    AI Reminder Call
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "confirmed")}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                                    Confirm
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "completed")}>
                                    Mark Complete
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "cancelled")} className="text-destructive">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setDeleteId(apt.id)} className="text-destructive">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="mt-6 space-y-4">
              {/* Patient Requests List */}
              <Card className="card-shadow border-border/50">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Patient Appointment Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingPatientAppts ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : patientAppointments?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No patient appointment requests yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {patientAppointments?.map((apt) => (
                        <div key={apt.id} className="p-4 hover:bg-muted/30 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg min-w-[100px]">
                                <CalendarDays className="w-4 h-4 text-muted-foreground mb-1" />
                                <span className="text-sm font-medium">{format(new Date(apt.preferred_date), "MMM d, yyyy")}</span>
                                <span className="text-xs text-muted-foreground capitalize">{apt.preferred_time || "Any time"}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                                    {apt.patient_name?.split(" ").map(n => n[0]).join("") || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 text-muted-foreground" />
                                    <p className="font-medium text-foreground">{apt.patient_name}</p>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-1">
                                      <PhoneCall className="w-3 h-3 text-muted-foreground" />
                                      <p className="text-sm text-muted-foreground">{apt.patient_phone}</p>
                                    </div>
                                    {apt.patient_email && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">{apt.patient_email}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {apt.doctors && (
                                      <div className="flex items-center gap-1">
                                        <Stethoscope className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">{apt.doctors.name}</p>
                                      </div>
                                    )}
                                    {apt.departments && (
                                      <Badge variant="outline" className="text-xs">{apt.departments.name}</Badge>
                                    )}
                                  </div>
                                  {apt.notes && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">"{apt.notes}"</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <Badge variant="secondary" className="mb-1 capitalize">{apt.appointment_type}</Badge>
                                <Badge variant="outline" className={statusStyles[apt.status as keyof typeof statusStyles] || statusStyles.pending}>
                                  {apt.status}
                                </Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handlePatientAppointmentStatus(apt.id, "confirmed")}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                                    Confirm Request
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePatientAppointmentStatus(apt.id, "cancelled")} className="text-destructive">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject Request
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AddAppointmentModal open={showAddModal} onOpenChange={setShowAddModal} selectedDate={date} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Appointments;

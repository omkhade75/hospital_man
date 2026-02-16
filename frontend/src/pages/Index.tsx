import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Users, CalendarCheck, BedDouble, Stethoscope, Loader2, Clock, User } from "lucide-react";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { useAppointments } from "@/hooks/useAppointments";
import { useDepartments } from "@/hooks/useDepartments";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  UserPlus, 
  CalendarPlus, 
  BedDouble as BedIcon,
  Pill,
  FileText,
  ClipboardCheck,
  Building2,
  TrendingUp
} from "lucide-react";
import AddPatientModal from "@/components/modals/AddPatientModal";
import AddAppointmentModal from "@/components/modals/AddAppointmentModal";

const statusStyles = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-info/10 text-info border-info/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const Index = () => {
  const navigate = useNavigate();
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);

  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: doctors, isLoading: doctorsLoading } = useDoctors();
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments(format(new Date(), "yyyy-MM-dd"));
  const { data: departments, isLoading: departmentsLoading } = useDepartments();

  const isLoading = patientsLoading || doctorsLoading || appointmentsLoading || departmentsLoading;

  const totalBeds = departments?.reduce((sum, d) => sum + d.total_beds, 0) || 0;
  const occupiedBeds = departments?.reduce((sum, d) => sum + d.occupied_beds, 0) || 0;
  const availableBeds = totalBeds - occupiedBeds;

  const availableDoctors = doctors?.filter(d => d.available).length || 0;
  const pendingAppointments = appointments?.filter(a => a.status === "pending").length || 0;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const quickActions = [
    { icon: UserPlus, label: "Add Patient", description: "Register new patient", color: "bg-primary/10 text-primary hover:bg-primary/20", onClick: () => setShowAddPatient(true) },
    { icon: CalendarPlus, label: "New Appointment", description: "Schedule appointment", color: "bg-info/10 text-info hover:bg-info/20", onClick: () => setShowAddAppointment(true) },
    { icon: BedIcon, label: "Bed Management", description: "Manage bed allocation", color: "bg-success/10 text-success hover:bg-success/20", onClick: () => navigate("/beds") },
    { icon: Pill, label: "Prescriptions", description: "Write prescription", color: "bg-warning/10 text-warning hover:bg-warning/20", onClick: () => {} },
    { icon: FileText, label: "Lab Reports", description: "View lab results", color: "bg-secondary text-secondary-foreground hover:bg-secondary/80", onClick: () => navigate("/reports") },
    { icon: ClipboardCheck, label: "Discharge", description: "Process discharge", color: "bg-accent text-accent-foreground hover:bg-accent/80", onClick: () => {} },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Welcome back! Here's an overview of your hospital."
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Patients"
          value={patients?.length || 0}
          change={`${patients?.filter(p => p.status === "admitted").length || 0} currently admitted`}
          changeType="neutral"
          icon={Users}
          iconColor="primary"
        />
        <StatCard
          title="Today's Appointments"
          value={appointments?.length || 0}
          change={`${pendingAppointments} pending confirmation`}
          changeType="neutral"
          icon={CalendarCheck}
          iconColor="info"
        />
        <StatCard
          title="Available Beds"
          value={availableBeds}
          change={`Out of ${totalBeds} total`}
          changeType="neutral"
          icon={BedDouble}
          iconColor="success"
        />
        <StatCard
          title="Active Doctors"
          value={availableDoctors}
          change={`${(doctors?.length || 0) - availableDoctors} on leave`}
          changeType="neutral"
          icon={Stethoscope}
          iconColor="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl card-shadow border border-border/50 animate-fade-in">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Today's Appointments
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {appointments?.length || 0} appointments scheduled
              </p>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {appointments?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No appointments scheduled for today.
                </div>
              ) : (
                appointments?.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="p-4 hover:bg-muted/50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                            {apt.patients?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{apt.patients?.name || "Unknown"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Stethoscope className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{apt.doctors?.name || "Unknown"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(apt.appointment_time)}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("mt-1 capitalize", statusStyles[apt.status as keyof typeof statusStyles] || statusStyles.pending)}
                        >
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">{apt.type}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button 
                className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                onClick={() => navigate("/appointments")}
              >
                View All Appointments →
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Column - Quick Actions & Departments */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-card rounded-xl card-shadow border border-border/50 p-6 animate-fade-in">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  className={`h-auto flex-col items-center gap-2 p-4 ${action.color} transition-all duration-200`}
                  onClick={action.onClick}
                >
                  <action.icon className="w-6 h-6" />
                  <div className="text-center">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs opacity-70">{action.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Department Status */}
          <div className="bg-card rounded-xl card-shadow border border-border/50 animate-fade-in">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground">Department Status</h3>
              <p className="text-sm text-muted-foreground mt-1">Current occupancy</p>
            </div>
            <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
              {departments?.slice(0, 5).map((dept) => {
                const occupancy = dept.total_beds > 0 ? Math.round((dept.occupied_beds / dept.total_beds) * 100) : 0;
                return (
                  <div key={dept.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{dept.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {dept.doctors_count} doctors
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          {dept.occupied_beds}
                          <span className="text-sm font-normal text-muted-foreground">/{dept.total_beds}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">beds</p>
                      </div>
                    </div>
                    <Progress
                      value={occupancy}
                      className={cn(
                        "h-2",
                        occupancy > 80 && "[&>div]:bg-warning",
                        occupancy > 90 && "[&>div]:bg-destructive"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="bg-card rounded-xl card-shadow border border-border/50 animate-fade-in">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">Recent Patients</h3>
            <p className="text-sm text-muted-foreground mt-1">Recently registered patients</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/patients")}>
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Patient</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Condition</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Room</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients?.slice(0, 4).map((patient) => (
                <tr key={patient.id} className="hover:bg-muted/30 transition-colors duration-200">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                          {patient.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.age} yrs, {patient.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-foreground">{patient.condition || "—"}</p>
                  </td>
                  <td className="p-4">
                    {patient.room ? (
                      <Badge variant="secondary" className="font-mono">{patient.room}</Badge>
                    ) : "—"}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        patient.status === "stable" && "bg-success/10 text-success border-success/20",
                        patient.status === "admitted" && "bg-info/10 text-info border-info/20",
                        patient.status === "critical" && "bg-destructive/10 text-destructive border-destructive/20",
                        patient.status === "outpatient" && "bg-success/10 text-success border-success/20"
                      )}
                    >
                      {patient.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {(!patients || patients.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No patients yet. Add your first patient to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPatientModal open={showAddPatient} onOpenChange={setShowAddPatient} />
      <AddAppointmentModal open={showAddAppointment} onOpenChange={setShowAddAppointment} />
    </DashboardLayout>
  );
};

export default Index;

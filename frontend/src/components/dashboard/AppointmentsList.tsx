import { Clock, Stethoscope, Loader2, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/hooks/useAppointments";
import { format } from "date-fns";

const statusStyles = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-info/10 text-info border-info/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const AppointmentsList = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: appointments, isLoading } = useAppointments(today);

  return (
    <div className="bg-card rounded-xl card-shadow border border-border/50 animate-fade-in h-full overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Today's Appointments
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? "Loading appointments..." : `${appointments?.length || 0} appointments scheduled`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p>Syncing scheduled list...</p>
          </div>
        ) : appointments && appointments.length > 0 ? (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 hover:bg-muted/50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                      {apt.patients?.name
                        ? apt.patients.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                        : "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{apt.patients?.name || "Unknown Patient"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Stethoscope className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {apt.doctors?.name || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-foreground font-medium">
                    <Clock className="w-3 h-3" />
                    {apt.appointment_time}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("mt-1 capitalize text-[10px]", statusStyles[apt.status as keyof typeof statusStyles] || "")}
                  >
                    {apt.status || 'Scheduled'}
                  </Badge>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-[10px] h-5">
                  {apt.type}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No appointments for today.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-muted/20">
        <button
          onClick={() => window.location.href = '/appointments'}
          className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View Full Schedule →
        </button>
      </div>
    </div>
  );
};

export default AppointmentsList;


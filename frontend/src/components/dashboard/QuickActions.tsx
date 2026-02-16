import { 
  UserPlus, 
  CalendarPlus, 
  FileText, 
  BedDouble,
  Pill,
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  {
    icon: UserPlus,
    label: "Add Patient",
    description: "Register new patient",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    icon: CalendarPlus,
    label: "New Appointment",
    description: "Schedule appointment",
    color: "bg-info/10 text-info hover:bg-info/20",
  },
  {
    icon: BedDouble,
    label: "Assign Bed",
    description: "Manage bed allocation",
    color: "bg-success/10 text-success hover:bg-success/20",
  },
  {
    icon: Pill,
    label: "Prescriptions",
    description: "Write prescription",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  {
    icon: FileText,
    label: "Lab Reports",
    description: "View lab results",
    color: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  },
  {
    icon: ClipboardCheck,
    label: "Discharge",
    description: "Process discharge",
    color: "bg-accent text-accent-foreground hover:bg-accent/80",
  },
];

const QuickActions = () => {
  return (
    <div className="bg-card rounded-xl card-shadow border border-border/50 p-6 animate-fade-in">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className={`h-auto flex-col items-center gap-2 p-4 ${action.color} transition-all duration-200`}
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
  );
};

export default QuickActions;

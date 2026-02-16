import { Building2, Users, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const departments = [
  {
    name: "Cardiology",
    patients: 45,
    capacity: 60,
    doctors: 8,
    trend: "+5%",
  },
  {
    name: "Neurology",
    patients: 32,
    capacity: 40,
    doctors: 6,
    trend: "+2%",
  },
  {
    name: "Orthopedics",
    patients: 28,
    capacity: 35,
    doctors: 5,
    trend: "-1%",
  },
  {
    name: "Pediatrics",
    patients: 52,
    capacity: 70,
    doctors: 10,
    trend: "+8%",
  },
  {
    name: "Emergency",
    patients: 18,
    capacity: 25,
    doctors: 12,
    trend: "+3%",
  },
];

const DepartmentStatus = () => {
  return (
    <div className="bg-card rounded-xl card-shadow border border-border/50 animate-fade-in">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Department Status
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Current occupancy and capacity
        </p>
      </div>
      <div className="p-4 space-y-4">
        {departments.map((dept) => {
          const occupancy = Math.round((dept.patients / dept.capacity) * 100);
          return (
            <div
              key={dept.name}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{dept.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {dept.doctors} doctors
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          dept.trend.startsWith("+")
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        <TrendingUp className="w-3 h-3" />
                        {dept.trend}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">
                    {dept.patients}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{dept.capacity}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">patients</p>
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
  );
};

export default DepartmentStatus;

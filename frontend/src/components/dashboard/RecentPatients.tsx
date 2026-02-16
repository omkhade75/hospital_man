import { MoreHorizontal, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const patients = [
  {
    id: 1,
    name: "John Smith",
    age: 45,
    gender: "Male",
    condition: "Hypertension",
    status: "stable",
    admitted: "2024-01-10",
    room: "301-A",
  },
  {
    id: 2,
    name: "Emily Davis",
    age: 32,
    gender: "Female",
    condition: "Post-Surgery",
    status: "recovering",
    admitted: "2024-01-12",
    room: "205-B",
  },
  {
    id: 3,
    name: "Robert Johnson",
    age: 58,
    gender: "Male",
    condition: "Cardiac Monitoring",
    status: "critical",
    admitted: "2024-01-13",
    room: "ICU-02",
  },
  {
    id: 4,
    name: "Maria Garcia",
    age: 28,
    gender: "Female",
    condition: "Observation",
    status: "stable",
    admitted: "2024-01-14",
    room: "108-A",
  },
];

const statusStyles = {
  stable: "bg-success/10 text-success border-success/20",
  recovering: "bg-info/10 text-info border-info/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const RecentPatients = () => {
  return (
    <div className="bg-card rounded-xl card-shadow border border-border/50 animate-fade-in">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Recent Patients
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Currently admitted patients
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Patient
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Condition
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Room
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className="hover:bg-muted/30 transition-colors duration-200"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {patient.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {patient.age} yrs, {patient.gender}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-foreground">{patient.condition}</p>
                  <p className="text-xs text-muted-foreground">
                    Admitted: {patient.admitted}
                  </p>
                </td>
                <td className="p-4">
                  <Badge variant="secondary" className="font-mono">
                    {patient.room}
                  </Badge>
                </td>
                <td className="p-4">
                  <Badge
                    variant="outline"
                    className={statusStyles[patient.status as keyof typeof statusStyles]}
                  >
                    {patient.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Record</DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="w-4 h-4 mr-2" />
                        Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentPatients;

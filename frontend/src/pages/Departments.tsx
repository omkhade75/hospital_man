import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Brain, 
  Bone, 
  Baby, 
  Stethoscope, 
  Activity,
  Plus,
  Users,
  BedDouble,
  TrendingUp,
  Loader2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDepartments, useDeleteDepartment } from "@/hooks/useDepartments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Cardiology": Heart,
  "Neurology": Brain,
  "Orthopedics": Bone,
  "Pediatrics": Baby,
  "Emergency": Activity,
  "Oncology": Stethoscope,
};

const colorMap: Record<string, string> = {
  "Cardiology": "text-red-500 bg-red-500/10",
  "Neurology": "text-purple-500 bg-purple-500/10",
  "Orthopedics": "text-orange-500 bg-orange-500/10",
  "Pediatrics": "text-pink-500 bg-pink-500/10",
  "Emergency": "text-red-600 bg-red-600/10",
  "Oncology": "text-green-500 bg-green-500/10",
};

const Departments = () => {
  const { data: departments, isLoading } = useDepartments();
  const deleteDepartment = useDeleteDepartment();

  const handleDelete = (id: string) => {
    deleteDepartment.mutate(id);
  };

  return (
    <DashboardLayout title="Departments" subtitle="Manage hospital departments and their resources">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">
            {departments?.length || 0} active departments
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments?.map((dept) => {
            const occupancy = dept.total_beds > 0 ? Math.round((dept.occupied_beds / dept.total_beds) * 100) : 0;
            const Icon = iconMap[dept.name] || Stethoscope;
            const colorClass = colorMap[dept.name] || "text-primary bg-primary/10";
            
            return (
              <Card 
                key={dept.id} 
                className="card-shadow border-border/50 hover:shadow-elevated transition-all duration-300 cursor-pointer animate-fade-in group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={cn("p-3 rounded-xl", colorClass)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-success border-success/30 bg-success/5">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Department</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{dept.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(dept.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-heading mt-3">{dept.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{dept.head_doctor || "No head assigned"}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Staff Info */}
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{dept.doctors_count} doctors</span>
                    </div>
                    <span className="text-muted-foreground">{dept.nurses_count} nurses</span>
                  </div>

                  {/* Bed Occupancy */}
                  {dept.total_beds > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-muted-foreground" />
                          Bed Occupancy
                        </span>
                        <span className="font-medium">{dept.occupied_beds}/{dept.total_beds}</span>
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
                  )}

                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Departments;

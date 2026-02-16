import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  Activity,
  ClipboardList,
  BarChart3,
  PieChart,
  Loader2
} from "lucide-react";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { useAppointments } from "@/hooks/useAppointments";
import { useDepartments } from "@/hooks/useDepartments";

const Reports = () => {
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: doctors, isLoading: doctorsLoading } = useDoctors();
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();

  const isLoading = patientsLoading || doctorsLoading || appointmentsLoading || departmentsLoading;

  const reportCategories = [
    {
      title: "Patient Reports",
      description: "Patient demographics, admissions, and treatment history",
      icon: Users,
      color: "bg-primary/10 text-primary",
      stats: `${patients?.length || 0} total patients`,
      reports: ["Patient Demographics", "Admission History", "Treatment Summary", "Discharge Reports"]
    },
    {
      title: "Appointment Reports",
      description: "Appointment scheduling and status tracking",
      icon: Calendar,
      color: "bg-info/10 text-info",
      stats: `${appointments?.length || 0} appointments`,
      reports: ["Daily Schedule", "Appointment Status", "No-show Analysis", "Wait Time Report"]
    },
    {
      title: "Department Reports",
      description: "Department-wise performance and resource utilization",
      icon: Activity,
      color: "bg-success/10 text-success",
      stats: `${departments?.length || 0} departments`,
      reports: ["Department Overview", "Bed Occupancy", "Staff Distribution", "Resource Usage"]
    },
    {
      title: "Staff Reports",
      description: "Doctor and staff performance metrics",
      icon: ClipboardList,
      color: "bg-warning/10 text-warning",
      stats: `${doctors?.length || 0} doctors`,
      reports: ["Doctor Performance", "Staff Attendance", "Workload Analysis", "Shift Reports"]
    },
  ];

  const quickStats = [
    { label: "Total Patients", value: patients?.length || 0, icon: Users, trend: "+12%" },
    { label: "Active Appointments", value: appointments?.filter(a => a.status === "scheduled").length || 0, icon: Calendar, trend: "+5%" },
    { label: "Available Doctors", value: doctors?.filter(d => d.available).length || 0, icon: Activity, trend: "0%" },
    { label: "Departments", value: departments?.length || 0, icon: BarChart3, trend: "+2" },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Reports" subtitle="Hospital analytics and reports">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Reports" subtitle="Hospital analytics and reports">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="card-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs text-success">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.trend}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category, index) => (
          <Card key={index} className="card-shadow hover:shadow-elevated transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary">{category.stats}</Badge>
              </div>
              <CardTitle className="text-lg mt-3">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.reports.map((report, reportIndex) => (
                  <div 
                    key={reportIndex}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{report}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Preview */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Admissions Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Analytics visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Analytics visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;

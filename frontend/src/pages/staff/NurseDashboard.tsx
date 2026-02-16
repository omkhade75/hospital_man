import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { BedDouble, ClipboardCheck, Activity, Users } from "lucide-react";
import { useDepartments } from "@/hooks/useDepartments";
import { usePatients } from "@/hooks/usePatients";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const NurseDashboard = () => {
    const navigate = useNavigate();
    const { data: departments, isLoading: deptLoading } = useDepartments();
    const { data: patients, isLoading: patLoading } = usePatients();

    if (deptLoading || patLoading) {
        return <DashboardLayout title="Nurse Dashboard" subtitle="Loading..."><div /></DashboardLayout>;
    }

    const admittedPatients = patients?.filter(p => p.status === 'admitted' || p.status === 'critical') || [];
    const criticalPatients = patients?.filter(p => p.status === 'critical') || [];

    return (
        <DashboardLayout
            title="Nurse Station"
            subtitle="In-patient care and ward management."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Admitted Patients"
                    value={admittedPatients.length}
                    change="Currently in wards"
                    changeType="neutral"
                    icon={Users}
                    iconColor="primary"
                />
                <StatCard
                    title="Critical Cases"
                    value={criticalPatients.length}
                    change="Need attention"
                    changeType={criticalPatients.length > 0 ? "negative" : "positive"}
                    icon={Activity}
                    iconColor="destructive"
                />
                <StatCard
                    title="Tasks Pending"
                    value={0}
                    change="Shift tasks"
                    changeType="neutral"
                    icon={ClipboardCheck}
                    iconColor="warning"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ward Status */}
                <div className="bg-card rounded-xl border border-border/50 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg">Ward Occupancy</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/beds')}>Manage Beds</Button>
                    </div>
                    <div className="space-y-4">
                        {departments?.map((dept) => {
                            const occupancy = dept.total_beds > 0 ? (dept.occupied_beds / dept.total_beds) * 100 : 0;
                            return (
                                <div key={dept.id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{dept.name}</span>
                                        <span className="text-muted-foreground">{dept.occupied_beds}/{dept.total_beds}</span>
                                    </div>
                                    <Progress value={occupancy} className="h-2" />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Critical Patients List */}
                <div className="bg-card rounded-xl border border-border/50 p-6">
                    <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Critical Watchlist
                    </h3>
                    <div className="space-y-3">
                        {criticalPatients.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No critical patients reported.</p>
                        ) : (
                            criticalPatients.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div>
                                        <p className="font-medium text-red-900">{p.name}</p>
                                        <p className="text-xs text-red-700">Room: {p.room || 'Unassigned'}</p>
                                    </div>
                                    <Badge variant="destructive">Critical</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NurseDashboard;

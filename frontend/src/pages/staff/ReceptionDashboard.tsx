import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Users, CalendarPlus, UserPlus, PhoneCall, BedDouble, Receipt } from "lucide-react";
import { useDoctors } from "@/hooks/useDoctors";
import { useDepartments } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import AddPatientModal from "@/components/modals/AddPatientModal";
import AddAppointmentModal from "@/components/modals/AddAppointmentModal";
import UploadReportModal from "@/components/modals/UploadReportModal";

const ReceptionDashboard = () => {
    const navigate = useNavigate();
    const [showAddPatient, setShowAddPatient] = useState(false);
    const [showAddAppointment, setShowAddAppointment] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const { data: doctors, isLoading: doctorsLoading } = useDoctors();
    const { data: departments, isLoading: departmentsLoading } = useDepartments();

    const availableDoctors = doctors?.filter(d => d.available).length || 0;
    const totalBeds = departments?.reduce((sum, d) => sum + d.total_beds, 0) || 0;
    const occupiedBeds = departments?.reduce((sum, d) => sum + d.occupied_beds, 0) || 0;

    if (doctorsLoading || departmentsLoading) {
        return <DashboardLayout title="Reception Dashboard" subtitle="Loading..."><div /></DashboardLayout>;
    }

    return (
        <DashboardLayout
            title="Reception Dashboard"
            subtitle="Front desk operations and patient management."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Available Doctors"
                    value={availableDoctors}
                    change="Available now"
                    changeType="positive"
                    icon={Users}
                    iconColor="primary"
                />
                <StatCard
                    title="Bed Availability"
                    value={totalBeds - occupiedBeds}
                    change={`${occupiedBeds} occupied`}
                    changeType={totalBeds - occupiedBeds < 5 ? "negative" : "neutral"}
                    icon={BedDouble}
                    iconColor="info"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            className="h-24 flex-col gap-2"
                            variant="outline"
                            onClick={() => setShowAddPatient(true)}
                        >
                            <UserPlus className="w-6 h-6 text-primary" />
                            Register Patient
                        </Button>
                        <Button
                            className="h-24 flex-col gap-2"
                            variant="outline"
                            onClick={() => setShowAddAppointment(true)}
                        >
                            <CalendarPlus className="w-6 h-6 text-green-600" />
                            Book Appointment
                        </Button>
                        <Button
                            className="h-24 flex-col gap-2"
                            variant="outline"
                            onClick={() => navigate('/callbacks')}
                        >
                            <PhoneCall className="w-6 h-6 text-orange-600" />
                            Callbacks
                        </Button>
                        <Button
                            className="h-24 flex-col gap-2"
                            variant="outline"
                            onClick={() => navigate('/beds')}
                        >
                            <BedDouble className="w-6 h-6 text-blue-600" />
                            Check Beds
                        </Button>
                        <Button
                            className="h-24 flex-col gap-2"
                            variant="outline"
                            onClick={() => setShowUploadModal(true)}
                        >
                            <Receipt className="w-6 h-6 text-purple-600" />
                            Upload Receipt
                        </Button>
                    </div>
                </div>
            </div>

            <AddPatientModal open={showAddPatient} onOpenChange={setShowAddPatient} />
            <AddAppointmentModal open={showAddAppointment} onOpenChange={setShowAddAppointment} />
            <UploadReportModal open={showUploadModal} onOpenChange={setShowUploadModal} defaultType="bill" />
        </DashboardLayout>
    );
};

export default ReceptionDashboard;

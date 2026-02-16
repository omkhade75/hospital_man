import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { CalendarCheck, Stethoscope, Loader2, Clock, FileText, User, Upload, Activity, Search, History, Send, ClipboardList } from "lucide-react";
import { useAppointments } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import UploadReportModal from "@/components/modals/UploadReportModal";
import { toast } from "sonner";

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Instructions State
    const [instruction, setInstruction] = useState("");
    const [priority, setPriority] = useState("normal");
    const [recipient, setRecipient] = useState("nurse");

    // History Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPatientHistory, setSelectedPatientHistory] = useState<any>(null);

    // Filter appointments for the current doctor
    const { data: appointments, isLoading: appointmentsLoading } = useAppointments(format(new Date(), "yyyy-MM-dd"));
    const { data: patients, isLoading: patientsLoading } = usePatients();

    const isLoading = appointmentsLoading || patientsLoading;

    if (isLoading) {
        return (
            <DashboardLayout title="Doctor Dashboard" subtitle="Loading...">
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const pendingAppointments = appointments?.filter(a => a.status === "pending").length || 0;
    const todayAppointments = appointments?.length || 0;

    const handleSendInstruction = () => {
        if (!instruction.trim()) {
            toast.error("Please enter an instruction");
            return;
        }
        // Mock sending instruction
        toast.success("Instruction sent to staff", {
            description: `Sent to ${recipient} with ${priority} priority.`
        });
        setInstruction("");
        setPriority("normal");
    };

    const handleHistorySearch = () => {
        if (!searchQuery) return;
        const found = patients?.find(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.patient_id?.includes(searchQuery));

        if (found) {
            // Mock history data
            setSelectedPatientHistory({
                ...found,
                visits: [
                    { date: "2024-01-10", reason: "Fever", doctor: "Dr. Smith" },
                    { date: "2023-12-05", reason: "General Checkup", doctor: "Dr. Smith" }
                ],
                reports: [
                    { date: "2024-01-10", name: "Blood Test", type: "lab" },
                    { date: "2023-12-05", name: "X-Ray Chest", type: "imaging" }
                ]
            });
        } else {
            toast.error("Patient not found");
            setSelectedPatientHistory(null);
        }
    };

    return (
        <DashboardLayout
            title="Doctor Dashboard"
            subtitle="Manage your appointments and patients."
        >
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="patients">My Patients</TabsTrigger>
                    <TabsTrigger value="instructions">Staff Instructions</TabsTrigger>
                    <TabsTrigger value="records">Patient Records</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <StatCard
                            title="Today's Appointments"
                            value={todayAppointments}
                            change={`${pendingAppointments} pending`}
                            changeType="neutral"
                            icon={CalendarCheck}
                            iconColor="primary"
                        />
                        <StatCard
                            title="My Patients"
                            value={appointments?.map(a => a.patient_id).filter((v, i, a) => a.indexOf(v) === i).length || 0} // Unique patients today
                            change="Seen today"
                            changeType="neutral"
                            icon={User}
                            iconColor="info"
                        />
                        <StatCard
                            title="Pending Reports"
                            value={0}
                            change="To review"
                            changeType="neutral"
                            icon={FileText}
                            iconColor="warning"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content - Appointments */}
                        <div className="lg:col-span-2 bg-card rounded-xl card-shadow border border-border/50 animate-fade-in p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-heading font-semibold text-foreground">Upcoming Appointments</h3>
                                <span className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMM")}</span>
                            </div>

                            <div className="divide-y divide-border">
                                {appointments?.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No appointments scheduled for today.
                                    </div>
                                ) : (
                                    appointments?.map((apt) => (
                                        <div key={apt.id} className="py-4 flex items-center justify-between hover:bg-muted/50 px-2 rounded-lg transition-colors">
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {apt.patients?.name?.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{apt.patients?.name}</p>
                                                    <p className="text-sm text-muted-foreground capitalize">{apt.type}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-sm text-foreground mb-1 justify-end">
                                                    <Clock className="w-3 h-3" />
                                                    {apt.appointment_time}
                                                </div>
                                                <Badge variant={apt.status === 'confirmed' ? 'default' : 'outline'}>
                                                    {apt.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar - Quick Actions */}
                        <div className="space-y-6">
                            <div className="bg-card rounded-xl card-shadow border border-border/50 p-6 animate-fade-in">
                                <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12"
                                        onClick={() => setShowUploadModal(true)}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Medical Report
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Write Prescription
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* My Patients Tab */}
                <TabsContent value="patients">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Patients</CardTitle>
                            <CardDescription>List of patients under your care or visited recently.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Age/Gender</TableHead>
                                            <TableHead>Condition</TableHead>
                                            <TableHead>Last Visit</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patients?.slice(0, 10).map((patient) => (
                                            <TableRow key={patient.id}>
                                                <TableCell className="font-medium">{patient.name}</TableCell>
                                                <TableCell>{patient.age} / {patient.gender}</TableCell>
                                                <TableCell>{patient.condition || "-"}</TableCell>
                                                <TableCell>Today</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{patient.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Staff Instructions Tab */}
                <TabsContent value="instructions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Staff Instruction Center</CardTitle>
                            <CardDescription>Send instructions or tasks to nurses and receptionists.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Recipient Role</Label>
                                    <Select value={recipient} onValueChange={setRecipient}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nurse">Nurse Station</SelectItem>
                                            <SelectItem value="reception">Reception</SelectItem>
                                            <SelectItem value="all">All Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Instruction / Task</Label>
                                <Textarea
                                    placeholder="Enter detailed instruction here..."
                                    className="min-h-[120px]"
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleSendInstruction} className="gap-2">
                                <Send className="w-4 h-4" /> Send Instruction
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Patient Records Tab (History & Reports) */}
                <TabsContent value="records">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Patient Search</CardTitle>
                                <CardDescription>Search for a patient to view history and reports.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4">
                                    <Input
                                        placeholder="Search by name or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleHistorySearch()}
                                    />
                                    <Button onClick={handleHistorySearch}>
                                        <Search className="w-4 h-4 mr-2" /> Search
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {selectedPatientHistory && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <History className="w-5 h-5 text-primary" />
                                            Visit History
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {selectedPatientHistory.visits.map((visit: any, index: number) => (
                                                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                                    <div>
                                                        <p className="font-medium">{visit.reason}</p>
                                                        <p className="text-sm text-muted-foreground">{visit.doctor}</p>
                                                    </div>
                                                    <Badge variant="outline">{visit.date}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList className="w-5 h-5 text-blue-600" />
                                            Medical Reports
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {selectedPatientHistory.reports.map((report: any, index: number) => (
                                                <div key={index} className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                        <div>
                                                            <p className="font-medium text-blue-900">{report.name}</p>
                                                            <p className="text-xs text-blue-700 capitalize">{report.type}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-8 text-blue-700 hover:text-blue-900">
                                                        View
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" className="w-full mt-2" onClick={() => setShowUploadModal(true)}>
                                                <Upload className="w-4 h-4 mr-2" /> Upload New Report
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <UploadReportModal open={showUploadModal} onOpenChange={setShowUploadModal} defaultType="lab" />
        </DashboardLayout>
    );
};

export default DoctorDashboard;

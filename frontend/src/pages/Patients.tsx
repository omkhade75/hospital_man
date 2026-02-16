import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, MoreHorizontal, Phone, Mail, FileText, Trash2, Loader2 } from "lucide-react";
import { usePatients, useDeletePatient, Patient } from "@/hooks/usePatients";
import AddPatientModal from "@/components/modals/AddPatientModal";
import PatientDetailsModal from "@/components/modals/PatientDetailsModal";
import UploadReportModal from "@/components/modals/UploadReportModal";

const statusStyles = {
  admitted: "bg-info/10 text-info border-info/20",
  outpatient: "bg-success/10 text-success border-success/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  discharged: "bg-muted text-muted-foreground border-muted",
};

const Patients = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: patients, isLoading } = usePatients();
  const deletePatient = useDeletePatient();

  const filteredPatients = patients?.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.condition?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deletePatient.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout title="Patients" subtitle="Manage patient records and information">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patients by name, ID, or condition..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="admitted">Admitted</SelectItem>
              <SelectItem value="outpatient">Outpatient</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="discharged">Discharged</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-card rounded-xl card-shadow border border-border/50 animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Condition</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Room</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPatients?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No patients found. Add your first patient to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients?.map((patient) => (
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
                          <code className="text-sm bg-muted px-2 py-1 rounded">{patient.patient_id}</code>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{patient.phone || "—"}</p>
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
                          <Badge variant="outline" className={statusStyles[patient.status as keyof typeof statusStyles] || statusStyles.outpatient}>
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
                              <DropdownMenuItem onClick={() => { setSelectedPatient(patient); setShowUploadModal(true); }}>
                                <FileText className="w-4 h-4 mr-2" />
                                Upload Record
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedPatient(patient); setShowDetailsModal(true); }}>
                                <FileText className="w-4 h-4 mr-2" />
                                View Records
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Details</DropdownMenuItem>
                              {patient.phone && (
                                <DropdownMenuItem onClick={() => window.open(`tel:${patient.phone}`)}>
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call
                                </DropdownMenuItem>
                              )}
                              {patient.email && (
                                <DropdownMenuItem onClick={() => window.open(`mailto:${patient.email}`)}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Email
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(patient.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPatients?.length || 0} of {patients?.length || 0} patients
              </p>
            </div>
          </>
        )}
      </div>

      <AddPatientModal open={showAddModal} onOpenChange={setShowAddModal} />
      <PatientDetailsModal open={showDetailsModal} onOpenChange={setShowDetailsModal} patient={selectedPatient} />
      <UploadReportModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        patientId={selectedPatient?.id}
        patientName={selectedPatient?.name}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Patients;

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Search, Plus, Phone, Mail, Calendar, Star, Loader2, Trash2, Clock } from "lucide-react";
import { useDoctors, useDeleteDoctor, Doctor } from "@/hooks/useDoctors";
import AddDoctorModal from "@/components/modals/AddDoctorModal";
import SetScheduleModal from "@/components/modals/SetScheduleModal";

const Doctors = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: doctors, isLoading } = useDoctors();
  const deleteDoctor = useDeleteDoctor();

  const filteredDoctors = doctors?.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && doctor.available) ||
      (availabilityFilter === "busy" && !doctor.available);
    return matchesSearch && matchesAvailability;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDoctor.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const openScheduleModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowScheduleModal(true);
  };

  return (
    <DashboardLayout title="Doctors" subtitle="Manage medical staff and their schedules">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search doctors by name or specialty..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">On Leave</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Doctor
          </Button>
        </div>
      </div>

      {/* Doctors Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredDoctors?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No doctors found. Add your first doctor to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors?.map((doctor) => (
            <Card key={doctor.id} className="card-shadow border-border/50 hover:shadow-elevated transition-shadow duration-300 animate-fade-in">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="w-20 h-20 mb-4">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                        {doctor.name.split(" ").slice(1).map((n) => n[0]).join("") || doctor.name.split(" ")[0][0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-4 right-0 w-4 h-4 rounded-full border-2 border-card ${doctor.available ? 'bg-success' : 'bg-muted-foreground'}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground">{doctor.name}</h3>
                  <Badge variant="secondary" className="mt-2">{doctor.specialty}</Badge>
                  <div className="flex items-center gap-1 mt-2 text-warning">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{doctor.rating}</span>
                  </div>
                  <div className="mt-4 w-full space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Experience</span>
                      <span className="text-foreground font-medium">{doctor.experience || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Patients</span>
                      <span className="text-foreground font-medium">{doctor.total_patients.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 w-full">
                    {doctor.phone && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`tel:${doctor.phone}`)}>
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    {doctor.email && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`mailto:${doctor.email}`)}>
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openScheduleModal(doctor)}
                      title="Set Schedule"
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(doctor.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button className="w-full mt-3" variant={doctor.available ? "default" : "secondary"} disabled={!doctor.available}>
                    {doctor.available ? "Book Appointment" : "On Leave"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddDoctorModal open={showAddModal} onOpenChange={setShowAddModal} />
      <SetScheduleModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        doctor={selectedDoctor}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this doctor? This action cannot be undone.
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

export default Doctors;

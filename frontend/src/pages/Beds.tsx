import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useBeds, useCreateBed, useDeleteBed, useUpdateBedStatus, Bed } from "@/hooks/useBeds";
import { useDepartments } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { BedDouble, Plus, Search, Trash2, User, Activity, Filter, Hotel, MoreVertical, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Beds = () => {
    const { data: beds, isLoading } = useBeds();
    const { data: departments } = useDepartments();
    const createBed = useCreateBed();
    const deleteBed = useDeleteBed();
    const updateBedStatus = useUpdateBedStatus();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editStatusOpen, setEditStatusOpen] = useState(false);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [bedToDelete, setBedToDelete] = useState<string | null>(null);

    // Form State
    const [newBed, setNewBed] = useState({
        bed_number: "",
        room_number: "",
        department_id: "",
        bed_type: "Standard",
        status: "Available"
    });

    const filteredBeds = beds?.filter((bed) => {
        const matchesSearch =
            bed.bed_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bed.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bed.patients?.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || bed.status === statusFilter;
        const matchesDept = departmentFilter === "all" || bed.department_id === departmentFilter;

        return matchesSearch && matchesStatus && matchesDept;
    });

    const stats = {
        total: beds?.length || 0,
        occupied: beds?.filter(b => b.status === "Occupied").length || 0,
        available: beds?.filter(b => b.status === "Available").length || 0,
        maintenance: beds?.filter(b => b.status === "Maintenance").length || 0,
    };

    const handleCreateBed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBed.department_id) {
            toast.error("Please select a department");
            return;
        }

        try {
            await createBed.mutateAsync(newBed);
            setIsAddOpen(false);
            setNewBed({
                bed_number: "",
                room_number: "",
                department_id: "",
                bed_type: "Standard",
                status: "Available"
            });
        } catch {
            toast.error("Failed to create bed");
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "Available": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
            case "Occupied": return "bg-red-500/10 text-red-600 border-red-200";
            case "Maintenance": return "bg-orange-500/10 text-orange-600 border-orange-200";
            default: return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    const getStatusDot = (status: string | null) => {
        switch (status) {
            case "Available": return "bg-emerald-500";
            case "Occupied": return "bg-red-500";
            case "Maintenance": return "bg-orange-500";
            default: return "bg-gray-400";
        }
    };

    return (
        <DashboardLayout title="Bed Management" subtitle="Monitor and manage hospital bed occupancy">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="shadow-sm border-l-4 border-l-primary">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Beds</p>
                            <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <BedDouble className="w-5 h-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-emerald-500">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Available</p>
                            <h3 className="text-2xl font-bold mt-1">{stats.available}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <Hotel className="w-5 h-5 text-emerald-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-red-500">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                            <h3 className="text-2xl font-bold mt-1">{stats.occupied}</h3>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <User className="w-5 h-5 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-orange-500">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                            <h3 className="text-2xl font-bold mt-1">{stats.maintenance}</h3>
                        </div>
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                            <Activity className="w-5 h-5 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="flex flex-1 gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search bed, room, or patient..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Occupied">Occupied</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments?.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Bed
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Bed</DialogTitle>
                            <DialogDescription>
                                Enter the details for the new bed unit.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateBed} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bed_number">Bed Number</Label>
                                    <Input
                                        id="bed_number"
                                        placeholder="e.g. B-101"
                                        value={newBed.bed_number}
                                        onChange={(e) => setNewBed({ ...newBed, bed_number: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="room_number">Room Number</Label>
                                    <Input
                                        id="room_number"
                                        placeholder="e.g. 101"
                                        value={newBed.room_number}
                                        onChange={(e) => setNewBed({ ...newBed, room_number: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select
                                    value={newBed.department_id}
                                    onValueChange={(val) => setNewBed({ ...newBed, department_id: val })}
                                >
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments?.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Bed Type</Label>
                                    <Select
                                        value={newBed.bed_type}
                                        onValueChange={(val) => setNewBed({ ...newBed, bed_type: val })}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="ICU">ICU</SelectItem>
                                            <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                                            <SelectItem value="Private">Private</SelectItem>
                                            <SelectItem value="VipSuite">VIP Suite</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Initial Status</Label>
                                    <Select
                                        value={newBed.status}
                                        onValueChange={(val) => setNewBed({ ...newBed, status: val })}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Available">Available</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Bed</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Bed Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredBeds?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                    <BedDouble className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No beds found</h3>
                    <p className="text-gray-500">Try adjusting your filters or add a new bed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredBeds?.map((bed) => (
                        <Card key={bed.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className={cn("absolute top-0 left-0 w-1 h-full", getStatusDot(bed.status || "Available"))} />

                            <CardHeader className="pb-2 pt-4 pl-5 pr-4 flex flex-row items-center justify-between space-y-0">
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {bed.room_number}
                                    </span>
                                    <CardTitle className="text-xl font-bold">
                                        {bed.bed_number}
                                    </CardTitle>
                                </div>
                                <Badge variant="outline" className={cn("capitalize", getStatusColor(bed.status))}>
                                    {bed.status}
                                </Badge>
                            </CardHeader>

                            <CardContent className="pl-5 pr-4 pb-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="font-medium">{bed.bed_type || "Standard"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Department:</span>
                                    <span className="font-medium truncate max-w-[120px]" title={bed.departments?.name}>
                                        {bed.departments?.name || "Unassigned"}
                                    </span>
                                </div>

                                {bed.status === "Occupied" && bed.patients && (
                                    <div className="mt-3 pt-3 border-t border-dashed">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Patient</span>
                                        </div>
                                        <p className="font-medium text-sm truncate">{bed.patients.name}</p>
                                    </div>
                                )}

                                <div className="pt-2 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedBed(bed);
                                                setEditStatusOpen(true);
                                            }}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Update Status
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setBedToDelete(bed.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!bedToDelete} onOpenChange={(open) => !open && setBedToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bed</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this bed? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (bedToDelete) {
                                    deleteBed.mutate(bedToDelete);
                                    setBedToDelete(null);
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={editStatusOpen} onOpenChange={setEditStatusOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Bed Status</DialogTitle>
                        <DialogDescription>
                            Change the status of the bed {selectedBed?.bed_number}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                key={selectedBed?.id}
                                defaultValue={selectedBed?.status || "Available"}
                                onValueChange={(val) => {
                                    if (selectedBed) {
                                        updateBedStatus.mutate({
                                            id: selectedBed.id,
                                            status: val,
                                            patient_id: val === "Available" ? null : selectedBed.patient_id
                                        });
                                        setEditStatusOpen(false);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Occupied">Occupied</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedBed?.status === "Occupied" && (
                            <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                Note: Changing from Occupied to Available will remove the patient assignment.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default Beds;

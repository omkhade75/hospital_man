import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { useUpdateDoctor, Doctor } from "@/hooks/useDoctors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PermissionRequestModal from "@/components/modals/PermissionRequestModal";

interface SetScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doctor: Doctor | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? "AM" : "PM";
    return `${hour}:00 ${ampm}`;
});

const SetScheduleModal = ({ open, onOpenChange, doctor }: SetScheduleModalProps) => {
    const [loading, setLoading] = useState(false);
    const updateDoctor = useUpdateDoctor();
    const { user } = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    // State for schedule - simple version: same hours for selected days
    const [selectedDays, setSelectedDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    const [startTime, setStartTime] = useState("9:00 AM");
    const [endTime, setEndTime] = useState("5:00 PM");
    const [isAvailable, setIsAvailable] = useState(true);

    useEffect(() => {
        if (doctor) {
            setIsAvailable(doctor.available);
            if (doctor.schedule) {
                try {
                    const schedule = typeof doctor.schedule === 'string'
                        ? JSON.parse(doctor.schedule)
                        : doctor.schedule;
                    if (schedule.start) setStartTime(schedule.start);
                    if (schedule.end) setEndTime(schedule.end);
                    if (schedule.days) setSelectedDays(schedule.days);
                } catch {
                    resetDefaults();
                }
            } else {
                resetDefaults();
            }
        }
        checkUserRole();
    }, [doctor, user]);

    const resetDefaults = () => {
        setStartTime("9:00 AM");
        setEndTime("5:00 PM");
        setSelectedDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    };

    const checkUserRole = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id.toString())
            .maybeSingle();
        if (data) setUserRole(data.role);
    };

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleSave = async () => {
        if (!doctor) return;

        // If receptionist, require admin approval
        if (userRole === 'receptionist') {
            setShowPermissionModal(true);
            return;
        }

        setLoading(true);
        try {
            const scheduleData = {
                days: selectedDays,
                start: startTime,
                end: endTime
            };


            await updateDoctor.mutateAsync({
                id: doctor.id,
                available: isAvailable,
                schedule: scheduleData
            });

            toast.success("Schedule updated successfully", {
                description: `Updated availability for ${doctor.name}`
            });
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update schedule";

            // Fallback: If 'schedule' column doesn't exist yet, try updating ONLY availability
            if (userRole !== 'receptionist') {
                try {
                    await updateDoctor.mutateAsync({
                        id: doctor.id,
                        available: isAvailable,
                    });
                    toast.warning("Availability updated, but detailed schedule could not be saved.", {
                        description: "The database may not yet support detailed schedules."
                    });
                    onOpenChange(false);
                    return;
                } catch {
                    // Retry failed silently
                }
            }

            // If it's a permission error that slipped through
            if (message.includes("permission") || message.includes("policy")) {
                toast.error("You do not have permission to perform this action.");
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Set Availability Schedule
                        </DialogTitle>
                        <DialogDescription>
                            Configure the weekly availability for <strong>{doctor?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                            <Label htmlFor="available-mode" className="flex flex-col space-y-1">
                                <span className="font-medium">Currently Available</span>
                                <span className="font-normal text-xs text-muted-foreground">Toggle global availability status.</span>
                            </Label>
                            <Switch
                                id="available-mode"
                                checked={isAvailable}
                                onCheckedChange={setIsAvailable}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Working Days</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => (
                                    <div
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={`
                                            cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                                            ${selectedDays.includes(day)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"}
                                        `}
                                    >
                                        {day.slice(0, 3)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Select value={startTime} onValueChange={setStartTime}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HOURS.map(hour => (
                                            <SelectItem key={`start-${hour}`} value={hour}>{hour}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Select value={endTime} onValueChange={setEndTime}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HOURS.map(hour => (
                                            <SelectItem key={`end-${hour}`} value={hour}>{hour}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save Schedule"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PermissionRequestModal
                open={showPermissionModal}
                onOpenChange={(open) => {
                    setShowPermissionModal(open);
                    if (!open) onOpenChange(false); // Close parent modal if request is done or cancelled
                }}
                action={`update schedule for Dr. ${doctor?.name}`}
            />
        </>
    );
};

export default SetScheduleModal;

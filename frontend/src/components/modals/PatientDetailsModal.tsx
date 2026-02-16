import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Pill, CreditCard, Download, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

interface PatientDetailsModalProps {
    patient: Tables<"patients"> | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PatientDetailsModal = ({ patient, open, onOpenChange }: PatientDetailsModalProps) => {
    if (!patient) return null;

    const handleDownloadPDF = () => {
        toast.success("Downloading patient records...", {
            description: "The PDF file will be downloaded shortly.",
        });
        // Mock simulation
        setTimeout(() => {
            toast.info("Download Complete", { description: `${patient.name}_records.pdf saved.` })
        }, 1500);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold">{patient.name}</DialogTitle>
                            <DialogDescription className="mt-1 flex items-center gap-2">
                                <span>ID: {patient.patient_id}</span>
                                <span>•</span>
                                <span>{patient.age} yrs, {patient.gender}</span>
                                <span>•</span>
                                <Badge variant="outline">{patient.status}</Badge>
                            </DialogDescription>
                        </div>
                        <Button onClick={handleDownloadPDF}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Records
                        </Button>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="reports">Medical Reports</TabsTrigger>
                        <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                        <TabsTrigger value="billing">Billing & Payments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Current Condition
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-semibold">{patient.condition || "Not recorded"}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Admitted: {patient.admitted_at ? format(new Date(patient.admitted_at), 'PPP') : 'N/A'}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Vitals
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>BP: 120/80</div>
                                        <div>Pulse: 72 bpm</div>
                                        <div>Temp: 98.6°F</div>
                                        <div>SpO2: 98%</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="reports" className="mt-4">
                        <ScrollArea className="h-[300px] border rounded-md p-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Blood Test Report (CBC)</p>
                                            <p className="text-sm text-muted-foreground">Jan 15, 2026</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">View</Button>
                                </div>
                                {/* Placeholder for more reports */}
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No more reports found.
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="prescriptions" className="mt-4">
                        <ScrollArea className="h-[300px] border rounded-md p-4">
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <h4 className="font-semibold">General Medication</h4>
                                        <span className="text-sm text-muted-foreground">Jan 16, 2026</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Pill className="w-4 h-4 text-primary" />
                                            <span>Paracetamol 500mg - 1-0-1 (3 days)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Pill className="w-4 h-4 text-primary" />
                                            <span>Amoxicillin 250mg - 1-0-1 (5 days)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="billing" className="mt-4">
                        <ScrollArea className="h-[300px] border rounded-md p-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <CreditCard className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Advance Payment</p>
                                            <p className="text-sm text-muted-foreground">Jan 14, 2026 • Receipt #10234</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-700">₹ 10,000</p>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default PatientDetailsModal;

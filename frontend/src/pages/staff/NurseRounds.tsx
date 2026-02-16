import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NurseRound {
    id: string;
    doctor_id: string | null;
    doctor_name: string;
    specialty: string;
    round_time: string;
    ward: string;
    patients_count: number;
    created_at: string;
}

interface MedicalAdvice {
    id: string;
    patient_name: string;
    doctor_name: string;
    advice: string;
    acknowledged: boolean;
    created_at: string;
}

const NurseRounds = () => {
    const queryClient = useQueryClient();

    // Fetch Rounds
    const { data: rounds, isLoading: roundsLoading } = useQuery({
        queryKey: ['nurse-rounds'],
        queryFn: async () => {
            const { data, error } = await supabase.from('nurse_rounds' as any).select('*');
            if (error) throw error;
            return data as unknown as NurseRound[];
        }
    });

    // Fetch Advice
    const { data: advice, isLoading: adviceLoading } = useQuery({
        queryKey: ['medical-advice'],
        queryFn: async () => {
            const { data, error } = await supabase.from('medical_advice' as any).select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data as unknown as MedicalAdvice[];
        }
    });

    // Acknowledge Mutation
    const acknowledge = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('medical_advice' as any).update({ acknowledged: true }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-advice'] });
            toast.success("Instruction acknowledged");
        }
    });

    if (roundsLoading || adviceLoading) {
        return (
            <DashboardLayout title="Rounds & Advice" subtitle="Syncing with station...">
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Rounds & Advice"
            subtitle="Track doctor rounds and medical instructions."
        >
            <Tabs defaultValue="rounds" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="rounds" className="data-[state=active]:bg-background">Doctor Rounds</TabsTrigger>
                    <TabsTrigger value="advice" className="data-[state=active]:bg-background">Doctor Advice & Instructions</TabsTrigger>
                </TabsList>

                <TabsContent value="rounds" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rounds && rounds.length > 0 ? rounds.map((round) => (
                            <Card key={round.id} className="hover:shadow-lg transition-all border-border/50 group">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <CardTitle className="text-base">{round.doctor_name}</CardTitle>
                                        </div>
                                        <Badge variant="secondary" className="font-normal">{round.specialty}</Badge>
                                    </div>
                                    <CardDescription>{round.ward}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span className="font-semibold text-foreground">Today at {round.round_time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <UsersIcon className="h-4 w-4" />
                                            <span>{round.patients_count} Patients to visit</span>
                                        </div>
                                        <Button className="w-full shadow-sm" variant="outline">
                                            View Patient List
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : (
                            <div className="col-span-full p-12 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground">No rounds scheduled for today.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="advice">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Recent Medical Advice</CardTitle>
                            <CardDescription>Instructions left by doctors for inpatient care.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {advice && advice.length > 0 ? advice.map((item) => (
                                    <div key={item.id} className={cn(
                                        "flex gap-4 p-5 border rounded-xl transition-colors",
                                        item.acknowledged ? "bg-muted/30 border-border/30" : "bg-blue-50/30 border-blue-100 shadow-sm"
                                    )}>
                                        <div className="mt-1">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center shadow-inner",
                                                item.acknowledged ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-700"
                                            )}>
                                                <FileText className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-foreground">{item.patient_name}</h4>
                                                    {!item.acknowledged && <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] h-4">NEW</Badge>}
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {format(new Date(item.created_at), "MMM d, h:mm a")}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Ordered by <span className="text-foreground font-medium">{item.doctor_name}</span></p>
                                            <div className={cn(
                                                "mt-3 text-sm p-4 rounded-xl leading-relaxed",
                                                item.acknowledged ? "bg-muted/50 text-muted-foreground" : "bg-white border text-foreground"
                                            )}>
                                                {item.advice}
                                            </div>
                                            <div className="pt-2 flex justify-end">
                                                {!item.acknowledged ? (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 shadow-sm"
                                                        onClick={() => acknowledge.mutate(item.id)}
                                                        disabled={acknowledge.isPending}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" /> Acknowledge Instruction
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                                        <CheckCircle className="w-3 h-3 mr-1.5" /> Acknowledged
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center text-muted-foreground italic">
                                        No recent instructions found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
};

// Icon helper
function UsersIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

export default NurseRounds;


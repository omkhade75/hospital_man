import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bot, ArrowRight, RefreshCw, AlertCircle, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { useMurfAI } from "@/hooks/useMurfAI";

const symptoms = [
    { id: "headache", label: "Headache / Dizziness", department: "Neurology" },
    { id: "chest_pain", label: "Chest Pain / Palpitations", department: "Cardiology" },
    { id: "stomach", label: "Stomach Pain / Nausea", department: "Gastroenterology" },
    { id: "joint", label: "Joint Pain / Fracture", department: "Orthopedics" },
    { id: "skin", label: "Skin Rash / Itching", department: "Dermatology" },
    { id: "child", label: "Child Health Issue", department: "Pediatrics" }
];

export default function SymptomChecker() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedSymptom, setSelectedSymptom] = useState("");
    const [severity, setSeverity] = useState("");
    const { speak } = useMurfAI();

    const handleNext = () => {
        if (step === 1 && !selectedSymptom) {
            toast.error("Please select a primary symptom");
            return;
        }
        if (step === 2 && !severity) {
            toast.error("Please select severity");
            return;
        }
        const nextStep = step + 1;
        setStep(nextStep);

        // 🔊 Murf AI voice when results are shown (step 3)
        if (nextStep === 3) {
            const dept = symptoms.find(s => s.id === selectedSymptom)?.department || "General Medicine";
            const urgency = severity === "severe"
                ? "This appears to be a severe condition. Please seek emergency care immediately or visit the Emergency Department right away."
                : severity === "moderate"
                    ? "Based on your symptoms, we recommend you contact a doctor at the earliest opportunity."
                    : "Based on your symptoms, please book an appointment with our specialists at your earliest convenience.";
            speak({
                text: `Based on your reported symptoms, we recommend visiting the ${dept} department. ${urgency} Our doctors are here to help you. Please do not delay seeking medical attention. Take care and stay safe!`,
                voiceId: "en-US-natalie",
                rate: 1.0,
                pitch: 0,
            });
        }
    };

    const handleReset = () => {
        setStep(1);
        setSelectedSymptom("");
        setSeverity("");
    };

    const getDepartment = () => {
        const symptom = symptoms.find(s => s.id === selectedSymptom);
        return symptom ? symptom.department : "General Medicine";
    };

    useEffect(() => {
        if (!open) handleReset();
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="lg" className="h-16 px-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <Bot className="h-6 w-6 mr-2 animate-pulse" />
                    AI Symptom Checker
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-blue-600" />
                            Symptom Checker
                        </span>
                        {step < 3 && <span className="text-sm font-normal text-muted-foreground">Step {step}/2</span>}
                    </CardTitle>
                    {step < 3 && <CardDescription>Select what describes your condition best.</CardDescription>}
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div className="space-y-4">
                            <Label className="text-base">What represents your main symptom?</Label>
                            <RadioGroup value={selectedSymptom} onValueChange={setSelectedSymptom} className="grid grid-cols-1 gap-3">
                                {symptoms.map((s) => (
                                    <div key={s.id} className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${selectedSymptom === s.id ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
                                        <RadioGroupItem value={s.id} id={s.id} />
                                        <Label htmlFor={s.id} className="cursor-pointer flex-1">{s.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <Label className="text-base">How severe is the pain/discomfort?</Label>
                            <RadioGroup value={severity} onValueChange={setSeverity} className="space-y-3">
                                <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                                    <RadioGroupItem value="mild" id="mild" />
                                    <Label htmlFor="mild" className="cursor-pointer flex-1">Mild - Annoying but bearable</Label>
                                </div>
                                <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                                    <RadioGroupItem value="moderate" id="moderate" />
                                    <Label htmlFor="moderate" className="cursor-pointer flex-1">Moderate - Affects daily activities</Label>
                                </div>
                                <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-red-50 border-red-200">
                                    <RadioGroupItem value="severe" id="severe" className="text-red-600" />
                                    <Label htmlFor="severe" className="cursor-pointer flex-1 text-red-700 font-medium">Severe - Unbearable / Emergency</Label>
                                </div>
                            </RadioGroup>
                            {severity === 'severe' && (
                                <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p>For severe symptoms, please visit the Emergency Department immediately or call an ambulance.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-4 space-y-4 animation-fade-in">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bot className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Recommended Department</h3>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-lg font-semibold text-blue-700">{getDepartment()}</p>
                                <p className="text-sm text-blue-600/80 mt-1">Based on your symptoms</p>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100 text-left">
                                <PhoneCall className="h-5 w-5 text-green-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-green-800">Please contact a doctor</p>
                                    <p className="text-xs text-green-700/80">Book an appointment for proper diagnosis and treatment.</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                Please note: This is an AI suggestion, not a medical diagnosis.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {step < 3 ? (
                        <div className="flex w-full gap-3">
                            {step > 1 && (
                                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">Back</Button>
                            )}
                            <Button onClick={handleNext} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={handleReset} variant="outline" className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" /> Check Another Symptom
                        </Button>
                    )}
                </CardFooter>
            </DialogContent>
        </Dialog>
    );
}

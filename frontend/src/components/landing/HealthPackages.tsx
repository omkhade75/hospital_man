import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Heart, Shield, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const packages = [
    {
        title: "Basic Health Checkup",
        price: "₹1,499",
        description: "Essential health screening for everyone.",
        icon: Activity,
        features: ["CBC (Complete Blood Count)", "Blood Sugar (Fasting)", "Lipid Profile", "Urine Routine", "Doctor Consultation"]
    },
    {
        title: "Full Body Checkup",
        price: "₹3,999",
        description: "Comprehensive health assessment.",
        popular: true,
        icon: Shield,
        features: ["All Basic Features", "Liver Function Test", "Kidney Function Test", "Thyroid Profile", "ECG", "Vitamin D & B12", "Chest X-Ray"]
    },
    {
        title: "Diabetes Care",
        price: "₹2,499",
        description: "Specialized package for diabetic patients.",
        icon: Heart,
        features: ["HbA1c", "Fasting & PP Blood Sugar", "Cholesterol Profile", "Creatinine", "Eye Checkup", "Dietician Consultation"]
    },
    {
        title: "Heart Care Package",
        price: "₹5,999",
        description: "Advanced cardiac health screening.",
        icon: Heart,
        features: ["2D Echo / TMT", "Lipid Profile", "ECG", "Chest X-Ray", "Cardiologist Consultation", "Diet Counselling"]
    }
];

export default function HealthPackages() {
    return (
        <section className="py-20 px-4 bg-muted/50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Preventive Care</Badge>
                    <h2 className="text-3xl font-bold mb-4">Health Checkup Packages</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Detect health issues early with our comprehensive and affordable health packages. Book online and skip the queue.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {packages.map((pkg, i) => (
                        <Card key={i} className={`relative flex flex-col hover:shadow-xl transition-shadow ${pkg.popular ? 'border-primary shadow-lg scale-105 z-10' : ''}`}>
                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                            )}
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <pkg.icon className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-xl">{pkg.title}</CardTitle>
                                <CardDescription>{pkg.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <span className="text-3xl font-bold">{pkg.price}</span>
                                </div>
                                <ul className="space-y-3">
                                    {pkg.features.map((feature, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant={pkg.popular ? "default" : "outline"}>
                                    Book Now
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

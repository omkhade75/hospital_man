import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
    {
        name: "Rahul Sharma",
        role: "Patient",
        content: "The care I received at Star Hospital was exceptional. The doctors were attentive and the nursing staff was incredibly supportive during my recovery.",
        rating: 5,
        avatar: "RS"
    },
    {
        name: "Priya Patel",
        role: "Regular Checkups",
        content: "I've been using their health packages for 3 years now. The process is seamless, reports are digital, and the advice is very practical.",
        rating: 5,
        avatar: "PP"
    },
    {
        name: "David Wilson",
        role: "Emergency Care",
        content: "Rushed here for an emergency late at night. The response time was phenomenal. Literally saved a life. Forever grateful.",
        rating: 5,
        avatar: "DW"
    },
    {
        name: "Anita Desai",
        role: "Maternity Care",
        content: "The maternity ward is world-class. Dr. Sarah Johnson guided me through a complex pregnancy with so much patience and expertise.",
        rating: 4,
        avatar: "AD"
    }
];

export default function Testimonials() {
    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    return (
        <section className="py-20 px-4 bg-muted/30">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Patient Stories</h2>
                    <p className="text-muted-foreground">What our community says about their experience with us.</p>
                </div>

                <Carousel
                    plugins={[plugin.current]}
                    className="w-full max-w-5xl mx-auto"
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                >
                    <CarouselContent>
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4">
                                <Card className="h-full border-none shadow-md bg-card/50 hover:bg-card transition-colors">
                                    <CardContent className="p-6 flex flex-col h-full">
                                        <Quote className="h-8 w-8 text-primary/20 mb-4" />
                                        <p className="text-muted-foreground mb-6 flex-1 italic">"{testimonial.content}"</p>

                                        <div className="flex items-center gap-4 mt-auto">
                                            <Avatar>
                                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.avatar}`} />
                                                <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-sm">{testimonial.name}</p>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-3 w-3 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                </Carousel>
            </div>
        </section>
    );
}

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket } from "lucide-react";

const ComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            {/* Animated background elements */}
            <div className="absolute inset-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10" />
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

            <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
                <div className="mb-8 flex justify-center">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-xl animate-bounce">
                        <Rocket className="w-12 h-12 text-yellow-400" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-pink-200 tracking-tight">
                    Coming Soon
                </h1>

                <p className="text-xl md:text-2xl text-blue-100/80 mb-8 leading-relaxed">
                    We are currently working on our social media presence.
                    Something amazing is in the works!
                </p>

                <Button
                    onClick={() => navigate("/")}
                    size="lg"
                    className="bg-white text-purple-900 hover:bg-blue-50 font-semibold px-8 py-6 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Button>
            </div>

            <div className="absolute bottom-8 text-sm text-white/40">
                © 2026 Medicare Hospital. Stay Tuned.
            </div>
        </div>
    );
};

export default ComingSoon;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, Stethoscope, X, ArrowRight } from 'lucide-react';

interface LoginPromptModalProps {
  delaySeconds?: number;
}

const LoginPromptModal = ({ delaySeconds = 10 }: LoginPromptModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already shown in this session
    const alreadyShown = sessionStorage.getItem('loginPromptShown');
    if (alreadyShown) {
      setHasBeenShown(true);
      return;
    }

    const timer = setTimeout(() => {
      if (!hasBeenShown) {
        setIsOpen(true);
        setHasBeenShown(true);
        sessionStorage.setItem('loginPromptShown', 'true');
      }
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [delaySeconds, hasBeenShown]);

  const handleOptionClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-0 overflow-hidden rounded-2xl">
        {/* Close Button Override */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 z-50 p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-8 text-center pb-6">
            <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
              <img src="/logo.png" alt="Medicare Logo" className="w-10 h-10 object-contain" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 mb-2">
              Welcome to Medicare
            </DialogTitle>
            <DialogDescription className="text-muted-foreground max-w-sm mx-auto">
              Access personalized care, view reports, or manage hospital operations securely.
            </DialogDescription>
          </div>

          {/* Selection Grid */}
          <div className="p-6 grid grid-cols-2 gap-4">
            {/* Patient Card */}
            <div
              onClick={() => handleOptionClick('/patient/login')}
              className="group cursor-pointer relative p-5 rounded-2xl border border-border/50 bg-card hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Patient Portal</h3>
              <p className="text-xs text-muted-foreground leading-snug mb-3">
                Book appointments & view medical records
              </p>
              <div className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                Sign In <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>

            {/* Staff Card */}
            <div
              onClick={() => handleOptionClick('/staff/login')}
              className="group cursor-pointer relative p-5 rounded-2xl border border-border/50 bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Staff Portal</h3>
              <p className="text-xs text-muted-foreground leading-snug mb-3">
                For doctors, nurses & hospital staff
              </p>
              <div className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                Staff Login <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="pb-6 text-center">
            <p className="text-sm text-muted-foreground">
              New patient?{" "}
              <Link
                to="/patient/register"
                onClick={() => setIsOpen(false)}
                className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - Hidden on mobile, fixed on desktop */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar">
        <Sidebar className="h-full w-full border-r-0" />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col lg:pl-64 w-full transition-all duration-300">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

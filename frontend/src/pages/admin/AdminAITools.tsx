import DashboardLayout from "@/components/layout/DashboardLayout";
import AICalculator from "@/components/dashboard/AICalculator";

const AdminAITools = () => {
    return (
        <DashboardLayout
            title="AI Financial Tools"
            subtitle="Advanced calculation and analysis tools for administrators."
        >
            <div className="max-w-4xl mx-auto">
                <AICalculator />
            </div>
        </DashboardLayout>
    );
};

export default AdminAITools;

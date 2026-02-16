import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { DollarSign, CreditCard, Activity, TrendingUp } from "lucide-react";
import AICalculator from "@/components/dashboard/AICalculator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CashierDashboard = () => {
    // Fetch some quick stats
    const { data: stats } = useQuery({
        queryKey: ['cashier-stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('transactions')
                .select('amount, created_at');

            if (error || !data) return { total: 0, today: 0, count: 0 };

            const total = data.reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const todayDate = new Date().toISOString().split('T')[0];
            const todayTotal = data
                .filter(t => t.created_at?.startsWith(todayDate))
                .reduce((sum, t) => sum + Number(t.amount || 0), 0);

            return { total, today: todayTotal, count: data.length };
        }
    });

    return (
        <DashboardLayout
            title="Cashier Station"
            subtitle="Manage hospital finances and patient billing."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Revenue"
                    value={`$${stats?.total.toFixed(0) || '0'}`}
                    change="Lifetime"
                    changeType="neutral"
                    icon={DollarSign}
                    iconColor="primary"
                />
                <StatCard
                    title="Today's Collection"
                    value={`$${stats?.today.toFixed(0) || '0'}`}
                    change="Daily earning"
                    changeType="positive"
                    icon={TrendingUp}
                    iconColor="success"
                />
                <StatCard
                    title="Transactions"
                    value={stats?.count || 0}
                    change="Total processed"
                    changeType="neutral"
                    icon={CreditCard}
                    iconColor="warning"
                />
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5" /> AI Financial Assistant
                    </h2>
                    <AICalculator />
                </section>
            </div>
        </DashboardLayout>
    );
};

export default CashierDashboard;

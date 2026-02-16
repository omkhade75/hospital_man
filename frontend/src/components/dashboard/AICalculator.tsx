import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Calculator, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
    id: string;
    amount: number;
    description: string;
    created_at: string;
    patient_name: string;
}

const AICalculator = () => {
    const [patientName, setPatientName] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ total: number; count: number; transactions: Transaction[] } | null>(null);

    const handleCalculate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientName.trim()) {
            toast.error("Please enter a patient name");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Find patient transactions
            // Note: In a real app we might match by ID, but requirement says "whose name is asked"
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .ilike('patient_name', `%${patientName}%`)
                .returns<Transaction[]>();

            if (error) throw error;

            if (!data || data.length === 0) {
                toast.info("No transactions found for this patient.");
                setLoading(false);
                return;
            }

            const total = data.reduce((sum, t) => sum + Number(t.amount), 0);
            setResult({
                total,
                count: data.length,
                transactions: data
            });
            toast.success("Calculation complete!");

        } catch (error: unknown) {
            toast.error("Failed to calculate amount");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-primary" />
                    AI Transaction Calculator
                </CardTitle>
                <CardDescription>
                    Enter a patient's name to calculate their total transaction amount instantly.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleCalculate} className="flex gap-4 mb-6">
                    <Input
                        placeholder="Patient Name (e.g. John Doe)"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                        Calculate
                    </Button>
                </form>

                {result && (
                    <div className="bg-muted p-4 rounded-lg space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Transactions Found</p>
                                <p className="text-2xl font-bold">{result.count}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total Amount Due</p>
                                <p className="text-3xl font-bold text-green-600">${result.total.toFixed(2)}</p>
                            </div>
                        </div>

                        <div>
                            <p className="font-semibold mb-2 text-sm">Transaction History</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {result.transactions.map((t) => (
                                    <div key={t.id} className="flex justify-between text-sm p-2 bg-background rounded border">
                                        <span>{t.description || 'Generic Transaction'}</span>
                                        <div className="flex gap-4">
                                            <span className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                                            <span className="font-medium">${Number(t.amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AICalculator;

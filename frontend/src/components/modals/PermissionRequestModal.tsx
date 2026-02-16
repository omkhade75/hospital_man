import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Lock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action: string;
}

const PermissionRequestModal = ({ open, onOpenChange, action }: PermissionRequestModalProps) => {
    const { user } = useAuth();
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for this request");
            return;
        }

        setLoading(true);
        try {
            // 1. Find all admins
            const { data: admins, error: adminError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'admin');

            if (adminError) throw adminError;

            if (!admins || admins.length === 0) {
                throw new Error("No administrators found to receive this request.");
            }

            // 2. Send notification to all admins
            const notifications = admins.map(admin => ({
                user_id: admin.user_id,
                title: "Permission Request",
                message: `${user?.email || 'A user'} requests to ${action}. Reason: ${reason}`,
                type: "permission_request",
                entity_type: "request",
                entity_id: user?.id.toString(),
                is_read: false
            }));

            const { error: notifError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notifError) throw notifError;

            toast.success("Permission request sent to Admin", {
                description: `Request to ${action} has been forwarded for approval.`
            });
            onOpenChange(false);
            setReason("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to send request";
            toast.error("Failed to send request", { description: message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <Lock className="w-5 h-5" />
                        Restricted Action
                    </DialogTitle>
                    <DialogDescription>
                        You do not have permission to <strong>{action}</strong>. You can request approval from an administrator.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Why is this change necessary?"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                        {loading ? "Sending Request..." : "Request Approval"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PermissionRequestModal;

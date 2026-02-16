import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { UserCheck, UserX, Clock, Search, Shield, FileQuestion, CheckCircle, XCircle } from 'lucide-react';

interface ApprovalRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  requested_role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'cashier';
  status: string;
  created_at: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const StaffApprovals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch approval requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['staff-approval-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_approval_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ApprovalRequest[];
    },
  });

  // Fetch change requests (notifications)
  const { data: changeRequests = [], isLoading: isChangeLoading } = useQuery({
    queryKey: ['change-requests'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id.toString()) // Get notifications for current admin
        .eq('type', 'permission_request')
        .order('created_at', { ascending: false });

      if (error) throw error; // Log error but don't break page?
      return data as ChangeRequest[];
    },
    enabled: !!user
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (request: ApprovalRequest) => {
      // First create the user role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: request.user_id,
        role: request.requested_role,
      });
      if (roleError) throw roleError;

      // Then update the approval request status
      const { error: updateError } = await supabase
        .from('staff_approval_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id.toString(),
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Staff access approved!');
      queryClient.invalidateQueries({ queryKey: ['staff-approval-requests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ request, reason }: { request: ApprovalRequest; reason: string }) => {
      const { error } = await supabase
        .from('staff_approval_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id.toString(),
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', request.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['staff-approval-requests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });

  // Resolve Change Request (Delete notification)
  const resolveRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request processed");
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
    },
    onError: () => {
      toast.error("Failed to process request");
    }
  });

  const filteredRequests = requests.filter(
    (req) =>
      req.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter((r) => r.status === 'pending');
  const processedRequests = filteredRequests.filter((r) => r.status !== 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      doctor: 'bg-blue-100 text-blue-800',
      nurse: 'bg-pink-100 text-pink-800',
      receptionist: 'bg-gray-100 text-gray-800',
      cashier: 'bg-emerald-100 text-emerald-800',
    };
    return <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>{role}</Badge>;
  };

  return (
    <DashboardLayout title="Staff Approvals" subtitle="Manage staff access and requests">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Staff Approvals & Requests
            </h1>
            <p className="text-muted-foreground">Manage access and review change requests</p>
          </div>
        </div>

        <Tabs defaultValue="approvals" className="w-full space-y-6">
          <TabsList>
            <TabsTrigger value="approvals">Access Approvals</TabsTrigger>
            <TabsTrigger value="requests">Change Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Pending Requests ({pendingRequests.length})
                </CardTitle>
                <CardDescription>Requests awaiting your approval</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No pending requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{request.full_name}</div>
                          <div className="text-sm text-muted-foreground">{request.email}</div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(request.requested_role)}
                            <span className="text-xs text-muted-foreground">
                              Requested {format(new Date(request.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(request)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processed Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
                <CardDescription>Previously reviewed requests</CardDescription>
              </CardHeader>
              <CardContent>
                {processedRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No processed requests</p>
                ) : (
                  <div className="space-y-4">
                    {processedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{request.full_name}</div>
                          <div className="text-sm text-muted-foreground">{request.email}</div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(request.requested_role)}
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-blue-600" />
                  Operations Change Requests
                </CardTitle>
                <CardDescription>Requests from staff for restricted actions (e.g. Doctor Schedule Changes)</CardDescription>
              </CardHeader>
              <CardContent>
                {isChangeLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : changeRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                    <FileQuestion className="mx-auto h-12 w-12 opacity-20 mb-3" />
                    <p>No active change requests.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {changeRequests.map((req) => (
                      <div key={req.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 border rounded-lg bg-card shadow-sm">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{req.title}</h4>
                            <Badge variant="outline" className="text-xs">{format(new Date(req.created_at), 'MMM d, h:mm a')}</Badge>
                          </div>
                          <p className="text-sm text-foreground/80">{req.message}</p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => resolveRequestMutation.mutate(req.id)}
                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Done
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveRequestMutation.mutate(req.id)}
                            className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Access Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting {selectedRequest?.full_name}'s request.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter rejection reason (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedRequest) {
                    rejectMutation.mutate({ request: selectedRequest, reason: rejectionReason });
                  }
                }}
                disabled={rejectMutation.isPending}
              >
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StaffApprovals;

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Phone, PhoneCall, Clock, CheckCircle, XCircle, Search, Bot } from 'lucide-react';
import { format } from 'date-fns';

const CallbacksPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch callback requests
  const { data: callbacks = [], isLoading } = useQuery({
    queryKey: ['callback-requests', statusFilter],
    queryFn: async () => {
      let query = supabase.from('callback_requests').select('*');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['callback-requests'] });
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('callback_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Callback status updated');
      queryClient.invalidateQueries({ queryKey: ['callback-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-callbacks-count'] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const triggerAICall = async (callback: any) => {
    const VAPI_PRIVATE_KEY = import.meta.env.VITE_VAPI_PRIVATE_KEY;
    const PHONE_NUMBER_ID = import.meta.env.VITE_VAPI_PHONE_NUMBER_ID;

    if (!VAPI_PRIVATE_KEY) {
      toast.error("Missing VITE_VAPI_PRIVATE_KEY in .env file.");
      return;
    }

    if (!PHONE_NUMBER_ID) {
      toast.error("Missing VITE_VAPI_PHONE_NUMBER_ID in .env file.");
      return;
    }

    const toastId = toast.loading("Initiating AI Call...");

    // Normalize phone number to E.164 format
    let phoneNumber = callback.phone.trim().replace(/\s+/g, '');
    if (!phoneNumber.startsWith('+')) {
      if (phoneNumber.length === 10) {
        phoneNumber = '+91' + phoneNumber;
      } else if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
        phoneNumber = '+' + phoneNumber;
      }
    }

    console.log("Calling Vapi with transient assistant for:", phoneNumber);

    try {
      const apiUrl = "/api/vapi/call";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumberId: PHONE_NUMBER_ID,
          // DO NOT send assistantId -> this makes it a "Transient Assistant"
          customer: {
            number: phoneNumber,
            name: callback.name
          },
          assistant: {
            name: "Maya Callback Agent",
            firstMessage: `Hello, I am Maya from Star Hospital. Am I speaking with ${callback.name}?`,
            transcriber: {
              provider: "deepgram",
              model: "nova-2",
              language: "en-IN"
            },
            voice: {
              provider: "11labs",
              voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel (Standard 11Labs voice)
              stability: 0.5,
              similarityBoost: 0.75
            },
            model: {
              provider: "openai",
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: `You are Maya, a friendly and professional receptionist for Star Hospital.
                  You are calling to follow up on a callback request from a patient.
                  
                  Patient Name: ${callback.name}
                  
                  Instructions:
                  1. You've already introduced yourself in the first message.
                  2. Ask how you can help the patient.
                  3. Be polite, warm, and concise in your responses.
                  4. Always maintain a professional yet friendly tone.
                  5. If they have medical questions, offer to book an appointment with a doctor.
                  `
                }
              ]
            }
          }
        })
      });

      console.log("Vapi status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Vapi Success:", data);
        toast.success("AI Call Initiated! Maya should speak shortly.", { id: toastId });
      } else {
        const errorText = await response.text();
        console.error("Vapi Error body:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          toast.error(`Error: ${errorData.message || response.statusText}`, { id: toastId });
        } catch (e) {
          toast.error(`Error (Status: ${response.status})`, { id: toastId });
        }
      }
    } catch (error: any) {
      console.error("Call Error:", error);
      toast.error(`Network error: ${error.message}`, { id: toastId });
    }
  };

  const filteredCallbacks = callbacks.filter((callback) =>
    callback.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    callback.phone.includes(searchQuery)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Callback Requests" subtitle="Manage patient callback requests">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Callbacks Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Callback Requests ({filteredCallbacks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredCallbacks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No callback requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Preferred Time</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCallbacks.map((callback) => (
                      <TableRow key={callback.id}>
                        <TableCell className="font-medium">{callback.name}</TableCell>
                        <TableCell>
                          <a href={`tel:${callback.phone}`} className="text-primary hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {callback.phone}
                          </a>
                        </TableCell>
                        <TableCell>{callback.preferred_time || 'Anytime'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{callback.reason || '-'}</TableCell>
                        <TableCell>{format(new Date(callback.created_at), 'MMM d, yyyy h:mm a')}</TableCell>
                        <TableCell>{getStatusBadge(callback.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {callback.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:bg-blue-50"
                                  onClick={() => window.location.href = `tel:${callback.phone}`}
                                >
                                  <Phone className="h-4 w-4 mr-1" /> Call
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600 hover:bg-purple-50 border-purple-200"
                                  onClick={() => triggerAICall(callback)}
                                >
                                  <Bot className="h-4 w-4 mr-1" /> AI Call
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => updateStatusMutation.mutate({ id: callback.id, status: 'completed' })}
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => updateStatusMutation.mutate({ id: callback.id, status: 'cancelled' })}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {callback.status !== 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: callback.id, status: 'pending' })}
                              >
                                Reopen
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CallbacksPage;

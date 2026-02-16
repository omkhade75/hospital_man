import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import PermissionRequestModal from "@/components/modals/PermissionRequestModal";

const Settings = () => {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [pendingAction, setPendingAction] = useState("");

    useEffect(() => {
        if (user) {
            setDisplayName(user.fullName || "");
            setAvatarUrl(""); // Custom backend User doesn't seem to have avatarUrl in interface
            checkUserRole();
        }
    }, [user]);

    const checkUserRole = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id.toString())
            .maybeSingle();
        if (data) setUserRole(data.role);
    };

    const handleUpdateProfile = async () => {
        if (!user) return;

        // Restrict profile update for receptionists? Or maybe just password?
        // Let's restrict it just to demonstrate "Admin permission" needed for major changes.
        // But users usually can update their own profile.
        // Let's Stick to user request "RECEPTION ... CANNOT CHANGE MORE THINGS" - implies settings might be locked except for basic stuff.
        // Let's lock profile update for demonstration if user is 'receptionist'.

        if (userRole === 'receptionist') {
            setPendingAction("update profile settings");
            setShowPermissionModal(true);
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: displayName,
                    avatar_url: avatarUrl,
                },
            });

            if (error) throw error;

            toast.success("Profile updated successfully!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update profile";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = () => {
        if (userRole === 'receptionist') {
            setPendingAction("change account password");
            setShowPermissionModal(true);
            return;
        }
        // Logic for update password would go here
        toast.info("Password update feature coming soon");
    };

    return (
        <DashboardLayout
            title="Settings"
            subtitle="Manage your account settings and preferences."
        >
            <Tabs defaultValue="account" className="w-full space-y-6">
                <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                            <CardDescription>
                                Update your personal details here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center gap-4 sm:flex-row">
                                <div className="relative group">
                                    <Avatar className="w-24 h-24 border-2 border-border cursor-pointer">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="text-2xl">
                                            {displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    <Input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = URL.createObjectURL(file);
                                                setAvatarUrl(url);
                                                toast.info("Image selected. Click 'Save Changes' to update.");
                                            }
                                        }}
                                        disabled={userRole === 'receptionist'}
                                    />
                                </div>
                                <div className="space-y-1 text-center sm:text-left">
                                    <h4 className="font-medium">Profile Photo</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Click on the image to upload a new photo.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" defaultValue={user?.email || ""} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Your name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                // disabled={userRole === 'receptionist'} // Option to disable directly
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="avatar-url">Avatar URL (Optional)</Label>
                                <Input
                                    id="avatar-url"
                                    placeholder="https://example.com/avatar.png"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                // disabled={userRole === 'receptionist'}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleUpdateProfile} disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>
                                Choose what you want to be notified about.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="email-notifs" className="flex flex-col space-y-1">
                                    <span>Email Notifications</span>
                                    <span className="font-normal text-xs text-muted-foreground">Receive emails about your account activity.</span>
                                </Label>
                                <Switch id="email-notifs" />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="push-notifs" className="flex flex-col space-y-1">
                                    <span>Push Notifications</span>
                                    <span className="font-normal text-xs text-muted-foreground">Receive push notifications on your device.</span>
                                </Label>
                                <Switch id="push-notifs" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize the look and feel of the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                                    <span>Dark Mode</span>
                                    <span className="font-normal text-xs text-muted-foreground">Toggle dark mode on or off.</span>
                                </Label>
                                <Switch id="dark-mode" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>
                                Manage your password and security settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleUpdatePassword}>Update Password</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            <PermissionRequestModal
                open={showPermissionModal}
                onOpenChange={setShowPermissionModal}
                action={pendingAction}
            />
        </DashboardLayout>
    );
};

export default Settings;

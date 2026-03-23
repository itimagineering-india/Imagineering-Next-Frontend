"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Lock,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  Moon,
  Sun,
  Languages,
  AlertTriangle,
  Briefcase,
  MapPin,
  Camera,
  Loader2,
} from "lucide-react";
import i18n, { persistLanguage } from "@/i18n";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api-client";
import { signOutUser } from "@/lib/firebaseAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export async function getServerSideProps() { return { props: {} }; }

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  newLeads: boolean;
  bookingUpdates: boolean;
  paymentUpdates: boolean;
  marketingEmails: boolean;
}

interface PrivacySettings {
  profileVisibility: "public" | "private";
  showPhone: boolean;
  showEmail: boolean;
  showLocation: boolean;
  allowMessages: boolean;
}

interface AppPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
}

interface BusinessProfile {
  businessName: string;
  tagline: string;
  bio: string;
  yearsOfExperience: number;
  businessPhone: string;
  businessEmail: string;
  website: string;
  businessLogo?: string;
}

export default function ProviderProfileSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl && ["profile", "business", "notifications", "security", "privacy", "preferences"].includes(tabFromUrl) ? tabFromUrl : "profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const { toast } = useToast();

  // Profile State
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });

  // Business State
  const [business, setBusiness] = useState<BusinessProfile>({
    businessName: "",
    tagline: "",
    bio: "",
    yearsOfExperience: 0,
    businessPhone: "",
    businessEmail: "",
    website: "",
  });

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Other States
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newLeads: true,
    bookingUpdates: true,
    paymentUpdates: true,
    marketingEmails: false,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: "public",
    showPhone: true,
    showEmail: false,
    showLocation: true,
    allowMessages: true,
  });

  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: "system",
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const userRes = await api.auth.getMe();
      const userData = userRes.data as { user?: { name?: string; email?: string; phone?: string; avatar?: string; id?: string; notificationPreferences?: any; privacySettings?: any; appPreferences?: { language?: string } } } | undefined;
      if (userRes.success && userData?.user) {
        const u = userData.user;
        setProfile({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          avatar: u.avatar || "",
        });

        if (u.notificationPreferences) setNotifications(u.notificationPreferences);
        if (u.privacySettings) setPrivacy(u.privacySettings);
        if (u.appPreferences) {
          setPreferences({
            theme: "system",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: "en",
            ...u.appPreferences,
          } as AppPreferences);
          const lang = u.appPreferences.language;
          if (lang && ["en", "hi", "mr"].includes(lang)) {
            i18n.changeLanguage(lang);
            persistLanguage(lang);
          }
        }

        // Fetch provider business data
        const providerRes = await api.providers.getByUserId((u as any).id ?? (u as any)._id ?? "");
        const providerData = providerRes.data as { provider?: { _id?: string; businessName?: string; tagline?: string; bio?: string; yearsOfExperience?: number; businessPhone?: string; businessEmail?: string; website?: string; businessLogo?: string } } | undefined;
        if (providerRes.success && providerData?.provider) {
          const p = providerData.provider;
          setProviderId(p._id ?? null);
          setBusiness({
            businessName: p.businessName || "",
            tagline: p.tagline || "",
            bio: p.bio || "",
            yearsOfExperience: p.yearsOfExperience || 0,
            businessPhone: p.businessPhone || "",
            businessEmail: p.businessEmail || "",
            website: p.website || "",
            businessLogo: p.businessLogo,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings data:", error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please refresh.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await api.auth.updateProfile({
        name: profile.name,
        phone: profile.phone,
        avatar: profile.avatar,
      });
      if (res.success) {
        toast({ title: "Profile updated", description: "Your personal information has been saved." });
      }
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image size should be less than 5MB", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // Using fetch directly for multipart/form-data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'}/api/auth/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setProfile({ ...profile, avatar: result.data.avatar });
        toast({ title: "Avatar updated", description: "Your profile picture has been updated." });
      } else {
        throw new Error(result.error?.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBusinessLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image size should be less than 5MB", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'}/api/auth/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setBusiness({ ...business, businessLogo: result.data.url });
        toast({ title: "Logo uploaded", description: "Your business logo has been uploaded. Don't forget to save changes." });
      } else {
        throw new Error(result.error?.message || "Upload failed");
      }
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!providerId) {
      toast({ title: "Error", description: "Provider profile not found", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.providers.update(providerId, business);
      if (res.success) {
        toast({ title: "Business profile updated", description: "Your business details have been saved." });
      }
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Missing fields", description: "Please fill in all password fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirm password must match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters long", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.auth.changePassword({ currentPassword, newPassword });
      if (res.success) {
        toast({ title: "Password changed", description: "Your password has been updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to change password", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const res = await api.auth.updateNotifications(notifications);
      if (res.success) {
        toast({ title: "Notifications saved", description: "Your notification preferences have been updated" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    try {
      const res = await api.auth.updatePrivacy(privacy);
      if (res.success) {
        toast({ title: "Privacy settings saved", description: "Your privacy preferences have been updated" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const res = await api.auth.updatePreferences(preferences);
      if (res.success) {
        toast({ title: "Preferences saved", description: "Your app preferences have been updated" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await api.auth.deleteMyAccount();
      if (res.success) {
        await signOutUser();
        toast({
          title: "Account deleted",
          description: "Your account has been deleted. You can sign up again with the same email.",
        });
        router.replace("/signup");
      } else {
        throw new Error(res.error?.message || "Failed to delete account");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="flex-wrap h-auto p-1 bg-muted/50">
            <TabsTrigger value="profile" className="text-xs md:text-sm gap-2">
              <User className="h-3.5 w-3.5" /> Personal
            </TabsTrigger>
            <TabsTrigger value="business" className="text-xs md:text-sm gap-2">
              <Briefcase className="h-3.5 w-3.5" /> Business
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm gap-2">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm gap-2">
              <Lock className="h-3.5 w-3.5" /> Security
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs md:text-sm gap-2">
              <Shield className="h-3.5 w-3.5" /> Privacy
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs md:text-sm gap-2">
              <Globe className="h-3.5 w-3.5" /> Preferences
            </TabsTrigger>
          </TabsList>

          {/* Personal Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/10">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <Label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-sm bg-secondary flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors">
                      <Camera className="h-3.5 w-3.5" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isSaving}
                      />
                    </Label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-medium">{profile.name}</h4>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="mt-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Profile Tab */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Manage your business identity and details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/10">
                      {business.businessLogo ? (
                        <img src={business.businessLogo} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Briefcase className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <Label htmlFor="logo-upload" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-sm bg-secondary flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors">
                      <Camera className="h-3.5 w-3.5" />
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBusinessLogoUpload}
                        disabled={isSaving}
                      />
                    </Label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-medium">Business Logo</h4>
                    <p className="text-sm text-muted-foreground">Upload your company logo</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="biz-name">Business Name</Label>
                    <Input
                      id="biz-name"
                      value={business.businessName}
                      onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={business.tagline}
                      onChange={(e) => setBusiness({ ...business, tagline: e.target.value })}
                      placeholder="Short catchphrase for your business"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bio">Business Bio / Description</Label>
                    <Textarea
                      id="bio"
                      value={business.bio}
                      onChange={(e) => setBusiness({ ...business, bio: e.target.value })}
                      placeholder="Tell customers about your services and expertise..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp">Years of Experience</Label>
                    <Input
                      id="exp"
                      type="number"
                      value={business.yearsOfExperience}
                      onChange={(e) => setBusiness({ ...business, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-email">Business Email</Label>
                    <Input
                      id="biz-email"
                      type="email"
                      value={business.businessEmail}
                      onChange={(e) => setBusiness({ ...business, businessEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-phone">Business Phone</Label>
                    <Input
                      id="biz-phone"
                      value={business.businessPhone}
                      onChange={(e) => setBusiness({ ...business, businessPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input
                      id="website"
                      value={business.website}
                      onChange={(e) => setBusiness({ ...business, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveBusiness} disabled={isSaving} className="mt-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Business Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive push notifications on your device</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-medium">Notification Types</h4>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex-1">New Leads</Label>
                      <Switch
                        checked={notifications.newLeads}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, newLeads: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="flex-1">Booking Updates</Label>
                      <Switch
                        checked={notifications.bookingUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, bookingUpdates: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="flex-1">Payment Updates</Label>
                      <Switch
                        checked={notifications.paymentUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, paymentUpdates: checked })}
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account password and security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="curr-pass">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="curr-pass"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pass">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conf-pass">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="conf-pass"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Delete Account</p>
                      <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete Account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90">
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Deleting…
                              </>
                            ) : (
                              "Delete Account"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your profile visibility and data sharing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profile Visibility</Label>
                      <p className="text-xs text-muted-foreground">Make your profile public or private</p>
                    </div>
                    <select
                      value={privacy.profileVisibility}
                      onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as any })}
                      className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Show Phone Number</Label>
                    <Switch
                      checked={privacy.showPhone}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, showPhone: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Email Address</Label>
                    <Switch
                      checked={privacy.showEmail}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, showEmail: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Location</Label>
                    <Switch
                      checked={privacy.showLocation}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, showLocation: checked })}
                    />
                  </div>
                </div>
                <Button onClick={handleSavePrivacy} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>Customize your dashboard experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["light", "dark", "system"].map((t) => (
                        <Button
                          key={t}
                          variant={preferences.theme === t ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPreferences({ ...preferences, theme: t as any })}
                          className="capitalize"
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <select
                      value={preferences.language}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPreferences({ ...preferences, language: value });
                        i18n.changeLanguage(value);
                        persistLanguage(value);
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleSavePreferences} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}



import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateReferralLink } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  avatarUrl: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  newPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [referralLink] = useState(user ? generateReferralLink(user.username) : "");

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      await apiRequest("PATCH", `/api/users/${user.id}`, values);
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (!user) return;
    
    setIsSavingPassword(true);
    try {
      await apiRequest("PATCH", `/api/users/${user.id}/password`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Failed to update password",
        description: "Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard"
      });
    });
  };

  return (
    <AppLayout title="Profile">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatarUrl || ""} alt={user?.fullName || "User"} />
                  <AvatarFallback className="text-lg">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">{user?.fullName}</h3>
                  <p className="text-sm text-slate-500">@{user?.username}</p>
                </div>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/avatar.jpg" />
                        </FormControl>
                        <FormDescription>
                          Enter a URL for your profile picture
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isSavingPassword}>
                    {isSavingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="referrals" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Referral Program</CardTitle>
              <CardDescription>
                Share your referral link and earn 10% of the prize pool when your friends join games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Your Referral Link</h3>
                  <div className="flex">
                    <Input value={referralLink} readOnly className="flex-1" />
                    <Button onClick={copyReferralLink} className="ml-2">
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">How It Works</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-secondary-100 text-secondary-600 text-xs font-medium mr-2">1</span>
                      Share your unique referral link with friends
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-secondary-100 text-secondary-600 text-xs font-medium mr-2">2</span>
                      When they sign up and join a game using your link, you'll be tracked as the referrer
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-secondary-100 text-secondary-600 text-xs font-medium mr-2">3</span>
                      You'll earn 10% of their entry fee when they participate in a game
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-secondary-100 text-secondary-600 text-xs font-medium mr-2">4</span>
                      The more friends you refer, the more you earn!
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={copyReferralLink}>
                Copy Referral Link
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

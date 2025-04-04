import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthFormProps {
  onSuccess: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onLoginSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", values);
      
      if (!response.ok) {
        // If we get here, the apiRequest didn't throw, which is unexpected
        // Let's try to parse the error response
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Please check your credentials and try again");
      }
      
      toast({
        title: "Login successful!",
        description: "Welcome back to GameOn!",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Extract error message from error object
      let errorMessage = "Please check your credentials and try again.";
      if (error instanceof Error) {
        // Try to parse JSON error message if it exists
        try {
          const parsedError = error.message.split(': ')[1];
          if (parsedError) {
            const jsonError = JSON.parse(parsedError);
            errorMessage = jsonError.message || errorMessage;
          }
        } catch {
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegisterSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    try {
      // Remove confirmPassword as it's not needed in the API call
      const { confirmPassword, ...registerData } = values;
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      
      if (!response.ok) {
        // If we get here, the apiRequest didn't throw, which is unexpected
        // Let's try to parse the error response
        const errorData = await response.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || "Registration failed. Please try again.");
      }
      
      toast({
        title: "Registration successful!",
        description: "Welcome to GameOn!",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Extract error message from error object
      let errorMessage = "This username or email may already be in use.";
      if (error instanceof Error) {
        // Try to parse JSON error message if it exists
        try {
          const parsedError = error.message.split(': ')[1];
          if (parsedError) {
            const jsonError = JSON.parse(parsedError);
            errorMessage = jsonError.message || errorMessage;
          }
        } catch {
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Welcome to GameOn
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
            <TabsTrigger value="register" className="text-sm">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="register">
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

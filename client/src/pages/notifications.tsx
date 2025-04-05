import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Calendar, Clock, Trophy, Users, Bell, Info, AlertCircle, Settings } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types for notifications
interface Notification {
  id: number;
  type: 'game' | 'payment' | 'system';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

// Mock data (in a real app, this would be fetched from the API)
const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'game',
    title: 'New Game Invitation',
    message: 'You have been invited to join "Saturday Basketball Tournament"',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    actionUrl: '/games/5'
  },
  {
    id: 2,
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $15.00 from your referral to "Tennis Match Showdown"',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    actionUrl: '/earnings'
  },
  {
    id: 3,
    type: 'system',
    title: 'Account Updated',
    message: 'Your profile information has been successfully updated',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true
  },
  {
    id: 4,
    type: 'game',
    title: 'Game Status Update',
    message: '"Downtown Soccer Match" has been rescheduled to next Saturday',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    read: true,
    actionUrl: '/games/3'
  },
  {
    id: 5,
    type: 'payment',
    title: 'Payment Processed',
    message: 'Your entry fee payment of $25.00 for "Weekly Poker Night" has been processed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    read: true,
    actionUrl: '/games/2'
  }
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  // In a real app, we would fetch notifications from the API
  const { data, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      // In a real implementation, we would fetch from the API
      // For now, return mock data
      return { notifications: mockNotifications };
    },
    enabled: false, // Disable this query since we're using mock data
  });

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  // Get unread count for badge
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'game':
        return <Trophy className="h-5 w-5 text-primary-600" />;
      case 'payment':
        return <BadgeCheck className="h-5 w-5 text-green-600" />;
      case 'system':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-slate-600" />;
    }
  };

  // Format date relative to now
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <AppLayout
      title="Notifications"
      subtitle="Stay updated with your gaming activities"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      }
    >
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:w-auto md:inline-flex">
            <TabsTrigger value="all" className="relative">
              All
              {unreadCount > 0 && (
                <Badge className="ml-1 absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="game">Games</TabsTrigger>
            <TabsTrigger value="payment">Payments</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center pt-6 pb-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === "unread" 
                  ? "You have no unread notifications"
                  : "You don't have any notifications yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={cn(
                "transition-all duration-200 hover:shadow-md",
                !notification.read && "border-l-4 border-l-primary bg-primary-50/40"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 flex-shrink-0",
                    notification.type === 'payment' && "bg-green-100",
                    notification.type === 'system' && "bg-blue-100"
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-base mb-1">{notification.title}</h4>
                      <span className="text-xs text-slate-500">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                    <div className="flex justify-between items-center">
                      {notification.actionUrl && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto"
                          asChild
                        >
                          <a href={notification.actionUrl}>View details</a>
                        </Button>
                      )}
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto text-xs h-8"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}
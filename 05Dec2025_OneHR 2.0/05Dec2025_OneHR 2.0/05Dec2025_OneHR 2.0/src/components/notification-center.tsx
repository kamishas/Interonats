import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  Users,
  X,
  UserPlus,
  FileCheck,
  Building2,
  Briefcase,
  Shield,
  Calendar,
  Mail,
  Cake,
  Award,
  PartyPopper,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";

const API_URL = API_ENDPOINTS.NOTIFICATION;

// Simulated user ID - in production, get from auth context
// For now, we'll fetch all notifications and let users filter
const USER_ID = "current-user-id";

interface Notification {
  id: string;
  userId: string;
  type: "reminder" | "alert" | "confirmation" | "approval" | "warning" | "info";
  category: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: "low" | "medium" | "high" | "urgent";
  read: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const [isGeneratingAlerts, setIsGeneratingAlerts] = useState(false);

  useEffect(() => {
    fetchNotifications();
    generateCalendarAlerts(); // Generate calendar alerts on load
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/notifications?userId=${USER_ID}`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendarAlerts = async () => {
    try {
      setIsGeneratingAlerts(true);
      const response = await fetch(`${API_URL}/notifications/generate-calendar-alerts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Generated ${data.generated} calendar notifications`);
        // Refresh notifications to show newly generated ones
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error generating calendar alerts:', error);
    } finally {
      setIsGeneratingAlerts(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      const updated = await response.json();
      setNotifications(notifications.map(n => n.id === updated.id ? updated : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      await Promise.all(
        unreadNotifications.map(n => 
          fetch(`${API_URL}/notifications/${n.id}/read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAccessToken() ?? ''}`,
            },
          })
        )
      );

      fetchNotifications(); // Refresh
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (notification: Notification) => {
    switch (notification.type) {
      case "reminder":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "confirmation":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "approval":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "timesheet":
        return <Clock className="h-3 w-3" />;
      case "invoice":
        return <DollarSign className="h-3 w-3" />;
      case "expense":
        return <FileText className="h-3 w-3" />;
      case "employee":
      case "onboarding":
        return <UserPlus className="h-3 w-3" />;
      case "document":
        return <FileCheck className="h-3 w-3" />;
      case "client":
        return <Building2 className="h-3 w-3" />;
      case "project":
        return <Briefcase className="h-3 w-3" />;
      case "immigration":
      case "compliance":
        return <Shield className="h-3 w-3" />;
      case "approval":
        return <CheckCircle2 className="h-3 w-3" />;
      case "reminder":
        return <Calendar className="h-3 w-3" />;
      case "system":
        return <Mail className="h-3 w-3" />;
      case "Calendar":
        return <Calendar className="h-3 w-3 text-purple-600" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getNotificationSpecialIcon = (notification: Notification) => {
    // Special icons based on related entity type
    if (notification.relatedEntityType === 'birthday') {
      return <Cake className="h-4 w-4 text-pink-600" />;
    }
    if (notification.relatedEntityType === 'anniversary') {
      return <Award className="h-4 w-4 text-amber-600" />;
    }
    if (notification.relatedEntityType === 'holiday') {
      return <PartyPopper className="h-4 w-4 text-green-600" />;
    }
    return getIcon(notification);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === "all" ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with employee onboarding, documents, compliance, timesheets, and more
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Bell className="h-4 w-4 mr-2" />
            {unreadCount} unread
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Notifications</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All ({notifications.length})
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{filter === "unread" ? "No unread notifications" : "No notifications"}</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors ${
                        !notification.read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="mt-1">{getNotificationSpecialIcon(notification)}</div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={!notification.read ? "font-semibold" : ""}>{notification.title}</h4>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(notification.priority)}
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                          {notification.category && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {getCategoryIcon(notification.category)}
                                <span className="capitalize">{notification.category}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {notification.actionUrl && notification.actionLabel && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toast.info(`Navigate to: ${notification.actionUrl}`)}
                            >
                              {notification.actionLabel}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < filteredNotifications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Unread</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {notifications.filter(n => n.priority === "urgent" && !n.read).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Timesheet Alerts</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {notifications.filter(n => n.category === "timesheet" && !n.read).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

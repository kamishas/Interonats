import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getYear, parseISO, isAfter, isBefore, addDays, startOfDay, endOfDay } from 'date-fns';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { 
  Calendar as CalendarIcon, 
  Bell, 
  Cake, 
  Award, 
  PartyPopper, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  RefreshCw,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileCheck,
  Eye,
  X,
  Pencil,
  Building2,
  GraduationCap,
  Plane
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = API_ENDPOINTS.NOTIFICATION;
const ONBOARDING_API_URL = API_ENDPOINTS.EMPL_ONBORDING;

interface CalendarEvent {
  id: string;
  type: 'birthday' | 'anniversary' | 'holiday' | 'custom' | 'notification' | 'license' | 'certification' | 'immigration';
  title: string;
  date: string;
  employeeId?: string;
  employeeName?: string;
  description?: string;
  yearsOfService?: number;
  color?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notificationData?: {
    category: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    read: boolean;
  };
}

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
  dueDate?: string;
}

export function HRCalendarUnified() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<string>>(new Set(['birthday', 'anniversary', 'holiday', 'notification', 'custom', 'license', 'certification', 'immigration']));
  const [employees, setEmployees] = useState<any[]>([]);

  const [newEvent, setNewEvent] = useState({
    type: 'custom' as const,
    title: '',
    date: '',
    description: '',
    color: '#3b82f6',
    repeating: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    reminderFrequency: 'none' as 'none' | 'same-day' | '1-day' | '3-days' | '1-week' | '2-weeks'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Regenerate events when the viewed month changes
    if (employees.length > 0) {
      generateEvents(employees);
    }
  }, [currentDate]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchEmployeesAndGenerateEvents(),
      fetchHolidays(),
      fetchNotifications(),
      generateCalendarAlerts()
    ]);
    setIsLoading(false);
  };

  const fetchEmployeesAndGenerateEvents = async () => {
    try {
      // Fetch employees
      const employeesRes = await fetch(`${ONBOARDING_API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        console.log('[HR Calendar] Fetched employees:', data.employees);
        setEmployees(data.employees || []);
        generateEvents(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      // Initialize US holidays for current year
      const currentYear = new Date().getFullYear();
      await fetch(`${API_URL}/hr-calendar/initialize-us-holidays`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year: currentYear })
      });
      console.log(`[HR Calendar] Initialized US holidays for ${currentYear}`);

      // Fetch holidays
      const holidaysRes = await fetch(`${API_URL}/hr-calendar/holidays`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      
      if (holidaysRes.ok) {
        const data = await holidaysRes.json();
        console.log('[HR Calendar] Fetched holidays:', data.holidays);
        // Add holidays to events with deduplication
        setEvents(prev => {
          // Remove old holidays first
          const nonHolidays = prev.filter(e => e.type !== 'holiday');
          // Combine with new holidays and deduplicate
          const combined = [...nonHolidays, ...(data.holidays || [])];
          const deduped = Array.from(new Map(combined.map(e => [e.id, e])).values());
          return deduped;
        });
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const reinitializeHolidays = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(`${API_URL}/hr-calendar/initialize-us-holidays`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year: currentYear, force: true })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`US holidays for ${currentYear} re-initialized! (${data.count} holidays)`);
        await fetchHolidays(); // Refresh the calendar
      } else {
        toast.error('Failed to reinitialize holidays');
      }
    } catch (error) {
      console.error('Error reinitializing holidays:', error);
      toast.error('Failed to reinitialize holidays');
    }
  };

  const generateEvents = (employeeList: any[]) => {
    const generatedEvents: CalendarEvent[] = [];
    const viewedYear = getYear(currentDate);

    console.log('[HR Calendar] Generating events for viewed year:', viewedYear);
    console.log('[HR Calendar] Processing employees:', employeeList.length);

    employeeList.forEach(employee => {
      console.log('[HR Calendar] Employee:', employee.firstName, employee.lastName);
      console.log('  - dateOfBirth:', employee.dateOfBirth);
      console.log('  - startDate:', employee.startDate);
      
      // Birthday events - recurring every year
      if (employee.dateOfBirth) {
        const [year, month, day] = employee.dateOfBirth.split('-').map(Number);
        const thisYearBirthday = new Date(viewedYear, month - 1, day);
        
        console.log('  - Generated birthday event for year', viewedYear, ':', thisYearBirthday.toISOString());
        
        generatedEvents.push({
          id: `birthday-${employee.id}-${viewedYear}`,
          type: 'birthday',
          title: `${employee.firstName} ${employee.lastName}'s Birthday`,
          date: thisYearBirthday.toISOString(),
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          color: '#ec4899'
        });
      }

      // Work Anniversary events - recurring every year
      if (employee.startDate) {
        const startDate = new Date(employee.startDate);
        const thisYearAnniversary = new Date(viewedYear, startDate.getMonth(), startDate.getDate());
        const yearsOfService = viewedYear - startDate.getFullYear();
        
        console.log('  - Years of service for year', viewedYear, ':', yearsOfService);
        
        if (yearsOfService > 0) {
          console.log('  - Generated anniversary event for year', viewedYear, ':', thisYearAnniversary.toISOString());
          
          generatedEvents.push({
            id: `anniversary-${employee.id}-${viewedYear}`,
            type: 'anniversary',
            title: `${employee.firstName} ${employee.lastName} - ${yearsOfService} Year${yearsOfService > 1 ? 's' : ''}`,
            date: thisYearAnniversary.toISOString(),
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            yearsOfService,
            color: '#a855f7'
          });
        }
      }
    });

    console.log('[HR Calendar] Total generated events:', generatedEvents.length);
    setEvents(prev => {
      // Keep only holidays and custom events (not birthdays/anniversaries)
      const nonRecurringEvents = prev.filter(e => e.type === 'holiday' || e.type === 'custom');
      // Combine with new birthday/anniversary events and deduplicate by ID
      const combined = [...nonRecurringEvents, ...generatedEvents];
      const deduped = Array.from(new Map(combined.map(e => [e.id, e])).values());
      return deduped;
    });
  };

  const fetchEvents = async () => {
    // This is now handled by fetchEmployeesAndGenerateEvents and fetchHolidays
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications?userId=current-user-id`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        const notifs = Array.isArray(data) ? data : [];
        setNotifications(notifs);
        
        // Convert notifications with due dates into calendar events
        const notificationEvents: CalendarEvent[] = notifs
          .filter((n: Notification) => n.dueDate)
          .map((n: Notification) => {
            let eventType: CalendarEvent['type'] = 'notification';
            
            // Map notification categories to event types
            if (n.category === 'Licensing' || n.relatedEntityType === 'business_license') {
              eventType = 'license';
            } else if (n.category === 'Certifications' || n.relatedEntityType === 'certification') {
              eventType = 'certification';
            } else if (n.category === 'Immigration' || n.relatedEntityType?.includes('visa') || n.relatedEntityType?.includes('i9') || n.relatedEntityType?.includes('work_auth')) {
              eventType = 'immigration';
            }
            
            return {
              id: `notif-${n.id}`,
              type: eventType,
              title: n.title,
              date: n.dueDate!,
              description: n.message,
              priority: n.priority,
              color: n.priority === 'urgent' ? '#ef4444' : 
                     n.priority === 'high' ? '#f97316' : 
                     n.priority === 'medium' ? '#eab308' : '#3b82f6',
              notificationData: {
                category: n.category,
                message: n.message,
                actionUrl: n.actionUrl,
                actionLabel: n.actionLabel,
                read: n.read
              }
            };
          });
        
        // Add notification events to the calendar
        setEvents(prev => {
          // Remove old notification-based events
          const nonNotificationEvents = prev.filter(e => !e.id.startsWith('notif-'));
          // Add new notification events
          return [...nonNotificationEvents, ...notificationEvents];
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const generateCalendarAlerts = async () => {
    try {
      await fetch(`${API_URL}/notifications/generate-calendar-alerts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
    } catch (error) {
      console.error('Error generating calendar alerts:', error);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/calendar-events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
      });

      if (response.ok) {
        toast.success('Event added successfully');
        setShowAddDialog(false);
        setNewEvent({
          type: 'custom',
          title: '',
          date: '',
          description: '',
          color: '#3b82f6',
          repeating: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
          reminderFrequency: 'none' as 'none' | 'same-day' | '1-day' | '3-days' | '1-week' | '2-weeks'
        });
        fetchEvents();
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventType: string) => {
    // Don't allow deleting birthdays and anniversaries (they're auto-generated)
    if (eventType === 'birthday' || eventType === 'anniversary') {
      toast.error('Cannot delete auto-generated events. Birthdays and anniversaries are based on employee data.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/calendar-events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId));
        toast.success('Event deleted successfully');
        setSelectedDate(null); // Close the detail view
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    // Don't allow editing birthdays and anniversaries (they're auto-generated)
    if (event.type === 'birthday' || event.type === 'anniversary') {
      toast.error('Cannot edit auto-generated events. Birthdays and anniversaries are based on employee data.');
      return;
    }

    setEditingEvent(event);
    setShowEditDialog(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !editingEvent.title || !editingEvent.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/calendar-events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingEvent.title,
          date: editingEvent.date,
          description: editingEvent.description,
          color: editingEvent.color
        })
      });

      if (response.ok) {
        toast.success('Event updated successfully');
        setShowEditDialog(false);
        setEditingEvent(null);
        // Update the event in the local state
        setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
      } else {
        toast.error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  // Combine events and notifications for calendar display
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Calendar events - Parse dates without timezone conversion
    const calendarEvents = events.filter(event => {
      // Use parseISO to correctly handle ISO date strings and avoid timezone issues
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, date);
    });

    // Notifications with due dates
    const notificationEvents: CalendarEvent[] = notifications
      .filter(n => n.dueDate)
      .filter(n => {
        const dueDate = new Date(n.dueDate!);
        return isSameDay(dueDate, date);
      })
      .map(n => ({
        id: `notification-${n.id}`,
        type: 'notification' as const,
        title: n.title,
        date: n.dueDate!,
        priority: n.priority,
        description: n.message,
        color: getPriorityColor(n.priority),
        notificationData: {
          category: n.category,
          message: n.message,
          actionUrl: n.actionUrl,
          actionLabel: n.actionLabel,
          read: n.read
        }
      }));

    return [...calendarEvents, ...notificationEvents];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Cake className="h-4 w-4" />;
      case 'anniversary': return <Award className="h-4 w-4" />;
      case 'holiday': return <PartyPopper className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'license': return <Building2 className="h-4 w-4" />;
      case 'certification': return <GraduationCap className="h-4 w-4" />;
      case 'immigration': return <Plane className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'confirmation': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'reminder': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'approval': return <FileCheck className="h-5 w-5 text-purple-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of the week the month starts on (0 = Sunday, 6 = Saturday)
  const startDayOfWeek = monthStart.getDay();
  
  // Create empty cells for days before the first day of the month
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentNotifications = notifications.filter(n => n.priority === 'urgent' && !n.read);

  // Count events only in the current month
  const eventsThisMonth = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= monthStart && eventDate <= monthEnd;
  });

  // Include notifications with due dates in the count
  const notificationsThisMonth = notifications.filter(n => {
    if (!n.dueDate) return false;
    const dueDate = new Date(n.dueDate);
    return dueDate >= monthStart && dueDate <= monthEnd;
  });

  const totalEventsThisMonth = eventsThisMonth.length + notificationsThisMonth.length;
  const birthdaysThisMonth = eventsThisMonth.filter(e => e.type === 'birthday').length;
  const anniversariesThisMonth = eventsThisMonth.filter(e => e.type === 'anniversary').length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              {urgentNotifications.length} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEventsThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Birthdays</CardTitle>
            <Cake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {birthdaysThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anniversaries</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {anniversariesThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    HR Calendar & Notifications
                  </CardTitle>
                  <CardDescription>
                    View all HR events, alerts, and important dates in one place
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reinitializeHolidays}
                    title="Reinitialize all US holidays for the current year with corrected dates"
                  >
                    <PartyPopper className="h-4 w-4 mr-2" />
                    Fix Holidays
                  </Button>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calendar Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold text-lg min-w-[200px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                </div>
              </div>

              {/* Event Type Filters */}
              <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Show:
                </span>
                <Button
                  variant={visibleEventTypes.has('birthday') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newSet = new Set(visibleEventTypes);
                    if (newSet.has('birthday')) {
                      newSet.delete('birthday');
                    } else {
                      newSet.add('birthday');
                    }
                    setVisibleEventTypes(newSet);
                  }}
                  className={`h-7 text-xs ${visibleEventTypes.has('birthday') ? 'gradient-teal-blue text-white hover:opacity-90' : ''}`}
                >
                  <Cake className="h-3 w-3 mr-1" />
                  Birthdays
                </Button>
                <Button
                  variant={visibleEventTypes.has('anniversary') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newSet = new Set(visibleEventTypes);
                    if (newSet.has('anniversary')) {
                      newSet.delete('anniversary');
                    } else {
                      newSet.add('anniversary');
                    }
                    setVisibleEventTypes(newSet);
                  }}
                  className={`h-7 text-xs ${visibleEventTypes.has('anniversary') ? 'gradient-teal-blue text-white hover:opacity-90' : ''}`}
                >
                  <Award className="h-3 w-3 mr-1" />
                  Anniversaries
                </Button>
                <Button
                  variant={visibleEventTypes.has('holiday') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newSet = new Set(visibleEventTypes);
                    if (newSet.has('holiday')) {
                      newSet.delete('holiday');
                    } else {
                      newSet.add('holiday');
                    }
                    setVisibleEventTypes(newSet);
                  }}
                  className={`h-7 text-xs ${visibleEventTypes.has('holiday') ? 'gradient-teal-blue text-white hover:opacity-90' : ''}`}
                >
                  <PartyPopper className="h-3 w-3 mr-1" />
                  Holidays
                </Button>
                <Button
                  variant={visibleEventTypes.has('notification') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newSet = new Set(visibleEventTypes);
                    if (newSet.has('notification')) {
                      newSet.delete('notification');
                    } else {
                      newSet.add('notification');
                    }
                    setVisibleEventTypes(newSet);
                  }}
                  className={`h-7 text-xs ${visibleEventTypes.has('notification') ? 'gradient-teal-blue text-white hover:opacity-90' : ''}`}
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Notifications {unreadCount > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{unreadCount}</Badge>}
                </Button>
                <Button
                  variant={visibleEventTypes.has('custom') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newSet = new Set(visibleEventTypes);
                    if (newSet.has('custom')) {
                      newSet.delete('custom');
                    } else {
                      newSet.add('custom');
                    }
                    setVisibleEventTypes(newSet);
                  }}
                  className={`h-7 text-xs ${visibleEventTypes.has('custom') ? 'gradient-teal-blue text-white hover:opacity-90' : ''}`}
                >
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Custom
                </Button>
                <Button
                  variant={visibleEventTypes.has('license') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newSet = new Set(visibleEventTypes);
                    if (newSet.has('license')) {
                      newSet.delete('license');
                    } else {
                      newSet.add('license');
                    }
                    setVisibleEventTypes(newSet);
                  }}
                  className={`h-7 text-xs ${visibleEventTypes.has('license') ? 'gradient-teal-blue text-white hover:opacity-90' : ''}`}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Licenses
                </Button>
                <Button
                  variant={visibleEventTypes.has('certification') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newSet = new Set(visibleEventTypes);
                    if (newSet.has('certification')) {
                      newSet.delete('certification');
                    } else {
                      newSet.add('certification');
                    }
                    setVisibleEventTypes(newSet);
                  }}
                  className={`h-7 text-xs ${visibleEventTypes.has('certification') ? 'gradient-teal-blue text-white hover:opacity-90' : ''}`}
                >
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Certifications
                </Button>
                <Button
                  variant={visibleEventTypes.has('immigration') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newSet = new Set(visibleEventTypes);
                    if (newSet.has('immigration')) {
                      newSet.delete('immigration');
                    } else {
                      newSet.add('immigration');
                    }
                    setVisibleEventTypes(newSet);
                  }}
                  className={`h-7 text-xs ${visibleEventTypes.has('immigration') ? 'gradient-teal-blue text-white hover:opacity-90' : ''}`}
                >
                  <Plane className="h-3 w-3 mr-1" />
                  Immigration
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="border rounded-lg">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b bg-muted/50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center font-medium text-sm">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {/* Empty cells for days before the month starts */}
                  {emptyDays.map((_, idx) => (
                    <div key={`empty-${idx}`} className="min-h-[100px] p-2 border-b border-r bg-muted/20"></div>
                  ))}
                  
                  {/* Actual days of the month */}
                  {daysInMonth.map((day, idx) => {
                    const dayEvents = getEventsForDate(day).filter(
                      e => visibleEventTypes.has(e.type)
                    );
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div
                        key={idx}
                        className={`min-h-[100px] p-2 border-b border-r ${
                          isToday ? 'bg-blue-50' : ''
                        } hover:bg-muted/50 cursor-pointer`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600' : ''
                        }`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded truncate flex items-center gap-1"
                              style={{ backgroundColor: event.color + '20', color: event.color }}
                            >
                              {getEventIcon(event.type)}
                              <span className="truncate">{event.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Events */}
              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Events for {format(selectedDate, 'MMMM d, yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const filteredEvents = getEventsForDate(selectedDate).filter(
                        e => visibleEventTypes.has(e.type)
                      );
                      
                      if (filteredEvents.length === 0) {
                        return (
                          <p className="text-muted-foreground text-center py-4">
                            No events scheduled for this day
                          </p>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          {filteredEvents.map(event => (
                            <div
                              key={event.id}
                              className="flex items-start gap-3 p-3 border rounded-lg"
                            >
                              <div
                                className="p-2 rounded"
                                style={{ backgroundColor: event.color + '20' }}
                              >
                                {getEventIcon(event.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{event.title}</h4>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {event.type}
                                  </Badge>
                                  {event.priority && (
                                    <Badge
                                      variant={event.priority === 'urgent' ? 'destructive' : 'default'}
                                      className="text-xs"
                                    >
                                      {event.priority}
                                    </Badge>
                                  )}
                                  {event.notificationData && !event.notificationData.read && (
                                    <Badge variant="destructive" className="text-xs">New</Badge>
                                  )}
                                </div>
                                {event.employeeName && (
                                  <p className="text-sm text-muted-foreground">
                                    {event.employeeName}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {event.description}
                                  </p>
                                )}
                                {event.yearsOfService && (
                                  <p className="text-sm text-muted-foreground">
                                    {event.yearsOfService} years of service
                                  </p>
                                )}
                                
                                <div className="flex gap-2 mt-2">
                                  {event.notificationData && !event.notificationData.read && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(event.id.replace('notification-', ''))}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Mark as Read
                                    </Button>
                                  )}
                                  {event.notificationData?.actionUrl && event.notificationData?.actionLabel && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.location.href = event.notificationData!.actionUrl!}
                                    >
                                      {event.notificationData.actionLabel}
                                    </Button>
                                  )}
                                  {event.type !== 'birthday' && event.type !== 'anniversary' && event.type !== 'notification' && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditEvent(event)}
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteEvent(event.id, event.type)}
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Overview Boxes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Events & Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Today's Events & Alerts
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                {(() => {
                  const today = new Date();
                  const todaysEvents = getEventsForDate(today);

                  if (todaysEvents.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No events or alerts for today
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {todaysEvents.map(event => (
                        <div
                          key={event.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedDate(today)}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className="p-1.5 rounded"
                              style={{ backgroundColor: event.color + '20' }}
                            >
                              {getEventIcon(event.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {event.type}
                                </Badge>
                                {event.priority && (
                                  <Badge
                                    variant={event.priority === 'urgent' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {event.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upcoming Events & Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Upcoming Events & Alerts
              </CardTitle>
              <CardDescription>
                Next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                {(() => {
                  const today = startOfDay(new Date());
                  const nextWeek = addDays(today, 7);
                  
                  const upcomingEvents = events.filter(event => {
                    const eventDate = parseISO(event.date);
                    return isAfter(eventDate, today) && isBefore(eventDate, nextWeek);
                  }).sort((a, b) => {
                    const dateA = parseISO(a.date);
                    const dateB = parseISO(b.date);
                    return dateA.getTime() - dateB.getTime();
                  });

                  const upcomingNotifications = notifications
                    .filter(n => {
                      if (!n.dueDate) return false;
                      const dueDate = new Date(n.dueDate);
                      return isAfter(dueDate, today) && isBefore(dueDate, nextWeek);
                    })
                    .filter(n => !n.read)
                    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

                  if (upcomingEvents.length === 0 && upcomingNotifications.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No upcoming events or alerts
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {upcomingEvents.map(event => {
                        const eventDate = parseISO(event.date);
                        return (
                          <div
                            key={event.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedDate(eventDate)}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className="p-1.5 rounded"
                                style={{ backgroundColor: event.color + '20' }}
                              >
                                {getEventIcon(event.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {format(eventDate, 'MMM dd, yyyy')}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {event.type}
                                  </Badge>
                                  {event.priority && (
                                    <Badge
                                      variant={event.priority === 'urgent' ? 'destructive' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {event.priority}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {upcomingNotifications.map(notification => {
                        const dueDate = new Date(notification.dueDate!);
                        return (
                          <div
                            key={notification.id}
                            className="p-3 border rounded-lg border-l-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            style={{ borderLeftColor: getPriorityColor(notification.priority) }}
                          >
                            <div className="flex items-start gap-2">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{notification.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Due: {format(dueDate, 'MMM dd, yyyy')}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {notification.category}
                                  </Badge>
                                  <Badge
                                    variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {notification.priority}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Event</DialogTitle>
            <DialogDescription>
              Add a custom event to the HR calendar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value: any) => setNewEvent({ ...newEvent, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Event</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Repeating Event</Label>
                <Select
                  value={newEvent.repeating}
                  onValueChange={(value: any) => setNewEvent({ ...newEvent, repeating: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does Not Repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reminder</Label>
                <Select
                  value={newEvent.reminderFrequency}
                  onValueChange={(value: any) => setNewEvent({ ...newEvent, reminderFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Reminder</SelectItem>
                    <SelectItem value="same-day">Same Day</SelectItem>
                    <SelectItem value="1-day">1 Day Before</SelectItem>
                    <SelectItem value="3-days">3 Days Before</SelectItem>
                    <SelectItem value="1-week">1 Week Before</SelectItem>
                    <SelectItem value="2-weeks">2 Weeks Before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={newEvent.color}
                onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent}>
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Edit the selected event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select
                value={editingEvent?.type}
                onValueChange={(value: any) => setEditingEvent({ ...editingEvent!, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Event</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={editingEvent?.title}
                onChange={(e) => setEditingEvent({ ...editingEvent!, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={editingEvent?.date}
                onChange={(e) => setEditingEvent({ ...editingEvent!, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingEvent?.description}
                onChange={(e) => setEditingEvent({ ...editingEvent!, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={editingEvent?.color}
                onChange={(e) => setEditingEvent({ ...editingEvent!, color: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEvent}>
              Update Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

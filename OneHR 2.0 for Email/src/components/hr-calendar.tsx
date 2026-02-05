import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, Cake, Award, PartyPopper, Plus, 
  ChevronLeft, ChevronRight, Filter, Download, Users, Globe
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getYear } from 'date-fns';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

// Common US timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST/AKDT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
];

// Helper function to convert ISO date to specific timezone
const getDateInTimezone = (isoString: string, timezone: string): Date => {
  // For date-only events (holidays, birthdays, anniversaries), we should ignore 
  // timezone conversion and just extract the date components to avoid shifting
  const date = new Date(isoString);
  
  // Extract date components from the ISO string directly to avoid timezone shifts
  // The backend stores dates at noon UTC (e.g., "2025-12-25T12:00:00.000Z")
  const year = parseInt(isoString.substring(0, 4));
  const month = parseInt(isoString.substring(5, 7)) - 1; // Month is 0-indexed
  const day = parseInt(isoString.substring(8, 10));
  
  // Create a new date with local components at noon (no timezone shift)
  return new Date(year, month, day, 12, 0, 0, 0);
};

// Helper function to format date in specific timezone
const formatInTimezone = (date: Date | string, timezone: string, formatStr: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // For simple date formats, use toLocaleString
  if (formatStr === 'MM/dd/yyyy') {
    return d.toLocaleDateString('en-US', {
      timeZone: timezone,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  } else if (formatStr === 'MMM dd, yyyy') {
    return d.toLocaleDateString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } else if (formatStr === 'MMMM yyyy') {
    return d.toLocaleDateString('en-US', {
      timeZone: timezone,
      month: 'long',
      year: 'numeric'
    });
  } else if (formatStr === 'd') {
    return d.toLocaleDateString('en-US', {
      timeZone: timezone,
      day: 'numeric'
    });
  } else if (formatStr === 'yyyy-MM') {
    const parts = d.toLocaleDateString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit'
    }).split('/');
    return `${parts[2]}-${parts[0]}`;
  }
  
  // Fallback to regular format
  return format(d, formatStr);
};

interface CalendarEvent {
  id: string;
  type: 'birthday' | 'anniversary' | 'holiday' | 'custom';
  title: string;
  date: string;
  employeeId?: string;
  employeeName?: string;
  description?: string;
  yearsOfService?: number;
  color?: string;
}

export function HRCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showAddHolidayDialog, setShowAddHolidayDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string>('America/New_York');
  
  // Add holiday form
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDescription, setHolidayDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [events, filterType]);

  useEffect(() => {
    // Regenerate events when the viewed month changes
    if (employees.length > 0) {
      generateEvents(employees);
    }
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Initialize US holidays for current year (if not already done)
      try {
        const currentYear = new Date().getFullYear();
        await fetch(`${API_URL}/hr-calendar/initialize-us-holidays`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ year: currentYear })
        });
        console.log(`[HR Calendar] Initialized US holidays for ${currentYear}`);
      } catch (error) {
        console.error('Error initializing US holidays:', error);
        // Don't show error to user, just log it
      }
      
      // Fetch employees
      const employeesRes = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        console.log('[HR Calendar] Fetched employees:', data.employees);
        setEmployees(data.employees || []);
        generateEvents(data.employees || []);
      }
      
      // Fetch holidays
      const holidaysRes = await fetch(`${API_URL}/hr-calendar/holidays`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      if (holidaysRes.ok) {
        const data = await holidaysRes.json();
        console.log('[HR Calendar] Fetched holidays:', data.holidays);
        // Merge holidays with generated events
        setEvents(prev => [...prev, ...(data.holidays || [])]);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const generateEvents = (employeeList: any[]) => {
    const generatedEvents: CalendarEvent[] = [];
    // Use the year from the currently viewed month, not the current date
    const viewedYear = getYear(currentDate);

    console.log('[HR Calendar] Generating events for viewed year:', viewedYear);
    console.log('[HR Calendar] Processing employees:', employeeList.length);

    employeeList.forEach(employee => {
      console.log('[HR Calendar] Employee:', employee.firstName, employee.lastName);
      console.log('  - dateOfBirth:', employee.dateOfBirth);
      console.log('  - startDate:', employee.startDate);
      
      // Birthday events - recurring every year
      if (employee.dateOfBirth) {
        // Parse date without timezone conversion
        const [year, month, day] = employee.dateOfBirth.split('-').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const thisYearBirthday = new Date(viewedYear, month - 1, day);
        
        console.log('  - Generated birthday event for year', viewedYear, ':', thisYearBirthday.toISOString());
        
        generatedEvents.push({
          id: `birthday-${employee.id}-${viewedYear}`,
          type: 'birthday',
          title: `${employee.firstName} ${employee.lastName}'s Birthday`,
          date: thisYearBirthday.toISOString(),
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          color: 'bg-pink-500'
        });
      } else {
        console.log('  - No dateOfBirth found');
      }

      // Work Anniversary events - recurring every year
      if (employee.startDate) {
        const startDate = new Date(employee.startDate);
        const thisYearAnniversary = new Date(viewedYear, startDate.getMonth(), startDate.getDate());
        const yearsOfService = viewedYear - startDate.getFullYear();
        
        console.log('  - Years of service for year', viewedYear, ':', yearsOfService);
        
        // Only show anniversaries if they have at least 1 year of service by the viewed year
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
            color: 'bg-purple-500'
          });
        }
      } else {
        console.log('  - No startDate found');
      }
    });

    console.log('[HR Calendar] Total generated events:', generatedEvents.length);
    console.log('[HR Calendar] Generated events:', generatedEvents);
    setEvents(generatedEvents);
  };

  const applyFilter = () => {
    if (filterType === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(event => event.type === filterType));
    }
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      // Convert event date to selected timezone and compare dates only (ignore time)
      const eventDateTZ = getDateInTimezone(event.date, timezone);
      return isSameDay(eventDateTZ, date);
    });
  };

  const getEventsForMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    return filteredEvents.filter(event => {
      const eventDateTZ = getDateInTimezone(event.date, timezone);
      return eventDateTZ >= start && eventDateTZ <= end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleAddHoliday = async () => {
    if (!holidayName || !holidayDate) {
      toast.error('Please provide holiday name and date');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/hr-calendar/holidays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: holidayName,
          date: holidayDate,
          description: holidayDescription
        })
      });

      if (response.ok) {
        toast.success('Holiday added successfully');
        setShowAddHolidayDialog(false);
        setHolidayName('');
        setHolidayDate('');
        setHolidayDescription('');
        fetchData();
      } else {
        toast.error('Failed to add holiday');
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      const response = await fetch(`${API_URL}/hr-calendar/holidays/${holidayId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        toast.success('Holiday deleted');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Failed to delete holiday');
    }
  };

  const exportToCSV = () => {
    const monthEvents = getEventsForMonth();
    const csvContent = [
      ['Date', 'Type', 'Title', 'Employee', 'Description'].join(','),
      ...monthEvents.map(event => [
        format(new Date(event.date), 'MM/dd/yyyy'),
        event.type,
        event.title,
        event.employeeName || '',
        event.description || ''
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-calendar-${format(currentDate, 'yyyy-MM')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const initializeHolidaysForYear = async (year: number, force: boolean = false) => {
    try {
      const response = await fetch(`${API_URL}/hr-calendar/initialize-us-holidays`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year, force })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`US holidays for ${year} ${force ? 're-' : ''}initialized! (${data.count} holidays)`);
        fetchData();
      }
    } catch (error) {
      console.error('Error initializing holidays:', error);
      toast.error('Failed to initialize holidays');
    }
  };

  const monthEvents = getEventsForMonth();
  const birthdayCount = monthEvents.filter(e => e.type === 'birthday').length;
  const anniversaryCount = monthEvents.filter(e => e.type === 'anniversary').length;
  const holidayCount = monthEvents.filter(e => e.type === 'holiday').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl flex items-center gap-2">
            <CalendarIcon className="h-7 w-7 text-blue-600" />
            HR Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track birthdays, anniversaries, holidays, and important dates
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={() => initializeHolidaysForYear(new Date().getFullYear(), true)}
            title="Reinitialize all US holidays for the current year with corrected dates"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Fix Holiday Dates
          </Button>
          <Button onClick={() => setShowAddHolidayDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <Cake className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Birthdays This Month</p>
                <p className="text-2xl font-semibold">{birthdayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anniversaries This Month</p>
                <p className="text-2xl font-semibold">{anniversaryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <PartyPopper className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Holidays This Month</p>
                <p className="text-2xl font-semibold">{holidayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-semibold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="birthday">Birthdays</SelectItem>
                    <SelectItem value="anniversary">Anniversaries</SelectItem>
                    <SelectItem value="holiday">Holidays</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {(() => {
                const start = startOfMonth(currentDate);
                const end = endOfMonth(currentDate);
                const days = eachDayOfInterval({ start, end });
                const startDay = start.getDay();
                const cells = [];
                
                // Empty cells before month starts
                for (let i = 0; i < startDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="p-2 min-h-[80px]"></div>);
                }
                
                // Month days
                days.forEach(day => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  
                  cells.push(
                    <div
                      key={day.toISOString()}
                      className={`p-2 min-h-[80px] border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        isToday ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => {
                        setSelectedDate(day);
                        if (dayEvents.length > 0) {
                          setShowEventDialog(true);
                        }
                      }}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded text-white truncate ${
                              event.type === 'birthday' ? 'bg-pink-500' :
                              event.type === 'anniversary' ? 'bg-purple-500' :
                              event.type === 'holiday' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}
                            title={event.title}
                          >
                            {event.type === 'birthday' && '🎂 '}
                            {event.type === 'anniversary' && '🎉 '}
                            {event.type === 'holiday' && '🎊 '}
                            {event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
                
                return cells;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events in {format(currentDate, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {monthEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No events this month
                </p>
              ) : (
                monthEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      event.type === 'birthday' ? 'bg-pink-100' :
                      event.type === 'anniversary' ? 'bg-purple-100' :
                      event.type === 'holiday' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {event.type === 'birthday' && <Cake className="h-5 w-5 text-pink-600" />}
                      {event.type === 'anniversary' && <Award className="h-5 w-5 text-purple-600" />}
                      {event.type === 'holiday' && <PartyPopper className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <Badge variant="outline" className="mt-1 text-xs">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-pink-500"></div>
              <span className="text-sm">Birthday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span className="text-sm">Work Anniversary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Events on {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}
            </DialogTitle>
            <DialogDescription>
              All events scheduled for this day
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDate && getEventsForDate(selectedDate).map(event => (
              <div key={event.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.type === 'birthday' ? 'bg-pink-100' :
                      event.type === 'anniversary' ? 'bg-purple-100' :
                      event.type === 'holiday' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {event.type === 'birthday' && <Cake className="h-5 w-5 text-pink-600" />}
                      {event.type === 'anniversary' && <Award className="h-5 w-5 text-purple-600" />}
                      {event.type === 'holiday' && <PartyPopper className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <Badge variant="outline" className="mt-1">
                        {event.type}
                      </Badge>
                      {event.yearsOfService && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {event.yearsOfService} year{event.yearsOfService > 1 ? 's' : ''} of service
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                  {event.type === 'holiday' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this holiday?')) {
                          handleDeleteHoliday(event.id);
                          setShowEventDialog(false);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Holiday Dialog */}
      <Dialog open={showAddHolidayDialog} onOpenChange={setShowAddHolidayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Add a company holiday or special event to the calendar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="holiday-name">Holiday Name</Label>
              <Input
                id="holiday-name"
                placeholder="e.g., New Year's Day"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="holiday-date">Date</Label>
              <Input
                id="holiday-date"
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="holiday-description">Description (Optional)</Label>
              <Textarea
                id="holiday-description"
                placeholder="Additional details about this holiday"
                value={holidayDescription}
                onChange={(e) => setHolidayDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddHoliday} className="flex-1">
                Add Holiday
              </Button>
              <Button variant="outline" onClick={() => setShowAddHolidayDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

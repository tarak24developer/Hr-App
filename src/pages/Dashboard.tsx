import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  UserPlus,
  DollarSign,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';
import firebaseService from '../services/firebaseService';
import { formatIndianCurrency } from '../utils/currency';
import DashboardCard from '../components/DashboardCard';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  monthlyPayroll: number;
  employeeChange: string;
  attendanceChange: string;
  leaveChange: string;
  payrollChange: string;
}

interface CalendarEvent {
  id: string;
  name: string;
  date: Date;
  type: 'holiday' | 'meeting' | 'task' | 'announcement';
  description?: string;
  startTime?: string;
  endTime?: string;
  priority?: 'low' | 'medium' | 'high';
  attendees?: string[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Quick Actions state - for future use
  
  // Calendar modal state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [showEventPreview, setShowEventPreview] = useState(false);
  // keep only the setter; no local state read needed
  const [, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Announcement form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'announcement' as 'holiday' | 'meeting' | 'task' | 'announcement',
    priority: 'medium' as 'low' | 'medium' | 'high',
    date: new Date(),
    startTime: '',
    endTime: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEvents] = useState<CalendarEvent[]>(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    return [
      { id: '1', name: 'Republic Day', date: new Date(currentYear, 0, 26), type: 'holiday', priority: 'high' },
      { id: '2', name: 'Team Meeting', date: new Date(currentYear, currentMonth, currentDay + 2), type: 'meeting', startTime: '10:00', endTime: '11:00', priority: 'medium', attendees: ['John', 'Sarah', 'Mike'] },
      { id: '3', name: 'Project Deadline', date: new Date(currentYear, currentMonth, currentDay + 5), type: 'task', priority: 'high' },
      { id: '4', name: 'Holi', date: new Date(currentYear, 2, 25), type: 'holiday', priority: 'high' },
      { id: '5', name: 'Performance Review', date: new Date(currentYear, currentMonth, currentDay + 1), type: 'meeting', startTime: '14:00', endTime: '15:00', priority: 'high', attendees: ['HR Team'] },
      { id: '6', name: 'Training Session', date: new Date(currentYear, currentMonth, currentDay + 3), type: 'task', startTime: '09:00', endTime: '12:00', priority: 'medium' },
      { id: '7', name: 'Company Policy Update', date: new Date(currentYear, currentMonth, currentDay), type: 'announcement', priority: 'high', description: 'New remote work policy effective immediately' },
      { id: '8', name: 'Monthly All-Hands', date: new Date(currentYear, currentMonth, currentDay + 7), type: 'meeting', startTime: '16:00', endTime: '17:00', priority: 'medium', attendees: ['All Employees'] },
      { id: '9', name: 'System Maintenance', date: new Date(currentYear, currentMonth, currentDay + 4), type: 'announcement', priority: 'low', description: 'HRMS system will be down for 2 hours' }
    ];
  });

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load users (employees)
      const usersResult = await firebaseService.getCollection('users');
      const totalEmployees = usersResult?.success && usersResult.data ? usersResult.data.length : 0;

      // Generate realistic mock data
      const mockStats: DashboardStats = {
        totalEmployees,
        activeEmployees: Math.floor(totalEmployees * 0.87),
        pendingLeaves: Math.floor(totalEmployees * 0.12),
        monthlyPayroll: totalEmployees * 52000,
        employeeChange: '+3.2%',
        attendanceChange: '+5.8%',
        leaveChange: '-2.1%',
        payrollChange: '+8.5%',
      };

      setStats(mockStats);
      return mockStats;

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);


  // Handle refresh
  const handleRefresh = () => {
    loadDashboardData();
    setSuccessMessage('Dashboard refreshed successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    
    switch (action) {
      case 'Manage Payroll':
        navigate('/payroll');
        break;
      case 'Add Employee':
        navigate('/employee-directory');
        break;
      case 'View Attendance':
        navigate('/attendance');
        break;
      case 'View Reports':
        navigate('/reports');
        break;
      case 'Manage Leaves':
        navigate('/leaves');
        break;
      default:
        setSuccessMessage(`${action} action initiated`);
        setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Calendar helper functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const today = new Date();
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get total days in month
    const daysInMonth = lastDay.getDate();
    
    const days: CalendarDay[] = [];
    
    // Add previous month days to fill first week
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date)
      });
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        events: getEventsForDate(date)
      });
    }
    
    // Add next month days to fill last week
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date)
      });
    }
    
    return days;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return calendarEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const handleDateHover = (date: Date, event: React.MouseEvent) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    setHoveredDate(date);
    const events = getEventsForDate(date);
    if (events.length > 0) {
      // Get mouse position relative to the viewport
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = 300; // max-w-[300px]
      const tooltipHeight = 200; // estimated height
      const offset = 15; // distance from cursor
      
      // Calculate position relative to mouse cursor
      let x = mouseX + offset;
      let y = mouseY + offset;
      
      // Adjust if tooltip would go off screen horizontally
      if (x + tooltipWidth > viewportWidth) {
        x = mouseX - tooltipWidth - offset;
      }
      
      // Adjust if tooltip would go off screen vertically
      if (y + tooltipHeight > viewportHeight) {
        y = mouseY - tooltipHeight - offset;
      }
      
      // Ensure tooltip stays within viewport bounds
      x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10));
      y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10));
      
      setTooltipPosition({ x, y });
      
      // Show tooltip with a small delay to prevent flickering
      const timeout = setTimeout(() => {
        setShowEventPreview(true);
      }, 100);
      setHoverTimeout(timeout);
    }
  };

  const handleDateLeave = () => {
    // Clear timeout and hide tooltip immediately
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredDate(null);
    setShowEventPreview(false);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'text-red-600 bg-red-50 border-red-200';
      case 'meeting': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'task': return 'text-green-600 bg-green-50 border-green-200';
      case 'announcement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'holiday': return '🎉';
      case 'meeting': return '📅';
      case 'task': return '✅';
      case 'announcement': return '📢';
      default: return '📌';
    }
  };

  // Announcement form handlers
  const handleAddAnnouncement = () => {
    setShowAnnouncementForm(true);
  };

  const handleAnnouncementFormChange = (field: string, value: any) => {
    setAnnouncementForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!announcementForm.title.trim()) {
      errors['title'] = 'Title is required';
    }
    
    if (!announcementForm.type) {
      errors['type'] = 'Event type is required';
    }
    
    if (announcementForm.startTime && announcementForm.endTime) {
      const start = new Date(`2000-01-01T${announcementForm.startTime}`);
      const end = new Date(`2000-01-01T${announcementForm.endTime}`);
      if (start >= end) {
        errors['endTime'] = 'End time must be after start time';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAnnouncementSubmit = () => {
    if (!validateForm()) {
      setSuccessMessage('Please fix the errors in the form');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    // Create new event
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      name: announcementForm.title,
      date: announcementForm.date,
      type: announcementForm.type,
      description: announcementForm.content || announcementForm.description,
      priority: announcementForm.priority
    };

    // Add optional time properties if they exist
    if (announcementForm.startTime) {
      newEvent.startTime = announcementForm.startTime;
    }
    if (announcementForm.endTime) {
      newEvent.endTime = announcementForm.endTime;
    }

    // In a real app, this would be saved to backend
    console.log('New event created:', newEvent);
    
    // Reset form and close modal
    resetForm();
    setShowAnnouncementForm(false);
    setSuccessMessage(`${announcementForm.type.charAt(0).toUpperCase() + announcementForm.type.slice(1)} added successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const resetForm = () => {
    setAnnouncementForm({
      title: '',
      content: '',
      type: 'announcement',
      priority: 'medium',
      date: new Date(),
      startTime: '',
      endTime: '',
      description: ''
    });
    setFormErrors({});
  };

  const handleAnnouncementCancel = () => {
    resetForm();
    setShowAnnouncementForm(false);
  };


  // Show loading state
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
          Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HRMS Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your overview for today.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
             onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 border border-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content - only show when not loading and no errors */}
      {!loading && !error && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats && [
          {
            name: 'Total Employees',
            value: stats.totalEmployees,
            change: stats.employeeChange,
            changeType: (stats.employeeChange.startsWith('+') ? 'positive' : 'negative') as 'positive' | 'negative',
            icon: Users,
            color: 'blue' as const
          },
          {
            name: 'Active Employees',
            value: stats.activeEmployees,
            change: stats.attendanceChange,
            changeType: (stats.attendanceChange.startsWith('+') ? 'positive' : 'negative') as 'positive' | 'negative',
            icon: CheckCircle,
            color: 'green' as const
          },
          {
            name: 'Pending Leaves',
            value: stats.pendingLeaves,
            change: stats.leaveChange,
            changeType: (stats.leaveChange.startsWith('+') ? 'positive' : 'negative') as 'positive' | 'negative',
            icon: Calendar,
            color: 'yellow' as const
          },
          {
            name: 'Monthly Payroll',
            value: formatIndianCurrency(stats.monthlyPayroll),
            change: stats.payrollChange,
            changeType: (stats.payrollChange.startsWith('+') ? 'positive' : 'negative') as 'positive' | 'negative',
            icon: DollarSign,
            color: 'purple' as const
          }
        ].map((stat) => (
          <DashboardCard
            key={stat.name}
            name={stat.name}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Calendar Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Calendar</h3>
                </div>
                <button 
                  onClick={handleAddAnnouncement}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md border border-blue-600"
                  title="Add Announcement"
                  aria-label="Add Announcement"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Previous month"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Next month"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2 relative">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={`day-${index}`} className="text-center py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => (
                    <div
                      key={index}
                      className={cn(
                        "min-h-[40px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300 relative group",
                        day.isToday ? "bg-primary-50 border-primary-300" : "",
                        !day.isCurrentMonth ? "text-gray-300 bg-gray-50" : "text-gray-800"
                      )}
                      onClick={() => handleDateClick(day.date)}
                      onMouseEnter={(e) => handleDateHover(day.date, e)}
                      onMouseLeave={handleDateLeave}
                    >
                      <div className={cn(
                        "text-sm font-semibold mb-1",
                        day.isToday ? "text-primary-700" : "",
                        !day.isCurrentMonth ? "text-gray-300" : "text-gray-800"
                      )}>
                        {day.date.getDate()}
                      </div>
                      
                      {/* Event Indicators */}
                      {day.events.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {day.events.slice(0, 3).map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                event.type === 'holiday' ? "bg-red-500" :
                                event.type === 'meeting' ? "bg-blue-500" :
                                event.type === 'task' ? "bg-green-500" :
                                event.type === 'announcement' ? "bg-yellow-500" : "bg-gray-500"
                              )}
                            />
                          ))}
                          {day.events.length > 3 && (
                            <div className="text-xs text-gray-500 font-medium">
                              +{day.events.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Event Preview Tooltip */}
                {showEventPreview && hoveredDate && (
                  <div className="absolute right-4 top-20 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[300px] pointer-events-none">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {hoveredDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {getEventsForDate(hoveredDate).length} event{getEventsForDate(hoveredDate).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {getEventsForDate(hoveredDate).slice(0, 3).map((event, index) => (
                        <div key={index} className={cn(
                          "p-2 rounded border text-xs",
                          getEventTypeColor(event.type)
                        )}>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{getEventTypeIcon(event.type)}</span>
                            <span className="font-medium">{event.name}</span>
                          </div>
                          {event.startTime && (
                            <div className="text-xs mt-1 text-gray-600">
                              🕐 {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                            </div>
                          )}
                          {event.priority && (
                            <div className="text-xs mt-1">
                              <span className={cn(
                                "px-1 py-0.5 rounded text-xs font-medium",
                                event.priority === 'high' ? "bg-red-100 text-red-700" :
                                event.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"
                              )}>
                                {event.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {getEventsForDate(hoveredDate).length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{getEventsForDate(hoveredDate).length - 3} more events
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Event Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Holidays</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Meetings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Tasks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Announcements</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <button 
                  onClick={() => handleQuickAction('Add Employee')}
                  className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="p-3 bg-primary-100 rounded-full mb-3 group-hover:bg-primary-200 transition-colors">
                    <UserPlus className="w-8 h-8 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">Add Employee</span>
                  <span className="text-xs text-gray-500 text-center mt-1">New hire</span>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('View Attendance')}
                  className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="p-3 bg-green-100 rounded-full mb-3 group-hover:bg-green-200 transition-colors">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">View Attendance</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Track time</span>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('Manage Leaves')}
                  className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="p-3 bg-blue-100 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">Manage Leaves</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Time off</span>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('Manage Payroll')}
                  className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="p-3 bg-purple-100 rounded-full mb-3 group-hover:bg-purple-200 transition-colors">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">Manage Payroll</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Salary & benefits</span>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('View Reports')}
                  className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="p-3 bg-orange-100 rounded-full mb-3 group-hover:bg-orange-200 transition-colors">
                    <FileText className="w-8 h-8 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center">View Reports</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Analytics</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedDate && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEventModal(false);
              setSelectedDate(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto mx-2 sm:mx-4">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedDate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No events scheduled for this day</p>
                  </div>
                ) : (
                  getEventsForDate(selectedDate).map((event, index) => (
                    <div key={index} className={cn(
                      "p-4 rounded-lg border",
                      getEventTypeColor(event.type)
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                          <h4 className="font-semibold text-gray-900">{event.name}</h4>
                        </div>
                        {event.priority && (
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            event.priority === 'high' ? "bg-red-100 text-red-700" :
                            event.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                          )}>
                            {event.priority}
                          </span>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      
                      {event.startTime && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                          </div>
                        </div>
                      )}
                      
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Attendees: {event.attendees.join(', ')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedDate(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Add new event functionality
                    console.log('Add event for:', selectedDate);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Form Modal */}
      {showAnnouncementForm && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleAnnouncementCancel();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Add New Event</h3>
                </div>
                <button
                  onClick={handleAnnouncementCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => handleAnnouncementFormChange('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors['title'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter event title"
                    required
                  />
                  {formErrors['title'] && (
                    <p className="mt-1 text-sm text-red-600">{formErrors['title']}</p>
                  )}
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    value={announcementForm.type}
                    onChange={(e) => handleAnnouncementFormChange('type', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors['type'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    title="Select event type"
                    aria-label="Select event type"
                  >
                    <option value="announcement">📢 Announcement</option>
                    <option value="holiday">🎉 Holiday</option>
                    <option value="meeting">📅 Meeting</option>
                    <option value="task">✅ Task</option>
                  </select>
                  {formErrors['type'] && (
                    <p className="mt-1 text-sm text-red-600">{formErrors['type']}</p>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={announcementForm.content}
                    onChange={(e) => handleAnnouncementFormChange('content', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Enter event description"
                  />
                </div>

                {/* Date and Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={announcementForm.date.toISOString().split('T')[0]}
                      onChange={(e) => handleAnnouncementFormChange('date', new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      title="Select date"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={announcementForm.priority}
                      onChange={(e) => handleAnnouncementFormChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      title="Select priority"
                      aria-label="Select priority"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                </div>

                {/* Time (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={announcementForm.startTime}
                      onChange={(e) => handleAnnouncementFormChange('startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      title="Start time"
                      placeholder="HH:MM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={announcementForm.endTime}
                      onChange={(e) => handleAnnouncementFormChange('endTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        formErrors['endTime'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      title="End time"
                      placeholder="HH:MM"
                    />
                    {formErrors['endTime'] && (
                      <p className="mt-1 text-sm text-red-600">{formErrors['endTime']}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={announcementForm.description}
                    onChange={(e) => handleAnnouncementFormChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={2}
                    placeholder="Any additional notes or details"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  onClick={handleAnnouncementCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnnouncementSubmit}
                  className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-all flex items-center space-x-2 shadow-md bg-blue-600 hover:bg-blue-700 border border-blue-600 min-w-[120px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
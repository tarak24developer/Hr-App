import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { formatIndianCurrency } from '../utils/currency';

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

  // Auto-refresh removed as per user request

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const [addEventDialog, setAddEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: 'meeting' as 'holiday' | 'meeting' | 'task' | 'announcement',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    priority: 'medium' as 'low' | 'medium' | 'high',
    attendees: [] as string[]
  });

  // Mock calendar events data with announcements - using current dates
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
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

  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthYearDropdown, setMonthYearDropdown] = useState(false);

  // Notification count state
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsDropdown, setNotificationsDropdown] = useState(false);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    // Initialize notification count
    calculateNotificationCount();
  }, []);



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
    setSnackbar({
      open: true,
      message: 'Dashboard refreshed successfully',
      severity: 'success'
    });
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
      case 'View Notifications':
        setNotificationsDropdown(!notificationsDropdown);
        break;
      default:
        setSnackbar({
          open: true,
          message: `${action} action initiated`,
          severity: 'info'
        });
    }
  };

  // Event management functions
  const handleAddEvent = () => {
    setAddEventDialog(true);
  };

  const handleSaveEvent = () => {
    if (newEvent.name.trim() && newEvent.date) {
      const event: CalendarEvent = {
        id: Date.now().toString(),
        name: newEvent.name,
        date: new Date(newEvent.date),
        type: newEvent.type,
        description: newEvent.description,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        priority: newEvent.priority,
        attendees: newEvent.attendees
      };
      
      // Add to calendar events using state setter
      setCalendarEvents(prev => [...prev, event]);
      
      // Reset form and close dialog
      setNewEvent({
        name: '',
        date: new Date().toISOString().split('T')[0],
        type: 'meeting',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        priority: 'medium',
        attendees: [] as string[]
      });
      setAddEventDialog(false);
      
      setSnackbar({
        open: true,
        message: 'Event added successfully!',
        severity: 'success'
      });
    }
  };

  const handleCancelEvent = () => {
    setNewEvent({
      name: '',
      date: new Date().toISOString().split('T')[0],
      type: 'meeting',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      priority: 'medium',
      attendees: [] as string[]
    });
    setAddEventDialog(false);
  };

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };



  // Generate calendar days for current month
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

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return calendarEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  // Calculate notification count from events and announcements
  const calculateNotificationCount = useCallback(() => {
    const today = new Date();
    const upcomingEvents = calendarEvents.filter(event => {
      const eventDate = new Date(event.date);
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Count events in next 7 days, today's events, and high priority announcements
      return (diffDays >= 0 && diffDays <= 7) || 
             (event.type === 'announcement' && event.priority === 'high') ||
             diffDays === 0; // Include today's events
    });
    
    setNotificationCount(upcomingEvents.length);
  }, [calendarEvents]);

  // Update notification count when events change
  useEffect(() => {
    calculateNotificationCount();
  }, [calendarEvents, calculateNotificationCount]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (notificationsDropdown && !target.closest('[data-notifications-container]')) {
        setNotificationsDropdown(false);
      }
      if (monthYearDropdown && !target.closest('[data-month-year-container]')) {
        setMonthYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsDropdown, monthYearDropdown]);

  // Show loading state
  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error && !stats) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDashboardData}>
          Retry
        </Button>
      </Box>
    );
  }

  // Helper to format days until for notifications
  const formatDaysUntil = (date: Date) => {
    const today = new Date();
    const eventDate = new Date(date);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper to get notifications for the dropdown
  const getNotifications = () => {
    const notifications: {
      id: string;
      title: string;
      type: string;
      date: Date;
      priority: string;
      startTime?: string | undefined;
      endTime?: string | undefined;
      description?: string | undefined;
      attendees?: string[] | undefined;
      daysUntil: number;
    }[] = [];

    // Process all calendar events
    calendarEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const daysUntil = formatDaysUntil(eventDate);

      // Include events in next 7 days, today's events, and high priority announcements
      if (daysUntil >= 0 && daysUntil <= 7 || 
          (event.type === 'announcement' && event.priority === 'high') ||
          daysUntil === 0) {
        
        // Check if this event is already in notifications to avoid duplicates
        const existingNotification = notifications.find(n => n.id === event.id);
        if (!existingNotification) {
        notifications.push({
          id: event.id,
          title: event.name,
          type: event.type,
          date: eventDate,
          priority: event.priority || 'medium',
          startTime: event.startTime,
          endTime: event.endTime,
            description: event.description,
            attendees: event.attendees,
            daysUntil: daysUntil
          });
        }
      }
    });

    // Sort by days until, then by priority (high, medium, low)
    return notifications.sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) {
        return a.daysUntil - b.daysUntil;
      }
      // Sort by priority (high, medium, low)
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority === 'medium' && b.priority === 'low') return -1;
      return 0;
    });
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            HRMS Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Welcome back! Here's your overview for today.
          </Typography>
        </Box>
                 <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
           <Button
             variant="outlined"
             startIcon={<RefreshIcon />}
             onClick={handleRefresh}
             disabled={loading}
           >
             Refresh
           </Button>
                                                                                                                                                      <Box sx={{ position: 'relative', display: 'inline-block' }} data-notifications-container>
                               <Box
                                 onClick={() => handleQuickAction('View Notifications')}
                                 sx={{
                                   cursor: 'pointer',
                                   position: 'relative',
                                   display: 'inline-block',
                                   p: 0.5,
                                   borderRadius: 1,
                                   '&:hover': {
                                     transform: 'scale(1.1)',
                                     filter: 'drop-shadow(0 0 8px rgba(25, 118, 210, 0.4))',
                                     bgcolor: 'rgba(25, 118, 210, 0.1)'
                                   },
                                   transition: 'all 0.2s ease'
                                 }}
                               >
                                 <NotificationsIcon 
                                   sx={{
                                     fontSize: 24,
                                     color: notificationCount > 0 ? 'primary.main' : 'text.secondary',
                                     transition: 'all 0.2s ease'
                                   }}
                                 />
                                 {/* Custom Badge */}
                                 {notificationCount > 0 && (
                                   <Box
                                     sx={{
                                       position: 'absolute',
                                       top: -8,
                                       right: -8,
                                       minWidth: 18,
                                       height: 18,
                                       bgcolor: 'error.main',
                                       color: 'white',
                                       borderRadius: '50%',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       fontSize: '0.7rem',
                                       fontWeight: 'bold',
                                       border: '2px solid white',
                                       boxShadow: 2,
                                       animation: 'pulse 2s infinite',
                                       '@keyframes pulse': {
                                         '0%': {
                                           transform: 'scale(1)',
                                           opacity: 1
                                         },
                                         '50%': {
                                           transform: 'scale(1.1)',
                                           opacity: 0.8
                                         },
                                         '100%': {
                                           transform: 'scale(1)',
                                           opacity: 1
                                         }
                                       }
                                     }}
                                   >
                                     {notificationCount > 99 ? '99+' : notificationCount}
                                   </Box>
                                   )}
                                 </Box>
                                 
                                 {/* Notifications Dropdown */}
                                 {notificationsDropdown && (
                                   <Box
                                     sx={{
                                       position: 'absolute',
                                       top: '100%',
                                       right: 0,
                                       width: 400,
                                       maxHeight: 500,
                                       bgcolor: 'white',
                                       border: '1px solid',
                                       borderColor: 'grey.200',
                                       borderRadius: 2,
                                       boxShadow: 4,
                                       zIndex: 1000,
                                       mt: 1,
                                       overflow: 'hidden'
                                     }}
                                   >
                                     {/* Dropdown Header */}
                                     <Box sx={{ 
                                       p: 2, 
                                       bgcolor: 'white', 
                                       color: 'text.primary',
                                       borderBottom: '1px solid',
                                       borderColor: 'grey.200'
                                     }}>
                                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                         <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                           🔔 Notifications ({notificationCount})
                                         </Typography>
                                         <Button
                                           size="small"
                                           onClick={() => setNotificationsDropdown(false)}
                                           sx={{ 
                                             color: 'text.secondary', 
                                             minWidth: 'auto',
                                             p: 0.5,
                                             '&:hover': { bgcolor: 'grey.100' }
                                           }}
                                         >
                                           ✕
                                         </Button>
                                       </Box>
                                     </Box>
                                     
                                     {/* Notifications Content */}
                                     <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                       {getNotifications().length === 0 ? (
                                         <Box sx={{ textAlign: 'center', py: 4 }}>
                                           <Typography variant="body1" color="textSecondary" gutterBottom>
                                             No notifications
                                           </Typography>
                                           <Typography variant="body2" color="textSecondary">
                                             You're all caught up! No upcoming events or announcements.
                                           </Typography>
                                         </Box>
                                       ) : (
                                         getNotifications().map((notification, index) => (
                                           <Box
                                             key={notification.id}
                                             sx={{
                                               p: 2,
                                               borderBottom: index < getNotifications().length - 1 ? '1px solid' : 'none',
                                               borderColor: 'grey.100',
                                               '&:hover': {
                                                 bgcolor: 'grey.50'
                                               },
                                               transition: 'all 0.2s ease'
                                             }}
                                           >
                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                 <Box
                                                   sx={{
                                                     width: 8,
                                                     height: 8,
                                                     bgcolor: notification.type === 'holiday' ? 'error.main' :
                                                              notification.type === 'meeting' ? 'primary.main' :
                                                              notification.type === 'task' ? 'success.main' : 'warning.main',
                                                     borderRadius: '50%',
                                                     flexShrink: 0
                                                   }}
                                                 />
                                                 <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                                                   {notification.title}
                                                 </Typography>
                                                 <Chip
                                                   label={notification.type}
                                                   size="small"
                                                   sx={{
                                                     textTransform: 'capitalize',
                                                     fontSize: '0.7rem',
                                                     height: 20,
                                                     flexShrink: 0
                                                   }}
                                                 />
                                               </Box>
                                             </Box>
                                             
                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                               <Typography variant="caption" color="textSecondary">
                                                 {notification.date.toLocaleDateString('en-US', { 
                                                   month: 'short', 
                                                   day: 'numeric' 
                                                 })}
                                               </Typography>
                                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                 <Chip
                                                   label={notification.priority}
                                                   size="small"
                                                   color={
                                                     notification.priority === 'high' ? 'error' :
                                                     notification.priority === 'medium' ? 'warning' : 'success'
                                                   }
                                                   sx={{ fontSize: '0.7rem', height: 20 }}
                                                 />
                                                 <Typography variant="caption" color="textSecondary">
                                                   {notification.daysUntil === 0 ? 'Today' :
                                                    notification.daysUntil === 1 ? 'Tomorrow' :
                                                    notification.daysUntil < 0 ? `${Math.abs(notification.daysUntil)} days ago` :
                                                    `in ${notification.daysUntil} days`}
                                                 </Typography>
                                               </Box>
                                             </Box>
                                             
                                             {notification.startTime && (
                                               <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                                                 🕐 {notification.startTime}{notification.endTime ? ` - ${notification.endTime}` : ''}
                                               </Typography>
                                             )}
                                             
                                             {notification.description && (
                                               <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                                                 {notification.description}
                                               </Typography>
                                             )}
                                             
                                             {notification.attendees && notification.attendees.length > 0 && (
                                               <Typography variant="caption" color="textSecondary">
                                                 👥 {notification.attendees.join(', ')}
                                               </Typography>
                                             )}
                                           </Box>
                                         ))
                                       )}
                                     </Box>
                                     
                                     {/* Dropdown Footer */}
                                     <Box sx={{ 
                                       p: 1.5, 
                                       bgcolor: 'grey.50', 
                                       borderTop: '1px solid',
                                       borderColor: 'grey.200',
                                       textAlign: 'center'
                                     }}>
                                       <Button
                                         size="small"
                                         variant="text"
                                         onClick={() => setNotificationsDropdown(false)}
                                         sx={{ fontSize: '0.75rem' }}
                                       >
                                         Close
                                       </Button>
                                     </Box>
                                   </Box>
                                 )}
                               </Box>
         </Box>
      </Box>

      {/* Enhanced KPI Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: 2.5, 
        mb: 4,
        maxWidth: '100%'
      }}>
        {stats && [
          {
            name: 'Total Employees',
            value: stats.totalEmployees.toLocaleString(),
            change: stats.employeeChange,
            changeType: stats.employeeChange.startsWith('+') ? 'positive' : 'negative',
            icon: PeopleIcon,
            color: 'primary'
          },
          {
            name: 'Active Employees',
            value: stats.activeEmployees.toLocaleString(),
            change: stats.attendanceChange,
            changeType: stats.attendanceChange.startsWith('+') ? 'positive' : 'negative',
            icon: WorkIcon,
            color: 'success'
          },
          {
            name: 'Pending Leaves',
            value: stats.pendingLeaves.toLocaleString(),
            change: stats.leaveChange,
            changeType: stats.leaveChange.startsWith('+') ? 'positive' : 'negative',
            icon: EventIcon,
            color: 'warning'
          },
          {
            name: 'Monthly Payroll',
            value: formatIndianCurrency(stats.monthlyPayroll),
            change: stats.payrollChange,
            changeType: stats.payrollChange.startsWith('+') ? 'positive' : 'negative',
            icon: PaymentIcon,
            color: 'secondary'
          }
        ].map((stat) => (
          <Paper 
            key={stat.name} 
            sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: `${stat.color}.200`
              }
            }}
          >
                                      {/* Card Content */}
             <Box sx={{ 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'space-between',
               mb: 1.5
             }}>
               <Box sx={{ flex: 1 }}>
                 <Typography 
                   variant="body2" 
                   color="textSecondary" 
                   sx={{ 
                     fontWeight: '600',
                     fontSize: '0.75rem',
                     mb: 0.5
                   }}
                 >
                  {stat.name}
                </Typography>
                 <Typography 
                   variant="h4" 
                   component="div" 
                   sx={{ 
                     fontWeight: '700', 
                     color: `${stat.color}.main`,
                     lineHeight: 1.1
                   }}
                 >
                  {stat.value}
                </Typography>
              </Box>
               
               {/* Icon */}
              <Box sx={{ 
                 p: 1, 
                borderRadius: 2, 
                 bgcolor: `${stat.color}.50`,
                 color: `${stat.color}.main`,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 flexShrink: 0
               }}>
                 <stat.icon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
             
             {/* Simple Change Indicator */}
             <Box sx={{ 
               display: 'flex', 
               alignItems: 'center',
               gap: 0.5
             }}>
              {stat.changeType === 'positive' ? (
                 <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
              ) : (
                 <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
              )}
              <Typography 
                 variant="caption" 
                color={stat.changeType === 'positive' ? 'success.main' : 'error.main'}
                 sx={{ fontWeight: '600' }}
              >
                {stat.change}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

                                                        {/* Compact Apple-Style Calendar Card */}
          <Box sx={{ mb: 4 }}>
            <Card sx={{ 
              bgcolor: 'white', 
              boxShadow: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 0 }}>
                                 {/* Header with Navigation */}
                 <Box sx={{ 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center', 
                   p: 2.5,
                   borderBottom: '1px solid',
                   borderColor: 'grey.200',
                   bgcolor: 'white'
                 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                     {/* Calendar Icon with enhanced styling */}
                                                     <Box sx={{ 
                       p: 2, 
                       borderRadius: 3, 
                             bgcolor: 'primary.50',
                             color: 'primary.main',
                             display: 'flex',
                             alignItems: 'center',
                       justifyContent: 'center',
                       boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                       border: '1px solid',
                       borderColor: 'primary.100'
                           }}>
                       <CalendarIcon sx={{ fontSize: 26 }} />
                           </Box>
                     
                     {/* Month/Year with Inline Navigation and Dropdown */}
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Button
                                size="small"
                                variant="text"
                                onClick={goToPreviousMonth}
                                sx={{ 
                                  minWidth: 'auto',
                           p: 1,
                           borderRadius: 2,
                           fontSize: '1.2rem',
                                  color: 'text.secondary',
                           fontWeight: '600',
                                  '&:hover': { 
                                    bgcolor: 'grey.100',
                             color: 'primary.main'
                           },
                           transition: 'all 0.2s ease'
                         }}
                       >
                         ‹
                       </Button>
                       
                       <Box sx={{ position: 'relative' }} data-month-year-container>
                         <Typography 
                           variant="h5" 
                           onClick={() => setMonthYearDropdown(!monthYearDropdown)}
                           sx={{ 
                             fontWeight: '700', 
                             color: 'text.primary',
                             letterSpacing: '-0.5px',
                             minWidth: 'fit-content',
                             cursor: 'pointer',
                             p: 1,
                             borderRadius: 2,
                             '&:hover': {
                               bgcolor: 'grey.100',
                               color: 'primary.main'
                             },
                             transition: 'all 0.2s ease',
                             userSelect: 'none'
                           }}
                         >
                           {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                         </Typography>
                         
                         {/* Month/Year Selection Dropdown */}
                         {monthYearDropdown && (
                           <Box
                             sx={{
                               position: 'absolute',
                               top: '100%',
                               left: '50%',
                               transform: 'translateX(-50%)',
                               width: 280,
                               bgcolor: 'white',
                               border: '1px solid',
                               borderColor: 'grey.200',
                               borderRadius: 3,
                               boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                               zIndex: 1000,
                               mt: 1,
                               overflow: 'hidden',
                               '&::before': {
                                 content: '""',
                                 position: 'absolute',
                                 top: -8,
                                 left: '50%',
                                 transform: 'translateX(-50%)',
                                 width: 0,
                                 height: 0,
                                 borderLeft: '8px solid transparent',
                                 borderRight: '8px solid transparent',
                                 borderBottom: '8px solid white'
                               }
                             }}
                           >
                             {/* Dropdown Header */}
                             <Box sx={{ 
                               p: 2, 
                               bgcolor: 'primary.main', 
                               color: 'white',
                               textAlign: 'center'
                             }}>
                               <Typography variant="h6" sx={{ fontWeight: '700' }}>
                                 Select Month & Year
                               </Typography>
                             </Box>
                             
                             {/* Month Selection */}
                             <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'grey.200' }}>
                               <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 1.5, color: 'text.secondary' }}>
                                 Month
                               </Typography>
                               <Box sx={{ 
                                 display: 'grid', 
                                 gridTemplateColumns: 'repeat(3, 1fr)', 
                                 gap: 1 
                               }}>
                                 {[
                                   'January', 'February', 'March', 'April', 'May', 'June',
                                   'July', 'August', 'September', 'October', 'November', 'December'
                                 ].map((month, index) => (
                                   <Button
                                     key={month}
                                     variant="text"
                                     size="small"
                                     onClick={() => {
                                       const newDate = new Date(currentMonth.getFullYear(), index, 1);
                                       setCurrentMonth(newDate);
                                       setMonthYearDropdown(false);
                                     }}
                                     sx={{
                                       py: 1,
                                       px: 0.5,
                                       fontSize: '0.75rem',
                                       fontWeight: currentMonth.getMonth() === index ? '700' : '500',
                                       color: currentMonth.getMonth() === index ? 'primary.main' : 'text.primary',
                                       bgcolor: currentMonth.getMonth() === index ? 'primary.50' : 'transparent',
                                       borderRadius: 1.5,
                                       textTransform: 'none',
                                       '&:hover': {
                                         bgcolor: currentMonth.getMonth() === index ? 'primary.100' : 'grey.100'
                                       },
                                       transition: 'all 0.2s ease'
                                     }}
                                   >
                                     {month.slice(0, 3)}
                                   </Button>
                                 ))}
                               </Box>
                             </Box>
                             
                             {/* Year Selection */}
                             <Box sx={{ p: 2 }}>
                               <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 1.5, color: 'text.secondary' }}>
                                 Year
                               </Typography>
                               <Box sx={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'space-between',
                                 gap: 2
                               }}>
                                 <Button
                                   variant="outlined"
                                   size="small"
                                   onClick={() => {
                                     const newDate = new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1);
                                     setCurrentMonth(newDate);
                                   }}
                                   sx={{
                                     px: 2,
                                     py: 0.5,
                                     borderRadius: 2,
                                     fontSize: '0.8rem',
                                     fontWeight: '600',
                                     borderColor: 'grey.300',
                                     color: 'text.secondary',
                                     '&:hover': {
                                       borderColor: 'primary.main',
                                       color: 'primary.main'
                                  }
                                }}
                              >
                                ‹
                              </Button>
                                 
                                 <Typography variant="h6" sx={{ fontWeight: '700', color: 'text.primary' }}>
                                   {currentMonth.getFullYear()}
                                 </Typography>
                                 
                              <Button
                                   variant="outlined"
                                size="small"
                                   onClick={() => {
                                     const newDate = new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1);
                                     setCurrentMonth(newDate);
                                   }}
                                   sx={{
                                     px: 2,
                                     py: 0.5,
                                     borderRadius: 2,
                                     fontSize: '0.8rem',
                                     fontWeight: '600',
                                     borderColor: 'grey.300',
                                     color: 'text.secondary',
                                     '&:hover': {
                                       borderColor: 'primary.main',
                                       color: 'primary.main'
                                     }
                                   }}
                                 >
                                   ›
                                 </Button>
                               </Box>
                               
                               {/* Quick Year Navigation */}
                               <Box sx={{ 
                                 display: 'grid', 
                                 gridTemplateColumns: 'repeat(3, 1fr)', 
                                 gap: 1, 
                                 mt: 2 
                               }}>
                                 {[currentMonth.getFullYear() - 1, currentMonth.getFullYear(), currentMonth.getFullYear() + 1].map((year) => (
                                   <Button
                                     key={year}
                                variant="text"
                                     size="small"
                                     onClick={() => {
                                       const newDate = new Date(year, currentMonth.getMonth(), 1);
                                       setCurrentMonth(newDate);
                                       setMonthYearDropdown(false);
                                     }}
                                sx={{ 
                                       py: 1,
                                       px: 0.5,
                                       fontSize: '0.75rem',
                                       fontWeight: currentMonth.getFullYear() === year ? '700' : '500',
                                       color: currentMonth.getFullYear() === year ? 'primary.main' : 'text.primary',
                                       bgcolor: currentMonth.getFullYear() === year ? 'primary.50' : 'transparent',
                                       borderRadius: 1.5,
                                       '&:hover': {
                                         bgcolor: currentMonth.getFullYear() === year ? 'primary.100' : 'grey.100'
                                       },
                                       transition: 'all 0.2s ease'
                                     }}
                                   >
                                     {year}
                                   </Button>
                                 ))}
                               </Box>
                             </Box>
                             
                             {/* Close Button */}
                             <Box sx={{ 
                               p: 1.5, 
                               bgcolor: 'grey.50', 
                               borderTop: '1px solid',
                               borderColor: 'grey.200',
                               textAlign: 'center'
                             }}>
                               <Button
                                 size="small"
                                 variant="text"
                                 onClick={() => setMonthYearDropdown(false)}
                                 sx={{ 
                                   fontSize: '0.75rem',
                                  color: 'text.secondary',
                                   fontWeight: '600',
                                  '&:hover': { 
                                     color: 'primary.main'
                                  }
                                }}
                              >
                                 Close
                              </Button>
                             </Box>
                           </Box>
                         )}
                       </Box>
                       
                              <Button
                                size="small"
                                variant="text"
                                onClick={goToNextMonth}
                                sx={{ 
                                  minWidth: 'auto',
                           p: 1,
                           borderRadius: 2,
                           fontSize: '1.2rem',
                                  color: 'text.secondary',
                           fontWeight: '600',
                                  '&:hover': { 
                                    bgcolor: 'grey.100',
                             color: 'primary.main'
                           },
                           transition: 'all 0.2s ease'
                                }}
                              >
                                ›
                              </Button>
                        </Box>
                   </Box>
                   
                   {/* Add Event Button */}
                   <Button
                     variant="contained"
                     size="medium"
                     startIcon={<AddIcon />}
                     onClick={handleAddEvent}
                     sx={{ 
                       borderRadius: 2.5,
                       px: 2.5,
                       py: 1,
                       textTransform: 'none',
                       fontWeight: '600',
                       fontSize: '0.8rem',
                       bgcolor: 'primary.main',
                       color: 'white',
                       boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                       '&:hover': {
                         bgcolor: 'primary.dark',
                         transform: 'translateY(-2px)',
                         boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                       },
                       transition: 'all 0.3s ease',
                       letterSpacing: '0.3px'
                     }}
                   >
                     Add Event
                   </Button>
                 </Box>
                
                {/* Compact Calendar Grid */}
                <Box sx={{ p: 1.5 }}>
                  {/* Enhanced Day Headers */}
                   <Box sx={{ 
                     display: 'grid', 
                     gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: 0.75, 
                     mb: 1.5 
                   }}>
                     {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                       <Typography key={`day-${index}`} variant="body2" sx={{ 
                         textAlign: 'center', 
                         fontWeight: '800', 
                         color: 'text.primary', 
                         py: 1, 
                         fontSize: '0.85rem',
                         textTransform: 'uppercase',
                         letterSpacing: '1px',
                         bgcolor: 'grey.100',
                         borderRadius: 1.5,
                         border: '1px solid',
                         borderColor: 'grey.300'
                       }}>
                         {day}
                       </Typography>
                     ))}
                   </Box>
                  
                  {/* Enhanced Calendar Days */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: 0.75 
                  }}>
                                         {generateCalendarDays().map((day, index) => (
                       <Tooltip
                         key={index}
                         title={
                           day.events.length > 0 ? (
                            <Box sx={{ p: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
                                 {day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                               </Typography>
                               {day.events.map((event, eventIdx) => (
                                <Box key={eventIdx} sx={{ 
                                  mb: 1, 
                                  pb: 1, 
                                  borderBottom: eventIdx < day.events.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' 
                                }}>
                                  <Typography variant="caption" sx={{ 
                                    fontWeight: 'bold', 
                                    color: 'white', 
                                    display: 'block',
                                    fontSize: '0.8rem'
                                  }}>
                                     {event.name}
                                   </Typography>
                                   {event.startTime && (
                                    <Typography variant="caption" sx={{ 
                                      color: 'rgba(255,255,255,0.9)', 
                                      display: 'block', 
                                      fontSize: '0.7rem',
                                      mt: 0.25
                                    }}>
                                       🕐 {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                                     </Typography>
                                   )}
                                   {event.description && (
                                    <Typography variant="caption" sx={{ 
                                      color: 'rgba(255,255,255,0.8)', 
                                      display: 'block', 
                                      fontSize: '0.7rem', 
                                      mt: 0.25,
                                      fontStyle: 'italic'
                                    }}>
                                       {event.description}
                                     </Typography>
                                   )}
                                   {event.attendees && event.attendees.length > 0 && (
                                    <Typography variant="caption" sx={{ 
                                      color: 'rgba(255,255,255,0.8)', 
                                      display: 'block', 
                                      fontSize: '0.7rem', 
                                      mt: 0.25 
                                    }}>
                                       👥 {event.attendees.join(', ')}
                                     </Typography>
                                   )}
                                 </Box>
                               ))}
                             </Box>
                           ) : (
                            <Box sx={{ p: 1.5 }}>
                               <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'white' }}>
                                 {day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                               </Typography>
                               <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                 No events scheduled
                               </Typography>
                             </Box>
                           )
                         }
                         arrow
                         placement="top"
                         sx={{
                           '& .MuiTooltip-tooltip': {
                             bgcolor: 'rgba(0,0,0,0.9)',
                            maxWidth: 300,
                            fontSize: '0.75rem',
                            borderRadius: 2,
                            p: 0
                           }
                         }}
                       >
                                                 <Box
                          sx={{
                            minHeight: 36,
                            p: 0.75,
                            border: '1px solid',
                            borderColor: day.isToday ? 'primary.main' : 'grey.200',
                            borderRadius: 2,
                            bgcolor: day.isToday ? 'primary.50' : 
                                     day.isCurrentMonth ? 'white' : 'grey.50',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              bgcolor: day.isCurrentMonth ? 'primary.50' : 'grey.100',
                              borderColor: 'primary.main',
                              zIndex: 1
                            }
                          }}
                          onClick={() => {
                             // Navigate to calendar view with selected date
                             navigate('/calendar', { 
                               state: { selectedDate: day.date.toISOString() }
                             });
                           }}
                        >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: '600',
                            color: day.isToday ? 'primary.main' : 
                                   day.isCurrentMonth ? 'text.primary' : 'text.secondary',
                            fontSize: '0.8rem',
                            mb: 0.5,
                            textAlign: 'center'
                          }}
                        >
                          {day.date.getDate()}
                        </Typography>
                         
                                                   {/* Enhanced Event Indicators */}
                          {day.events.length > 0 && (
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 0.3,
                              justifyContent: 'center',
                              flexWrap: 'wrap',
                              maxWidth: '100%'
                            }}>
                              {day.events.slice(0, 3).map((event, eventIndex) => (
                                <Box
                                  key={eventIndex}
                                  sx={{
                                    width: 5,
                                    height: 5,
                                    bgcolor: event.type === 'holiday' ? 'error.main' : 
                                             event.type === 'meeting' ? 'primary.main' : 
                                             event.type === 'task' ? 'success.main' : 
                                             event.type === 'announcement' ? 'warning.main' : 'grey.main',
                                    borderRadius: '50%',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    border: '1px solid white',
                                    flexShrink: 0
                                  }}
                                />
                              ))}
                              {day.events.length > 3 && (
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ 
                                    fontSize: '0.6rem',
                                    fontWeight: '700',
                                    ml: 0.2
                                  }}
                                >
                                  +{day.events.length - 3}
                                </Typography>
                              )}
                            </Box>
                          )}
                       </Box>
                     </Tooltip>
                   ))}
                  </Box>
                </Box>

                                                                  {/* Enhanced Event Type Legend */}
                 <Box sx={{ 
                   display: 'flex', 
                   gap: 3, 
                   flexWrap: 'wrap',
                   p: 3,
                   pt: 2.5,
                   borderTop: '1px solid',
                   borderColor: 'grey.200',
                   bgcolor: 'grey.50'
                 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                     <Box sx={{ 
                       width: 14, 
                       height: 14, 
                       bgcolor: 'error.main', 
                       borderRadius: 2,
                       boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                       border: '2px solid white'
                     }} />
                     <Typography variant="body2" sx={{ 
                       fontSize: '0.85rem', 
                       fontWeight: '700',
                       color: 'text.primary'
                     }}>
                       Holidays
                     </Typography>
                   </Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                     <Box sx={{ 
                       width: 14, 
                       height: 14, 
                       bgcolor: 'primary.main', 
                       borderRadius: 2,
                       boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                       border: '2px solid white'
                     }} />
                     <Typography variant="body2" sx={{ 
                       fontSize: '0.85rem', 
                       fontWeight: '700',
                       color: 'text.primary'
                     }}>
                       Meetings
                     </Typography>
                   </Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                     <Box sx={{ 
                       width: 14, 
                       height: 14, 
                       bgcolor: 'success.main', 
                       borderRadius: 2,
                       boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                       border: '2px solid white'
                     }} />
                     <Typography variant="body2" sx={{ 
                       fontSize: '0.85rem', 
                       fontWeight: '700',
                       color: 'text.secondary'
                     }}>
                       Tasks
                     </Typography>
                   </Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                     <Box sx={{ 
                       width: 14, 
                       height: 14, 
                       bgcolor: 'warning.main', 
                       borderRadius: 2,
                       boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                       border: '2px solid white'
                     }} />
                     <Typography variant="caption" sx={{ 
                       fontSize: '0.8rem', 
                       fontWeight: '700',
                       color: 'text.secondary'
                     }}>
                       Announcements
                     </Typography>
   </Box>
                 </Box>
              </CardContent>
            </Card>
          </Box>

      {/* Quick Actions Section */}
      <Card sx={{ bgcolor: 'white', boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Quick Actions
          </Typography>
                     <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                                                     <Button
                fullWidth
                variant="outlined"
                startIcon={<PaymentIcon />}
                onClick={() => handleQuickAction('Manage Payroll')}
                sx={{ 
                  flexDirection: 'column', 
                  py: 2.5, 
                  height: 'auto',
                  cursor: 'pointer',
                  borderRadius: 2,
                  borderColor: 'grey.300',
                  color: 'text.primary',
                  '&:hover': { 
                    bgcolor: 'success.50', 
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                    borderColor: 'success.main'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                  Manage Payroll
                </Typography>
              </Button>
                                                   <Button
                fullWidth
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => handleQuickAction('Add Employee')}
                sx={{ 
                  flexDirection: 'column', 
                  py: 2.5, 
                  height: 'auto',
                  cursor: 'pointer',
                  borderRadius: 2,
                  borderColor: 'grey.300',
                  color: 'text.primary',
                  '&:hover': { 
                    bgcolor: 'warning.50', 
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                    borderColor: 'warning.main'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                  Add Employee
                </Typography>
              </Button>
                                                   <Button
                fullWidth
                variant="outlined"
                startIcon={<AccessTimeIcon />}
                onClick={() => handleQuickAction('View Attendance')}
                sx={{ 
                  flexDirection: 'column', 
                  py: 2.5, 
                  height: 'auto',
                  cursor: 'pointer',
                  borderRadius: 2,
                  borderColor: 'grey.300',
                  color: 'text.primary',
                  '&:hover': { 
                    bgcolor: 'info.50', 
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                    borderColor: 'info.main'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                  View Attendance
                </Typography>
              </Button>
          </Box>
        </CardContent>
      </Card>

                           {/* Enhanced Add Event Dialog */}
                 <Dialog 
           open={addEventDialog} 
           onClose={handleCancelEvent}
           maxWidth="md"
           fullWidth
           PaperProps={{
             sx: {
               borderRadius: 3,
               boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
               border: '1px solid',
               borderColor: 'grey.200'
             }
           }}
         >
           <Box sx={{ p: 0 }}>
             {/* Dialog Header */}
             <Box sx={{ 
               p: 3, 
               pb: 2,
               bgcolor: 'primary.main', 
               color: 'white',
               borderTopLeftRadius: 3,
               borderTopRightRadius: 3
             }}>
               <Typography variant="h5" sx={{ 
                 fontWeight: '700', 
                 color: 'white', 
                 textAlign: 'center',
                 letterSpacing: '-0.5px'
               }}>
                 📅 Add New Event
             </Typography>
               <Typography variant="body2" sx={{ 
                 color: 'rgba(255,255,255,0.8)', 
                 textAlign: 'center',
                 mt: 0.5
               }}>
                 Schedule a new event or meeting
               </Typography>
             </Box>
             
             {/* Dialog Content */}
             <Box sx={{ p: 3, pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
              {/* Left Column */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Event Name"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  required
                  placeholder="Enter event name"
                  size="medium"
                     sx={{
                       '& .MuiOutlinedInput-root': {
                         borderRadius: 2,
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'primary.main'
                         }
                       }
                     }}
                />
                
                <TextField
                  label="Date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  size="medium"
                     sx={{
                       '& .MuiOutlinedInput-root': {
                         borderRadius: 2,
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'primary.main'
                         }
                       }
                     }}
                />
                
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as 'holiday' | 'meeting' | 'task' | 'announcement' }))}
                    label="Event Type"
                    size="medium"
                       sx={{
                         borderRadius: 2,
                         '& .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'grey.300'
                         }
                       }}
                  >
                    <MenuItem value="meeting">📅 Meeting</MenuItem>
                    <MenuItem value="task">✅ Task</MenuItem>
                    <MenuItem value="holiday">🎉 Holiday</MenuItem>
                    <MenuItem value="announcement">📢 Announcement</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    label="Priority"
                    size="medium"
                       sx={{
                         borderRadius: 2,
                         '& .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'grey.300'
                         }
                       }}
                  >
                    <MenuItem value="low">🟢 Low</MenuItem>
                    <MenuItem value="medium">🟡 Medium</MenuItem>
                    <MenuItem value="high">🔴 High</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Right Column */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  size="medium"
                     sx={{
                       '& .MuiOutlinedInput-root': {
                         borderRadius: 2,
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'primary.main'
                         }
                       }
                     }}
                />
                
                <TextField
                  label="End Time"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  size="medium"
                     sx={{
                       '& .MuiOutlinedInput-root': {
                         borderRadius: 2,
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'primary.main'
                         }
                       }
                     }}
                />
                
                <TextField
                  label="Attendees (comma separated)"
                  value={newEvent.attendees.join(', ')}
                  onChange={(e) => setNewEvent(prev => ({ 
                    ...prev, 
                    attendees: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  }))}
                  fullWidth
                  placeholder="John, Sarah, Mike"
                  size="medium"
                     sx={{
                       '& .MuiOutlinedInput-root': {
                         borderRadius: 2,
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'primary.main'
                         }
                       }
                     }}
                />
                
                <TextField
                  label="Description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Event description..."
                  size="medium"
                     sx={{
                       '& .MuiOutlinedInput-root': {
                         borderRadius: 2,
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'primary.main'
                         }
                       }
                     }}
                />
              </Box>
            </Box>
            
               {/* Enhanced Action Buttons */}
               <Box sx={{ 
                 display: 'flex', 
                 gap: 2, 
                 justifyContent: 'center',
                 pt: 1
               }}>
               <Button 
                 variant="outlined" 
                 onClick={handleCancelEvent}
                 size="medium"
                 sx={{ 
                   px: 3, 
                     py: 1.5,
                     borderRadius: 2,
                   borderColor: 'grey.400',
                   color: 'text.secondary',
                     fontWeight: '600',
                   '&:hover': {
                     borderColor: 'grey.600',
                       bgcolor: 'grey.50',
                       transform: 'translateY(-1px)'
                     },
                     transition: 'all 0.2s ease'
                 }}
               >
                 Cancel
               </Button>
               <Button 
                 variant="contained" 
                 onClick={handleSaveEvent}
                 disabled={!newEvent.name.trim()}
                 size="medium"
                 sx={{ 
                   px: 3, 
                     py: 1.5,
                     borderRadius: 2,
                     fontWeight: '600',
                     bgcolor: 'primary.main',
                     boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                   '&:hover': {
                       bgcolor: 'primary.dark',
                       transform: 'translateY(-2px)',
                       boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                     },
                     transition: 'all 0.3s ease',
                     '&:disabled': {
                       bgcolor: 'grey.400',
                       boxShadow: 'none'
                     }
                 }}
               >
                 Save Event
               </Button>
               </Box>
             </Box>
          </Box>
        </Dialog>

       {/* Snackbar */}
       <Snackbar
         open={snackbar.open}
         autoHideDuration={6000}
         onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
       >
         <Alert
           onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
           severity={snackbar.severity}
           sx={{ width: '100%' }}
         >
           {snackbar.message}
         </Alert>
       </Snackbar>
    </Box>
  );
};

export default Dashboard;
    
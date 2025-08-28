import { useState, useEffect, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Chip,
  Fade,
  Grow,
  ClickAwayListener,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,

  Button,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Work as WorkIcon,

  Event as EventIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  Description as DocumentIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Receipt as ReceiptIcon,
  Report as ReportIcon,
  Logout as LogoutIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import ChangePasswordDialog from './ChangePasswordDialog';
import MobileNavigation from './MobileNavigation';
import LocationConsentModal from './LocationConsentModal';
// import { useTheme as useCustomTheme } from '../providers/ThemeProvider';
// Temporary mock for useCustomTheme
const useCustomTheme = () => ({
  isDarkMode: false,
  toggleTheme: () => {},
  isSystemTheme: false,
  syncWithSystem: () => {}
});
import locationTrackingService from '../services/locationTracking';
// import { ref, get, update } from 'firebase/database';
// import { realtimeDb } from '../config/firebase';
// Temporary mock for Firebase functions
const ref = (_path: string) => ({ path: _path });
const get = async (_ref: any) => ({ exists: () => false, val: () => null });
const update = async (_ref: any, _data: any) => Promise.resolve();
// const realtimeDb = null;

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

// Interface definitions
interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  uid?: string;
  mustChangePassword?: boolean;
}

interface Notification {
  _id: string;
  id?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface MiniCalendarProps {
  currentDate: Date;
  onClose: () => void;
}

interface CalendarDialogProps {
  open: boolean;
  onClose: () => void;
  currentDate: Date;
}

interface LayoutProps {
  children?: React.ReactNode;
}

// Mini Calendar Component for hover effect
const MiniCalendar: React.FC<MiniCalendarProps> = ({ currentDate }) => {
  const [currentMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };
  
  const generateCalendarDays = (): (number | null)[] => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };
  
  const isToday = (day: number | null): boolean => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };
  
  const isCurrentMonth = (day: number | null): boolean => {
    return day !== null;
  };
  
  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        mb: 1,
        p: 1.5,
        minWidth: 200,
        backgroundColor: 'background.paper',
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        zIndex: 1000,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          border: '6px solid transparent',
          borderTopColor: 'background.paper',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
          {formatMonthYear(currentMonth)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <Box key={day}>
            <Typography variant="caption" sx={{ 
              textAlign: 'center', 
              display: 'block', 
              fontWeight: 600,
              color: 'text.secondary',
              fontSize: '0.6rem'
            }}>
              {day}
            </Typography>
          </Box>
        ))}
        
        {generateCalendarDays().map((day, index) => (
          <Box key={index}>
            <Box
              sx={{
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 0.5,
                backgroundColor: isToday(day) ? 'primary.main' : 'transparent',
                color: isToday(day) ? 'primary.contrastText' : isCurrentMonth(day) ? 'text.primary' : 'text.disabled',
                fontSize: '0.6rem',
                fontWeight: isToday(day) ? 600 : 400,
              }}
            >
              {day || ''}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

// Calendar Dialog Component
const CalendarDialog: React.FC<CalendarDialogProps> = ({ open, onClose, currentDate }) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [currentMonth, setCurrentMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  const generateCalendarDays = (): (number | null)[] => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };
  
  const isToday = (day: number | null): boolean => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };
  
  const isSelected = (day: number | null): boolean => {
    if (!day) return false;
    return day === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };
  
  const handleDateClick = (day: number | null): void => {
    if (day) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
  };
  
  const handlePrevMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          maxWidth: 400,
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)'
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'primary.contrastText'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Calendar
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'primary.contrastText' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {formatMonthYear(currentMonth)}
          </Typography>
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Box key={day}>
              <Typography variant="caption" sx={{ 
                textAlign: 'center', 
                fontWeight: 600,
                color: 'text.secondary',
                mb: 0.5,
                fontSize: '0.7rem'
              }}>
                {day}
              </Typography>
            </Box>
          ))}
          
          {generateCalendarDays().map((day, index) => (
            <Box key={index}>
              <Box
                onClick={() => handleDateClick(day)}
                sx={{
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  backgroundColor: isToday(day) ? 'primary.main' : 
                                isSelected(day) ? 'primary.light' : 'transparent',
                  color: isToday(day) ? 'primary.contrastText' : 
                         isSelected(day) ? 'primary.contrastText' : 
                         day ? 'text.primary' : 'text.disabled',
                  fontSize: '0.75rem',
                  fontWeight: isToday(day) || isSelected(day) ? 600 : 400,
                  cursor: day ? 'pointer' : 'default',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': day ? {
                    backgroundColor: isToday(day) ? 'primary.dark' : 'primary.light',
                    transform: 'scale(1.05)',
                  } : {},
                }}
              >
                {day || ''}
              </Box>
            </Box>
          ))}
        </Box>
        
        <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
            Selected: {selectedDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            No events scheduled
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const menuGroups: MenuGroup[] = [
  {
    title: 'Employee Management',
    items: [
      { text: 'Employees', icon: <PeopleIcon />, path: '/employees', roles: ['admin', 'hr'] },
      { text: 'Users', icon: <GroupIcon />, path: '/users', roles: ['admin'] },
      { text: 'Training', icon: <SchoolIcon />, path: '/training', roles: ['admin', 'hr', 'trainer', 'employee'] },
      { text: 'Exit Process', icon: <ExitToAppIcon />, path: '/exit-process', roles: ['admin', 'hr', 'lineManager', 'employee'] },
    ]
  },
  {
    title: 'Time & Attendance',
    items: [
      { text: 'Attendance Management', icon: <EventIcon />, path: '/attendance', roles: ['admin', 'hr', 'lineManager', 'employee'] },
      { text: 'Leave Management', icon: <CalendarIcon />, path: '/leaves', roles: ['admin', 'hr', 'lineManager', 'employee'] },
      { text: 'Holiday Management', icon: <AssessmentIcon />, path: '/holiday-management', roles: ['admin', 'hr'] },
    ]
  },
  {
    title: 'Finance & Payroll',
    items: [
      { text: 'Pay Slip Generator', icon: <ReceiptIcon />, path: '/payroll', roles: ['admin', 'hr', 'finance', 'employee'] },

      { text: 'Expense Management', icon: <ReceiptIcon />, path: '/expense-management', roles: ['admin', 'hr', 'finance', 'employee'] },
    ]
  },
  {
    title: 'Asset & Inventory',
    items: [
      { text: 'Asset Management', icon: <InventoryIcon />, path: '/asset-management', roles: ['admin', 'hr', 'itAdmin', 'employee'] },
      { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory', roles: ['admin', 'hr'] },
    ]
  },
  {
    title: 'Documentation',
    items: [
      { text: 'Document Management', icon: <DocumentIcon />, path: '/document-management', roles: ['admin', 'hr', 'employee'] },
      { text: 'Request Portal', icon: <AssignmentIcon />, path: '/request-portal', roles: ['admin', 'hr', 'employee'] },
      { text: 'Feedback & Surveys', icon: <AssessmentIcon />, path: '/feedback-surveys', roles: ['admin', 'hr', 'employee'] },
    ]
  },
  {
    title: 'Operations',
    items: [
      { text: 'Incident Management', icon: <EventIcon />, path: '/incident-management', roles: ['admin', 'hr', 'lineManager', 'employee'] },
      { text: 'Announcements', icon: <BusinessIcon />, path: '/announcements', roles: ['admin', 'hr', 'employee'] },
      { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    ]
  },
  {
    title: 'Tracking & Analytics',
    items: [
      { text: 'User Tracking Dashboard', icon: <LocationIcon />, path: '/user-tracking', roles: ['admin'] },
      { text: 'Live Tracking Map', icon: <LocationIcon />, path: '/live-tracking-map', roles: ['admin'] },
      { text: 'Advanced Analytics', icon: <AnalyticsIcon />, path: '/advanced-analytics', roles: ['admin', 'hr', 'lineManager'] },
      { text: 'Reports', icon: <ReportIcon />, path: '/reports', roles: ['admin', 'hr', 'finance', 'lineManager', 'itAdmin', 'trainer', 'employee'] },
    ]
  },
  {
    title: 'Administration',
    items: [
      { text: 'Employer', icon: <BusinessIcon />, path: '/employer', roles: ['admin'] },
      { text: 'Enhanced Access Control', icon: <SecurityIcon />, path: '/enhanced-access-control', roles: ['admin'] },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ]
  },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [currentDate] = useState(new Date());
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [showLocationConsent, setShowLocationConsent] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set(['Employee Management']));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // const closeMenuTimer = useRef<NodeJS.Timeout>();
  const clockRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isDarkMode, toggleTheme, isSystemTheme, syncWithSystem } = useCustomTheme();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    let parsedUser: User | null = null;
    if (typeof userData === 'string') {
      try {
        parsedUser = JSON.parse(userData) as User;
      } catch (e) {
        parsedUser = null;
      }
    }
    if (parsedUser) {
      setUser(parsedUser);
      
      // Check if user needs to change password
      if (parsedUser.mustChangePassword) {
        setShowPasswordDialog(true);
      }

      // Check if location tracking is supported and show consent modal
      if (locationTrackingService.isSupported()) {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('User not logged in, skipping consent check');
          return;
        }
        
        // Prevent multiple consent checks
        if ((locationTrackingService as any).consentChecked) {
          console.log('Consent already checked, skipping');
          return;
        }
        
        // Check for existing consent from backend
        console.log('Checking location tracking consent...');
        locationTrackingService.checkExistingConsent().then((hasConsent: boolean) => {
          console.log('Consent check result:', hasConsent);
          (locationTrackingService as any).consentChecked = true; // Mark as checked
          if (!hasConsent) {
            console.log('No existing consent, showing consent modal');
            // Show consent modal after a short delay
            setTimeout(() => {
              setShowLocationConsent(true);
            }, 2000);
          } else {
            console.log('Existing consent found, initializing tracking');
            // User has already given consent, initialize tracking
            locationTrackingService.initializeTracking();
          }
        }).catch((error: any) => {
          console.error('Error checking consent:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          // If error, show consent modal anyway
          setTimeout(() => {
            setShowLocationConsent(true);
          }, 2000);
        });
      }
    }
  }, []);

  // Cleanup location tracking on unmount
  useEffect(() => {
    return () => {
      locationTrackingService.stopTracking();
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Get user ID from localStorage
        const userData = localStorage.getItem('user');
        let userId = 'anonymous';
        
        if (userData) {
          try {
            const user = JSON.parse(userData) as User;
            userId = user.uid || user.email || 'anonymous';
          } catch (error) {
            console.error('Error parsing user data:', error);
            userId = 'anonymous';
          }
        }

              // Get notifications from Firebase (mock)
      const notificationsRef = ref(`notifications/${userId}`);
      const snapshot = await get(notificationsRef);
        
        if (snapshot.exists()) {
          const notificationsData = snapshot.val() as Record<string, any> | null;
          const notifications = Object.values(notificationsData || {}) as Notification[];
          setNotifications(notifications);
          const unread = notifications.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = (): void => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = (): void => {
    // Stop location tracking before logout
    locationTrackingService.stopTracking();
    (locationTrackingService as any).consentChecked = false; // Reset consent check flag
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNavigation = (path: string): void => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
    handleNotificationMenuClose();
  };

  const handleMarkAsRead = async (notificationId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get user ID from localStorage
      const userData = localStorage.getItem('user');
      let userId = 'anonymous';
      
      if (userData) {
        try {
          const user = JSON.parse(userData) as User;
          userId = user.uid || user.email || 'anonymous';
        } catch (error) {
          console.error('Error parsing user data:', error);
          userId = 'anonymous';
        }
      }

      // Update notification in Firebase (mock)
      const notificationRef = ref(`notifications/${userId}/${notificationId}`);
      await update(notificationRef, { isRead: true });

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId || n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handlePasswordChangeSuccess = (): void => {
    // Update user data in localStorage to remove mustChangePassword flag
    const userData = localStorage.getItem('user');
    let parsedUser: User | null = null;
    if (typeof userData === 'string') {
      try {
        parsedUser = JSON.parse(userData) as User;
      } catch (e) {
        parsedUser = null;
      }
    }
    if (parsedUser) {
      const updatedUser = { ...parsedUser, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const handlePasswordDialogClose = (): void => {
    setShowPasswordDialog(false);
  };

  const handleClockHover = (): void => {
    setShowMiniCalendar(true);
  };

  const handleClockLeave = (): void => {
    setShowMiniCalendar(false);
  };

  const handleClockClick = (): void => {
    setShowCalendarDialog(true);
  };

  const handleCalendarDialogClose = (): void => {
    setShowCalendarDialog(false);
  };

  const handleLocationConsent = (consent: boolean, trackingData?: any): void => {
    if (consent) {
      console.log('Location tracking consent given:', trackingData);
      // Start tracking if consent is given
      if (trackingData) {
        // The tracking service will handle the rest
        console.log('Tracking initialized with data:', trackingData);
      }
    } else {
      console.log('Location tracking consent denied');
    }
    setShowLocationConsent(false);
  };

  const handleLocationConsentClose = (): void => {
    setShowLocationConsent(false);
  };

  const handleGroupToggle = (groupTitle: string): void => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      return newSet;
    });
  };

  const handleSidebarToggle = (): void => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1.5 : 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'primary.contrastText',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
              : 'linear-gradient(135deg, #5a5fef 0%, #7c3aed 100%)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 30% 20%, rgba(129, 140, 248, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }
        }}
        onClick={() => handleNavigation('/dashboard')}
      >
        <WorkIcon sx={{ 
          fontSize: sidebarCollapsed ? 32 : 40, 
          mb: sidebarCollapsed ? 0 : 1, 
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' 
        }} />
        {!sidebarCollapsed && (
          <>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                letterSpacing: '-0.025em',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              HRMS
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.9,
                display: 'block',
                mt: 0.5
              }}
            >
              Human Resource Management System
            </Typography>
          </>
        )}
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2, pb: 10, position: 'relative' }}>
        <List>
          {/* Individual Menu Items */}
          {[
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
            { text: 'Employee Directory', icon: <PeopleIcon />, path: '/employee-directory' },
          ].map((item, index) => (
            <Grow in timeout={200 + index * 50} key={item.text}>
              <Tooltip title={sidebarCollapsed ? item.text : ""} placement="right">
                <ListItem
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: sidebarCollapsed ? 0.5 : 1,
                    mb: 0.5,
                    borderRadius: 1,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    transition: 'all 0.15s ease-out',
                    cursor: 'pointer',
                    backgroundColor: location.pathname === item.path ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    borderLeft: location.pathname === item.path && !sidebarCollapsed ? '4px solid' : 'none',
                    borderLeftColor: 'primary.main',
                    '&:hover': {
                      transform: sidebarCollapsed ? 'scale(1.1)' : 'translateX(4px)',
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                      minWidth: sidebarCollapsed ? 0 : 40,
                      transition: 'all 0.15s ease-out',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <ListItemText 
                      primary={item.text} 
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: location.pathname === item.path ? 600 : 500,
                          fontSize: '0.875rem',
                        }
                      }}
                    />
                  )}
                </ListItem>
              </Tooltip>
            </Grow>
          ))}

          {/* Divider */}
          <Box sx={{ my: 2, mx: 2 }}>
            <Divider />
          </Box>

          {/* Grouped Menu Items */}
          {menuGroups.map((group, groupIndex) => {
            // Filter items based on user role
            const filteredItems = group.items.filter(item => {
              // HR role: restrict to specific pages
              if (user && user.role === 'hr') {
                const allowedForHR = [
                  'Dashboard',
                  'Employees',
                  'Attendance Management',
                  'Leave Management',
                  'Training',
                  'Announcements',
                  'Exit Process',
                ];
                return allowedForHR.includes(item.text);
              }
              // If no roles specified, show to everyone
              if (!item.roles) return true;
              // If user has no role, don't show
              if (!user || !user.role) return false;
              // Check if user's role is in the allowed roles
              return item.roles.includes(user.role);
            });

            // Don't render group if no items are visible
            if (filteredItems.length === 0) return null;

            const isExpanded = expandedGroups.has(group.title);

            // If sidebar is collapsed, show only icons without groups
            if (sidebarCollapsed) {
              return (
                <Grow in timeout={200 + groupIndex * 50} key={group.title}>
                  <Box>
                    {filteredItems.map((item) => (
                      <Tooltip title={item.text} placement="right" key={item.text}>
                        <ListItem
                          onClick={() => handleNavigation(item.path)}
                          sx={{
                            mx: 0.5,
                            mb: 0.5,
                            borderRadius: 1,
                            justifyContent: 'center',
                            transition: 'all 0.15s ease-out',
                            cursor: 'pointer',
                            backgroundColor: location.pathname === item.path ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              backgroundColor: 'rgba(99, 102, 241, 0.08)',
                            },
                          }}
                        >
                          <ListItemIcon 
                            sx={{ 
                              color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                              minWidth: 0,
                              transition: 'all 0.15s ease-out',
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                        </ListItem>
                      </Tooltip>
                    ))}
                  </Box>
                </Grow>
              );
            }

            return (
              <Grow in timeout={200 + groupIndex * 50} key={group.title}>
                <Box>
                  {/* Group Header */}
                  <ListItem
                    onClick={() => handleGroupToggle(group.title)}
                    sx={{
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 1,
                      backgroundColor: 'rgba(99, 102, 241, 0.04)',
                      transition: 'all 0.15s ease-out',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <ListItemText 
                      primary={group.title} 
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'text.primary',
                        }
                      }}
                    />
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItem>

                  {/* Group Items */}
                  {isExpanded && (
                    <Box sx={{ ml: 2 }}>
                      {filteredItems.map((item, index) => (
                        <Grow in timeout={300 + index * 50} key={item.text}>
                          <ListItem
                            onClick={() => handleNavigation(item.path)}
                            sx={{
                              mx: 1,
                              mb: 0.5,
                              borderRadius: 1,
                              transition: 'all 0.15s ease-out',
                              cursor: 'pointer',
                              backgroundColor: location.pathname === item.path ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                              borderLeft: location.pathname === item.path ? '4px solid' : 'none',
                              borderLeftColor: 'primary.main',
                              '&:hover': {
                                transform: 'translateX(4px)',
                                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                              },
                            }}
                          >
                            <ListItemIcon 
                              sx={{ 
                                color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                                minWidth: 40,
                                transition: 'all 0.15s ease-out',
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.text} 
                              sx={{
                                '& .MuiListItemText-primary': {
                                  fontWeight: location.pathname === item.path ? 600 : 500,
                                  fontSize: '0.875rem',
                                }
                              }}
                            />
                          </ListItem>
                        </Grow>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grow>
            );
          })}
        </List>
      </Box>

      {/* User Info Section */}
      {user && (
        <Box
          sx={{
            p: sidebarCollapsed ? 1 : 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30, 41, 59, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: sidebarCollapsed ? 50 : 70,
            zIndex: 1,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box 
            ref={clockRef}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: sidebarCollapsed ? 0 : 1.5,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease-out',
              '&:hover': {
                transform: 'scale(1.02)',
              }
            }}
            onMouseEnter={handleClockHover}
            onMouseLeave={handleClockLeave}
            onClick={handleClockClick}
          >
            <AccessTimeIcon sx={{ 
              fontSize: sidebarCollapsed ? 16 : 20, 
              color: 'text.secondary' 
            }} />
            {!sidebarCollapsed && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.2
                }}>
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  display: 'block',
                  lineHeight: 1.2
                }}>
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            )}
            
            {/* Mini Calendar on Hover */}
            {showMiniCalendar && !sidebarCollapsed && (
              <MiniCalendar 
                currentDate={currentDate} 
                onClose={() => setShowMiniCalendar(false)} 
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );

  const currentPage = (() => {
    for (const group of menuGroups) {
      const item = group.items.find(item => item.path === location.pathname);
      if (item) return item.text;
    }
    return 'Dashboard';
  })();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: `${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'all 0.15s ease-out',
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="subtitle1" noWrap component="div" sx={{ flexGrow: 1, fontSize: '1.125rem', fontWeight: 600 }}>
            {currentPage}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
          }}>
            {/* Quick Links */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}>
              <Button
                size="small"
                variant="text"
                startIcon={<AssessmentIcon sx={{ color: 'text.primary' }} />}
                onClick={() => navigate('/reports')}
                sx={{
                  color: 'text.primary',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Reports
              </Button>
              <Button
                size="small"
                variant="text"
                startIcon={<NotificationsIcon sx={{ color: 'text.primary' }} />}
                onClick={() => navigate('/notifications')}
                sx={{
                  color: 'text.primary',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Notifications
              </Button>
              <Button
                size="small"
                variant="text"
                startIcon={<BusinessIcon sx={{ color: 'text.primary' }} />}
                onClick={() => navigate('/settings')}
                sx={{
                  color: 'text.primary',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Settings
              </Button>
              <Button
                size="small"
                variant="text"
                startIcon={<GroupIcon sx={{ color: 'text.primary' }} />}
                onClick={() => navigate('/users')}
                sx={{
                  color: 'text.primary',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Users
              </Button>
            </Box>

            <IconButton
              size="small"
              onClick={toggleTheme}
              sx={{ 
                color: 'text.primary',
                width: 36,
                height: 36
              }}
            >
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            
            <IconButton
              size="small"
              onClick={handleNotificationMenuOpen}
              sx={{ 
                color: 'text.primary',
                width: 36,
                height: 36,
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Notification Dropdown */}
            {Boolean(notificationAnchorEl) && (
              <ClickAwayListener onClickAway={handleNotificationMenuClose}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    mt: 0.5,
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    width: 380,
                    maxHeight: 500,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                    border: '1px solid',
                    borderColor: 'divider',
                    zIndex: 9999,
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -4,
                      right: 12,
                      width: 8,
                      height: 8,
                      backgroundColor: 'background.paper',
                      transform: 'rotate(45deg)',
                      borderLeft: '1px solid',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      zIndex: -1
                    }
                  }}
                >
                  {/* Notification Header */}
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Notifications
                    </Typography>
                    {unreadCount > 0 && (
                      <Chip 
                        label={`${unreadCount} unread`} 
                        size="small" 
                        color="primary" 
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  
                  {/* Notification List */}
                  <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                    {notifications.length === 0 ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No notifications
                        </Typography>
                      </Box>
                    ) : (
                      notifications.slice(0, 5).map((notification, index) => (
                        <Fade in timeout={300 + index * 100} key={notification._id || notification.id}>
                          <Box
                            sx={{
                              p: 2,
                              borderBottom: 1,
                              borderColor: 'divider',
                              backgroundColor: notification.isRead ? 'inherit' : 'action.hover',
                              '&:hover': {
                                backgroundColor: 'rgba(99, 102, 241, 0.04)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: notification.isRead ? 500 : 600,
                                    mb: 0.5,
                                  }}
                                >
                                  {notification.title}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ display: 'block', mb: 0.5 }}
                                >
                                  {notification.message}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  display="block" 
                                  color="text.secondary"
                                  sx={{ fontSize: '0.7rem' }}
                                >
                                  {new Date(notification.createdAt).toLocaleString()}
                                </Typography>
                              </Box>
                              {!notification.isRead && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification._id || notification.id || '');
                                  }}
                                  sx={{ ml: 1 }}
                                >
                                  <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                                    Mark read
                                  </Typography>
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Fade>
                      ))
                    )}
                  </Box>

                  {/* View All Link */}
                  {notifications.length > 5 && (
                    <Box 
                      onClick={() => handleNavigation('/notifications')}
                      sx={{ 
                        borderTop: 1, 
                        borderColor: 'divider',
                        textAlign: 'center',
                        py: 1.5,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                        View all notifications ({notifications.length})
                      </Typography>
                    </Box>
                  )}
                </Box>
              </ClickAwayListener>
            )}

            {/* Profile Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, position: 'relative' }}>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                aria-controls="profile-menu"
                aria-haspopup="true"
                sx={{ color: 'text.primary' }}
              >
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                }}>
                  {user ? (user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U') : <AccountCircleIcon />}
                </Avatar>
              </IconButton>
              
              {Boolean(anchorEl) && (
                <ClickAwayListener onClickAway={handleMenuClose}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      mt: 0.5,
                      backgroundColor: 'background.paper',
                      borderRadius: 2,
                      minWidth: 180,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                      border: '1px solid',
                      borderColor: 'divider',
                      zIndex: 9999,
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -4,
                        right: 12,
                        width: 8,
                        height: 8,
                        backgroundColor: 'background.paper',
                        transform: 'rotate(45deg)',
                        borderLeft: '1px solid',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        zIndex: -1
                      }
                    }}
                  >
                    <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                      <ListItemIcon>
                        <AccountCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
                          {user ? (user.firstName + ' ' + user.lastName) : 'Profile'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                          {user ? user.role : ''}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem onClick={() => { handleMenuClose(); handleNavigation('/settings'); }} sx={{ py: 1 }}>
                      <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem' }}>
                        Settings
                      </Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { handleMenuClose(); toggleTheme(); }} sx={{ py: 1 }}>
                      <ListItemIcon>
                        {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                      </ListItemIcon>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem' }}>
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { handleMenuClose(); syncWithSystem(); }} sx={{ py: 1 }}>
                      <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem' }}>
                        Sync with System
                      </Typography>
                      {isSystemTheme && (
                        <Chip label="Active" size="small" color="success" sx={{ ml: 1, height: 20, fontSize: '0.6875rem' }} />
                      )}
                    </MenuItem>
                    <Divider />
                    <MenuItem 
                      onClick={() => { handleMenuClose(); handleLogout(); }}
                      sx={{ 
                        py: 1,
                        color: 'error.main', 
                        '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' } 
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit' }}>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2" sx={{ color: 'inherit', fontSize: '0.8125rem' }}>
                        Logout
                      </Typography>
                    </MenuItem>
                  </Box>
                </ClickAwayListener>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ 
          width: { md: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth }, 
          flexShrink: { md: 0 },
          transition: 'all 0.15s ease-out',
        }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
              border: 'none',
              transition: 'all 0.15s ease-out',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3, lg: 4 },
          width: { md: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          mt: 8.75,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          overflowX: 'hidden',
          pb: { xs: 8, md: 0 },
          transition: 'all 0.15s ease-out',
        }}
      >
        <Fade in timeout={300}>
          <Box>
            {children || null}
          </Box>
        </Fade>
      </Box>
      
      {/* Password Change Dialog */}
      <ChangePasswordDialog
        open={showPasswordDialog}
        onClose={handlePasswordDialogClose}
        onSuccess={handlePasswordChangeSuccess}
      />
      <LocationConsentModal
        open={showLocationConsent}
        onClose={handleLocationConsentClose}
        onConsent={handleLocationConsent}
      />
      
      {/* Calendar Dialog */}
      <CalendarDialog
        open={showCalendarDialog}
        onClose={handleCalendarDialogClose}
        currentDate={currentDate}
      />
      
      {/* Fixed Sidebar Toggle Button */}
      <Box
        sx={{
          position: 'fixed',
          left: sidebarCollapsed ? collapsedDrawerWidth + 4 : drawerWidth + 4,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1200,
          display: { xs: 'none', md: 'block' },
          transition: 'all 0.15s ease-out',
        }}
      >
        <Tooltip title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} placement="right">
          <IconButton
            onClick={handleSidebarToggle}
            size="small"
            sx={{
              backgroundColor: 'background.paper',
              color: 'text.secondary',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'primary.main',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Mobile Navigation */}
      <MobileNavigation onMenuClick={handleDrawerToggle} />
    </Box>
  );
};

export default Layout;
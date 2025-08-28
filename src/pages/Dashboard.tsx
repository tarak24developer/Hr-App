import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Divider
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
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { formatIndianCurrency } from '../utils/currency';

interface DashboardStats {
  totalEmployees: number;
  activeAttendance: number;
  pendingLeaves: number;
  monthlyPayroll: number;
  employeeChange: string;
  attendanceChange: string;
  leaveChange: string;
  payrollChange: string;
}

interface RecentActivity {
  id: string;
  type: 'leave_request' | 'attendance' | 'payroll' | 'training' | 'employee' | 'asset';
  message: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'success' | 'info' | 'warning';
  userId?: string;
  userName?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: Date;
  type: 'meeting' | 'training' | 'review' | 'holiday' | 'deadline';
  description?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load users (employees)
      const usersResult = await firebaseService.getCollection('users');
      const totalEmployees = usersResult?.success && usersResult.data ? usersResult.data.length : 0;

      // For now, we'll use mock data for other stats since collections don't exist yet
      const mockStats: DashboardStats = {
          totalEmployees,
        activeAttendance: Math.floor(totalEmployees * 0.85), // 85% attendance rate
        pendingLeaves: Math.floor(totalEmployees * 0.1), // 10% pending leaves
        monthlyPayroll: totalEmployees * 50000, // Average salary ₹50,000
        employeeChange: '+5%',
        attendanceChange: '+12%',
        leaveChange: '-8%',
        payrollChange: '+15%'
      };

      setStats(mockStats);

      // Mock recent activities
      const mockActivities: RecentActivity[] = [
        {
          id: '1',
            type: 'leave_request',
          message: 'John Doe requested sick leave',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: 'pending',
          userName: 'John Doe'
        },
        {
          id: '2',
            type: 'attendance',
          message: 'Jane Smith clocked in',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            status: 'success',
          userName: 'Jane Smith'
        },
        {
          id: '3',
          type: 'employee',
          message: 'New employee Mike Johnson joined',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          status: 'success',
          userName: 'Mike Johnson'
        }
      ];

      setRecentActivities(mockActivities);

      // Mock upcoming events
      const mockEvents: UpcomingEvent[] = [
        {
          id: '1',
          title: 'Team Meeting',
          date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          type: 'meeting',
          description: 'Weekly team sync meeting'
        },
        {
          id: '2',
          title: 'Training Session',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            type: 'training',
          description: 'React.js advanced concepts'
        },
        {
          id: '3',
          title: 'Performance Review',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          type: 'review',
          description: 'Q4 performance review'
        }
      ];

      setUpcomingEvents(mockEvents);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      setSnackbar({
        open: true,
        message: 'Failed to load dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadDashboardData();
    setLastRefresh(new Date());
    setSnackbar({
      open: true,
      message: 'Dashboard refreshed successfully',
      severity: 'success'
    });
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Format event date
  const formatEventDate = (date: Date) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'approved':
        return 'success';
      case 'warning':
      case 'pending':
        return 'warning';
      case 'error':
      case 'rejected':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'primary';
      case 'training':
        return 'success';
      case 'review':
        return 'secondary';
      case 'holiday':
        return 'error';
      case 'deadline':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Show loading state
  if (loading) {
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
  if (error) {
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Welcome back! Here's what's happening today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Last Updated */}
      <Typography variant="caption" color="textSecondary" sx={{ mb: 3, display: 'block' }}>
        Last updated: {lastRefresh.toLocaleTimeString('en-IN')}
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
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
              name: 'Active Attendance',
            value: stats.activeAttendance.toLocaleString(),
            change: stats.attendanceChange,
            changeType: stats.attendanceChange.startsWith('+') ? 'positive' : 'negative',
            icon: AccessTimeIcon,
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
          <Grid item xs={12} sm={6} md={3} key={stat.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {stat.name}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: `${stat.color}.100`,
                    color: `${stat.color}.main`
                  }}>
                    <stat.icon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  {stat.changeType === 'positive' ? (
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                  )}
                  <Typography 
                    variant="body2" 
                    color={stat.changeType === 'positive' ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 'medium' }}
                  >
                  {stat.change}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    from last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Recent Activities */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" component="h2">
                Recent Activities
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {recentActivities.length > 0 ? (
                <List>
                  {recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: `${getStatusColor(activity.status)}.main` 
                          }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.message}
                          secondary={formatRelativeTime(activity.timestamp)}
                        />
                        <Chip 
                          label={activity.status} 
                          size="small" 
                          color={getStatusColor(activity.status)}
                          variant="outlined"
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No recent activities
                </Box>
            )}
              <Box sx={{ mt: 2 }}>
                <Button size="small" color="primary">
                View all activities
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" component="h2">
                Upcoming Events
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {upcomingEvents.length > 0 ? (
                <List>
                  {upcomingEvents.map((event, index) => (
                    <React.Fragment key={event.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: `${getEventTypeColor(event.type)}.main` 
                          }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={event.title}
                          secondary={formatEventDate(event.date)}
                        />
                      </ListItem>
                      {index < upcomingEvents.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No upcoming events
                </Box>
            )}
              <Box sx={{ mt: 2 }}>
                <Button size="small" color="primary">
                View calendar
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="h2">
            Quick Actions
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PeopleIcon />}
                sx={{ 
                  flexDirection: 'column', 
                  py: 2, 
                  height: 'auto',
                  '&:hover': { bgcolor: 'primary.50' }
                }}
              >
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Add Employee
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AccessTimeIcon />}
                sx={{ 
                  flexDirection: 'column', 
                  py: 2, 
                  height: 'auto',
                  '&:hover': { bgcolor: 'primary.50' }
                }}
              >
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Clock In/Out
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EventIcon />}
                sx={{ 
                  flexDirection: 'column', 
                  py: 2, 
                  height: 'auto',
                  '&:hover': { bgcolor: 'primary.50' }
                }}
              >
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Request Leave
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PaymentIcon />}
                sx={{ 
                  flexDirection: 'column', 
                  py: 2, 
                  height: 'auto',
                  '&:hover': { bgcolor: 'primary.50' }
                }}
              >
                <Typography variant="body2" sx={{ mt: 1 }}>
                  View Payslip
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

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

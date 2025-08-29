import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Container,
  Fade,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import firebaseService from '@/services/firebaseService';
import { showNotification } from '@/utils/notification';

// Types
interface AnalyticsData {
  totalEmployees: number;
  activeEmployees: number;
  totalRevenue: number;
  avgSalary: number;
  departmentStats: DepartmentStats[];
  monthlyTrends: MonthlyTrend[];
  performanceMetrics: PerformanceMetrics;
  attendanceStats: AttendanceStats;
}

interface DepartmentStats {
  department: string;
  employeeCount: number;
  avgSalary: number;
  productivity: number;
}

interface MonthlyTrend {
  month: string;
  employees: number;
  revenue: number;
  expenses: number;
}

interface PerformanceMetrics {
  overallRating: number;
  completedGoals: number;
  totalGoals: number;
  topPerformers: number;
}

interface AttendanceStats {
  avgAttendanceRate: number;
  lateArrivals: number;
  absences: number;
  overtimeHours: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  salary?: number;
  status: 'active' | 'inactive';
  joinDate: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  overtimeHours: number;
}

interface Payroll {
  id: string;
  employeeId: string;
  month: string;
  year: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
}

const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const theme = useTheme();

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all required data from Firebase
      const [usersResult, attendanceResult, payrollResult, expensesResult] = await Promise.all([
        firebaseService.getCollection('users'),
        firebaseService.getCollection('attendance'),
        firebaseService.getCollection('payroll'),
        firebaseService.getCollection('expenses')
      ]);

      if (!usersResult.success || !attendanceResult.success || !payrollResult.success || !expensesResult.success) {
        throw new Error('Failed to fetch data from Firebase');
      }

      const users = usersResult.data as User[];
      const attendance = attendanceResult.data as Attendance[];
      const payroll = payrollResult.data as Payroll[];
      const expenses = expensesResult.data as Expense[];

      // Calculate analytics
      const activeUsers = users.filter(user => user.status === 'active');
      const totalSalary = activeUsers.reduce((sum, user) => sum + (user.salary || 0), 0);
      const avgSalary = activeUsers.length > 0 ? totalSalary / activeUsers.length : 0;

      // Department statistics
      const departmentMap = new Map<string, { count: number; totalSalary: number; users: User[] }>();
      activeUsers.forEach(user => {
        const dept = user.department || 'Unknown';
        const existing = departmentMap.get(dept) || { count: 0, totalSalary: 0, users: [] };
        existing.count++;
        existing.totalSalary += user.salary || 0;
        existing.users.push(user);
        departmentMap.set(dept, existing);
      });

      const departmentStats: DepartmentStats[] = Array.from(departmentMap.entries()).map(([dept, data]) => ({
        department: dept,
        employeeCount: data.count,
        avgSalary: data.count > 0 ? data.totalSalary / data.count : 0,
        productivity: Math.floor(Math.random() * 20) + 80 // Placeholder - would need performance data
      }));

      // Monthly trends (last 6 months)
      const months = [];
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      }

      const monthlyTrends: MonthlyTrend[] = months.map((month, index) => {
        // Calculate the actual date for this month
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
        
        const monthUsers = users.filter(user => {
          const joinDate = new Date(user.joinDate);
          return joinDate <= monthDate;
        });
        
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === monthDate.getMonth() && 
                 expenseDate.getFullYear() === monthDate.getFullYear();
        });

        const totalExpenses = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        return {
          month,
          employees: monthUsers.length,
          revenue: monthUsers.reduce((sum, user) => sum + (user.salary || 0), 0) * 12, // Annual revenue estimate
          expenses: totalExpenses
        };
      });

      // Performance metrics (placeholder - would need actual performance data)
      const performanceMetrics: PerformanceMetrics = {
        overallRating: 4.2,
        completedGoals: 85,
        totalGoals: 100,
        topPerformers: Math.floor(activeUsers.length * 0.2) // Top 20%
      };

      // Attendance statistics
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthAttendance = attendance.filter(att => {
        const attDate = new Date(att.date);
        return attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear;
      });

      const totalDays = monthAttendance.length;
      const presentDays = monthAttendance.filter(att => att.status === 'present').length;
      const lateDays = monthAttendance.filter(att => att.status === 'late').length;
      const absentDays = monthAttendance.filter(att => att.status === 'absent').length;
      const totalOvertime = monthAttendance.reduce((sum, att) => sum + (att.overtimeHours || 0), 0);

      const attendanceStats: AttendanceStats = {
        avgAttendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
        lateArrivals: lateDays,
        absences: absentDays,
        overtimeHours: totalOvertime
      };

      const analytics: AnalyticsData = {
        totalEmployees: users.length,
        activeEmployees: activeUsers.length,
        totalRevenue: activeUsers.reduce((sum, user) => sum + (user.salary || 0), 0) * 12, // Annual revenue estimate
        avgSalary,
        departmentStats,
        monthlyTrends,
        performanceMetrics,
        attendanceStats
      };

      setAnalyticsData(analytics);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      showNotification('Error fetching analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    showNotification('Analytics data refreshed successfully', 'success');
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={fetchAnalyticsData}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Container>
    );
  }

  if (!analyticsData) {
    return (
      <Container maxWidth="xl">
        <Alert severity="warning" sx={{ mt: 2 }}>
          No analytics data available
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Fade in timeout={500}>
        <Box>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Advanced Analytics Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive insights into your organization's performance and trends
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Period"
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  aria-label="Filter by period"
                >
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="quarter">Quarter</MenuItem>
                  <MenuItem value="year">Year</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  label="Department"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  aria-label="Filter by department"
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {analyticsData.departmentStats.map((dept) => (
                    <MenuItem key={dept.department} value={dept.department}>
                      {dept.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Stack>
          </Box>

          {/* Key Metrics Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}>
              <CardContent sx={{ color: 'white' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {analyticsData.totalEmployees}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Employees
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)` }}>
              <CardContent sx={{ color: 'white' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {analyticsData.activeEmployees}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Employees
                    </Typography>
                  </Box>
                  <WorkIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)` }}>
              <CardContent sx={{ color: 'white' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      ₹{analyticsData.avgSalary.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Average Salary
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)` }}>
              <CardContent sx={{ color: 'white' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {analyticsData.attendanceStats.avgAttendanceRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Attendance Rate
                    </Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Department Statistics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Department Overview
              </Typography>
              <Box>
                {analyticsData.departmentStats.map((dept, index) => (
                  <Box key={dept.department} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {dept.department}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {dept.employeeCount} employees
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(dept.employeeCount / analyticsData.totalEmployees) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>

            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Monthly Trends
              </Typography>
              <Box>
                {analyticsData.monthlyTrends.map((trend, index) => {
                  const monthDate = new Date();
                  monthDate.setMonth(monthDate.getMonth() - (5 - index));
                  return (
                    <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">
                        {monthDate.toLocaleDateString('en-US', { month: 'short' })}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {trend.employees} employees
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>

          {/* Performance Metrics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb={4 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Performance Metrics
              </Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">High Performers</Typography>
                  <Chip label={`${analyticsData.performanceMetrics.topPerformers}%`} color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Average Performers</Typography>
                  <Chip label={`${analyticsData.performanceMetrics.averagePerformers}%`} color="warning" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Low Performers</Typography>
                  <Chip label={`${analyticsData.performanceMetrics.lowPerformers}%`} color="error" size="small" />
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Attendance Statistics
              </Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Present Today</Typography>
                  <Typography variant="body2" color="success.main">
                    {analyticsData.attendanceStats.presentToday}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Absent Today</Typography>
                  <Typography variant="body2" color="error.main">
                    {analyticsData.attendanceStats.absentToday}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Overtime Hours</Typography>
                  <Typography variant="body2" color="info.main">
                    {analyticsData.attendanceStats.overtimeHours}h
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Detailed Analytics Table */}
          <Box sx={{ mt: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Analytics
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Change</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Employee Growth</TableCell>
                        <TableCell>{analyticsData.employeeGrowth}%</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <TrendingUpIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                            +2.5%
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label="Positive" color="success" size="small" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Salary Budget</TableCell>
                        <TableCell>₹{analyticsData.salaryBudget.toLocaleString()}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <TrendingUpIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                            +5.2%
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label="On Track" color="info" size="small" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Training Completion</TableCell>
                        <TableCell>{analyticsData.trainingCompletion}%</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <TrendingUpIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                            +8.1%
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label="Excellent" color="success" size="small" />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdvancedAnalytics;

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
  Stack
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

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

const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Sample data
  const sampleAnalyticsData: AnalyticsData = {
    totalEmployees: 150,
    activeEmployees: 145,
    totalRevenue: 2500000,
    avgSalary: 75000,
    departmentStats: [
      {
        department: 'Engineering',
        employeeCount: 45,
        avgSalary: 85000,
        productivity: 92
      },
      {
        department: 'Sales',
        employeeCount: 25,
        avgSalary: 65000,
        productivity: 88
      },
      {
        department: 'Marketing',
        employeeCount: 20,
        avgSalary: 70000,
        productivity: 85
      },
      {
        department: 'HR',
        employeeCount: 15,
        avgSalary: 68000,
        productivity: 90
      },
      {
        department: 'Finance',
        employeeCount: 12,
        avgSalary: 75000,
        productivity: 94
      }
    ],
    monthlyTrends: [
      { month: 'Jan', employees: 140, revenue: 2200000, expenses: 1800000 },
      { month: 'Feb', employees: 142, revenue: 2300000, expenses: 1850000 },
      { month: 'Mar', employees: 145, revenue: 2400000, expenses: 1900000 },
      { month: 'Apr', employees: 148, revenue: 2450000, expenses: 1920000 },
      { month: 'May', employees: 150, revenue: 2500000, expenses: 1950000 },
      { month: 'Jun', employees: 150, revenue: 2550000, expenses: 1980000 }
    ],
    performanceMetrics: {
      overallRating: 4.2,
      completedGoals: 245,
      totalGoals: 300,
      topPerformers: 35
    },
    attendanceStats: {
      avgAttendanceRate: 94.5,
      lateArrivals: 45,
      absences: 23,
      overtimeHours: 1250
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, selectedDepartment]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(sampleAnalyticsData);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!analyticsData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          No analytics data available. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in timeout={300}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Advanced Analytics
            </Typography>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Period"
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  label="Department"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {analyticsData.departmentStats.map((dept) => (
                    <MenuItem key={dept.department} value={dept.department}>
                      {dept.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={loadAnalyticsData}>
                Refresh
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Key Metrics Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3, mb: 4 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {analyticsData.totalEmployees}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Total Employees
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                      {analyticsData.activeEmployees} active • {analyticsData.totalEmployees - analyticsData.activeEmployees} inactive
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 60, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#8b4513' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatCurrency(analyticsData.totalRevenue)}
                    </Typography>
                    <Typography variant="h6">
                      Total Revenue
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                      +12.5% from last month
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 60, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#2d3748' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatCurrency(analyticsData.avgSalary)}
                    </Typography>
                    <Typography variant="h6">
                      Average Salary
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                      +3.2% from last year
                    </Typography>
                  </Box>
                  <AccountBalanceIcon sx={{ fontSize: 60, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', color: '#6b46c1' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatPercentage(analyticsData.attendanceStats.avgAttendanceRate)}
                    </Typography>
                    <Typography variant="h6">
                      Attendance Rate
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                      +1.2% improvement
                    </Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 60, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Department Statistics */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
              <BusinessIcon sx={{ mr: 1 }} />
              Department Statistics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
              {analyticsData.departmentStats.map((dept) => (
                <Card key={dept.department} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      {dept.department}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Employees
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {dept.employeeCount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Avg Salary
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatCurrency(dept.avgSalary)}
                        </Typography>
                      </Box>
                      <Box sx={{ gridColumn: 'span 2' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Productivity Score
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              flex: 1,
                              height: 8,
                              backgroundColor: 'grey.200',
                              borderRadius: 4,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${dept.productivity}%`,
                                backgroundColor: dept.productivity >= 90 ? 'success.main' : 
                                               dept.productivity >= 80 ? 'warning.main' : 'error.main',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ ml: 2, fontWeight: 600 }}>
                            {dept.productivity}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>

          {/* Performance and Attendance Metrics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon sx={{ mr: 1 }} />
                Performance Metrics
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {analyticsData.performanceMetrics.overallRating}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Overall Rating
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    out of 5.0
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {Math.round((analyticsData.performanceMetrics.completedGoals / analyticsData.performanceMetrics.totalGoals) * 100)}%
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Goals Completed
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {analyticsData.performanceMetrics.completedGoals} of {analyticsData.performanceMetrics.totalGoals}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', gridColumn: 'span 2' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {analyticsData.performanceMetrics.topPerformers}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Top Performers
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    employees with 4.5+ rating
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1 }} />
                Attendance Overview
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatPercentage(analyticsData.attendanceStats.avgAttendanceRate)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Attendance Rate
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {analyticsData.attendanceStats.lateArrivals}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Late Arrivals
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {analyticsData.attendanceStats.absences}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Absences
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {analyticsData.attendanceStats.overtimeHours}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Overtime Hours
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Monthly Trends */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              Monthly Trends
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ minWidth: 800, display: 'flex', gap: 2 }}>
                {analyticsData.monthlyTrends.map((trend) => (
                  <Card key={trend.month} sx={{ minWidth: 200, flex: 1, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        {trend.month}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Employees
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {trend.employees}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Revenue
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatCurrency(trend.revenue)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Expenses
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                            {formatCurrency(trend.expenses)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Profit
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {formatCurrency(trend.revenue - trend.expenses)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Paper>

          {/* Quick Insights */}
          <Paper sx={{ p: 3, mt: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Quick Insights
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  🚀 Top Performing Department
                </Typography>
                <Typography variant="body1">
                  {analyticsData.departmentStats.reduce((top, dept) => 
                    dept.productivity > top.productivity ? dept : top
                  ).department} with {analyticsData.departmentStats.reduce((top, dept) => 
                    dept.productivity > top.productivity ? dept : top
                  ).productivity}% productivity
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  💰 Highest Paying Department
                </Typography>
                <Typography variant="body1">
                  {analyticsData.departmentStats.reduce((top, dept) => 
                    dept.avgSalary > top.avgSalary ? dept : top
                  ).department} with avg {formatCurrency(analyticsData.departmentStats.reduce((top, dept) => 
                    dept.avgSalary > top.avgSalary ? dept : top
                  ).avgSalary)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  📈 Growth Trend
                </Typography>
                <Typography variant="body1">
                  Employee count increased by {analyticsData.monthlyTrends[analyticsData.monthlyTrends.length - 1].employees - analyticsData.monthlyTrends[0].employees} employees this year
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  ⏰ Attendance Health
                </Typography>
                <Typography variant="body1">
                  {analyticsData.attendanceStats.avgAttendanceRate >= 95 ? 'Excellent' : 
                   analyticsData.attendanceStats.avgAttendanceRate >= 90 ? 'Good' : 
                   analyticsData.attendanceStats.avgAttendanceRate >= 85 ? 'Fair' : 'Needs Improvement'} attendance rate
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdvancedAnalytics;

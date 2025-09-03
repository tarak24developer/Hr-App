import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import { 
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  BarChart as BarChartIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import firebaseService from '@/services/firebaseService';
import { showNotification } from '@/utils/notification';
import type { User, Attendance, Payroll, Asset, Training, Incident } from '@/types';

// Report Types
interface ReportData {
  id: string;
  title: string;
  type: 'attendance' | 'payroll' | 'performance' | 'assets' | 'training' | 'incidents' | 'custom';
  description: string;
  generatedAt: string;
  generatedBy: string;
  data: any[];
  filters: ReportFilters;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
}

interface ReportFilters {
  dateRange: {
    start: string;
    end: string;
  };
  departments: string[];
  employees: string[];
  status?: string;
  type?: string;
}

interface AnalyticsData {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  attendanceRate: number;
  averageSalary: number;
  totalAssets: number;
  activeTrainings: number;
  pendingIncidents: number;
  monthlyTrends: MonthlyTrend[];
  departmentStats: DepartmentStat[];
  performanceMetrics: PerformanceMetric[];
}

interface MonthlyTrend {
  month: string;
  employees: number;
  attendance: number;
  revenue: number;
  expenses: number;
}

interface DepartmentStat {
  department: string;
  employeeCount: number;
  avgSalary: number;
  attendanceRate: number;
  performance: number;
}

interface PerformanceMetric {
  category: string;
  value: number;
  target: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    departments: [],
    employees: []
  });

  useEffect(() => {
    fetchAnalyticsData();
    fetchReports();
  }, []);

  // Update progress bar widths when analytics data changes
  useEffect(() => {
    if (analyticsData) {
      const progressBars = document.querySelectorAll('[data-width]');
      progressBars.forEach((bar) => {
        const width = bar.getAttribute('data-width');
        if (width) {
          (bar as HTMLElement).style.setProperty('--data-width', width);
          bar.setAttribute('aria-valuenow', Math.round(parseFloat(width)).toString());
        }
      });
    }
  }, [analyticsData]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data from Firebase
      const [usersResponse, attendanceResponse, payrollResponse, assetsResponse, trainingsResponse, incidentsResponse] = await Promise.all([
        firebaseService.getCollection<User>('users'),
        firebaseService.getCollection<Attendance>('attendance'),
        firebaseService.getCollection<Payroll>('payroll'),
        firebaseService.getCollection<Asset>('assets'),
        firebaseService.getCollection<Training>('trainings'),
        firebaseService.getCollection<Incident>('incidents')
      ]);

      const users = usersResponse.success ? usersResponse.data || [] : [];
      const attendance = attendanceResponse.success ? attendanceResponse.data || [] : [];
      const payroll = payrollResponse.success ? payrollResponse.data || [] : [];
      const assets = assetsResponse.success ? assetsResponse.data || [] : [];
      const trainings = trainingsResponse.success ? trainingsResponse.data || [] : [];
      const incidents = incidentsResponse.success ? incidentsResponse.data || [] : [];

      // Calculate analytics
      const activeUsers = users.filter(user => user.status === 'active');
      const departments = [...new Set(users.map(user => user.department))];
      
      // Calculate attendance rate
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthAttendance = attendance.filter(att => {
        const attDate = new Date(att.date);
        return attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear;
      });
      const attendanceRate = monthAttendance.length > 0 ? 
        (monthAttendance.filter(att => att.status === 'present').length / monthAttendance.length) * 100 : 0;

      // Calculate average salary
      const totalSalary = activeUsers.reduce((sum, user) => sum + (user.salary || 0), 0);
      const averageSalary = activeUsers.length > 0 ? totalSalary / activeUsers.length : 0;

      // Generate monthly trends
      const monthlyTrends: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        const monthUsers = users.filter(user => {
          const joinDate = new Date(user.hireDate);
          return joinDate <= date;
        });
        
        const monthAttendance = attendance.filter(att => {
          const attDate = new Date(att.date);
          return attDate.getMonth() === date.getMonth() && attDate.getFullYear() === date.getFullYear();
        });
        
        const monthPayroll = payroll.filter(pay => {
          return pay.month === date.getMonth() + 1 && pay.year === date.getFullYear();
        });

        monthlyTrends.push({
          month,
          employees: monthUsers.length,
          attendance: monthAttendance.length > 0 ? 
            (monthAttendance.filter(att => att.status === 'present').length / monthAttendance.length) * 100 : 0,
          revenue: monthPayroll.reduce((sum, pay) => sum + pay.grossSalary, 0),
          expenses: monthPayroll.reduce((sum, pay) => sum + pay.netSalary, 0)
        });
      }

      // Department statistics
      const departmentStats: DepartmentStat[] = departments.map(dept => {
        const deptUsers = users.filter(user => user.department === dept);
        const deptAttendance = attendance.filter(att => {
          const user = users.find(u => u.id === att.employeeId);
          return user?.department === dept;
        });
        
        return {
          department: dept,
          employeeCount: deptUsers.length,
          avgSalary: deptUsers.length > 0 ? 
            deptUsers.reduce((sum, user) => sum + (user.salary || 0), 0) / deptUsers.length : 0,
          attendanceRate: deptAttendance.length > 0 ? 
            (deptAttendance.filter(att => att.status === 'present').length / deptAttendance.length) * 100 : 0,
          performance: Math.random() * 100 // Placeholder - would be calculated from actual performance data
        };
      });

      // Performance metrics
      const performanceMetrics: PerformanceMetric[] = [
        {
          category: 'Attendance',
          value: attendanceRate,
          target: 95,
          status: attendanceRate >= 95 ? 'excellent' : attendanceRate >= 85 ? 'good' : attendanceRate >= 75 ? 'average' : 'poor'
        },
        {
          category: 'Training Completion',
          value: 78,
          target: 80,
          status: 'good'
        },
        {
          category: 'Asset Utilization',
          value: 85,
          target: 90,
          status: 'good'
        },
        {
          category: 'Incident Resolution',
          value: 92,
          target: 95,
          status: 'excellent'
        }
      ];

      setAnalyticsData({
        totalEmployees: users.length,
        activeEmployees: activeUsers.length,
        totalDepartments: departments.length,
        attendanceRate,
        averageSalary,
        totalAssets: assets.length,
        activeTrainings: trainings.filter(t => t.status === 'in-progress').length,
        pendingIncidents: incidents.filter(i => i.status === 'open').length,
        monthlyTrends,
        departmentStats,
        performanceMetrics
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      showNotification('Failed to fetch analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await firebaseService.getCollection<ReportData>('reports', {
        orderBy: [{ field: 'generatedAt', direction: 'desc' }],
        limit: 10
      });
      
      if (response.success) {
        setReports(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      const newReport: Omit<ReportData, 'id'> = {
        title: `${selectedReportType} Report`,
        type: selectedReportType as any,
        description: `Generated report for ${selectedReportType}`,
        generatedAt: new Date().toISOString(),
        generatedBy: 'current-user', // Would be actual user ID
        data: [], // Would contain actual report data
        filters: reportFilters,
        status: 'generating'
      };

      const response = await firebaseService.addDocument('reports', newReport);
      
      if (response.success) {
        showNotification('Report generation started', 'success');
        fetchReports();
      } else {
        showNotification('Failed to generate report', 'error');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showNotification('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (reportId: string) => {
    showNotification('Export functionality coming soon', 'info');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'average': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircleIcon />;
      case 'good': return <CheckCircleIcon />;
      case 'average': return <WarningIcon />;
      case 'poor': return <ErrorIcon />;
      default: return <WarningIcon />;
    }
  };

  if (loading && !analyticsData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom CSS for progress bars */}
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-width] {
            width: calc(var(--data-width, 0) * 1%);
            transition: width 0.3s ease-in-out;
          }
        `
      }} />
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Comprehensive insights and reporting for your organization</p>
      </div>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Analytics Dashboard" icon={<BarChartIcon />} />
          <Tab label="Generated Reports" icon={<AssessmentIcon />} />
          <Tab label="Create Report" icon={<AssessmentIcon />} />
        </Tabs>
      </Box>

      {/* Analytics Dashboard */}
      {selectedTab === 0 && analyticsData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.totalEmployees}</p>
            </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <PeopleIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Employees</p>
                  <p className="text-3xl font-bold text-green-600">{analyticsData.activeEmployees}</p>
            </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{analyticsData.attendanceRate.toFixed(1)}%</p>
            </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ScheduleIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Salary</p>
                  <p className="text-3xl font-bold text-yellow-600">₹{analyticsData.averageSalary.toLocaleString()}</p>
            </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <MoneyIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="employees" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attendance" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
          </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.departmentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ department, employeeCount }) => `${department}: ${employeeCount}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="employeeCount"
                    >
                      {analyticsData.departmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
          </div>
        </div>
      </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsData.performanceMetrics.map((metric, index) => {
                const roundedValue = Math.round(metric.value);
                const progressWidth = Math.min(metric.value, 100);
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">{metric.category}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        metric.status === 'excellent' ? 'bg-green-100 text-green-800' :
                        metric.status === 'good' ? 'bg-blue-100 text-blue-800' :
                        metric.status === 'average' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {metric.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{metric.value.toFixed(1)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 relative">
                      <div 
                        className={`h-2 rounded-full absolute top-0 left-0 ${
                          metric.value >= 90 ? 'bg-green-500' :
                          metric.value >= 75 ? 'bg-blue-500' :
                          metric.value >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        role="progressbar"
                        aria-valuenow="0"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label={`${metric.category} progress: ${roundedValue}%`}
                        data-width={progressWidth}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">Target: {metric.target}%</p>
                  </div>
                );
              })}
              </div>
        </div>

          {/* Department Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Department Statistics</h3>
            </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Salary</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.departmentStats.map((dept, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <BusinessIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{dept.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{dept.employeeCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">₹{dept.avgSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{dept.attendanceRate.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          dept.performance >= 80 ? 'bg-green-100 text-green-800' :
                          dept.performance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {dept.performance.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Generated Reports */}
      {selectedTab === 1 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Generated Reports</h2>
            <button
              onClick={fetchReports}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{report.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    report.status === 'completed' ? 'bg-green-100 text-green-800' :
                    report.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                
                <div className="flex items-center mb-4">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    disabled={report.status !== 'completed'}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ViewIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    disabled={report.status !== 'completed'}
                    onClick={() => exportReport(report.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ExportIcon className="h-4 w-4 mr-1" />
                    Export
          </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Report */}
      {selectedTab === 2 && (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Generate New Report</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                id="report-type"
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select report type"
              >
                <option value="">Select report type</option>
                <option value="attendance">Attendance Report</option>
                <option value="payroll">Payroll Report</option>
                <option value="performance">Performance Report</option>
                <option value="assets">Asset Report</option>
                <option value="training">Training Report</option>
                <option value="incidents">Incident Report</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="date-start" className="block text-sm font-medium text-gray-700 mb-2">Date Range Start</label>
              <input
                id="date-start"
                type="date"
                value={reportFilters.dateRange.start}
                onChange={(e) => setReportFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select start date for report"
              />
          </div>
          
            <div>
              <label htmlFor="date-end" className="block text-sm font-medium text-gray-700 mb-2">Date Range End</label>
              <input
                id="date-end"
                type="date"
                value={reportFilters.dateRange.end}
                onChange={(e) => setReportFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select end date for report"
              />
      </div>
      
            <div className="md:col-span-2">
              <button
                onClick={generateReport}
                disabled={!selectedReportType || loading}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AssessmentIcon className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock,
  FileText,
  PieChart,
  LineChart,
  Activity,
  Eye,
  Share2
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface Report {
  id: string;
  name: string;
  type: 'attendance' | 'payroll' | 'performance' | 'recruitment' | 'turnover' | 'training';
  lastGenerated: string;
  status: 'ready' | 'generating' | 'error';
  size: string;
  format: 'pdf' | 'excel' | 'csv';
}

const Reports: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('month');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data - in real app this would come from Firebase
  const reports: Report[] = [
    {
      id: '1',
      name: 'Monthly Attendance Summary',
      type: 'attendance',
      lastGenerated: '2024-02-01',
      status: 'ready',
      size: '2.4 MB',
      format: 'pdf'
    },
    {
      id: '2',
      name: 'Q4 Payroll Report',
      type: 'payroll',
      lastGenerated: '2024-01-15',
      status: 'ready',
      size: '5.1 MB',
      format: 'excel'
    },
    {
      id: '3',
      name: 'Employee Performance Review',
      type: 'performance',
      lastGenerated: '2024-01-20',
      status: 'ready',
      size: '3.2 MB',
      format: 'pdf'
    },
    {
      id: '4',
      name: 'Recruitment Pipeline',
      type: 'recruitment',
      lastGenerated: '2024-02-05',
      status: 'generating',
      size: '1.8 MB',
      format: 'csv'
    },
    {
      id: '5',
      name: 'Annual Turnover Analysis',
      type: 'turnover',
      lastGenerated: '2024-01-10',
      status: 'ready',
      size: '4.7 MB',
      format: 'excel'
    },
    {
      id: '6',
      name: 'Training Completion Report',
      type: 'training',
      lastGenerated: '2024-01-25',
      status: 'ready',
      size: '2.9 MB',
      format: 'pdf'
    }
  ];

  const filteredReports = reports.filter(report => {
    if (selectedReportType !== 'all' && report.type !== selectedReportType) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance': return Clock;
      case 'payroll': return DollarSign;
      case 'performance': return TrendingUp;
      case 'recruitment': return Users;
      case 'turnover': return Activity;
      case 'training': return FileText;
      default: return FileText;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'excel': return 'bg-green-100 text-green-800';
      case 'csv': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const reportTypes = [
    { value: 'all', label: 'All Reports' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'performance', label: 'Performance' },
    { value: 'recruitment', label: 'Recruitment' },
    { value: 'turnover', label: 'Turnover' },
    { value: 'training', label: 'Training' }
  ];

  const dateRanges = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate and manage comprehensive HR reports</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ready to Download</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'ready').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'generating').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => new Date(r.lastGenerated).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Filter by report type"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Filter by date range"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>

            <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'grid' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Reports Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const TypeIcon = getTypeIcon(report.type);
            return (
              <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{report.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{report.type}</p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      getStatusColor(report.status)
                    )}>
                      {report.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-3 h-3 mr-2" />
                      <span>Generated: {report.lastGenerated}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FileText className="w-3 h-3 mr-2" />
                      <span>Size: {report.size}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getFormatColor(report.format)
                      )}>
                        {report.format.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button 
                      className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                      title="View report details"
                      aria-label="View report details"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
                    <button 
                      className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center"
                      title="Download report"
                      aria-label="Download report"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => {
                  const TypeIcon = getTypeIcon(report.type);
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              <TypeIcon className="w-4 h-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{report.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">{report.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getStatusColor(report.status)
                        )}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.lastGenerated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getFormatColor(report.format)
                        )}>
                          {report.format.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            title="View report details"
                            aria-label="View report details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900"
                            title="Download report"
                            aria-label="Download report"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-gray-600 hover:text-gray-900"
                            title="Share report"
                            aria-label="Share report"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or generate a new report.
          </p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Generate First Report
          </button>
        </div>
      )}

      {/* Analytics Preview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <PieChart className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Report Distribution</h4>
            <p className="text-2xl font-bold text-blue-600">6 Types</p>
            <p className="text-xs text-gray-500">Covering all HR areas</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <LineChart className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Generation Trend</h4>
            <p className="text-2xl font-bold text-green-600">+15%</p>
            <p className="text-xs text-gray-500">This month vs last</p>
      </div>
      
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Active Reports</h4>
            <p className="text-2xl font-bold text-purple-600">5</p>
            <p className="text-xs text-gray-500">Ready for download</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

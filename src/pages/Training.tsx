import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Clock, 
  Calendar, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'inactive' | 'completed';
  enrolledCount: number;
  maxCapacity: number;
  startDate: string;
  endDate: string;
  progress?: number;
}

interface TrainingEnrollment {
  id: string;
  employeeName: string;
  courseTitle: string;
  enrollmentDate: string;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped';
  progress: number;
  lastAccessed: string;
}

const Training: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'courses' | 'enrollments' | 'analytics'>('courses');

  // Mock data - in real app this would come from Firebase
  const courses: TrainingCourse[] = [
    {
      id: '1',
      title: 'Leadership Fundamentals',
      description: 'Essential leadership skills for new managers and team leads',
      instructor: 'Dr. Sarah Johnson',
      duration: '8 weeks',
      category: 'Leadership',
      level: 'intermediate',
      status: 'active',
      enrolledCount: 24,
      maxCapacity: 30,
      startDate: '2024-02-15',
      endDate: '2024-04-15'
    },
    {
      id: '2',
      title: 'Advanced Excel for HR',
      description: 'Master Excel functions and formulas for HR data analysis',
      instructor: 'Mike Chen',
      duration: '4 weeks',
      category: 'Technical Skills',
      level: 'advanced',
      status: 'active',
      enrolledCount: 18,
      maxCapacity: 25,
      startDate: '2024-02-20',
      endDate: '2024-03-20'
    },
    {
      id: '3',
      title: 'Communication Skills Workshop',
      description: 'Improve workplace communication and conflict resolution',
      instructor: 'Lisa Rodriguez',
      duration: '2 weeks',
      category: 'Soft Skills',
      level: 'beginner',
      status: 'active',
      enrolledCount: 35,
      maxCapacity: 40,
      startDate: '2024-03-01',
      endDate: '2024-03-15'
    },
    {
      id: '4',
      title: 'HR Compliance Essentials',
      description: 'Understanding labor laws and compliance requirements',
      instructor: 'Attorney David Kim',
      duration: '6 weeks',
      category: 'Compliance',
      level: 'intermediate',
      status: 'active',
      enrolledCount: 22,
      maxCapacity: 30,
      startDate: '2024-02-10',
      endDate: '2024-03-25'
    },
    {
      id: '5',
      title: 'Data Analytics for HR',
      description: 'Introduction to HR analytics and data-driven decision making',
      instructor: 'Dr. Emily Watson',
      duration: '10 weeks',
      category: 'Analytics',
      level: 'advanced',
      status: 'active',
      enrolledCount: 15,
      maxCapacity: 20,
      startDate: '2024-03-01',
      endDate: '2024-05-10'
    }
  ];

  const enrollments: TrainingEnrollment[] = [
    {
      id: '1',
      employeeName: 'John Doe',
      courseTitle: 'Leadership Fundamentals',
      enrollmentDate: '2024-01-15',
      status: 'in-progress',
      progress: 65,
      lastAccessed: '2024-02-01'
    },
    {
      id: '2',
      employeeName: 'Jane Smith',
      courseTitle: 'Advanced Excel for HR',
      enrollmentDate: '2024-01-20',
      status: 'completed',
      progress: 100,
      lastAccessed: '2024-02-15'
    },
    {
      id: '3',
      employeeName: 'Bob Wilson',
      courseTitle: 'Communication Skills Workshop',
      enrollmentDate: '2024-02-01',
      status: 'enrolled',
      progress: 0,
      lastAccessed: '2024-02-01'
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'dropped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-blue-600';
    return 'text-red-600';
  };

  const categories = ['Leadership', 'Technical Skills', 'Soft Skills', 'Compliance', 'Analytics'];
  const levels = ['beginner', 'intermediate', 'advanced'];
  const statuses = ['active', 'inactive', 'completed'];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
          <p className="text-gray-600">Manage training courses, enrollments, and track progress</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((total, course) => total + course.enrolledCount, 0)}
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
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">78%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'courses', name: 'Courses', icon: BookOpen },
            { id: 'enrollments', name: 'Enrollments', icon: Users },
            { id: 'analytics', name: 'Analytics', icon: GraduationCap }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by level"
                >
                  <option value="all">All Levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{course.title}</h3>
                      <p className="text-xs text-gray-500">{course.instructor}</p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      getStatusColor(course.status)
                    )}>
                      {course.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{course.description}</p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium text-gray-900">{course.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Level:</span>
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getLevelColor(course.level)
                      )}>
                        {course.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium text-gray-900">{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Enrolled:</span>
                      <span className="font-medium text-gray-900">
                        {course.enrolledCount}/{course.maxCapacity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Start Date:</span>
                      <span className="font-medium text-gray-900">{course.startDate}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button 
                      className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                      title="View course details"
                      aria-label="View course details"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
                    <button 
                      className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center"
                      title="Edit course"
                      aria-label="Edit course"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria.
              </p>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Add First Course
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Accessed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{enrollment.employeeName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{enrollment.courseTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enrollment.enrollmentDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getEnrollmentStatusColor(enrollment.status)
                      )}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={cn('h-2 rounded-full', getProgressColor(enrollment.progress))}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                        <span className={cn('text-sm font-medium', getProgressColor(enrollment.progress))}>
                          {enrollment.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enrollment.lastAccessed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          title="View enrollment details"
                          aria-label="View enrollment details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          title="Resume course"
                          aria-label="Resume course"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Course Completion by Category</h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollment Trends</h3>
              <div className="space-y-3">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor(Math.random() * 50) + 10}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Training Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Average Completion Rate</h4>
                <p className="text-2xl font-bold text-blue-600">78%</p>
                <p className="text-xs text-gray-500">+5% from last month</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Average Course Duration</h4>
                <p className="text-2xl font-bold text-green-600">6.2 weeks</p>
                <p className="text-xs text-gray-500">-0.8 weeks from last month</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Active Learners</h4>
                <p className="text-2xl font-bold text-purple-600">142</p>
                <p className="text-xs text-gray-500">+12 from last month</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Users, 
  Clock, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import { cn } from '@/utils/cn';
import firebaseService from '@/services/firebaseService';
import { showNotification } from '@/utils/notification';

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

interface Instructor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  experience: string;
  status: 'active' | 'inactive';
  bio: string;
}

const Training: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'courses' | 'enrollments' | 'analytics' | 'instructors'>('courses');
  
  // Firebase data states
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Course Modal States
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showViewCourseModal, setShowViewCourseModal] = useState(false);
  const [showEditInstructorModal, setShowEditInstructorModal] = useState(false);
  const [showViewInstructorModal, setShowViewInstructorModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);
  const [viewingCourse, setViewingCourse] = useState<TrainingCourse | null>(null);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [viewingInstructor, setViewingInstructor] = useState<Instructor | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    instructor: '',
    duration: '',
    category: '',
    level: 'beginner' as const,
    status: 'active' as const,
    maxCapacity: 30,
    startDate: '',
    endDate: ''
  });

  const [newInstructor, setNewInstructor] = useState({
    name: '',
    email: '',
    specialization: '',
    experience: '',
    status: 'active' as const,
    bio: ''
  });

  // Initialize with empty arrays - data will be loaded from Firebase

  // Fetch data from Firebase
  const fetchTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [coursesRes, enrollmentsRes, instructorsRes] = await Promise.all([
        firebaseService.getCollection('trainings'),
        firebaseService.getCollection('trainingEnrollments'),
        firebaseService.getCollection('instructors')
      ]);

      if (coursesRes.success && coursesRes.data) {
        const coursesData = coursesRes.data.map((course: any) => ({
          id: course.id,
          title: course.title || '',
          description: course.description || '',
          instructor: course.instructor || '',
          duration: course.duration || '',
          category: course.category || '',
          level: course.level || 'beginner',
          status: course.status || 'active',
          enrolledCount: course.enrolledCount || 0,
          maxCapacity: course.maxCapacity || 0,
          startDate: course.startDate || '',
          endDate: course.endDate || '',
          progress: course.progress || 0
        }));
        setCourses(coursesData);
      }

             if (enrollmentsRes.success && enrollmentsRes.data) {
         const enrollmentsData = enrollmentsRes.data.map((enrollment: any) => ({
           id: enrollment.id,
           employeeName: enrollment.employeeName || '',
           courseTitle: enrollment.courseTitle || '',
           enrollmentDate: enrollment.enrollmentDate || '',
           status: enrollment.status || 'enrolled',
           progress: enrollment.progress || 0,
           lastAccessed: enrollment.lastAccessed || ''
         }));
         setEnrollments(enrollmentsData);
       }

       if (instructorsRes.success && instructorsRes.data) {
         const instructorsData = instructorsRes.data.map((instructor: any) => ({
           id: instructor.id,
           name: instructor.name || '',
           email: instructor.email || '',
           specialization: instructor.specialization || '',
           experience: instructor.experience || '',
           status: instructor.status || 'active',
           bio: instructor.bio || ''
         }));
         setInstructors(instructorsData);
       }
    } catch (err) {
      console.error('Error fetching training data:', err);
      setError('Failed to load training data');
      showNotification('Error loading training data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  // Handle editing instructor
  const handleEditInstructor = async () => {
    try {
      if (!editingInstructor || !editingInstructor.name || !editingInstructor.email || !editingInstructor.specialization) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      const instructorData = {
        ...editingInstructor,
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('instructors', editingInstructor.id, instructorData);
      
      if (result.success) {
        showNotification('Instructor updated successfully!', 'success');
        setShowEditInstructorModal(false);
        setEditingInstructor(null);
        fetchTrainings(); // Refresh the data
      } else {
        showNotification('Failed to update instructor', 'error');
      }
    } catch (err) {
      console.error('Error updating instructor:', err);
      showNotification('Error updating instructor', 'error');
    }
  };

  // Handle adding new instructor
  const handleAddInstructor = async () => {
    try {
      if (!newInstructor.name || !newInstructor.email || !newInstructor.specialization) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      const instructorData = {
        ...newInstructor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.addDocument('instructors', instructorData);
      
      if (result.success) {
        showNotification('Instructor added successfully!', 'success');
        setShowAddInstructorModal(false);
        setNewInstructor({
          name: '',
          email: '',
          specialization: '',
          experience: '',
          status: 'active',
          bio: ''
        });
        fetchTrainings(); // Refresh the data
      } else {
        showNotification('Failed to add instructor', 'error');
      }
    } catch (err) {
      console.error('Error adding instructor:', err);
      showNotification('Error adding instructor', 'error');
    }
  };

  // Handle editing course
  const handleEditCourse = async () => {
    try {
      if (!editingCourse || !editingCourse.title || !editingCourse.instructor || !editingCourse.category) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      const courseData = {
        ...editingCourse,
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('trainings', editingCourse.id, courseData);
      
      if (result.success) {
        showNotification('Course updated successfully!', 'success');
        setShowEditCourseModal(false);
        setEditingCourse(null);
        fetchTrainings(); // Refresh the data
      } else {
        showNotification('Failed to update course', 'error');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      showNotification('Error updating course', 'error');
    }
  };

  // Handle adding new course
  const handleAddCourse = async () => {
    try {
      if (!newCourse.title || !newCourse.instructor || !newCourse.category) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      const courseData = {
        ...newCourse,
        enrolledCount: 0,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.addDocument('trainings', courseData);
      
      if (result.success) {
        showNotification('Course added successfully!', 'success');
        setShowAddCourseModal(false);
        setNewCourse({
          title: '',
          description: '',
          instructor: '',
          duration: '',
          category: '',
          level: 'beginner',
          status: 'active',
          maxCapacity: 30,
          startDate: '',
          endDate: ''
        });
        fetchTrainings(); // Refresh the data
      } else {
        showNotification('Failed to add course', 'error');
      }
    } catch (err) {
      console.error('Error adding course:', err);
      showNotification('Error adding course', 'error');
    }
  };

  // Generate CSV for export
  const generateCSV = () => {
    const headers = ['Course Title', 'Instructor', 'Category', 'Level', 'Status', 'Duration', 'Enrolled', 'Max Capacity', 'Start Date', 'End Date'];
    const courseRows = courses.map(course => [
      course.title,
      course.instructor,
      course.category,
      course.level,
      course.status,
      course.duration,
      course.enrolledCount,
      course.maxCapacity,
      course.startDate,
      course.endDate
    ]);
    
    const csvContent = [headers, ...courseRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

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
          <button 
            onClick={() => setShowAddCourseModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
          

          <button 
            onClick={() => {
              const csvContent = generateCSV();
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `training-data-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              showNotification('Data exported successfully!', 'success');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
          <button 
            onClick={fetchTrainings}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

             {/* No Data State */}
       {!loading && !error && courses.length === 0 && enrollments.length === 0 && (
         <div className="text-center py-12">
           <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-gray-900 mb-2">No training data available</h3>
           <p className="text-gray-600 mb-6">
             Start by adding your first training course.
           </p>
           <button 
             onClick={() => setShowAddCourseModal(true)}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
           >
             Add First Course
           </button>
         </div>
       )}

      {/* Quick Stats */}
      {!loading && !error && (
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
                             <p className="text-2xl font-bold text-gray-900">
                 {enrollments.length > 0 
                   ? Math.round((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100)
                   : 0}%
               </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
                     {[
             { id: 'courses', name: 'Courses', icon: BookOpen },
             { id: 'enrollments', name: 'Enrollments', icon: Users },
             { id: 'analytics', name: 'Analytics', icon: GraduationCap },
             { id: 'instructors', name: 'Instructors', icon: Users }
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
      {activeTab === 'courses' && !loading && !error && (
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
                       onClick={() => {
                         setViewingCourse(course);
                         setShowViewCourseModal(true);
                       }}
                       className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                       title="View course details"
                       aria-label="View course details"
                     >
                       <Eye className="w-3 h-3 mr-1" />
                       View
                     </button>
                     <button 
                       onClick={() => {
                         setEditingCourse(course);
                         setShowEditCourseModal(true);
                       }}
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
                             <button 
                 onClick={() => setShowAddCourseModal(true)}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 Add First Course
               </button>
            </div>
          )}
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && !loading && !error && (
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
      {activeTab === 'analytics' && !loading && !error && (
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
                           style={{ width: `${enrollments.filter(e => e.status === 'completed').length > 0 ? (enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100 : 0}%` }}
                         />
                       </div>
                       <span className="text-sm font-medium text-gray-900">
                         {enrollments.filter(e => e.status === 'completed').length > 0 ? Math.round((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100) : 0}%
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
                           style={{ width: `${enrollments.length > 0 ? (enrollments.length / 5) * 100 : 0}%` }}
                         />
                       </div>
                       <span className="text-sm font-medium text-gray-900">
                         {enrollments.length}
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
                                 <p className="text-2xl font-bold text-blue-600">
                   {enrollments.length > 0 
                     ? Math.round((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100)
                     : 0}%
                 </p>
                 <p className="text-xs text-gray-500">Current completion rate</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Average Course Duration</h4>
                                 <p className="text-2xl font-bold text-green-600">
                   {courses.length > 0 
                     ? courses.reduce((total, course) => {
                         const duration = parseInt(course.duration) || 0;
                         return total + duration;
                       }, 0) / courses.length
                     : 0} weeks
                 </p>
                 <p className="text-xs text-gray-500">Average course duration</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Active Learners</h4>
                                 <p className="text-2xl font-bold text-purple-600">
                   {enrollments.filter(e => e.status === 'in-progress' || e.status === 'enrolled').length}
                 </p>
                 <p className="text-xs text-gray-500">Currently active learners</p>
              </div>
            </div>
                     </div>
                  </div>
        )}

       {/* Instructors Tab */}
       {activeTab === 'instructors' && !loading && !error && (
         <div className="space-y-6">
           {/* Header */}
           <div className="flex items-center justify-between">
             <h3 className="text-lg font-medium text-gray-900">Manage Instructors</h3>
             <button 
               onClick={() => setShowAddInstructorModal(true)}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
             >
               <Plus className="w-4 h-4" />
               <span>Add Instructor</span>
             </button>
           </div>

           {/* Instructors Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {instructors.map((instructor) => (
               <div key={instructor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-4">
                   <div className="flex items-start justify-between mb-3">
                     <div className="flex-1 min-w-0">
                       <h3 className="text-sm font-medium text-gray-900 truncate">{instructor.name}</h3>
                       <p className="text-xs text-gray-500">{instructor.email}</p>
                     </div>
                     <span className={cn(
                       'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                       instructor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                     )}>
                       {instructor.status}
                     </span>
                   </div>

                   <p className="text-xs text-gray-600 mb-3 line-clamp-2">{instructor.bio}</p>

                   <div className="space-y-2 text-xs">
                     <div className="flex items-center justify-between">
                       <span className="text-gray-500">Specialization:</span>
                       <span className="font-medium text-gray-900">{instructor.specialization}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-gray-500">Experience:</span>
                       <span className="font-medium text-gray-900">{instructor.experience}</span>
                     </div>
                   </div>

                   <div className="mt-4 flex space-x-2">
                     <button 
                       onClick={() => {
                         setViewingInstructor(instructor);
                         setShowViewInstructorModal(true);
                       }}
                       className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                       title="View instructor details"
                       aria-label="View instructor details"
                     >
                       <Eye className="w-3 h-3 mr-1" />
                       View
                     </button>
                     <button 
                       onClick={() => {
                         setEditingInstructor(instructor);
                         setShowEditInstructorModal(true);
                       }}
                       className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center"
                       title="Edit instructor"
                       aria-label="Edit instructor"
                     >
                       <Edit className="w-3 h-3 mr-1" />
                       <span>Edit</span>
                     </button>
                   </div>
                 </div>
               </div>
             ))}
           </div>

           {/* Empty State */}
           {instructors.length === 0 && (
             <div className="text-center py-12">
               <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900 mb-2">No instructors available</h3>
               <p className="text-gray-600 mb-6">
                 Start by adding your first instructor.
               </p>
               <button 
                 onClick={() => setShowAddInstructorModal(true)}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 Add First Instructor
               </button>
             </div>
           )}
         </div>
       )}

               {/* Add Course Modal */}
        {showAddCourseModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Training Course</h2>
                  <p className="text-gray-600 mt-1">Create a new training course for your employees</p>
                </div>
                <button
                  onClick={() => setShowAddCourseModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
                      <input
                        type="text"
                        value={newCourse.title}
                        onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter course title"
                      />
                    </div>

                                                               <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instructor *</label>
                        <select
                          value={newCourse.instructor}
                          onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          aria-label="Select course instructor"
                        >
                          <option value="">Select instructor</option>
                          {instructors.map((instructor) => (
                            <option key={instructor.id} value={instructor.name}>{instructor.name}</option>
                          ))}
                        </select>
                      </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={newCourse.category}
                        onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course category"
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={newCourse.level}
                        onChange={(e) => setNewCourse({...newCourse, level: e.target.value as any})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course level"
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Course Details Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-green-600" />
                    Course Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                      <input
                        type="text"
                        value={newCourse.duration}
                        onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="e.g., 4 weeks, 2 days"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                      <input
                        type="number"
                        value={newCourse.maxCapacity}
                        onChange={(e) => setNewCourse({...newCourse, maxCapacity: parseInt(e.target.value) || 30})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        min="1"
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={newCourse.startDate}
                        onChange={(e) => setNewCourse({...newCourse, startDate: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course start date"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={newCourse.endDate}
                        onChange={(e) => setNewCourse({...newCourse, endDate: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course end date"
                      />
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                    Course Description
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Enter detailed course description..."
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCourse}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Course</span>
                </button>
              </div>
                         </div>
           </div>
         )}

        {/* Edit Course Modal */}
        {showEditCourseModal && editingCourse && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Training Course</h2>
                  <p className="text-gray-600 mt-1">Update course information</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditCourseModal(false);
                    setEditingCourse(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
                      <input
                        type="text"
                        value={editingCourse.title}
                        onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter course title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Instructor *</label>
                      <select
                        value={editingCourse.instructor}
                        onChange={(e) => setEditingCourse({...editingCourse, instructor: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course instructor"
                      >
                        <option value="">Select instructor</option>
                        {instructors.map((instructor) => (
                          <option key={instructor.id} value={instructor.name}>{instructor.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={editingCourse.category}
                        onChange={(e) => setEditingCourse({...editingCourse, category: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course category"
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={editingCourse.level}
                        onChange={(e) => setEditingCourse({...editingCourse, level: e.target.value as any})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course level"
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Course Details Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-green-600" />
                    Course Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                      <input
                        type="text"
                        value={editingCourse.duration}
                        onChange={(e) => setEditingCourse({...editingCourse, duration: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="e.g., 4 weeks, 2 days"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                      <input
                        type="number"
                        value={editingCourse.maxCapacity}
                        onChange={(e) => setEditingCourse({...editingCourse, maxCapacity: parseInt(e.target.value) || 30})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        min="1"
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={editingCourse.startDate}
                        onChange={(e) => setEditingCourse({...editingCourse, startDate: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course start date"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={editingCourse.endDate}
                        onChange={(e) => setEditingCourse({...editingCourse, endDate: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        aria-label="Select course end date"
                      />
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                    Course Description
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editingCourse.description}
                      onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Enter detailed course description..."
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowEditCourseModal(false);
                    setEditingCourse(null);
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCourse}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Update Course</span>
                </button>
              </div>
            </div>
          </div>
                 )}

        {/* View Course Modal */}
        {showViewCourseModal && viewingCourse && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Course Details</h2>
                  <p className="text-gray-600 mt-1">View course information</p>
                </div>
                <button
                  onClick={() => {
                    setShowViewCourseModal(false);
                    setViewingCourse(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                      <p className="text-gray-900 font-medium">{viewingCourse.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                      <p className="text-gray-900 font-medium">{viewingCourse.instructor}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <p className="text-gray-900 font-medium">{viewingCourse.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <span className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                        getLevelColor(viewingCourse.level)
                      )}>
                        {viewingCourse.level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Course Details Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-green-600" />
                    Course Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                      <p className="text-gray-900 font-medium">{viewingCourse.duration}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                      <p className="text-gray-900 font-medium">{viewingCourse.maxCapacity}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <p className="text-gray-900 font-medium">{viewingCourse.startDate}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <p className="text-gray-900 font-medium">{viewingCourse.endDate}</p>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                    Course Description
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <p className="text-gray-900">{viewingCourse.description}</p>
                  </div>
                </div>

                {/* Enrollment Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-600" />
                    Enrollment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currently Enrolled</label>
                      <p className="text-gray-900 font-medium">{viewingCourse.enrolledCount}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <span className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                        getStatusColor(viewingCourse.status)
                      )}>
                        {viewingCourse.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowViewCourseModal(false);
                    setViewingCourse(null);
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewCourseModal(false);
                    setViewingCourse(null);
                    setEditingCourse(viewingCourse);
                    setShowEditCourseModal(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Course</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Instructor Modal */}
        {showAddInstructorModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Instructor</h2>
                  <p className="text-gray-600 mt-1">Add a new instructor to your training program</p>
                </div>
                <button
                  onClick={() => setShowAddInstructorModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={newInstructor.name}
                      onChange={(e) => setNewInstructor({...newInstructor, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter instructor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newInstructor.email}
                      onChange={(e) => setNewInstructor({...newInstructor, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
                    <input
                      type="text"
                      value={newInstructor.specialization}
                      onChange={(e) => setNewInstructor({...newInstructor, specialization: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="e.g., Leadership, Technical Skills"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                    <input
                      type="text"
                      value={newInstructor.experience}
                      onChange={(e) => setNewInstructor({...newInstructor, experience: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="e.g., 5 years, Senior Level"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newInstructor.status}
                      onChange={(e) => setNewInstructor({...newInstructor, status: e.target.value as any})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      aria-label="Select instructor status"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={newInstructor.bio}
                    onChange={(e) => setNewInstructor({...newInstructor, bio: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Enter instructor bio and background..."
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowAddInstructorModal(false)}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddInstructor}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Instructor</span>
                </button>
              </div>
                         </div>
           </div>
         )}

        {/* Edit Instructor Modal */}
        {showEditInstructorModal && editingInstructor && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Instructor</h2>
                  <p className="text-gray-600 mt-1">Update instructor information</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditInstructorModal(false);
                    setEditingInstructor(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={editingInstructor.name}
                      onChange={(e) => setEditingInstructor({...editingInstructor, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter instructor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={editingInstructor.email}
                      onChange={(e) => setEditingInstructor({...editingInstructor, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
                    <input
                      type="text"
                      value={editingInstructor.specialization}
                      onChange={(e) => setEditingInstructor({...editingInstructor, specialization: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="e.g., Leadership, Technical Skills"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                    <input
                      type="text"
                      value={editingInstructor.experience}
                      onChange={(e) => setEditingInstructor({...editingInstructor, experience: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="e.g., 5 years, Senior Level"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editingInstructor.status}
                      onChange={(e) => setEditingInstructor({...editingInstructor, status: e.target.value as any})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      aria-label="Select instructor status"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={editingInstructor.bio}
                    onChange={(e) => setEditingInstructor({...editingInstructor, bio: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Enter instructor bio and background..."
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowEditInstructorModal(false);
                    setEditingInstructor(null);
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditInstructor}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Update Instructor</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Instructor Modal */}
        {showViewInstructorModal && viewingInstructor && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Instructor Details</h2>
                  <p className="text-gray-600 mt-1">View instructor information</p>
                </div>
                <button
                  onClick={() => {
                    setShowViewInstructorModal(false);
                    setViewingInstructor(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <p className="text-gray-900 font-medium">{viewingInstructor.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900 font-medium">{viewingInstructor.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                    <p className="text-gray-900 font-medium">{viewingInstructor.specialization}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                    <p className="text-gray-900 font-medium">{viewingInstructor.experience}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className={cn(
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      viewingInstructor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    )}>
                      {viewingInstructor.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <p className="text-gray-900">{viewingInstructor.bio}</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowViewInstructorModal(false);
                    setViewingInstructor(null);
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewInstructorModal(false);
                    setViewingInstructor(null);
                    setEditingInstructor(viewingInstructor);
                    setShowEditInstructorModal(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Instructor</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default Training;

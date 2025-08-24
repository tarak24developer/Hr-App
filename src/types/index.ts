// Core User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  position: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  avatar: string | null;
  phone: string;
  address: string;
  emergencyContact: EmergencyContact;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
  isActive?: boolean;
  lastLoginAt?: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export type UserRole = 'admin' | 'hr' | 'manager' | 'employee';

// Authentication Types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Employee Types
export interface Employee extends User {
  employeeId: string;
  salary: number;
  managerId?: string;
  subordinates?: string[];
  skills: string[];
  certifications: Certification[];
  performance: PerformanceMetrics;
}

export interface Certification {
  name: string;
  issuer: string;
  dateObtained: string;
  expiryDate?: string;
}

export interface PerformanceMetrics {
  rating: number;
  lastReview: string;
  goals: Goal[];
  achievements: Achievement[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  progress: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  impact: 'low' | 'medium' | 'high';
}

// Attendance Types
export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  location?: Location;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
}

// Leave Types
export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export type LeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other';

// Payroll Types
export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  grossSalary: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
}

export interface Allowance {
  type: string;
  amount: number;
  description?: string;
}

export interface Deduction {
  type: string;
  amount: number;
  description?: string;
}

// Asset Types
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  serialNumber: string;
  assignedTo?: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  location: string;
  description?: string;
}

export type AssetType = 'laptop' | 'phone' | 'furniture' | 'vehicle' | 'equipment' | 'other';

// Training Types
export interface Training {
  id: string;
  title: string;
  type: TrainingType;
  description: string;
  instructor: string;
  startDate: string;
  endDate: string;
  duration: number;
  maxParticipants: number;
  participants: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  materials?: string[];
  assessment?: Assessment;
}

export type TrainingType = 'technical' | 'soft-skills' | 'compliance' | 'leadership' | 'other';

export interface Assessment {
  id: string;
  type: 'quiz' | 'exam' | 'practical' | 'presentation';
  score: number;
  maxScore: number;
  feedback?: string;
}

// Incident Types
export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolvedAt?: string;
  attachments?: string[];
}

export type IncidentType = 'security' | 'safety' | 'harassment' | 'misconduct' | 'other';

// Document Types
export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  fileType: string;
  url: string;
  tags: string[];
  accessLevel: 'public' | 'private' | 'restricted';
  expiryDate?: string;
}

export type DocumentType = 'policy' | 'contract' | 'certificate' | 'report' | 'form' | 'other';

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  senderId?: string;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'reminder';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox' | 'radio';
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: ValidationRule[];
  placeholder?: string;
  defaultValue?: any;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// Theme Types
export interface Theme {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  borderRadius: number;
  fontSize: 'small' | 'medium' | 'large';
}

// Settings Types
export interface UserSettings {
  theme: Theme;
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: NotificationType[];
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'team-only';
  locationSharing: boolean;
  activityTracking: boolean;
}

// User Tracking Types
export interface UserTrackingData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  loginTime?: string;
  logoutTime?: string;
  lastActivity?: string;
  totalDistance: number;
  currentLocation?: Location;
  deviceInfo?: DeviceInfo;
  isActive: boolean;
  department: string;
  position: string;
}

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
  language: string;
  userAgent: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

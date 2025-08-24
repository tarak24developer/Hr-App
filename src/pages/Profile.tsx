import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Edit, 
  Save, 
  X, 
  Camera,
  Shield,
  Bell,
  Key,
  Trash2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUser } from '@/stores/authStore';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  department: string;
  position: string;
  employeeId: string;
  startDate: string;
}

const Profile: React.FC = () => {
  const user = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    dateOfBirth: '1990-01-01',
    department: 'Engineering',
    position: 'Senior Developer',
    employeeId: 'EMP001',
    startDate: '2020-01-15'
  });

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // In real app, this would save to Firebase
    console.log('Saving profile data:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      dateOfBirth: '1990-01-01',
      department: 'Engineering',
      position: 'Senior Developer',
      employeeId: 'EMP001',
      startDate: '2020-01-15'
    });
    setIsEditing(false);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'preferences', name: 'Preferences', icon: Key }
  ] as const;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                  {avatarFile ? (
                    <img
                      src={URL.createObjectURL(avatarFile)}
                      alt="Profile avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-gray-600">{formData.position}</p>
                <p className="text-sm text-gray-500">{formData.department}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                                 <input
                   type="text"
                   value={formData.firstName}
                   onChange={(e) => handleInputChange('firstName', e.target.value)}
                   disabled={!isEditing}
                   aria-label="First Name"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                                 <input
                   type="text"
                   value={formData.lastName}
                   onChange={(e) => handleInputChange('lastName', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Last Name"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Email
                 </label>
                 <input
                   type="email"
                   value={formData.email}
                   onChange={(e) => handleInputChange('email', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Email"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Phone
                 </label>
                 <input
                   type="tel"
                   value={formData.phone}
                   onChange={(e) => handleInputChange('phone', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Phone"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Date of Birth
                 </label>
                 <input
                   type="date"
                   value={formData.dateOfBirth}
                   onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Date of Birth"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
             </div>
           </div>

           {/* Address Information */}
           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Street Address
                 </label>
                 <input
                   type="text"
                   value={formData.address}
                   onChange={(e) => handleInputChange('address', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Street Address"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   City
                 </label>
                 <input
                   type="text"
                   value={formData.city}
                   onChange={(e) => handleInputChange('city', e.target.value)}
                   disabled={!isEditing}
                   aria-label="City"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   State
                 </label>
                 <input
                   type="text"
                   value={formData.state}
                   onChange={(e) => handleInputChange('state', e.target.value)}
                   disabled={!isEditing}
                   aria-label="State"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   ZIP Code
                 </label>
                 <input
                   type="text"
                   value={formData.zipCode}
                   onChange={(e) => handleInputChange('zipCode', e.target.value)}
                   disabled={!isEditing}
                   aria-label="ZIP Code"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
             </div>
           </div>

           {/* Employment Information */}
           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Employee ID
                 </label>
                 <input
                   type="text"
                   value={formData.employeeId}
                   onChange={(e) => handleInputChange('employeeId', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Employee ID"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Start Date
                 </label>
                 <input
                   type="date"
                   value={formData.startDate}
                   onChange={(e) => handleInputChange('startDate', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Start Date"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Department
                 </label>
                 <input
                   type="text"
                   value={formData.department}
                   onChange={(e) => handleInputChange('department', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Department"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Position
                 </label>
                 <input
                   type="text"
                   value={formData.position}
                   onChange={(e) => handleInputChange('position', e.target.value)}
                   disabled={!isEditing}
                   aria-label="Position"
                   className={cn(
                     'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                     isEditing 
                       ? 'border-gray-300' 
                       : 'border-gray-200 bg-gray-50 text-gray-500'
                   )}
                 />
               </div>
             </div>
           </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Change Password</h4>
                <p className="text-sm text-gray-600">Update your password regularly for security</p>
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Change
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Enable
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Login Sessions</h4>
                <p className="text-sm text-gray-600">Manage your active login sessions</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-600">Receive push notifications in the app</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-600">Receive notifications via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Language</h4>
                <p className="text-sm text-gray-600">Choose your preferred language</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Time Zone</h4>
                <p className="text-sm text-gray-600">Set your local time zone</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC-6 (Central Time)</option>
                <option>UTC-7 (Mountain Time)</option>
                <option>UTC-8 (Pacific Time)</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Date Format</h4>
                <p className="text-sm text-gray-600">Choose your preferred date format</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

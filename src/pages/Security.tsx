import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Users,
  Eye,
  Key,
  Activity,
  Database
} from 'lucide-react';

interface SecurityData {
  activeSessions: number;
  failedLogins: number;
  securityAlerts: number;
  lastBackup: string;
  systemStatus: 'secure' | 'warning' | 'critical';
  lastSecurityScan: string;
  firewallStatus: 'active' | 'inactive';
  encryptionStatus: 'enabled' | 'disabled';
}

const Security: React.FC = () => {
  const [securityData, setSecurityData] = useState<SecurityData>({
    activeSessions: 0,
    failedLogins: 0,
    securityAlerts: 0,
    lastBackup: '',
    systemStatus: 'secure',
    lastSecurityScan: '',
    firewallStatus: 'active',
    encryptionStatus: 'enabled'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading security data
    const timer = setTimeout(() => {
      setSecurityData({
        activeSessions: 12,
        failedLogins: 3,
        securityAlerts: 1,
        lastBackup: '2024-01-15 14:30 UTC',
        systemStatus: 'secure',
        lastSecurityScan: '2024-01-15 12:00 UTC',
        firewallStatus: 'active',
        encryptionStatus: 'enabled'
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSecurityAction = async (action: string) => {
    try {
      console.log(`Security action ${action} executed`);
      // Here you would make actual API calls
    } catch (err) {
      console.error(`Failed to execute security action ${action}:`, err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading Security Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
                    Monitor system security, access controls, and threat detection
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Active Sessions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {securityData.activeSessions}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Currently logged in</p>
              </div>
            </div>
          </div>

              {/* Failed Logins */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Logins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {securityData.failedLogins}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">Last 24 hours</p>
              </div>
            </div>
          </div>

              {/* Security Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Alerts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {securityData.securityAlerts}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Requires attention</p>
              </div>
            </div>
          </div>

              {/* System Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Status</p>
                <div className="flex items-center mt-1">
                  {getStatusIcon(securityData.systemStatus)}
                  <span className={`ml-2 text-sm font-medium px-2 py-1 rounded-full border ${getStatusColor(securityData.systemStatus)}`}>
                    {securityData.systemStatus}
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">All systems operational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Security Controls */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white ml-3">
                          Security Controls
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleSecurityAction('backup')}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Create Backup
                  <span className="block text-sm font-normal opacity-75">Coming Soon</span>
                </button>
                
                <button
                  onClick={() => handleSecurityAction('audit')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Run Security Audit
                  <span className="block text-sm font-normal opacity-75">Coming Soon</span>
                </button>
                
                <button
                  onClick={() => handleSecurityAction('update')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Update Security
                  <span className="block text-sm font-normal opacity-75">Coming Soon</span>
                </button>
                
                <button
                  onClick={() => handleSecurityAction('monitor')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Monitor Activity
                  <span className="block text-sm font-normal opacity-75">Coming Soon</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div className="space-y-6">
              {/* Last Backup */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Last Backup</h3>
              </div>
              <div className="text-center py-4">
                <Settings className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                          {securityData.lastBackup || 'No backup available'}
                </p>
              </div>
            </div>

            {/* Security Scan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Last Security Scan</h3>
              </div>
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {securityData.lastSecurityScan || 'No scan available'}
                </p>
              </div>
            </div>

            {/* Firewall Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Firewall Status</h3>
              </div>
              <div className="text-center py-4">
                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  securityData.firewallStatus === 'active' 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-red-100 dark:bg-red-900'
                }`}>
                  <Shield className={`w-6 h-6 ${
                    securityData.firewallStatus === 'active' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <p className={`text-sm font-medium ${
                  securityData.firewallStatus === 'active' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {securityData.firewallStatus === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            {/* Encryption Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Encryption Status</h3>
              </div>
              <div className="text-center py-4">
                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  securityData.encryptionStatus === 'enabled' 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-red-100 dark:bg-red-900'
                }`}>
                  <Key className={`w-6 h-6 ${
                    securityData.encryptionStatus === 'enabled' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <p className={`text-sm font-medium ${
                  securityData.encryptionStatus === 'enabled' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {securityData.encryptionStatus === 'enabled' ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Activity className="w-6 h-6 text-gray-600 dark:text-gray-400 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Security Activity
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Security scan completed successfully
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    2 hours ago • No threats detected
                  </p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Failed login attempt detected
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    4 hours ago • IP: 192.168.1.100
                  </p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    System backup completed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    6 hours ago • 2.3 GB backed up
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security; 
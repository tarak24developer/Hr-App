import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Package,
  Monitor,
  Smartphone,
  Printer,
  Car,
  UserCheck,
  MapPin,
  Wrench,
  CheckCircle,
  X,
  Download,
  User,
  DollarSign,
  AlertCircle,
  Search,
  Filter,
  User as UserIcon,
  Badge,
  Calendar as CalendarIcon,
  Clock as ClockIcon
} from 'lucide-react';
import { cn } from '../utils/cn';
import firebaseService from '../services/firebaseService';
import { showNotification } from '../utils/notification';
import DashboardCard from '../components/DashboardCard';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface Asset {
  id: string;
  name: string;
  category: 'computer' | 'mobile' | 'printer' | 'furniture' | 'vehicle' | 'other';
  serialNumber: string;
  model: string;
  manufacturer: string;
  purchaseDate: any;
  purchasePrice: number;
  currentValue: number;
  status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'lost';
  assignedTo?: string;
  location: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  warrantyExpiry?: any | null;
  description?: string;
  supplier?: string;
  supplierContact?: string;
  tags?: string[];
  notes?: string;
  imageUrl?: string;
  maintenanceHistory?: MaintenanceRecord[];
  depreciationRate?: number;
  createdAt: any;
  updatedAt: any;
}

interface MaintenanceRecord {
  id: string;
  date: any;
  type: 'preventive' | 'repair' | 'upgrade' | 'inspection';
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate?: any;
}

const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    condition: '',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'computer' as Asset['category'],
    serialNumber: '',
    model: '',
    manufacturer: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    status: 'available' as Asset['status'],
    assignedTo: '',
    location: '',
    condition: 'excellent' as Asset['condition'],
    warrantyExpiry: '',
    description: '',
    supplier: '',
    supplierContact: '',
    notes: '',
    depreciationRate: ''
  });

  // Firebase integration functions
  const fetchAssets = async () => {
    try {
      setAssetsLoading(true);
      const result = await firebaseService.getCollection('assets');
      if (result.success) {
        setAssets(result.data as Asset[] || []);
      } else {
        showNotification('Failed to fetch assets', 'error');
        setAssets([]);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      showNotification('Error fetching assets', 'error');
      setAssets([]);
    } finally {
      setAssetsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const result = await firebaseService.getCollection('users');
      if (result.success) {
        setUsers(result.data as User[] || []);
      } else {
        showNotification('Failed to fetch users', 'error');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Error fetching users', 'error');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchUsers();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         asset.serialNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
                         asset.model.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || asset.category === filters.category;
    const matchesStatus = !filters.status || asset.status === filters.status;
    const matchesCondition = !filters.condition || asset.condition === filters.condition;
    const matchesLocation = !filters.location || asset.location === filters.location;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCondition && matchesLocation;
  });

  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getTotalAssets = () => {
    return assets.length;
  };

  const getAvailableAssets = () => {
    return assets.filter(asset => asset.status === 'available');
  };

  const getAssignedAssets = () => {
    return assets.filter(asset => asset.status === 'assigned');
  };

  const getMaintenanceAssets = () => {
    return assets.filter(asset => asset.status === 'maintenance');
  };

  const getTotalValue = () => {
    return assets.reduce((total, asset) => total + asset.currentValue, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getCategoryIcon = (category: Asset['category']) => {
    switch (category) {
      case 'computer':
        return <Monitor className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'printer':
        return <Printer className="w-4 h-4" />;
      case 'vehicle':
        return <Car className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', asset?: Asset) => {
    setDialogMode(mode);
    if (asset) {
      setSelectedAsset(asset);
      setAssetForm({
        name: asset.name,
        category: asset.category,
        serialNumber: asset.serialNumber,
        model: asset.model,
        manufacturer: asset.manufacturer,
        purchaseDate: formatDate(asset.purchaseDate),
        purchasePrice: asset.purchasePrice.toString(),
        currentValue: asset.currentValue.toString(),
        status: asset.status,
        assignedTo: asset.assignedTo || '',
        location: asset.location,
        condition: asset.condition,
        warrantyExpiry: formatDate(asset.warrantyExpiry),
        description: asset.description || '',
        supplier: asset.supplier || '',
        supplierContact: asset.supplierContact || '',
        notes: asset.notes || '',
        depreciationRate: asset.depreciationRate?.toString() || ''
      });
    } else {
      setSelectedAsset(null);
      setAssetForm({
        name: '',
        category: 'computer',
        serialNumber: '',
        model: '',
        manufacturer: '',
        purchaseDate: '',
        purchasePrice: '',
        currentValue: '',
        status: 'available',
        assignedTo: '',
        location: '',
        condition: 'excellent',
        warrantyExpiry: '',
        description: '',
        supplier: '',
        supplierContact: '',
        notes: '',
        depreciationRate: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAsset(null);
    setAssetForm({
      name: '',
      category: 'computer',
      serialNumber: '',
      model: '',
      manufacturer: '',
      purchaseDate: '',
      purchasePrice: '',
      currentValue: '',
      status: 'available',
      assignedTo: '',
      location: '',
      condition: 'excellent',
      warrantyExpiry: '',
      description: '',
      supplier: '',
      supplierContact: '',
      notes: '',
      depreciationRate: ''
    });
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name || !assetForm.serialNumber || !assetForm.model || !assetForm.manufacturer) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const assetData = {
        ...assetForm,
        purchasePrice: parseFloat(assetForm.purchasePrice),
        currentValue: parseFloat(assetForm.currentValue),
        purchaseDate: new Date(assetForm.purchaseDate),
        warrantyExpiry: assetForm.warrantyExpiry ? new Date(assetForm.warrantyExpiry) : null,
        depreciationRate: assetForm.depreciationRate ? parseFloat(assetForm.depreciationRate) : 0,
        tags: [],
        maintenanceHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (dialogMode === 'add') {
        const result = await firebaseService.addDocument('assets', assetData);
        if (result.success) {
          showNotification('Asset added successfully!', 'success');
          fetchAssets();
        } else {
          showNotification('Failed to add asset', 'error');
        }
      } else if (dialogMode === 'edit' && selectedAsset) {
        const result = await firebaseService.updateDocument('assets', selectedAsset.id, assetData);
        if (result.success) {
          showNotification('Asset updated successfully!', 'success');
          fetchAssets();
        } else {
          showNotification('Failed to update asset', 'error');
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving asset:', error);
      showNotification('Error saving asset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        const result = await firebaseService.deleteDocument('assets', assetId);
        if (result.success) {
          showNotification('Asset deleted successfully!', 'success');
          fetchAssets();
        } else {
          showNotification('Failed to delete asset', 'error');
        }
      } catch (error) {
        console.error('Error deleting asset:', error);
        showNotification('Error deleting asset', 'error');
      }
    }
  };

  const handleStatusChange = async (assetId: string, newStatus: string) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      const result = await firebaseService.updateDocument('assets', assetId, updateData);
      if (result.success) {
        showNotification(`Asset status updated to ${newStatus}`, 'success');
        fetchAssets();
      } else {
        showNotification('Failed to update asset status', 'error');
      }
    } catch (error) {
      console.error('Error updating asset status:', error);
      showNotification('Error updating asset status', 'error');
    }
  };

  // Loading state
  if (assetsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading asset data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600">Manage company assets, track assignments, and monitor maintenance</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => handleOpenDialog('add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
          <button 
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard
          name="Total Assets"
          value={getTotalAssets()}
          icon={Package}
          color="blue"
        />
        <DashboardCard
          name="Available"
          value={getAvailableAssets().length}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          name="Assigned"
          value={getAssignedAssets().length}
          icon={UserCheck}
          color="yellow"
        />
        <DashboardCard
          name="Maintenance"
          value={getMaintenanceAssets().length}
          icon={Wrench}
          color="indigo"
        />
        <DashboardCard
          name="Total Value"
          value={formatCurrency(getTotalValue())}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      {assets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              {(filters.category || filters.status || filters.condition || filters.location) && (
                <button
                  onClick={() => setFilters({ search: '', category: '', status: '', condition: '', location: '' })}
                  className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="computer">Computer</option>
                    <option value="mobile">Mobile</option>
                    <option value="printer">Printer</option>
                    <option value="furniture">Furniture</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={filters.condition}
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Conditions</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Locations</option>
                    {Array.from(new Set(assets.map(asset => asset.location))).map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assets Table */}
      {assets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAssets.map((asset) => {
                  const assignedUser = users.find(u => u.id === asset.assignedTo);
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              {getCategoryIcon(asset.category)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            <div className="text-sm text-gray-500">{asset.serialNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {asset.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                          asset.status === 'available' ? 'bg-green-100 text-green-800' :
                          asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          asset.status === 'retired' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        )}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignedUser?.name || 'Unassigned'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignedUser?.department || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{asset.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(asset.currentValue)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Condition: {asset.condition}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenDialog('view', asset)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDialog('edit', asset)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <select
                            value={asset.status}
                            onChange={(e) => handleStatusChange(asset.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                            <option value="lost">Lost</option>
                          </select>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* No Results */}
      {filteredAssets.length === 0 && assets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
          <p className="text-gray-500">Try adjusting your search or filter parameters</p>
        </div>
      )}

      {/* Empty State */}
      {assets.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Assets Yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first asset to get started with asset management</p>
          <button
            onClick={() => handleOpenDialog('add')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Asset</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredAssets.length > rowsPerPage && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.ceil(filteredAssets.length / rowsPerPage) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg",
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(Math.ceil(filteredAssets.length / rowsPerPage), currentPage + 1))}
              disabled={currentPage === Math.ceil(filteredAssets.length / rowsPerPage)}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit/View Modal */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseDialog}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {dialogMode === 'view' ? (
              // View Mode - New Design
              <div className="p-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Eye className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Asset Details</h3>
                  </div>
                  <button
                    onClick={handleCloseDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Asset Details Content */}
                <div className="space-y-6">
                  {/* Asset Header */}
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">{assetForm.name}</h4>
                      <p className="text-gray-600">{assetForm.serialNumber}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          assetForm.status === 'available' ? "bg-green-100 text-green-800" :
                          assetForm.status === 'assigned' ? "bg-blue-100 text-blue-800" :
                          assetForm.status === 'maintenance' ? "bg-yellow-100 text-yellow-800" :
                          assetForm.status === 'retired' ? "bg-gray-100 text-gray-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {assetForm.status.charAt(0).toUpperCase() + assetForm.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">{assetForm.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Asset Name</p>
                            <p className="text-sm text-gray-600">{assetForm.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Badge className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Category</p>
                            <p className="text-sm text-gray-600">{assetForm.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Monitor className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Serial Number</p>
                            <p className="text-sm text-gray-600">{assetForm.serialNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Model</p>
                            <p className="text-sm text-gray-600">{assetForm.model}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Financial Information</h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Purchase Price</p>
                            <p className="text-sm text-gray-600">₹{assetForm.purchasePrice}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Current Value</p>
                            <p className="text-sm text-gray-600">₹{assetForm.currentValue}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Purchase Date</p>
                            <p className="text-sm text-gray-600">{assetForm.purchaseDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <ClockIcon className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Depreciation Rate</p>
                            <p className="text-sm text-gray-600">{assetForm.depreciationRate}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment & Location Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Assignment & Location</h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Assigned To</p>
                            <p className="text-sm text-gray-600">
                              {assetForm.assignedTo ? 
                                users.find(u => u.id === assetForm.assignedTo)?.name || 'Unknown' : 
                                'Unassigned'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Location</p>
                            <p className="text-sm text-gray-600">{assetForm.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Status & Condition</h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Status</p>
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                              assetForm.status === 'available' ? "bg-green-100 text-green-800" :
                              assetForm.status === 'assigned' ? "bg-blue-100 text-blue-800" :
                              assetForm.status === 'maintenance' ? "bg-yellow-100 text-yellow-800" :
                              assetForm.status === 'retired' ? "bg-gray-100 text-gray-800" :
                              "bg-red-100 text-red-800"
                            )}>
                              {assetForm.status.charAt(0).toUpperCase() + assetForm.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Condition</p>
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                              assetForm.condition === 'excellent' ? "bg-green-100 text-green-800" :
                              assetForm.condition === 'good' ? "bg-blue-100 text-blue-800" :
                              assetForm.condition === 'fair' ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            )}>
                              {assetForm.condition.charAt(0).toUpperCase() + assetForm.condition.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Additional Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Manufacturer</span>
                          <span className="text-sm text-gray-900">{assetForm.manufacturer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Supplier</span>
                          <span className="text-sm text-gray-900">{assetForm.supplier || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Warranty Expiry</span>
                          <span className="text-sm text-gray-900">{assetForm.warrantyExpiry || '—'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Supplier Contact</span>
                          <span className="text-sm text-gray-900">{assetForm.supplierContact || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  {assetForm.description && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Description</h5>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">{assetForm.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Notes Section */}
                  {assetForm.notes && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Notes</h5>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">{assetForm.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                  <button
                    onClick={handleCloseDialog}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Add/Edit Mode - Original Design
              <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                {dialogMode === 'add' && <Plus className="w-5 h-5" />}
                {dialogMode === 'edit' && <Edit className="w-5 h-5" />}
                <span>
                      {dialogMode === 'add' ? 'Add New Asset' : 'Edit Asset'}
                </span>
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                  <input
                    type="text"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, category: e.target.value as Asset['category'] }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="computer">Computer</option>
                    <option value="mobile">Mobile</option>
                    <option value="printer">Printer</option>
                    <option value="furniture">Furniture</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={assetForm.model}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, model: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={assetForm.manufacturer}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={assetForm.purchaseDate}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                  <input
                    type="number"
                    value={assetForm.purchasePrice}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                  <input
                    type="number"
                    value={assetForm.currentValue}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, currentValue: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, status: e.target.value as Asset['status'] }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select
                    value={assetForm.assignedTo}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={assetForm.location}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, location: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, condition: e.target.value as Asset['condition'] }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={assetForm.warrantyExpiry}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={assetForm.supplier}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, supplier: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Contact</label>
                  <input
                    type="text"
                    value={assetForm.supplierContact}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, supplierContact: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation Rate (%)</label>
                  <input
                    type="number"
                    value={assetForm.depreciationRate}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, depreciationRate: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={assetForm.description}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, description: e.target.value }))}
                    disabled={false}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={assetForm.notes}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={false}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                    Cancel
              </button>
                <button
                  onClick={handleSaveAsset}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>Save</span>
                </button>
                </div>
              </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;

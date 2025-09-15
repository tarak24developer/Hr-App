import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Package,
  Tag,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Download,
  DollarSign,
  AlertCircle,
  Search,
  Filter,
  X,
  FileText
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

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  description: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  assignedTo?: string;
  location: string;
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  condition: 'new' | 'good' | 'fair' | 'poor';
  dateAdded: any;
  lastUpdated: any;
  lastAudit?: any;
  supplier: string;
  supplierContact: string;
  warrantyExpiry?: any | null;
  tags: string[];
  notes: string;
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
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

  const [inventoryForm, setInventoryForm] = useState({
    name: '',
    category: '',
    sku: '',
    description: '',
    quantity: '',
    minQuantity: '',
    maxQuantity: '',
    unit: '',
    unitPrice: '',
    assignedTo: '',
    location: '',
    status: 'active' as InventoryItem['status'],
    condition: 'new' as InventoryItem['condition'],
    supplier: '',
    supplierContact: '',
    warrantyExpiry: '',
    tags: '',
    notes: ''
  });

  // Firebase integration functions
  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const result = await firebaseService.getCollection('inventory');
      if (result.success) {
        setInventory(result.data as InventoryItem[] || []);
      } else {
        showNotification('Failed to fetch inventory', 'error');
        setInventory([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showNotification('Error fetching inventory', 'error');
      setInventory([]);
    } finally {
      setInventoryLoading(false);
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
    fetchInventory();
    fetchUsers();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         item.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
                         item.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || item.category === filters.category;
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesCondition = !filters.condition || item.condition === filters.condition;
    const matchesLocation = !filters.location || item.location === filters.location;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCondition && matchesLocation;
  });

  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getTotalItems = () => {
    return inventory.length;
  };

  const getActiveItems = () => {
    return inventory.filter(item => item.status === 'active');
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= item.minQuantity);
  };

  const getOutOfStockItems = () => {
    return inventory.filter(item => item.status === 'out_of_stock');
  };

  const getTotalValue = () => {
    return inventory.reduce((total, item) => total + item.totalValue, 0);
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

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', item?: InventoryItem) => {
    setDialogMode(mode);
    if (item) {
      setSelectedItem(item);
      setInventoryForm({
        name: item.name,
        category: item.category,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity.toString(),
        minQuantity: item.minQuantity.toString(),
        maxQuantity: item.maxQuantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        assignedTo: item.assignedTo || '',
        location: item.location,
        status: item.status,
        condition: item.condition,
        supplier: item.supplier,
        supplierContact: item.supplierContact,
        warrantyExpiry: formatDate(item.warrantyExpiry),
        tags: item.tags.join(', '),
        notes: item.notes
      });
    } else {
      setSelectedItem(null);
      setInventoryForm({
        name: '',
        category: '',
        sku: '',
        description: '',
        quantity: '',
        minQuantity: '',
        maxQuantity: '',
        unit: '',
        unitPrice: '',
        assignedTo: '',
        location: '',
        status: 'active',
        condition: 'new',
        supplier: '',
        supplierContact: '',
        warrantyExpiry: '',
        tags: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setInventoryForm({
      name: '',
      category: '',
      sku: '',
      description: '',
      quantity: '',
      minQuantity: '',
      maxQuantity: '',
      unit: '',
      unitPrice: '',
      assignedTo: '',
      location: '',
      status: 'active',
      condition: 'new',
      supplier: '',
      supplierContact: '',
      warrantyExpiry: '',
      tags: '',
      notes: ''
    });
  };

  const handleSaveItem = async () => {
    if (!inventoryForm.name || !inventoryForm.sku || !inventoryForm.category || !inventoryForm.quantity) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const quantity = parseFloat(inventoryForm.quantity);
      const unitPrice = parseFloat(inventoryForm.unitPrice);
      const totalValue = quantity * unitPrice;
      
      const itemData = {
        ...inventoryForm,
        quantity: quantity,
        minQuantity: parseFloat(inventoryForm.minQuantity),
        maxQuantity: parseFloat(inventoryForm.maxQuantity),
        unitPrice: unitPrice,
        totalValue: totalValue,
        dateAdded: new Date(),
        lastUpdated: new Date(),
        warrantyExpiry: inventoryForm.warrantyExpiry ? new Date(inventoryForm.warrantyExpiry) : null,
        tags: inventoryForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (dialogMode === 'add') {
        const result = await firebaseService.addDocument('inventory', itemData);
        if (result.success) {
          showNotification('Inventory item added successfully!', 'success');
          fetchInventory();
        } else {
          showNotification('Failed to add inventory item', 'error');
        }
      } else if (dialogMode === 'edit' && selectedItem) {
        const result = await firebaseService.updateDocument('inventory', selectedItem.id, itemData);
        if (result.success) {
          showNotification('Inventory item updated successfully!', 'success');
          fetchInventory();
        } else {
          showNotification('Failed to update inventory item', 'error');
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      showNotification('Error saving inventory item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const result = await firebaseService.deleteDocument('inventory', itemId);
        if (result.success) {
          showNotification('Inventory item deleted successfully!', 'success');
          fetchInventory();
        } else {
          showNotification('Failed to delete inventory item', 'error');
        }
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        showNotification('Error deleting inventory item', 'error');
      }
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      const updateData = {
        status: newStatus,
        lastUpdated: new Date()
      };

      const result = await firebaseService.updateDocument('inventory', itemId, updateData);
      if (result.success) {
        showNotification(`Inventory item status updated to ${newStatus}`, 'success');
        fetchInventory();
      } else {
        showNotification('Failed to update inventory item status', 'error');
      }
    } catch (error) {
      console.error('Error updating inventory item status:', error);
      showNotification('Error updating inventory item status', 'error');
    }
  };

  // Loading state
  if (inventoryLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage company inventory items</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => handleOpenDialog('add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
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
          name="Total Items"
          value={getTotalItems()}
          icon={Package}
          color="blue"
        />
        <DashboardCard
          name="Active Items"
          value={getActiveItems().length}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          name="Low Stock"
          value={getLowStockItems().length}
          icon={AlertTriangle}
          color="yellow"
        />
        <DashboardCard
          name="Out of Stock"
          value={getOutOfStockItems().length}
          icon={AlertCircle}
          color="red"
        />
        <DashboardCard
          name="Total Value"
          value={formatCurrency(getTotalValue())}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      {inventory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search inventory..."
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
                    {Array.from(new Set(inventory.map(item => item.category))).map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="out_of_stock">Out of Stock</option>
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
                    <option value="new">New</option>
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
                    {Array.from(new Set(inventory.map(item => item.location))).map(location => (
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

      {/* Inventory Table */}
      {inventory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {paginatedInventory.map((item) => {
                  const isLowStock = item.quantity <= item.minQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.sku}</div>
                        <div className="text-sm text-gray-500">{item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.quantity}</div>
                        {isLowStock && (
                          <div className="text-sm text-yellow-600 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                          item.status === 'active' ? 'bg-green-100 text-green-800' :
                          item.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          item.status === 'discontinued' ? 'bg-red-100 text-red-800' :
                          'bg-red-100 text-red-800'
                        )}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{item.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.totalValue)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(item.unitPrice)} per {item.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenDialog('view', item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDialog('edit', item)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="discontinued">Discontinued</option>
                            <option value="out_of_stock">Out of Stock</option>
                          </select>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
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
      {filteredInventory.length === 0 && inventory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
          <p className="text-gray-500">Try adjusting your search or filter parameters</p>
        </div>
      )}

      {/* Empty State */}
      {inventory.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Inventory Items Yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first inventory item to get started with inventory management</p>
          <button
            onClick={() => handleOpenDialog('add')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Item</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredInventory.length > rowsPerPage && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.ceil(filteredInventory.length / rowsPerPage) }, (_, i) => i + 1).map((page) => (
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
              onClick={() => setCurrentPage(Math.min(Math.ceil(filteredInventory.length / rowsPerPage), currentPage + 1))}
              disabled={currentPage === Math.ceil(filteredInventory.length / rowsPerPage)}
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
              // View Mode - grouped sections, read-only
              <div className="p-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Eye className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Item Details</h3>
                  </div>
                  <button
                    onClick={handleCloseDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Item Details Content */}
                <div className="space-y-6">
                  {/* Item Header */}
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-xl">
                        {inventoryForm.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">{inventoryForm.name}</h4>
                      <p className="text-gray-600">{inventoryForm.sku}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          parseFloat(inventoryForm.quantity) <= parseFloat(inventoryForm.minQuantity) ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        )}>
                          {parseFloat(inventoryForm.quantity) <= parseFloat(inventoryForm.minQuantity) ? 'Low Stock' : 'In Stock'}
                        </span>
                        <span className="text-sm text-gray-500">{inventoryForm.category}</span>
                        <span className="text-sm text-gray-500">Qty: {inventoryForm.quantity}</span>
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
                            <p className="text-sm font-medium text-gray-900">Item Name</p>
                            <p className="text-sm text-gray-600">{inventoryForm.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">SKU</p>
                            <p className="text-sm text-gray-600">{inventoryForm.sku}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Tag className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Category</p>
                            <p className="text-sm text-gray-600">{inventoryForm.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Unit</p>
                            <p className="text-sm text-gray-600">{inventoryForm.unit}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Information */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Quantity Information</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Current Quantity</span>
                          <span className="text-sm text-gray-900">{inventoryForm.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Min Quantity</span>
                          <span className="text-sm text-gray-900">{inventoryForm.minQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Max Quantity</span>
                          <span className="text-sm text-gray-900">{inventoryForm.maxQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Reorder Level</span>
                          <span className="text-sm text-gray-900">{inventoryForm.minQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Status</span>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            parseFloat(inventoryForm.quantity) <= parseFloat(inventoryForm.minQuantity) ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          )}>
                            {parseFloat(inventoryForm.quantity) <= parseFloat(inventoryForm.minQuantity) ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  {inventoryForm.description && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Description</h5>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">{inventoryForm.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Additional Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Location</span>
                          <span className="text-sm text-gray-900">{inventoryForm.location || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Supplier</span>
                          <span className="text-sm text-gray-900">{inventoryForm.supplier || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Unit Price</span>
                          <span className="text-sm text-gray-900">₹{inventoryForm.unitPrice || '0'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Total Value</span>
                          <span className="text-sm text-gray-900">₹{(parseFloat(inventoryForm.quantity) * parseFloat(inventoryForm.unitPrice)).toFixed(2) || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Warranty Expiry</span>
                          <span className="text-sm text-gray-900">{inventoryForm.warrantyExpiry || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Assigned To</span>
                          <span className="text-sm text-gray-900">
                            {inventoryForm.assignedTo ? 
                              users.find(u => u.id === inventoryForm.assignedTo)?.name || '—' : 
                              '—'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Condition</span>
                          <span className="text-sm text-gray-900 capitalize">{inventoryForm.condition || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Tags</span>
                          <span className="text-sm text-gray-900">
                            {inventoryForm.tags ? 
                              inventoryForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag).join(', ') || '—' : 
                              '—'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Notes</span>
                          <span className="text-sm text-gray-900">{inventoryForm.notes || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  {dialogMode === 'add' ? 'Add New Item' : 'Edit Item'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                value={inventoryForm.name}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                value={inventoryForm.sku}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={inventoryForm.category}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={inventoryForm.unit}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={inventoryForm.quantity}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
                  <input
                    type="number"
                    value={inventoryForm.minQuantity}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, minQuantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Quantity</label>
                  <input
                    type="number"
                    value={inventoryForm.maxQuantity}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, maxQuantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    value={inventoryForm.unitPrice}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={inventoryForm.status}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, status: e.target.value as InventoryItem['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={inventoryForm.condition}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, condition: e.target.value as InventoryItem['condition'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select
                    value={inventoryForm.assignedTo}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, assignedTo: e.target.value }))}
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
                    value={inventoryForm.location}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={inventoryForm.supplier}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Contact</label>
                  <input
                    type="text"
                    value={inventoryForm.supplierContact}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, supplierContact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={inventoryForm.warrantyExpiry}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={inventoryForm.tags}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={inventoryForm.description}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={inventoryForm.notes}
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, notes: e.target.value }))}
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
                onClick={handleSaveItem}
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

export default Inventory;

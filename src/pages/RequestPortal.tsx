import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface Request {
  id: string;
  title: string;
  description: string;
  type: 'leave' | 'expense' | 'equipment' | 'support' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  attachments: string[];
  comments: RequestComment[];
  approvalWorkflow: ApprovalStep[];
}

interface RequestComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  isInternal: boolean;
}

interface ApprovalStep {
  id: string;
  step: number;
  approverName: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  processedAt?: Date;
}

const RequestPortal: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Mock data for development
  const mockRequests: Request[] = [
    {
      id: '1',
      title: 'Annual Leave Request',
      description: 'Requesting 5 days of annual leave for vacation',
      type: 'leave',
      status: 'pending',
      priority: 'medium',
      requesterId: '1',
      requesterName: 'John Doe',
      requesterEmail: 'john.doe@company.com',
      assignedTo: 'HR Manager',
      createdAt: new Date('2024-01-15T10:30:00'),
      updatedAt: new Date('2024-01-15T10:30:00'),
      dueDate: new Date('2024-01-20T17:00:00'),
      attachments: [],
      comments: [
        {
          id: '1',
          content: 'Leave request submitted for review',
          authorId: '1',
          authorName: 'John Doe',
          createdAt: new Date('2024-01-15T10:30:00'),
          isInternal: false
        }
      ],
      approvalWorkflow: [
        {
          id: '1',
          step: 1,
          approverName: 'Direct Manager',
          approverId: 'mgr1',
          status: 'pending'
        },
        {
          id: '2',
          step: 2,
          approverName: 'HR Manager',
          approverId: 'hr1',
          status: 'pending'
        }
      ]
    },
    {
      id: '2',
      title: 'New Laptop Request',
      description: 'Current laptop is running slow and needs replacement',
      type: 'equipment',
      status: 'approved',
      priority: 'high',
      requesterId: '2',
      requesterName: 'Jane Smith',
      requesterEmail: 'jane.smith@company.com',
      assignedTo: 'IT Manager',
      createdAt: new Date('2024-01-12T09:15:00'),
      updatedAt: new Date('2024-01-14T16:30:00'),
      dueDate: new Date('2024-01-20T17:00:00'),
      completedAt: new Date('2024-01-14T16:30:00'),
      attachments: ['laptop_specs.pdf'],
      comments: [
        {
          id: '2',
          content: 'Laptop request approved. MacBook Pro ordered.',
          authorId: 'it1',
          authorName: 'IT Manager',
          createdAt: new Date('2024-01-14T16:30:00'),
          isInternal: false
        }
      ],
      approvalWorkflow: [
        {
          id: '3',
          step: 1,
          approverName: 'Direct Manager',
          approverId: 'mgr2',
          status: 'approved',
          comments: 'Performance issues confirmed',
          processedAt: new Date('2024-01-13T14:00:00')
        },
        {
          id: '4',
          step: 2,
          approverName: 'IT Manager',
          approverId: 'it1',
          status: 'approved',
          comments: 'MacBook Pro 16" approved',
          processedAt: new Date('2024-01-14T16:30:00')
        }
      ]
    }
  ];

  useEffect(() => {
    // Load mock data
    setRequests(mockRequests);
  }, []);

  const handleCreateRequest = () => {
    setSelectedRequest(null);
    setIsViewMode(false);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setIsViewMode(true);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (requestId: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    setSnackbar({
      open: true,
      message: 'Request deleted successfully',
      severity: 'success'
    });
  };

  const handleApproveRequest = (requestId: string) => {
    setRequests(prev => prev.map(req =>
      req.id === requestId
        ? { ...req, status: 'approved', completedAt: new Date(), updatedAt: new Date() }
        : req
    ));
    setSnackbar({
      open: true,
      message: 'Request approved successfully',
      severity: 'success'
    });
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => prev.map(req =>
      req.id === requestId
        ? { ...req, status: 'rejected', updatedAt: new Date() }
        : req
    ));
    setSnackbar({
      open: true,
      message: 'Request rejected',
      severity: 'warning'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_review':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'leave':
        return 'Leave Request';
      case 'expense':
        return 'Expense Reimbursement';
      case 'equipment':
        return 'Equipment Request';
      case 'support':
        return 'IT Support';
      case 'other':
        return 'Other Request';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Request Portal</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and track all your requests</p>
          </div>
          <button
            onClick={handleCreateRequest}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Submit Request
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {requests.filter(req => req.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {requests.filter(req => req.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Review</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {requests.filter(req => req.status === 'in_review').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {request.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {getRequestTypeLabel(request.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.requesterName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {request.requesterEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {request.createdAt.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                          title="View Details"
                          aria-label="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded"
                              title="Approve"
                              aria-label="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                              title="Reject"
                              aria-label="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                          title="Delete Request"
                          aria-label="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Request Details Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {isViewMode ? 'Request Details' : isCreateMode ? 'Submit New Request' : 'Edit Request'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Close"
                    aria-label="Close"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {selectedRequest && (
                  <div className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Request Information</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedRequest.title}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{getRequestTypeLabel(selectedRequest.type)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedRequest.description}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedRequest.status.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Approval Workflow</h4>
                        <div className="space-y-3">
                          {selectedRequest.approvalWorkflow.map((step, index) => (
                            <div key={step.id} className="flex items-center space-x-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                step.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : step.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{step.approverName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {step.status === 'pending' ? 'Pending' : 
                                   step.status === 'approved' ? 'Approved' : 'Rejected'}
                                </p>
                                {step.comments && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{step.comments}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {selectedRequest.comments.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Comments</h4>
                        <div className="space-y-3">
                          {selectedRequest.comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{comment.authorName}</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {comment.createdAt.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Snackbar */}
        {snackbar.open && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`px-6 py-3 rounded-lg shadow-lg text-white ${
              snackbar.severity === 'success' ? 'bg-green-600' :
              snackbar.severity === 'error' ? 'bg-red-600' :
              snackbar.severity === 'warning' ? 'bg-yellow-600' :
              'bg-blue-600'
            }`}>
              {snackbar.message}
              <button
                onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
                className="ml-4 text-white hover:text-gray-200"
                title="Close"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestPortal;

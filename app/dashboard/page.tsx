"use client";

import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, CheckCircle, XCircle, Clock, Users, FileText, QrCode, LogOut, LogIn, Trash2, Printer, Undo2 } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ReturnButton from '@/components/ReturnButton';
import { useCountUp } from '@/lib/useCountUp';

// Types based on OpenAPI spec
interface StatusHistoryItem {
  status: string;
  changed_at: string;
  changed_by: string;
}

interface GatePass {
  id: string;
  number: string;
  person_name: string;
  description: string;
  created_by: string;
  is_returnable: boolean;
  status: string;
  status_history: StatusHistoryItem[];
  created_at: string;
  approved_at?: string | null;
  exit_photo_id?: string | null;
  return_photo_id?: string | null;
  exit_time?: string | null;
  return_time?: string | null;
  qr_code_url?: string | null;
}

interface GatePassCreate {
  person_name: string;
  description: string;
  is_returnable: boolean;
}

// Production API Base URL
const API_BASE = 'https://gatepass-api.cushtello.shop';
// const API_BASE = 'http://localhost:8000';


// API Service Layer with error handling
const api = {
  // Admin endpoints
  admin: {
    getPending: async (): Promise<GatePass[]> => {
      const res = await fetch(`${API_BASE}/admin/gatepass/pending`);
      if (!res.ok) throw new Error('Failed to fetch pending gatepasses');
      return res.json();
    },
    getAll: async (status?: string): Promise<GatePass[]> => {
      const url = status ? `${API_BASE}/hr/gatepass/list?status=${status}` : `${API_BASE}/hr/gatepass/list`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch all gatepasses');
      return res.json();
    },
    approve: async (passNumber: string, name: string): Promise<GatePass> => {
      const res = await fetch(`${API_BASE}/admin/gatepass/${passNumber}/approve?name=${encodeURIComponent(name)}`, { 
        method: 'POST' 
      });
      if (!res.ok) throw new Error('Failed to approve gatepass');
      return res.json();
    },
    reject: async (passNumber: string, name: string): Promise<GatePass> => {
      const res = await fetch(`${API_BASE}/admin/gatepass/${passNumber}/reject?name=${encodeURIComponent(name)}`, { 
        method: 'POST' 
      });
      if (!res.ok) throw new Error('Failed to reject gatepass');
      return res.json();
    },
    delete: async (passNumber: string, name: string): Promise<GatePass> => {
      const res = await fetch(`${API_BASE}/admin/gatepass/${passNumber}/delete?name=${encodeURIComponent(name)}`, { 
        method: 'POST' 
      });
      if (!res.ok) throw new Error('Failed to delete gatepass');
      return res.json();
    }
  },
  // HR endpoints
  hr: {
    create: async (data: GatePassCreate): Promise<GatePass> => {
      const res = await fetch(`${API_BASE}/hr/gatepass/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create gatepass');
      return res.json();
    },
    list: async (status?: string): Promise<GatePass[]> => {
      const url = status ? `${API_BASE}/hr/gatepass/list?status=${status}` : `${API_BASE}/hr/gatepass/list`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch gatepasses');
      return res.json();
    },
    print: async (passNumber: string) => {
      window.open(`${API_BASE}/hr/gatepass/${passNumber}/print`, '_blank');
    }
  },
  // Gate endpoints
  gate: {
    getByNumber: async (passNumber: string): Promise<GatePass> => {
      const res = await fetch(`${API_BASE}/gate/gatepass/number/${passNumber}`);
      if (!res.ok) throw new Error('Failed to fetch gatepass');
      return res.json();
    },
    scanExit: async (passNumber: string, file: File): Promise<GatePass> => {
      const formData = new FormData();
      formData.append('pass_number', passNumber);
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/gate/scan-exit`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to scan exit');
      return res.json();
    },
    scanReturn: async (passNumber: string, file: File): Promise<GatePass> => {
      const formData = new FormData();
      formData.append('pass_number', passNumber);
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/gate/scan-return`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to scan return');
      return res.json();
    }
  }
};

const INITIAL_STATS = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  completed: 0,
  returned: 0,
  pending_return: 0,
}

export function useInitialStats(gatePasses: GatePass[]) {
  const hasRun = useRef(false)
  const [stats, setStats] = useState(INITIAL_STATS)

  useEffect(() => {
    if (hasRun.current) return
    if (!gatePasses || gatePasses.length === 0) return

    const result = { ...INITIAL_STATS }

    for (const p of gatePasses) {
      result.total++
      if (p.status in result) {
        // @ts-ignore
        result[p.status]++
      }
    }

    setStats(result)
    hasRun.current = true
  }, [gatePasses])

  return stats
}

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    pending_return: 'bg-blue-100 text-blue-800 border-blue-300',
    returned: 'bg-green-100 text-green-800 border-green-300',
    completed: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// KPI Card Component
const KPICard: React.FC<{
  title: string
  value: number
  icon: React.ReactNode
  color: string
}> = ({ title, value, icon, color }) => {

  const animatedValue = useCountUp(value)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {animatedValue}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}


// Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

// Main Dashboard Component
const GatePassDashboard: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'hr' | 'gate'>('admin');
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(30);
  const ITEMS_PER_PAGE = 25;

  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem("role"));
  }, []);

  // Form state for HR create
  const [formData, setFormData] = useState<GatePassCreate>({
    person_name: '',
    description: '',
    is_returnable: false
  });
  
  useEffect(() => {
    loadData();
    setDisplayCount(30); // Reset pagination when filters change
  }, [role, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: GatePass[] = [];
    
        // Use real API
        if (role === 'admin') {
          if (selectedStatus === 'all' || !selectedStatus) {
            data = await api.admin.getAll();
          } else {
            data = await api.admin.getAll(selectedStatus);
          }
        } else if (role === 'hr') {
          if (selectedStatus === 'all' || !selectedStatus) {
            data = await api.hr.list();
          } else {
            data = await api.hr.list(selectedStatus);
          }
        } else if (role === 'gate') {
          data = await api.admin.getAll(); // Gate can see all for recent scans
        
      }
      setGatePasses(data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      // Fallback to mock data on error
    } finally {
      setLoading(false);
    }
  };

  const filteredPasses = selectedStatus === 'all' 
    ? gatePasses 
    : gatePasses.filter(p => p.status === selectedStatus);

  const displayedPasses = filteredPasses.slice(0, displayCount);
  const hasMore = displayCount < filteredPasses.length;
  const remainingCount = filteredPasses.length - displayCount;

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredPasses.length));
  };

  const stats = {
    total: gatePasses.length,
    pending: gatePasses.filter(p => p.status === 'pending').length,
    approved: gatePasses.filter(p => p.status === 'approved').length,
    rejected: gatePasses.filter(p => p.status === 'rejected').length,
    completed: gatePasses.filter(p => ['completed'].includes(p.status)).length,
    returned: gatePasses.filter(p => p.status === 'returned').length,
    pending_return: gatePasses.filter(p => p.status === 'pending_return').length
  };

  const stats_gatepasses = useInitialStats(gatePasses);


  const statusDistribution = [
    { name: 'Pending', value: stats.pending, color: '#fbbf24' },
    { name: 'Approved', value: stats.approved, color: '#10b981' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
    { name: 'Active', value: stats.completed, color: '#3b82f6' },
    { name: 'Returned', value: stats.returned, color: '#059669' }
  ];

// Calculate daily trend from actual gatepass data (last 7 days)
const dailyTrend = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 13);
    
    // Initialize trend data for 7 days
    const trendData = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: 0,
        dateObj: date
      };
    });
    
    // Count gatepasses for each day
    for (const pass of gatePasses) {
      const createdDate = new Date(pass.created_at);
      createdDate.setHours(0, 0, 0, 0);
      
      // Stop processing if the gatepass is older than 7 days for efficiency
      if (createdDate < sevenDaysAgo) {
        continue;
      }
      
      // Find matching day in trend data
      const dayIndex = trendData.findIndex(day => 
        day.dateObj.getTime() === createdDate.getTime()
      );
      
      if (dayIndex !== -1) {
        trendData[dayIndex].count++;
      }
    }
    
    // Remove dateObj before returning (only used for comparison)
    return trendData.map(({ date, count }) => ({ date, count }));
  })();

  const handleAction = async (pass: GatePass, action: 'approve' | 'reject' | 'delete') => {
    setSelectedPass(pass);
    setActionType(action);
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedPass || !actionType) return;

    setLoading(true);
    setError(null);
    try {
      let updatedPass: GatePass;
      
      // Call real API
      if (actionType === 'approve') {
        updatedPass = await api.admin.approve(selectedPass.number, username || 'admin');
      } else if (actionType === 'reject') {
        updatedPass = await api.admin.reject(selectedPass.number, username || 'admin');
      } else {
        updatedPass = await api.admin.delete(selectedPass.number, username || 'admin');
      }
      
      // Update local state with response
      setGatePasses(prev => prev.map(p => 
        p.id === selectedPass.id ? updatedPass : p
      ));
      
      setShowActionModal(false);
      setSelectedPass(null);
      setActionType(null);
    } catch (error) {
      console.error('Error performing action:', error);
      setError(error instanceof Error ? error.message : 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (scanType: 'exit' | 'return') => {
    if (!qrInput.trim()) {
      setError('Please enter a gate pass number');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Fetch gate pass details
      const pass = await api.gate.getByNumber(qrInput.trim());
      setSelectedPass(pass);
      
      // Note: In a real implementation, you would also need to handle photo capture
      // For now, this just fetches the pass details
      
      setQrInput('');
    } catch (error) {
      console.error('Error scanning QR:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan gate pass');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Fetching Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gate Pass Management</h1>
            </div>
            
            <div className="flex items-center space-x-4">
            <ReturnButton />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="admin">Admin</option>
                <option value="gate">Gate</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Dashboard */}
        {role === 'admin' && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <KPICard title="Total" value={stats_gatepasses.total} icon={<FileText className="w-6 h-6 text-gray-600" />} color="bg-gray-100" />
              <KPICard title="Pending" value={stats_gatepasses.pending} icon={<Clock className="w-6 h-6 text-yellow-600" />} color="bg-yellow-100" />
              <KPICard title="Approved" value={stats_gatepasses.approved} icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} color="bg-emerald-100" />
              <KPICard title="Rejected" value={stats_gatepasses.rejected} icon={<XCircle className="w-6 h-6 text-red-600" />} color="bg-red-100" />
              <KPICard title="Completed" value={stats_gatepasses.completed} icon={<Users className="w-6 h-6 text-blue-600" />} color="bg-blue-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <KPICard title="Pending Return" value={stats_gatepasses.pending_return} icon={<Undo2 className="w-6 h-6 text-red-600" />} color="bg-red-100" />
              <KPICard title="Returned Gate Passes" value={stats_gatepasses.returned} icon={<CheckCircle className="w-6 h-6 text-green-600" />} color="bg-green-100" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trend (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Gate Passes" fill='#10b181' fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6 rounded-xl bg-gradient-to-r from-slate-50 to-white px-6 py-4 shadow-sm border border-slate-200 flex justify-center items-center">
  <h3 className="text-2xl font-semibold text-slate-800 tracking-tight text-center">
    Gatepass History
  </h3>
</div>

              <div className="flex justify-center items-center mb-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-20 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 bg-emerald-100 hover:bg-emerald-200"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>   
                  <option value="rejected">Rejected</option> 
                  <option value="returned">Returned</option>
                  <option value="pending_return">Pending Return</option>
                  <option value="completed">Completed</option>

                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                    <th className="text-left py-4 pl-2 pr-20 text-sm font-semibold text-gray-700 whitespace-nowrap">Pass Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Person</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                      <th className="text-left py-3 pl-5 pr-30 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Returnable</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedPasses.map((pass) => (
                      <tr key={pass.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm font-medium text-gray-900">{pass.number}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{pass.person_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{pass.description}</td>
                        <td className="py-3 px-4"><StatusBadge status={pass.status} /></td>
                        <td className="py-3 px-4 text-sm text-gray-600">{pass.is_returnable ? 'Yes' : 'No'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{new Date(pass.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end space-x-2">
                            {pass.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAction(pass, 'approve')}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleAction(pass, 'reject')}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleAction(pass, 'delete')}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {hasMore && (
                <div className="mt-6 flex flex-col items-center space-y-3">
                  <div className="text-sm text-gray-600">
                    Showing {displayedPasses.length} of {filteredPasses.length} gate passes
                    <span className="text-gray-500 ml-2">({remainingCount} more)</span>
                  </div>
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Load More ({Math.min(ITEMS_PER_PAGE, remainingCount)} items)</span>
                  </button>
                </div>
              )}

              {!hasMore && filteredPasses.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-600">
                  Showing all {filteredPasses.length} gate passes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gate Dashboard */}
        {role === 'gate' && (
          <div className="space-y-6">

            {/* Recent Scans */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6 rounded-xl bg-gradient-to-r from-slate-50 to-white px-6 py-4 shadow-sm border border-slate-200 flex justify-center items-center">
  <h3 className="text-2xl font-semibold text-slate-800 tracking-tight text-center">
    Recent Scan History
  </h3>
</div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pass Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Person</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Exit Time</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Return Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedPasses.filter(p => p.exit_time).map((pass) => (
                      <tr key={pass.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{pass.number}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{pass.person_name}</td>
                        <td className="py-3 px-4"><StatusBadge status={pass.status} /></td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                            {pass.exit_time ? new Date(new Date(pass.exit_time).getTime() + 5 * 60 * 60 * 1000).toLocaleString(): '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {pass.return_time ? new Date(new Date(pass.return_time).getTime() + 5 * 60 * 60 * 1000).toLocaleString(): '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Recent Scans */}
              {hasMore && gatePasses.filter(p => p.exit_time).length > displayCount && (
                <div className="mt-6 flex flex-col items-center space-y-3">
                  <div className="text-sm text-gray-600">
                    Showing {displayedPasses.filter(p => p.exit_time).length} of {gatePasses.filter(p => p.exit_time).length} recent scans
                  </div>
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      <Modal isOpen={showActionModal} onClose={() => setShowActionModal(false)}>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Confirm {actionType === 'approve' ? 'Approval' : actionType === 'reject' ? 'Rejection' : 'Deletion'}
          </h3>
          
          {selectedPass && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Pass Number</p>
              <p className="text-lg font-semibold text-gray-900">{selectedPass.number}</p>
              <p className="text-sm text-gray-600 mt-2">Person</p>
              <p className="text-gray-900">{selectedPass.person_name}</p>
            </div>
          )}

          <p className="text-gray-700 mb-6">
            Are you sure you want to {actionType} this gate pass?
            {actionType === 'delete' && ' This action cannot be undone.'}
          </p>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowActionModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                actionType === 'approve' 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : actionType === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GatePassDashboard;
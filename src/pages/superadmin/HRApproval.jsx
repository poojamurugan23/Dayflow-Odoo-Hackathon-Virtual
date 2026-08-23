import { useState, useEffect } from 'react';
import API_BASE, { getAvatarUrl } from '../../lib/api';
import { UserCheck, XCircle, CheckCircle, Clock } from 'lucide-react';

export function SuperAdminHRApproval() {
  const [pendingHRs, setPendingHRs] = useState([]);
  const [approvedHRs, setApprovedHRs] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores ID of HR being approved
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPendingHRs = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      
      // Filter for HRs that are not approved
      const pending = data.filter(u => u.role === 'hr' && !u.is_approved);
      const approved = data.filter(u => u.role === 'hr' && u.is_approved);
      setPendingHRs(pending);
      setApprovedHRs(approved);
    } catch (err) {
      setError('Could not load pending HR requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingHRs();
  }, []);

  const handleApprove = async (hrId) => {
    setActionLoading(hrId);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/auth/approve-hr`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ hrId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to approve HR');
      
      setSuccess(`Successfully approved HR. Generated Login ID: ${data.login_id}`);
      fetchPendingHRs();
    } catch (err) {
      setError(err.message); if (err.message === 'HR is already approved') { fetchPendingHRs(); }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#502D55] border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">HR Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">Review and approve new HR manager registrations.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'pending' ? 'bg-white text-[#502D55] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Pending Requests ({pendingHRs.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-[#502D55] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Approval History ({approvedHRs.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 p-4 border border-green-100 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {pendingHRs.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No Pending Approvals</h3>
              <p className="mt-1 text-sm text-gray-500">All HR registrations have been processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pendingHRs.map((hr) => (
                    <tr key={hr._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img src={getAvatarUrl(hr)} alt={hr.name} className="h-10 w-10 rounded-full object-cover shadow-sm border border-gray-100 bg-gray-50" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{hr.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{hr.login_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hr.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hr.email}</div>
                        <div className="text-xs text-gray-500">{hr.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(hr.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApprove(hr._id)}
                          disabled={actionLoading === hr._id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#502D55] text-white text-sm font-medium rounded-lg hover:bg-[#935073] transition-colors disabled:opacity-50"
                        >
                          {actionLoading === hr._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {approvedHRs.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No History Available</h3>
              <p className="mt-1 text-sm text-gray-500">There are no approved HR registrations yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {approvedHRs.map((hr) => (
                    <tr key={hr._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img src={getAvatarUrl(hr)} alt={hr.name} className="h-10 w-10 rounded-full object-cover shadow-sm border border-gray-100 bg-gray-50" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{hr.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{hr.login_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hr.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hr.email}</div>
                        <div className="text-xs text-gray-500">{hr.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(hr.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wider">
                          <CheckCircle size={14} /> Approved
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

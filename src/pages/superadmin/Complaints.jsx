import { useState, useEffect } from 'react';
import API_BASE from '../../lib/api';
import { MessageSquareWarning, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';

export function SuperAdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active'); // 'Active' or 'Resolved'

  // Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateStatus = async (status) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/complaints/${selectedComplaint._id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status, admin_notes: adminNotes })
      });

      if (response.ok) {
        fetchComplaints();
        setSelectedComplaint(null);
      }
    } catch (error) {
      console.error('Failed to update complaint:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredComplaints = filter === 'Active' 
    ? complaints.filter(c => !['Resolved', 'Rejected'].includes(c.status))
    : complaints.filter(c => ['Resolved', 'Rejected'].includes(c.status));

  if (loading) {
    return <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#502D55] border-t-transparent"></div>
    </div>;
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Complaints & Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and resolve issues reported by employees and HRs.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setFilter('Active')}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${filter === 'Active' ? 'bg-white text-[#502D55] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Active Tickets
          </button>
          <button 
            onClick={() => setFilter('Resolved')}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${filter === 'Resolved' ? 'bg-white text-[#502D55] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Resolved History
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredComplaints.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-100">
            <MessageSquareWarning className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No Complaints Found</h3>
            <p className="mt-1 text-sm text-gray-500">There are no tickets matching this filter.</p>
          </div>
        ) : (
          filteredComplaints.map(complaint => (
            <div 
              key={complaint._id}
              onClick={() => {
                setSelectedComplaint(complaint);
                setAdminNotes(complaint.admin_notes || '');
              }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#502D55] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </span>
                <div className="flex items-center text-xs text-gray-400 gap-1">
                  <Clock size={12} />
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">{complaint.subject}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                {complaint.description}
              </p>
              
              <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-xs">
                  {complaint.user_id?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">{complaint.user_id?.name || 'Unknown User'}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{complaint.user_id?.role} • {complaint.user_id?.login_id}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail & Resolve Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-serif">{selectedComplaint.subject}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Reported by {selectedComplaint.user_id?.name} on {new Date(selectedComplaint.createdAt).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedComplaint.description}
                </div>
              </div>

              {selectedComplaint.generated_letter_url && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Attached Document</h4>
                  <a 
                    href={selectedComplaint.generated_letter_url} 
                    download={`Complaint_${selectedComplaint._id}.pdf`}
                    className="inline-flex items-center gap-2 text-sm text-[#502D55] hover:text-[#935073] font-medium bg-[#502D55]/10 px-4 py-2 rounded-lg"
                  >
                    Download Letter PDF
                  </a>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Admin Notes (Visible to user)</h4>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add resolution notes or request more info..."
                  disabled={['Resolved', 'Rejected'].includes(selectedComplaint.status)}
                  className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#502D55] focus:border-transparent outline-none h-32 text-sm ${['Resolved', 'Rejected'].includes(selectedComplaint.status) ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 justify-end">
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
              >
                Close
              </button>
              
              {!['Resolved', 'Rejected'].includes(selectedComplaint.status) && (
                <>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('In Progress')}
                    className="px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
                  >
                    Mark In Progress
                  </button>
                  
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('Rejected')}
                    className="px-5 py-2.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-xl transition-colors"
                  >
                    Reject
                  </button>

                  <button 
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('Resolved')}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Resolve Ticket
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

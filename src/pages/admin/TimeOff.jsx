import { useState, useEffect } from 'react';
import API_BASE from '../../lib/api';
import { Check, X, Search, Plus, Calendar, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';

const LEAVE_TYPES = ['Paid time off', 'Sick Leave', 'Unpaid Leaves'];

export function AdminTimeOff() {
  const [activeTab, setActiveTab] = useState('timeoff'); // 'timeoff' | 'allocation'
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showToast, setShowToast] = useState(null);

  // New Request Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [newForm, setNewForm] = useState({ employeeId: '', leaveType: 'Paid time off', startDate: '', endDate: '', reason: '' });

  // Reject Modal
  const [rejectModal, setRejectModal] = useState(null); // holds leave._id
  const [rejectComment, setRejectComment] = useState('');

  const allocations = employees.map(emp => {
    let paidUsed = 0;
    let sickUsed = 0;
    
    leaves.forEach(l => {
      if (l.employee_id?._id === emp._id && l.status === 'Approved') {
        const days = Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1;
        if (l.leave_type === 'Paid time off' || l.leave_type === 'Paid Leave') paidUsed += days;
        if (l.leave_type === 'Sick leave' || l.leave_type === 'Sick Leave') sickUsed += days;
      }
    });

    return {
      id: emp._id,
      empName: emp.name,
      empId: emp.login_id || emp.employeeId || 'N/A',
      paidAllocated: emp.paid_leave_allocated || 24,
      paidUsed,
      sickAllocated: emp.sick_leave_allocated || 7,
      sickUsed
    };
  });
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocForm, setAllocForm] = useState({ employeeId: '', paidDays: 24, sickDays: 7 });
  const [allocLoading, setAllocLoading] = useState(false);

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  const getToken = () => localStorage.getItem('dayflow_token');

  // ── Fetch all leave requests + employee list ──────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaveRes, empRes] = await Promise.all([
        fetch(`${API_BASE}/api/data/timeoff`, { headers: { 'Authorization': `Bearer ${getToken()}` } }),
        fetch(`${API_BASE}/api/data/employees`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      ]);
      if (leaveRes.ok) setLeaves(await leaveRes.json());
      if (empRes.ok) {
        const emps = await empRes.json();
        setEmployees(emps);
        if (emps.length > 0 && !newForm.employeeId) {
          setNewForm(f => ({ ...f, employeeId: emps[0]._id }));
          setAllocForm(f => ({ ...f, employeeId: emps[0]._id }));
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Approve / Reject ─────────────────────────────────────
  const handleUpdateStatus = async (id, status, comment = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/data/timeoff/${id}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, review_comment: comment })
      });
      if (res.ok) {
        toast(status === 'Approved' ? '✓ Time off request approved.' : '✗ Time off request rejected.');
        setRejectModal(null);
        setRejectComment('');
        fetchData();
      } else {
        const err = await res.json();
        toast(`Error: ${err.message}`);
      }
    } catch {
      toast('Failed to update status.');
    }
  };

  // ── Remove / Delete ──────────────────────────────────────
  const handleRemove = async (id) => {
    if (!window.confirm('Remove this time off record?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/data/timeoff/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) { toast('Time off record removed.'); fetchData(); }
      else toast('Failed to remove.');
    } catch { toast('Failed to remove.'); }
  };

  // ── Create new Time Off on behalf of employee ────────────
  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newForm.employeeId || !newForm.startDate || !newForm.endDate) {
      toast('Please fill all required fields.'); return;
    }
    setNewLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/data/timeoff`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: newForm.employeeId,
          type: newForm.leaveType,
          startDate: newForm.startDate,
          endDate: newForm.endDate,
          reason: newForm.reason || `${newForm.leaveType} - Created by Admin`
        })
      });
      if (res.ok) {
        toast('Time off request created successfully.');
        setShowNewModal(false);
        setNewForm({ employeeId: employees[0]?._id || '', leaveType: 'Paid time off', startDate: '', endDate: '', reason: '' });
        fetchData();
      } else {
        const err = await res.json();
        toast(`Error: ${err.message}`);
      }
    } catch { toast('Failed to create time off.'); }
    finally { setNewLoading(false); }
  };

  // ── Create Allocation ────────────────────────────────────
  const handleAllocSubmit = async (e) => {
    e.preventDefault();
    if (!allocForm.employeeId) { toast('Select an employee.'); return; }
    setAllocLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/data/employees/${allocForm.employeeId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paid_leave_allocated: Number(allocForm.paidDays) || 24,
          sick_leave_allocated: Number(allocForm.sickDays) || 7
        })
      });
      
      if (res.ok) {
        toast('Leave allocation updated.');
        setShowAllocModal(false);
        fetchData();
      } else {
        const err = await res.json();
        toast(`Error: ${err.message}`);
      }
    } catch (err) {
      toast('Failed to update allocation.');
    } finally {
      setAllocLoading(false);
    }
  };

  // ── Filter ───────────────────────────────────────────────
  const filteredLeaves = leaves.filter(l => {
    // Show all valid requests
    if (!l.employee_id) return false;

    if (!search) return true;
    const name = (l.employee_id?.name || '').toLowerCase();
    const id = (l.employee_id?.login_id || '').toLowerCase();
    const type = (l.type || '').toLowerCase();
    const s = search.toLowerCase();
    return name.includes(s) || id.includes(s) || type.includes(s);
  });

  const statusBadge = (status) => {
    if (status === 'Approved') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700"><CheckCircle size={11} />Approved</span>;
    if (status === 'Rejected') return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700"><XCircle size={11} />Rejected</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Clock size={11} />Pending</span>;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />{showToast}
          </div>
        </div>
      )}

      {/* Page title */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Time Off</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Review, approve, or reject employee time-off requests. Manage leave allocations.</p>
      </div>

      {/* Action Bar: Searchbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Searchbar..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]" />
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm">
          <p className="text-base font-bold text-blue-600">Paid time Off</p>
          <p className="text-2xl font-extrabold text-[#171923] mt-1 font-serif">24 Days Available</p>
          <p className="text-xs text-gray-500 mt-1">Standard annual paid time-off allowance per employee</p>
        </div>
        <div className="bg-white rounded-xl border border-cyan-100 p-5 shadow-sm">
          <p className="text-base font-bold text-cyan-600">Sick time off</p>
          <p className="text-2xl font-extrabold text-[#171923] mt-1 font-serif">07 Days Available</p>
          <p className="text-xs text-gray-500 mt-1">Medical and sick leave allocation per year per employee</p>
        </div>
      </div>

      {/* TIME OFF TAB — Table with Name, Start Date, End Date, Time off Type, Status, Actions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin text-[#502D55]" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/75">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Start Date</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">End Date</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Time off Type</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Status</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeaves.map((leave, i) => (
                    <tr key={leave._id || i} className="hover:bg-gray-50/50 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#502D55] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(leave.employee_id?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#171923]">{leave.employee_id?.name || 'Unknown Employee'}</p>
                            <p className="text-xs text-[#6B7280] font-mono">{leave.employee_id?.login_id || ''}</p>
                          </div>
                        </div>
                      </td>
                      {/* Start Date */}
                      <td className="px-5 py-3.5 text-[#171923] font-medium">
                        {new Date(leave.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      {/* End Date */}
                      <td className="px-5 py-3.5 text-[#171923] font-medium">
                        {new Date(leave.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${
                          leave.type?.toLowerCase().includes('paid') ? 'text-blue-600' :
                          leave.type?.toLowerCase().includes('sick') ? 'text-cyan-600' : 'text-purple-600'
                        }`}>{leave.type}</span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">{statusBadge(leave.status)}</td>
                      {/* Actions: Red Remove + Green Accept */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          {/* Red: Remove (always) or Reject (when pending) */}
                          <button
                            onClick={() => leave.status === 'Pending' ? setRejectModal(leave._id) : handleRemove(leave._id)}
                            title={leave.status === 'Pending' ? 'Reject Request' : 'Remove Record'}
                            className="h-7 px-3 rounded-md bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 text-xs font-semibold shadow-sm transition-all active:scale-95"
                          >
                            <X size={12} />
                            {leave.status === 'Pending' ? 'Reject' : 'Remove'}
                          </button>

                          {/* Green: Accept/Approve — shown when not yet approved */}
                          {leave.status !== 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(leave._id, 'Approved')}
                              title="Approve Request"
                              className="h-7 px-3 rounded-md bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 text-xs font-semibold shadow-sm transition-all active:scale-95"
                            >
                              <Check size={12} />
                              Accept
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLeaves.length === 0 && (
                <div className="p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                  <p className="text-sm text-[#6B7280]">No time off requests found{search ? ` matching "${search}"` : '.'}.</p>
                </div>
              )}
            </div>
          )}
        </div>



      {/* ── Reject Reason Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
              <h3 className="text-base font-bold text-red-900">Reject Time Off Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Rejection Comment (Optional)</label>
                <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} rows={3}
                  placeholder="Provide reason for rejection..."
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setRejectModal(null); setRejectComment(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleUpdateStatus(rejectModal, 'Rejected', rejectComment)} className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-sm font-semibold text-white">
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

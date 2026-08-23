import { useState, useEffect } from 'react';
import API_BASE from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Clock, CheckCircle, XCircle, X, Loader2, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

const LEAVE_TYPES = ['Paid time off', 'Sick Leave', 'Unpaid Leaves'];

export function EmployeeTimeOff() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new request
  const [timeOffType, setTimeOffType] = useState('Paid time off');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Calendar year navigation
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };
  const getToken = () => localStorage.getItem('dayflow_token');

  // ── Fetch this employee's leaves ─────────────────────────
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/data/timeoff`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setLeaves(await res.json());
    } catch (err) {
      console.error('Failed to fetch timeoff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  // ── Calculate days between dates ─────────────────────────
  const calculateDays = () => {
    if (!startDate || !endDate) return '01.00';
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return '00.00';
    const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
    return String(diff).padStart(2, '0') + '.00';
  };

  // ── Submit new time off request ──────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) { toast('Please select start and end dates.'); return; }
    const s = new Date(startDate), en = new Date(endDate);
    if (en < s) { toast('End date must be on or after start date.'); return; }
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/data/timeoff`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: timeOffType,
          startDate,
          endDate,
          reason: attachmentName ? `${timeOffType} (Attachment: ${attachmentName})` : `${timeOffType} Request`
        })
      });

      if (res.ok) {
        toast('Time-off request submitted successfully!');
        setShowModal(false);
        setStartDate('');
        setEndDate('');
        setAttachmentName('');
        setTimeOffType('Paid time off');
        fetchLeaves(); // Real-time update
      } else {
        const err = await res.json();
        toast(`Error: ${err.message}`);
      }
    } catch {
      toast('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open modal pre-filled with a date ───────────────────
  const handleOpenForDate = (dateStr) => {
    setStartDate(dateStr);
    setEndDate(dateStr);
    setShowModal(true);
  };

  // ── Calendar helpers ─────────────────────────────────────
  const fmtKey = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const getLeaveForDay = (year, monthIdx, day) => {
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.find(l => key >= fmtKey(l.start_date) && key <= fmtKey(l.end_date));
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const renderMonth = (monthIdx) => {
    const daysInMonth = new Date(currentYear, monthIdx + 1, 0).getDate();
    const firstDay = new Date(currentYear, monthIdx, 1).getDay();
    const today = new Date();
    const isThisMonth = today.getFullYear() === currentYear && today.getMonth() === monthIdx;

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-6 w-6" />);

    for (let d = 1; d <= daysInMonth; d++) {
      const leave = getLeaveForDay(currentYear, monthIdx, d);
      const isToday = isThisMonth && today.getDate() === d;
      const dateKey = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      let cls = 'text-gray-700 hover:bg-[#502D55]/10 hover:text-[#502D55]';
      if (leave) {
        if (leave.status === 'Approved') cls = 'bg-[#502D55] text-white font-bold';
        else if (leave.status === 'Pending') cls = 'bg-[#935073] text-white font-bold animate-pulse';
        else cls = 'bg-red-500 text-white font-bold';
      } else if (isToday) {
        cls = 'border-2 border-[#502D55] text-[#502D55] font-bold';
      }

      cells.push(
        <button key={d} type="button"
          onClick={() => handleOpenForDate(dateKey)}
          title={leave ? `${leave.type} — ${leave.status}` : `Apply time off on ${dateKey}`}
          className={`h-6 w-6 text-[11px] flex items-center justify-center rounded-full transition-all cursor-pointer ${cls}`}
        >{d}</button>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 hover:border-[#502D55]/30 transition-colors shadow-sm">
        <h4 className="text-xs font-bold text-[#502D55] mb-2 font-serif">{months[monthIdx]} {currentYear}</h4>
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-[9px] font-bold text-gray-400">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">{cells}</div>
      </div>
    );
  };

  // Compute balances from leaves
  const approvedPaid = leaves.filter(l => l.status === 'Approved' && l.type?.toLowerCase().includes('paid')).length;
  const approvedSick = leaves.filter(l => l.status === 'Approved' && l.type?.toLowerCase().includes('sick')).length;
  const paidRemaining = Math.max(0, 24 - approvedPaid);
  const sickRemaining = Math.max(0, 7 - approvedSick);

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

      {/* Page Title */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Time Off</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Submit and track your personal time-off requests in real-time.</p>
      </div>

      {/* Single "Time Off" tab */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button className="px-5 py-2.5 text-sm font-semibold rounded-t-lg bg-[#502D55] text-white shadow-sm">
          Time Off
        </button>
      </div>

      {/* Action Bar: NEW + Year Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <button
          onClick={() => {
            const todayStr = fmtKey(new Date());
            setStartDate(todayStr);
            setEndDate(todayStr);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#935073] hover:bg-[#7b3e5f] text-white px-5 py-2.5 text-sm font-bold shadow-sm transition-colors"
        >
          <Plus size={16} /> NEW
        </button>

        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentYear(y => y - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-[#502D55] px-3 font-mono">{currentYear}</span>
          <button onClick={() => setCurrentYear(y => y + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Leave Balance Cards — live-computed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-base font-bold text-[#502D55]">Paid time Off</p>
          <p className="text-2xl font-extrabold text-[#171923] mt-1 font-serif">{paidRemaining} Days Available</p>
          <p className="text-xs text-[#6B7280] mt-1">Available balance for annual vacations and personal days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-base font-bold text-[#935073]">Sick time off</p>
          <p className="text-2xl font-extrabold text-[#171923] mt-1 font-serif">{String(sickRemaining).padStart(2, '0')} Days Available</p>
          <p className="text-xs text-[#6B7280] mt-1">Available balance for medical and health recovery</p>
        </div>
      </div>

      {/* 12-Month Annual Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <h3 className="text-base font-bold text-[#171923] font-serif">Time Off Calendar — {currentYear}</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#502D55]" /><span className="text-gray-700 font-medium">Approved</span></div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#935073]" /><span className="text-gray-700 font-medium">Pending</span></div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500" /><span className="text-gray-700 font-medium">Rejected</span></div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-[#502D55]" /><span className="text-gray-700 font-medium">Today</span></div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[#502D55]" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {months.map((_, i) => <div key={i}>{renderMonth(i)}</div>)}
          </div>
        )}
      </div>

      {/* My Time Off Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#171923] font-serif">My Time Off Requests</h3>
          <span className="text-xs text-gray-400 font-medium">{leaves.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/75">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Time Off Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Start Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">End Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Reason</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.map((l, i) => (
                <tr key={l._id || i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-[#502D55]">{l.type}</td>
                  <td className="px-5 py-3.5 text-[#171923] font-medium">
                    {new Date(l.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-[#171923] font-medium">
                    {new Date(l.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280] max-w-xs truncate">{l.reason}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      l.status === 'Approved' ? 'bg-[#502D55]/10 text-[#502D55] border border-[#502D55]/20' :
                      l.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-[#935073]/10 text-[#935073] border border-[#935073]/20'
                    }`}>
                      {l.status === 'Approved' && <CheckCircle size={11} />}
                      {l.status === 'Rejected' && <XCircle size={11} />}
                      {l.status === 'Pending' && <Clock size={11} />}
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-sm text-gray-400">
                    No time off requests yet. Click <strong>NEW</strong> or click any calendar date to apply.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── NEW Time Off Request Modal (Wireframe exact format) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-bold text-[#171923] font-serif">Time off Type Request</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-200 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              {/* Employee (read-only) */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</span>
                <span className="font-bold text-[#502D55] font-serif">{user?.name || '[Employee]'}</span>
              </div>

              {/* Time off Type */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Time off Type</span>
                <select value={timeOffType} onChange={e => setTimeOffType(e.target.value)}
                  className="font-semibold text-[#502D55] border border-gray-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#502D55]">
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Validity Period (Start → End) */}
              <div className="pb-3 border-b border-gray-100 space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Validity Period</span>
                <div className="flex items-center gap-2">
                  <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-[#502D55] focus:outline-none" />
                  <span className="text-xs text-gray-400 font-bold shrink-0">To</span>
                  <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-[#502D55] focus:outline-none" />
                </div>
              </div>

              {/* Allocation (auto-calculated days) */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocation</span>
                <span className="font-mono font-bold text-[#502D55]">{calculateDays()} Days</span>
              </div>

              {/* File Attachment */}
              <div className="flex flex-col gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Letter / Medical Note</span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-[#502D55]/10 hover:text-[#502D55] text-xs font-semibold text-gray-600 transition-colors">
                    <Upload size={13} />
                    {attachmentName ? 'Change File' : 'Upload File'}
                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) { toast('File is too large. Max 5MB.'); return; }
                        setAttachmentName(file.name);
                      }
                    }} />
                  </label>
                </div>
                {attachmentName && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-xs flex justify-between items-center">
                    <span className="truncate">{attachmentName}</span>
                    <button type="button" onClick={() => setAttachmentName('')} className="hover:text-green-900"><X size={14}/></button>
                  </div>
                )}
              </div>

              {/* Submit + Discard */}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-xl bg-[#502D55] hover:bg-[#3e2342] text-white py-2.5 text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70">
                  {submitting && <Loader2 className="animate-spin" size={15} />}
                  Submit Request
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

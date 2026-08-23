import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CheckCircle, LogIn, LogOut as LogOutIcon, Plane, X,
  Mail, Phone, Building2, Briefcase, Calendar, Search, Plus, Loader2
} from 'lucide-react';
import { EmployeeProfileModal } from '../../components/EmployeeProfileModal';
import { formatDate } from '../../lib/mockData';

/* ── Status helpers ─────────────────────────────────────── */
const STATUS_CONFIG = {
  present: { dot: 'bg-green-500', label: 'Present in office' },
  leave:   { icon: <Plane size={14} className="text-sky-500" />, label: 'On Leave' },
  absent:  { dot: 'bg-yellow-500', label: 'Absent' },
};

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
  return (
    <span title={cfg.label} className="flex items-center justify-center">
      {cfg.icon ?? <span className={`h-3 w-3 rounded-full ring-2 ring-white shadow-sm ${cfg.dot}`} />}
    </span>
  );
}

/* ── Elapsed timer hook ──────────────────────────────────── */
function useElapsed(startTime) {
  const [elapsed, setElapsed] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!startTime) { setElapsed(''); return; }
    const tick = () => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    ref.current = setInterval(tick, 1000);
    return () => clearInterval(ref.current);
  }, [startTime]);

  return elapsed;
}

/* ── Main Component ─────────────────────────────────────── */
export function EmployeeDashboard() {
  const { user } = useAuth();

  // Employees grid
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Check-In / Check-Out real working
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTimestamp, setCheckInTimestamp] = useState(null); // ms epoch
  const [checkInDisplay, setCheckInDisplay] = useState(null);      // "HH:MM AM/PM"
  const [ciLoading, setCiLoading] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const elapsed = useElapsed(checkInTimestamp);
  const getToken = () => localStorage.getItem('dayflow_token');

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  /* Fetch employees */
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/data/employees', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.map(emp => ({
          ...emp, // Spread all fields including new schema fields
          id: emp._id,
          employeeId: emp.login_id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone || '+91 98765 43210',
          position: emp.position || 'Employee',
          department: emp.department || 'General',
          companyName: emp.company_name || 'Odoo India',
          joiningDate: emp.joining_date,
          // Deterministic status from name hash so it's stable across renders
          attendanceStatus: emp.status === 'On Leave' ? 'leave'
            : (emp.name?.charCodeAt(0) % 3 === 0 ? 'absent' : 'present'),
          avatar: (emp.name || 'EM').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        })));
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* Check today's attendance status on mount */
  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/data/attendance', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const records = await res.json();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayRecord = records.find(r => {
          const d = new Date(r.date); d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
        if (todayRecord?.check_in && !todayRecord?.check_out) {
          setCheckedIn(true);
          const ciDate = new Date(todayRecord.check_in);
          setCheckInTimestamp(ciDate.getTime());
          setCheckInDisplay(ciDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (err) {
      console.error('Fetch attendance error:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTodayAttendance();
  }, []);

  /* Real Check-In */
  const handleCheckIn = async () => {
    if (checkedIn) return;
    setCiLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/data/attendance/check-in', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const now = new Date();
        setCheckedIn(true);
        setCheckInTimestamp(now.getTime());
        setCheckInDisplay(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        toast('Checked in successfully! Status dot is now green ●');
      } else {
        const err = await res.json();
        toast(`Check-in: ${err.message}`);
      }
    } catch {
      toast('Failed to check in. Please retry.');
    } finally {
      setCiLoading(false);
    }
  };

  /* Real Check-Out */
  const handleCheckOut = async () => {
    if (!checkedIn) return;
    setCiLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/data/attendance/check-out', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setCheckedIn(false);
        setCheckInTimestamp(null);
        setCheckInDisplay(null);
        toast('Checked out successfully!');
      } else {
        const err = await res.json();
        toast(`Check-out: ${err.message}`);
      }
    } catch {
      toast('Failed to check out. Please retry.');
    } finally {
      setCiLoading(false);
    }
  };

  const filtered = employees.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.name.toLowerCase().includes(s) || (e.department || '').toLowerCase().includes(s) || (e.position || '').toLowerCase().includes(s);
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start min-h-0">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />{showToast}
          </div>
        </div>
      )}

      {/* ── LEFT: Employee Directory Grid ─────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Employees</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Directory of your colleagues. Click any card to view their profile.</p>
        </div>

        {/* Action Bar: Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3">

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]"
            />
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-gray-600 px-1">
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500" /><span>Present in office</span></div>
          <div className="flex items-center gap-1.5"><Plane size={13} className="text-sky-500" /><span>On leave</span></div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-yellow-500" /><span>Absent</span></div>
        </div>

        {/* Employee Cards Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="animate-spin text-[#502D55]" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">No employees found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4">
            {filtered.map(emp => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className="bg-white rounded-xl border border-gray-200 p-5 relative cursor-pointer hover:border-[#502D55]/40 hover:shadow-md transition-all group flex flex-col h-full"
              >
                {/* Header: Avatar + Details */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#502D55] to-[#935073] text-white flex items-center justify-center text-lg font-bold shadow-sm group-hover:scale-105 transition-transform shrink-0">
                      {emp.avatar}
                    </div>
                    <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-white">
                      <StatusDot status={emp.attendanceStatus} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-sm font-bold text-[#171923] truncate leading-tight">{emp.name}</h3>
                    <p className="text-xs text-[#502D55] font-semibold mt-1 truncate">{emp.position}</p>
                    <p className="text-[11px] text-gray-500 font-medium truncate flex items-center gap-1 mt-0.5">
                      <Briefcase size={10} /> {emp.department}
                    </p>
                  </div>
                </div>

                {/* Body: Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Mail size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{emp.phone}</span>
                  </div>
                </div>

                {/* Footer: Skills & ID */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap items-end justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {emp.skills && emp.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {emp.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-50 border border-gray-200 text-gray-600 font-medium whitespace-nowrap">
                            {skill}
                          </span>
                        ))}
                        {emp.skills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-gray-50 border border-gray-200 text-gray-400 font-medium">
                            +{emp.skills.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No skills listed</span>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-md bg-[#502D55]/5 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#502D55] whitespace-nowrap shrink-0">
                    {emp.employeeId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: Check-In / Check-Out Systray ──────────── */}
      <div className="w-full lg:w-64 xl:w-72 flex-shrink-0 lg:sticky lg:top-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          {/* Header with real-time status dot */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance</p>
              <p className="text-sm font-semibold text-[#171923] mt-0.5">{user?.name?.split(' ')[0] || 'My'} Status</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ring-2 ring-white shadow transition-colors duration-500 ${checkedIn ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
              <span className={`text-xs font-semibold ${checkedIn ? 'text-green-600' : 'text-red-500'}`}>
                {checkedIn ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Check IN button */}
          <button
            onClick={handleCheckIn}
            disabled={checkedIn || ciLoading}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${
              !checkedIn && !ciLoading
                ? 'bg-[#502D55] text-white hover:bg-[#3e2342]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Check IN</span>
            {ciLoading && !checkedIn ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
          </button>

          {/* Since timer */}
          <div className="bg-gray-50 border border-gray-100 rounded-lg py-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Since</p>
            <p className="text-base font-mono font-bold text-[#171923]">
              {checkedIn ? checkInDisplay : '--:-- --'}
            </p>
            {checkedIn && elapsed && (
              <p className="text-[11px] text-[#502D55] font-mono font-semibold mt-0.5">{elapsed} elapsed</p>
            )}
          </div>

          {/* Check OUT button */}
          <button
            onClick={handleCheckOut}
            disabled={!checkedIn || ciLoading}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${
              checkedIn && !ciLoading
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Check Out</span>
            {ciLoading && checkedIn ? <Loader2 className="animate-spin" size={16} /> : <LogOutIcon size={16} />}
          </button>

          {/* Quick info */}
          <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Today</span>
              <span className="font-semibold text-gray-700">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Your ID</span>
              <span className="font-mono font-bold text-[#502D55] text-[10px]">{user?.employeeId || user?.login_id || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── View-Only Employee Profile Modal ─────────────── */}
      {selectedEmployee && (
        <EmployeeProfileModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
          isAdmin={false} 
        />
      )}
    </div>
  );
}

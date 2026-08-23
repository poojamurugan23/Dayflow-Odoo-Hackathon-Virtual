import { useState, useEffect, useRef } from 'react';
import API_BASE, { getAvatarUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogIn, LogOut as LogOutIcon, Plane,
  Mail, Phone, Briefcase, Search, Loader2, Clock, Video, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';

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

/* ── Real Analytics Data State ───────────────────────────── */

/* ── Main Component ─────────────────────────────────────── */
export function EmployeeDashboard() {
  const { user } = useAuth();

  // Employees grid
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Check-In / Check-Out real working
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTimestamp, setCheckInTimestamp] = useState(null); // ms epoch
  const [checkInDisplay, setCheckInDisplay] = useState(null);      // "HH:MM AM/PM"
  const [ciLoading, setCiLoading] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const [weeklyHoursData, setWeeklyHoursData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [totalMonthHours, setTotalMonthHours] = useState(0);
  const [prevComplaints, setPrevComplaints] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);

  const elapsed = useElapsed(checkInTimestamp);
  const getToken = () => localStorage.getItem('dayflow_token');

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  /* Fetch Stats */
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWeeklyHoursData(data.weeklyHoursData || []);
        setAttendanceData(data.attendanceData || []);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  /* Fetch employees */
  const fetchEmployees = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/data/employees`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out super admin and HR if needed (just showing peers)
        const peers = data.filter(e => e.role === 'employee');
        setEmployees(peers.map(emp => ({
          ...emp,
          id: emp._id,
          employeeId: emp.login_id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone || '+91 98765 43210',
          position: emp.position || 'Employee',
          department: emp.department || 'General',
          attendanceStatus: emp.status === 'On Leave' ? 'leave'
            : (emp.name?.charCodeAt(0) % 3 === 0 ? 'absent' : 'present'),
          avatar: getAvatarUrl(emp)
        })));
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const resAtt = await fetch(`${API_BASE}/api/data/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAtt.ok) {
        const attData = await resAtt.json();
        const userId = user?.id || user?._id;
        const myRecords = attData.filter(a => {
          const id = a.employee_id?._id || a.employee_id;
          return id === userId;
        });
        myRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latest = myRecords[0];
        
        if (latest && new Date(latest.createdAt).toDateString() === new Date().toDateString()) {
          if (latest.check_in && !latest.check_out) {
            setCheckedIn(true);
            const d = new Date(latest.check_in);
            setCheckInTimestamp(d.getTime());
            setCheckInDisplay(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          } else {
            setCheckedIn(false);
            setCheckInTimestamp(null);
            setCheckInDisplay('--:--');
          }
        } else {
          setCheckedIn(false);
        }
        
        // Calculate real total month hours
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let totalHrs = 0;
        myRecords.forEach(r => {
          const d = new Date(r.date || r.createdAt);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && r.check_in && r.check_out) {
             const hrs = (new Date(r.check_out) - new Date(r.check_in)) / (1000 * 60 * 60);
             totalHrs += hrs;
          }
        });
        setTotalMonthHours(totalHrs);

      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMyComplaints = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data/complaints`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        const userId = user?.id || user?._id;
        const myComplaints = data.filter(c => (c.employee_id?._id || c.employee_id) === userId);
        
        // Check for newly resolved tickets
        setPrevComplaints(prev => {
          if (prev.length > 0) {
            myComplaints.forEach(curr => {
              if (curr.status === 'Resolved') {
                const old = prev.find(p => p._id === curr._id);
                if (old && old.status !== 'Resolved') {
                  toast(`Ticket Resolved: ${curr.subject}`);
                }
              }
            });
          }
          return myComplaints;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUpcomingMeetings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data/meetings`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        const now = new Date();
        const upcoming = data.filter(m => {
          if (!m.date || !m.time) return false;
          const [hours, minutes] = m.time.split(':');
          const meetingDate = new Date(m.date);
          meetingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          return meetingDate >= now;
        }).sort((a, b) => {
          const aDate = new Date(a.date);
          const [aH, aM] = a.time.split(':');
          aDate.setHours(parseInt(aH, 10), parseInt(aM, 10), 0, 0);

          const bDate = new Date(b.date);
          const [bH, bM] = b.time.split(':');
          bDate.setHours(parseInt(bH, 10), parseInt(bM, 10), 0, 0);

          return aDate - bDate;
        });
        setUpcomingMeetings(upcoming);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchEmployees(true);
    fetchMyAttendance();
    fetchMyComplaints();
    fetchUpcomingMeetings();
    const interval = setInterval(() => {
      fetchMyAttendance();
      fetchEmployees(false);
      fetchMyComplaints();
      fetchUpcomingMeetings();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  /* Real Check-In */
  const handleCheckIn = async () => {
    if (checkedIn) return;
    setCiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/data/attendance/check-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchMyAttendance();
        toast('Checked in successfully!');
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
      const res = await fetch(`${API_BASE}/api/data/attendance/check-out`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchMyAttendance();
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
            <div className="h-4 w-4 rounded-full bg-green-500" />{showToast}
          </div>
        </div>
      )}

      {/* ── LEFT: Analytics & Employee Directory ─────────────────── */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        
        {/* Overview Header & Monthly Hours */}
        <div className="bg-gradient-to-r from-[#502D55] to-[#714376] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="mt-1 text-white/80 text-sm">Here is your work summary for this month.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-white/70 uppercase tracking-widest font-semibold">Total Hours</p>
              <p className="text-2xl font-bold font-mono">{Math.floor(totalMonthHours)}<span className="text-sm font-medium">.{Math.round((totalMonthHours % 1) * 10)}h</span></p>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Hours Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Hours Logged (This Week)</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={weeklyHoursData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="hours" fill="#502D55" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance Donut Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Attendance (This Month)</h3>
            <div className="h-48 w-full flex items-center">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Directory Section */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="font-bold text-lg text-[#171923]">Colleagues Directory</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search peers..."
                className="block w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40 bg-white rounded-xl border border-gray-200">
              <Loader2 className="animate-spin text-[#502D55]" size={24} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">No peers found{search ? ` for "${search}"` : ''}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(emp => (
                <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-4 relative flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-full border border-gray-100 shadow-sm shrink-0">
                      <img src={emp.avatar} alt={emp.name} className="h-12 w-12 rounded-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-white">
                      <StatusDot status={emp.attendanceStatus} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#171923] truncate">{emp.name}</h3>
                    <p className="text-[11px] text-[#502D55] font-semibold truncate">{emp.position}</p>
                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                      {emp.department} • {emp.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Upcoming Meetings & Recent Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Video size={18} className="text-[#502D55]" /> Upcoming Meetings
            </h3>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No upcoming meetings scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.slice(0, 5).map(m => (
                  <div key={m._id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <p className="font-semibold text-sm text-[#171923] truncate">{m.title}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {m.time}</span>
                      <span>{new Date(m.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Info size={18} className="text-[#502D55]" /> My Recent Tickets
            </h3>
            {prevComplaints.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No recent tickets raised.</p>
            ) : (
              <div className="space-y-3">
                {prevComplaints.slice(0, 5).map(c => (
                  <div key={c._id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#171923] truncate">{c.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      c.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                      c.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
              <span className="font-mono font-bold text-[#502D55] text-sm">{user?.employeeId || user?.login_id || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

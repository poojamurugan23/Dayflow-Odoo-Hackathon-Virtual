import { useState, useEffect } from 'react';
import API_BASE from '../../lib/api';
import { Loader2, Clock, CheckCircle, ChevronLeft, ChevronRight, Calendar, UserCheck, AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(null);
  
  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const formatMonthParam = () => {
    return `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`;
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dayflow_token');
      // Simulated or real fetch
      const response = await fetch(`${API_BASE}/api/data/attendance?month=${formatMonthParam()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        let data = await response.json();
        
        // No mock data injected anymore, real API data only

        // Sort records by date descending
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecords(data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth]);

  const goBackMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const goForwardMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const calcWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diffMs = new Date(checkOut) - new Date(checkIn);
    return diffMs / (1000 * 60 * 60);
  };

  const formatHours = (hoursNum) => {
    if (!hoursNum) return '-';
    const h = Math.floor(hoursNum);
    const m = Math.round((hoursNum - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Summary stats calculations
  let totalHoursNum = 0;
  let totalExtraNum = 0;
  records.forEach(r => {
    const hrs = calcWorkHours(r.check_in, r.check_out);
    totalHoursNum += hrs;
    if (hrs > 8) totalExtraNum += (hrs - 8);
  });

  const daysPresent = records.filter(r => r.status === 'Present' || (r.check_in && r.check_out)).length;
  let paidLeaves = records.filter(r => r.status === 'Leave' || r.status === 'Paid Leave').length;
  let unpaidLeaves = records.filter(r => r.status === 'Unpaid Leave').length;
  let sickLeaves = records.filter(r => r.status === 'Sick Leave').length;
  let daysAbsent = records.filter(r => r.status === 'Absent').length;
  
  if (daysAbsent === 0) {
    const userStr = localStorage.getItem('dayflow_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const joinDate = user?.joining_date ? new Date(user.joining_date) : new Date(2020, 0, 1);

    const countWeekdays = (year, month, startDay, upToDay) => {
      let count = 0;
      for (let d = startDay; d <= upToDay; d++) {
        const day = new Date(year, month, d).getDay();
        if (day !== 0 && day !== 6) count++;
      }
      return count;
    };
    
    const now = new Date();
    const isCurrentMonth = currentMonth.year === now.getFullYear() && currentMonth.month === now.getMonth();
    const isPastMonth = new Date(currentMonth.year, currentMonth.month) < new Date(now.getFullYear(), now.getMonth());
    
    if (isCurrentMonth || isPastMonth) {
       const upToDay = isCurrentMonth ? now.getDate() : new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
       let startDay = 1;
       
       if (joinDate.getFullYear() === currentMonth.year && joinDate.getMonth() === currentMonth.month) {
         startDay = joinDate.getDate();
       } else if (joinDate > new Date(currentMonth.year, currentMonth.month + 1, 0)) {
         startDay = upToDay + 1; // Future month, so 0 days
       }
       
       const totalWeekdays = countWeekdays(currentMonth.year, currentMonth.month, startDay, upToDay);
       daysAbsent = Math.max(0, totalWeekdays - daysPresent - paidLeaves - unpaidLeaves - sickLeaves);
    }
  }

  // Chart data
  const chartData = records.slice(0, 7).reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    hours: parseFloat(calcWorkHours(r.check_in, r.check_out).toFixed(2))
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Attendance Overview</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Track your working hours and leave balances.</p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm">
          <button onClick={goBackMonth} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><ChevronLeft size={18} /></button>
          <span className="text-sm font-bold text-[#171923] min-w-[120px] text-center">
            {monthNames[currentMonth.month]} {currentMonth.year}
          </span>
          <button onClick={goForwardMonth} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><UserCheck size={20} /></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Total Working Days</p>
          </div>
          <p className="text-2xl font-bold text-[#171923]">{daysPresent}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><AlertTriangle size={20} /></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Days Absent</p>
          </div>
          <p className="text-2xl font-bold text-[#171923]">{daysAbsent}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Clock size={20} /></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Total Working Hrs</p>
          </div>
          <p className="text-2xl font-bold font-mono text-[#171923]">{formatHours(totalHoursNum)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg text-[#502D55]"><Calendar size={20} /></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Extra Hours</p>
          </div>
          <p className="text-2xl font-bold font-mono text-[#171923]">{formatHours(totalExtraNum)}</p>
        </div>
      </div>

      {/* Advanced Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaves Breakdown */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#171923] to-[#2d3748] rounded-2xl p-6 text-white shadow-md flex flex-col justify-center">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-6">Leave Balance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Paid Leaves</span>
                <span className="font-bold">{paidLeaves}</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sick Leaves</span>
                <span className="font-bold">{sickLeaves}</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Unpaid Leaves</span>
                <span className="font-bold">{unpaidLeaves}</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#171923] mb-4">Daily Working Hours (Recent)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="hours" fill="#502D55" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Date-wise Detailed Log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#171923] flex items-center gap-2">
            <Clock size={16} className="text-[#502D55]" /> Detailed Logs
          </h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[#502D55]" size={32} />
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No attendance records found for this month.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Check In</th>
                  <th className="px-6 py-3 font-semibold">Check Out</th>
                  <th className="px-6 py-3 font-semibold">Work Hours</th>
                  <th className="px-6 py-3 font-semibold">Extra</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(record => {
                  const hrs = calcWorkHours(record.check_in, record.check_out);
                  const extra = hrs > 8 ? hrs - 8 : null;
                  const dateObj = new Date(record.date);
                  
                  return (
                    <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>
                        <div className="text-xs text-gray-500">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                      </td>
                      <td className="px-6 py-4">
                        {record.check_in ? (
                          <span className="font-mono text-gray-700">{new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {record.check_out ? (
                          <span className="font-mono text-gray-700">{new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-medium text-gray-900">{formatHours(hrs)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {extra ? <span className="text-green-600 font-mono text-xs font-bold">+{formatHours(extra)}</span> : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          record.status === 'Present' ? 'bg-green-50 text-green-700 border border-green-200' :
                          record.status === 'Leave' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

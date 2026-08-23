import { useState, useEffect } from 'react';
import API_BASE from '../../lib/api';
import { Loader2, Clock, CheckCircle, ChevronDown } from 'lucide-react';

export function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [showToast, setShowToast] = useState(null);
  
  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // 0-indexed
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatMonthParam = () => {
    return `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`;
  };

  const formatDateDisplay = () => {
    const today = new Date();
    const day = today.getDate();
    const month = monthNames[currentMonth.month];
    return `${day},${month} ${currentMonth.year}`;
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/attendance?month=${formatMonthParam()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
        
        const today = new Date().toDateString();
        const todayRec = data.find(r => new Date(r.date).toDateString() === today);
        setTodayRecord(todayRec);
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
    if (!checkIn || !checkOut) return '-';
    const diffMs = new Date(checkOut) - new Date(checkIn);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const calcExtraHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    const diffMs = new Date(checkOut) - new Date(checkIn);
    const totalHrs = diffMs / (1000 * 60 * 60);
    const extra = totalHrs - 8;
    if (extra <= 0) return '00:00';
    const h = Math.floor(extra);
    const m = Math.floor((extra - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Summary stats
  const daysPresent = records.filter(r => r.status === 'Present' || (r.check_in && !r.check_out)).length;
  const leavesCount = records.filter(r => r.status === 'Leave').length;
  const totalWorkingDays = records.length || 0;

  return (
    <div className="space-y-6">
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />{showToast}
          </div>
        </div>
      )}

      {/* Top Header Row with Title */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Attendance</h1>
        <p className="mt-0.5 text-xs text-[#6B7280]">Personal monthly attendance log</p>
      </div>

      {/* Control Bar: Month navigation + Metric Boxes in exact wireframe toolbar layout */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        {/* Navigation & Month Selector */}
        <div className="flex items-center gap-2">
          <button 
            onClick={goBackMonth} 
            title="Previous Month"
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold transition-colors text-sm"
          >
            &lt;-
          </button>
          <button 
            onClick={goForwardMonth} 
            title="Next Month"
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold transition-colors text-sm"
          >
            -&gt;
          </button>

          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              value={currentMonth.month}
              onChange={e => setCurrentMonth(prev => ({ ...prev, month: Number(e.target.value) }))}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold py-1.5 pl-3 pr-8 text-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20"
            >
              {shortMonthNames.map((m, idx) => (
                <option key={m} value={idx}>{m} {currentMonth.year}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Metric Boxes Toolbar (Exact Wireframe Format) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Count of days present */}
          <div className="border border-gray-200 rounded-lg px-4 py-1.5 bg-gray-50/50 text-center">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Count of days present</p>
            <p className="text-base font-extrabold text-[#502D55] font-serif leading-tight">{daysPresent}</p>
          </div>

          {/* Leaves count */}
          <div className="border border-gray-200 rounded-lg px-4 py-1.5 bg-gray-50/50 text-center">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Leaves count</p>
            <p className="text-base font-extrabold text-[#935073] font-serif leading-tight">{leavesCount}</p>
          </div>

          {/* Total working days */}
          <div className="border border-gray-200 rounded-lg px-4 py-1.5 bg-gray-50/50 text-center">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total working days</p>
            <p className="text-base font-extrabold text-[#171923] font-serif leading-tight">{totalWorkingDays}</p>
          </div>
        </div>
      </div>

      {/* Date Header Indicator */}
      <div className="px-2">
        <h2 className="text-sm font-bold text-[#171923] font-serif">{formatDateDisplay()}</h2>
      </div>

      {/* Attendance Table (Exact Wireframe Columns: Date, Check In, Check Out, Work Hours, Extra hours) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-[#502D55]" size={32} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/75">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Check In</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Check Out</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Work Hours</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Extra hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r, i) => (
                    <tr key={r._id || i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[#171923]">
                        {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-[#171923] font-medium">
                        {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-[#171923] font-medium">
                        {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-[#171923] font-semibold">{calcWorkHours(r.check_in, r.check_out)}</td>
                      <td className="px-5 py-3.5 text-[#502D55] font-semibold">{calcExtraHours(r.check_in, r.check_out)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {records.length === 0 && (
              <div className="p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-[#6B7280]">No attendance records for {monthNames[currentMonth.month]} {currentMonth.year}.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

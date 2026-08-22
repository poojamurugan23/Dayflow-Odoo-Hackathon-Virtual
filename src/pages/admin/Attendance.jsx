import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, Clock } from 'lucide-react';

export function AdminAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const formatDateDisplay = (date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'long' });
    const year = date.getFullYear();
    return `${day},${month} ${year}`;
  };

  const formatDateParam = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`http://localhost:5000/api/data/attendance?date=${formatDateParam(selectedDate)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
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
  }, [selectedDate]);

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
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

  const filtered = records.filter(r => {
    if (!search) return true;
    const empName = r.employee_id?.name || '';
    const empId = r.employee_id?.login_id || '';
    return empName.toLowerCase().includes(search.toLowerCase()) || empId.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Top Header Row with Title & Searchbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Attendance</h1>
          <p className="mt-0.5 text-xs text-[#6B7280]">Daily organization-wide attendance list view</p>
        </div>

        {/* Searchbar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Searchbar" 
            className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]"
          />
        </div>
      </div>

      {/* Second Control Row: Navigation, Date Picker, Day Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 shadow-xs">
        {/* Navigation arrows */}
        <button 
          onClick={goBack} 
          title="Previous Day"
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold transition-colors text-sm"
        >
          &lt;-
        </button>
        <button 
          onClick={goForward} 
          title="Next Day"
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold transition-colors text-sm"
        >
          -&gt;
        </button>

        {/* Date Selector input */}
        <div className="relative flex items-center">
          <input 
            type="date" 
            value={formatDateParam(selectedDate)} 
            onChange={e => setSelectedDate(new Date(e.target.value))} 
            className="border border-gray-200 rounded-lg text-xs font-semibold py-1.5 px-3 text-[#502D55] bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]"
          />
        </div>

        {/* Day Mode Indicator */}
        <span className="px-4 py-1.5 rounded-lg bg-[#502D55] text-white text-xs font-bold shadow-xs">
          Day
        </span>
      </div>

      {/* Date Header Indicator */}
      <div className="px-2">
        <h2 className="text-sm font-bold text-[#171923] font-serif">{formatDateDisplay(selectedDate)}</h2>
      </div>

      {/* Attendance Table */}
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
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Emp</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Check In</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Check Out</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Work Hours</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#171923] uppercase tracking-wider">Extra hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r, i) => (
                    <tr key={r._id || i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#502D55] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(r.employee_id?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#171923]">{r.employee_id?.name || 'Unknown'}</p>
                            <p className="text-xs text-[#6B7280] font-mono">{r.employee_id?.login_id || ''}</p>
                          </div>
                        </div>
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
            {filtered.length === 0 && (
              <div className="p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-[#6B7280]">No attendance records for this date.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserCheck, UserMinus, FileClock, CreditCard, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const attendanceTrend = [
  { day: 'Mon', present: 230, absent: 18 },
  { day: 'Tue', present: 225, absent: 23 },
  { day: 'Wed', present: 235, absent: 13 },
  { day: 'Thu', present: 221, absent: 27 },
  { day: 'Fri', present: 218, absent: 30 },
];

const deptData = [
  { name: 'Engineering', value: 85, color: '#502D55' },
  { name: 'Product', value: 32, color: '#935073' },
  { name: 'HR', value: 18, color: '#A78BA3' },
  { name: 'Finance', value: 25, color: '#3B82F6' },
  { name: 'Marketing', value: 42, color: '#F59E0B' },
  { name: 'Operations', value: 46, color: '#10B981' },
];

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalBasicPayroll: 0
  });
  
  const [pendingRequests, setPendingRequests] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      if (!token) return;

      // Fetch overview metrics
      const resMetrics = await fetch('http://localhost:5000/api/data/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMetrics.ok) {
        const data = await resMetrics.json();
        setMetrics(data);
      }

      // Fetch pending leaves
      const resLeaves = await fetch('http://localhost:5000/api/data/timeoff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resLeaves.ok) {
        const data = await resLeaves.json();
        setPendingRequests(data.filter(l => l.status === 'Pending').slice(0, 5)); // Show latest 5
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 5 seconds for real-time dashboard updates
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const formatLakhs = (num) => {
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">{greeting()}, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Here's a real-time view of your workforce.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Employees', value: metrics.totalEmployees.toString(), icon: Users, color: 'blue' },
          { label: 'Present Today', value: metrics.presentToday.toString(), icon: UserCheck, color: 'green' },
          { label: 'On Leave', value: metrics.approvedLeaves.toString(), icon: UserMinus, color: 'amber' },
          { label: 'Pending Requests', value: String(metrics.pendingLeaves).padStart(2, '0'), icon: FileClock, color: 'red' },
          { label: 'Monthly Payroll', value: formatLakhs(metrics.totalBasicPayroll), icon: CreditCard, color: 'purple' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#502D55]/30 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#6B7280]">{card.label}</span>
                <div className={`h-9 w-9 rounded-lg bg-${card.color}-50 flex items-center justify-center`}>
                  <Icon size={18} className={`text-${card.color}-600`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#171923]">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#171923] font-serif">This Week's Attendance</h3>
            <button onClick={() => navigate('/admin/reports')} className="text-xs font-medium text-[#502D55] hover:text-[#935073] flex items-center gap-1">View Reports <ArrowRight size={14} /></button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attendanceTrend} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="present" fill="#502D55" radius={[6, 6, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="#E5E7EB" radius={[6, 6, 0, 0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-[#171923] font-serif mb-4">Department Split</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {deptData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {deptData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></span>
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Leave Requests */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#171923] font-serif">Pending Leave Requests</h3>
          <button onClick={() => navigate('/admin/timeoff')} className="text-xs font-medium text-[#502D55] hover:text-[#935073] flex items-center gap-1">View All <ArrowRight size={14} /></button>
        </div>
        {pendingRequests.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {pendingRequests.map(l => (
              <div key={l._id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#502D55] text-white flex items-center justify-center text-xs font-bold">
                    {l.employee_id?.name ? l.employee_id.name.split(' ').map(n => n[0]).join('').substring(0,2) : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#171923]">{l.employee_id?.name || 'Unknown Employee'}</p>
                    <p className="text-xs text-[#6B7280]">
                      {l.type} · {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 animate-pulse border border-amber-200">
                  Pending
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#6B7280]">No pending requests currently.</div>
        )}
      </div>
    </div>
  );
}

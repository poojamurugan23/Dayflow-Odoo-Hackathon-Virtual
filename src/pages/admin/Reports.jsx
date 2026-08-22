import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Download, FileText, Filter } from 'lucide-react';

const attendanceData = [
  { month: 'Mar', present: 210, absent: 18, leave: 20 },
  { month: 'Apr', present: 215, absent: 15, leave: 18 },
  { month: 'May', present: 220, absent: 12, leave: 16 },
  { month: 'Jun', present: 218, absent: 14, leave: 16 },
  { month: 'Jul', present: 225, absent: 10, leave: 13 },
  { month: 'Aug', present: 221, absent: 13, leave: 14 },
];

const deptData = [
  { name: 'Engineering', value: 85 },
  { name: 'Product', value: 32 },
  { name: 'HR', value: 18 },
  { name: 'Finance', value: 25 },
  { name: 'Marketing', value: 42 },
  { name: 'Operations', value: 46 },
];

const leaveTypes = [
  { name: 'Paid Leave', value: 45 },
  { name: 'Sick Leave', value: 28 },
  { name: 'Unpaid Leave', value: 12 },
];

const payrollTrend = [
  { month: 'Mar', amount: 2200000 },
  { month: 'Apr', amount: 2250000 },
  { month: 'May', amount: 2300000 },
  { month: 'Jun', amount: 2320000 },
  { month: 'Jul', amount: 2400000 },
  { month: 'Aug', amount: 2480000 },
];

const COLORS = ['#502D55', '#935073', '#A78BA3', '#3B82F6', '#F59E0B', '#10B981'];

export function AdminReports() {
  const [activeReport, setActiveReport] = useState('attendance');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Comprehensive workforce insights and reporting.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"><Download size={16} /> Export PDF</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#502D55] px-4 py-2 text-sm font-medium text-white hover:bg-[#5a3256] shadow-sm"><FileText size={16} /> Export Excel</button>
        </div>
      </div>

      {/* Report tabs */}
      <div className="bg-white rounded-xl border border-gray-200 px-1">
        <nav className="flex gap-0 overflow-x-auto">
          {[
            { id: 'attendance', name: 'Attendance Report' },
            { id: 'leave', name: 'Leave Report' },
            { id: 'payroll', name: 'Payroll Report' },
            { id: 'department', name: 'Department Overview' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`whitespace-nowrap px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeReport === tab.id ? 'border-[#502D55] text-[#502D55]' : 'border-transparent text-[#6B7280] hover:text-[#171923] hover:border-gray-300'
              }`}
            >{tab.name}</button>
          ))}
        </nav>
      </div>

      {activeReport === 'attendance' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#171923] font-serif">Attendance Trend (Last 6 Months)</h3>
            <div className="flex items-center gap-2">
              <select className="border border-gray-200 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#502D55]/20"><option>2026</option></select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={attendanceData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="present" fill="#502D55" radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="#EF4444" radius={[4, 4, 0, 0]} name="Absent" />
              <Bar dataKey="leave" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Leave" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeReport === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-[#171923] font-serif mb-6">Leave Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={leaveTypes} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {leaveTypes.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-[#171923] font-serif mb-4">Leave Summary</h3>
            <div className="space-y-4">
              {leaveTypes.map((lt, i) => (
                <div key={lt.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                    <span className="text-sm font-medium text-[#171923]">{lt.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#171923]">{lt.value} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'payroll' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-[#171923] font-serif mb-6">Monthly Payroll Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={payrollTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip formatter={v => [`₹${(v / 100000).toFixed(1)}L`, 'Total Payroll']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="amount" stroke="#502D55" strokeWidth={3} dot={{ fill: '#502D55', r: 5 }} activeDot={{ r: 7 }} name="Payroll" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeReport === 'department' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-[#171923] font-serif mb-6">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-[#171923] font-serif mb-4">Department Breakdown</h3>
            <div className="space-y-3">
              {deptData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-sm text-[#171923]">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(d.value / 248) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                    </div>
                    <span className="text-sm font-medium text-[#171923] w-8 text-right">{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

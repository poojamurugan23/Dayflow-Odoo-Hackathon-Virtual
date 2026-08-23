import { useState } from 'react';
import { X } from 'lucide-react';
import { formatDate } from '../lib/mockData';

export function EmployeeProfileModal({ employee, onClose, isAdmin = true }) {
  const [activeTab, setActiveTab] = useState('resume');

  const TABS = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    ...(isAdmin ? [{ id: 'salary', label: 'Salary Info' }] : []),
  ];

  const dummySkills = ['Leadership', 'HR Management', 'Payroll', 'Compliance', 'Team Building'];
  const dummyCerts = ['SHRM-CP Certified', 'PMP – Project Management Professional'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-5xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#502D55] to-[#935073] p-6 text-white relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-end gap-5">
            <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white/20 shadow-md flex items-center justify-center text-[#502D55] text-3xl font-bold bg-gradient-to-br from-purple-50 to-pink-50">
              {employee.avatar || employee.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-serif">{employee.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-400/20 text-green-100 uppercase border border-green-400/30">Active</span>
              </div>
              <p className="text-sm text-purple-100 font-medium">{employee.position} • {employee.department}</p>
            </div>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="px-6 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex gap-2 pt-4">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${activeTab === t.id ? 'bg-[#502D55] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-b-0 border-gray-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          
          {/* RESUME TAB */}
          {activeTab === 'resume' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {['ABOUT', 'WHAT I LOVE ABOUT MY JOB', 'MY INTERESTS AND HOBBIES'].map(title => (
                  <div key={title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-3">{title}</h3>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[180px]">
                  <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-4">SKILLS</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dummySkills.map(s => <span key={s} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-1 text-xs font-medium text-[#171923] shadow-sm">{s}</span>)}
                  </div>
                  {isAdmin && (
                    <button className="text-xs font-semibold text-[#502D55] flex items-center gap-1 hover:text-[#935073]">
                      + Add Skills
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[180px]">
                  <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-4">CERTIFICATION</h3>
                  <div className="space-y-2 mb-4">
                    {dummyCerts.map((c, i) => <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-[#171923] shadow-sm">{c}</div>)}
                  </div>
                  {isAdmin && (
                    <button className="text-xs font-semibold text-[#502D55] flex items-center gap-1 hover:text-[#935073]">
                      + Add Skills
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PRIVATE INFO TAB */}
          {activeTab === 'private' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-[#171923] font-serif border-b border-gray-100 pb-2">Private Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-gray-500 text-xs">Date of Birth</span><span className="font-semibold text-gray-800 text-xs">20 Jun 1988</span>
                    <span className="text-gray-500 text-xs">Nationality</span><span className="font-semibold text-gray-800 text-xs">Indian</span>
                    <span className="text-gray-500 text-xs">Gender</span><span className="font-semibold text-gray-800 text-xs">Female</span>
                    <span className="text-gray-500 text-xs">Marital Status</span><span className="font-semibold text-gray-800 text-xs">Married</span>
                    <span className="text-gray-500 text-xs">Personal Email</span><span className="font-semibold text-gray-800 text-xs">{employee.email}</span>
                    <span className="text-gray-500 text-xs">Phone</span><span className="font-semibold text-gray-800 text-xs">{employee.phone}</span>
                    <span className="text-gray-500 text-xs">Joining Date</span><span className="font-semibold text-gray-800 text-xs">{formatDate(employee.joiningDate || new Date())}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-gray-500 text-xs">Account Number</span><span className="font-mono font-bold text-[#502D55] text-xs">50100123456789</span>
                    <span className="text-gray-500 text-xs">Bank Name</span><span className="font-semibold text-gray-800 text-xs">HDFC Bank</span>
                    <span className="text-gray-500 text-xs">IFSC Code</span><span className="font-mono font-bold text-gray-800 text-xs">HDFC0002345</span>
                    <span className="text-gray-500 text-xs">PAN No</span><span className="font-mono font-bold text-gray-800 text-xs">FGHIJ5678K</span>
                    <span className="text-gray-500 text-xs">UAN No</span><span className="font-mono font-bold text-gray-800 text-xs">100987654321</span>
                    <span className="text-gray-500 text-xs">Employee ID</span><span className="font-mono font-bold text-gray-800 text-xs">{employee.employeeId || employee.login_id || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SALARY INFO TAB */}
          {activeTab === 'salary' && isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-[#171923] font-serif border-b border-gray-100 pb-2">Salary Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider">Salary Components (Monthly)</h4>
                  {[
                    { name: 'Basic Salary', amt: 25000, pct: '50.00' },
                    { name: 'House Rent Allowance', amt: 12500, pct: '50.00' },
                    { name: 'Standard Allowance', amt: 4167, pct: '16.67' },
                    { name: 'Performance Bonus', amt: 2082.50, pct: '8.33' },
                    { name: 'Leave Travel Allowance', amt: 2082.50, pct: '8.33' },
                    { name: 'Fixed Allowance', amt: 4168, pct: '8.34' },
                  ].map(c => (
                    <div key={c.name} className="flex justify-between items-center text-xs pb-2 border-b border-gray-50 last:border-0">
                      <span className="font-semibold text-gray-800">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#171923]">{c.amt.toFixed(2)} ₹</span>
                        <span className="font-mono font-semibold text-[#502D55] w-12 text-right">{c.pct}%</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs font-bold pt-2 border-t-2 border-gray-100">
                    <span className="text-[#502D55]">Total Monthly Wage</span>
                    <span className="font-mono text-[#502D55] text-sm">50,000.00 ₹</span>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider mb-4">Provident Fund (PF)</h4>
                    {[{ name: 'Employee', amt: 3000 }, { name: "Employer's", amt: 3000 }].map(p => (
                      <div key={p.name} className="flex justify-between items-center text-xs mb-2">
                        <span className="font-semibold text-gray-800">{p.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#171923]">{p.amt.toFixed(2)} ₹</span>
                          <span className="font-mono font-semibold text-[#935073] w-12 text-right">12%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider mb-4">Tax Deductions</h4>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">Professional Tax</span>
                      <span className="font-mono font-bold text-red-600">200.00 ₹ / month</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

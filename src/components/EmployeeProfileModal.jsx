import { useState } from 'react';
import { X } from 'lucide-react';
import { formatDate } from '../lib/mockData';

export function EmployeeProfileModal({ employee, onClose, isAdmin = true }) {
  const [activeTab, setActiveTab] = useState('resume');

  // --- Dynamic Live Salary Calculator State ---
  const [monthWage, setMonthWage] = useState(50000);
  const [workingDays, setWorkingDays] = useState(5);
  const [breakTime, setBreakTime] = useState(1);

  // Auto Calculations based on monthWage
  const yearlyWage = monthWage * 12;
  const basicSalary = monthWage * 0.50; // 50% of Wage
  const hra = basicSalary * 0.50; // 50% of Basic (25% of Wage)
  const standardAllowance = (basicSalary * 0.16668); // ~4167
  const performanceBonus = (basicSalary * 0.0833); // ~2082.50
  const lta = (basicSalary * 0.0833); // ~2082.50
  const subTotalComponents = basicSalary + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, monthWage - subTotalComponents); // Remainder

  // PF & Tax Deductions
  const pfEmployee = basicSalary * 0.12; // 12% of Basic
  const pfEmployer = basicSalary * 0.12; // 12% of Basic
  const professionalTax = 200.00;

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
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-3">ABOUT</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    {employee.about || "No information provided."}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-3">WHAT I LOVE ABOUT MY JOB</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    {employee.job_love || "No information provided."}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-3">MY INTERESTS AND HOBBIES</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    {employee.hobbies || "No information provided."}
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[180px]">
                  <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-4">SKILLS</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(employee.skills || []).length > 0 ? (
                      employee.skills.map(s => <span key={s} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-1 text-xs font-medium text-[#171923] shadow-sm">{s}</span>)
                    ) : (
                      <span className="text-xs text-gray-500">No skills added.</span>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[180px]">
                  <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-4">CERTIFICATION</h3>
                  <div className="space-y-2 mb-4">
                    {(employee.certifications || []).length > 0 ? (
                      employee.certifications.map((c, i) => <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-[#171923] shadow-sm">{c}</div>)
                    ) : (
                      <span className="text-xs text-gray-500">No certifications added.</span>
                    )}
                  </div>
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
                    <span className="text-gray-500 text-xs">Date of Birth</span><span className="font-semibold text-gray-800 text-xs">{employee.dob ? new Date(employee.dob).toLocaleDateString() : '—'}</span>
                    <span className="text-gray-500 text-xs">Nationality</span><span className="font-semibold text-gray-800 text-xs">{employee.nationality || '—'}</span>
                    <span className="text-gray-500 text-xs">Gender</span><span className="font-semibold text-gray-800 text-xs">{employee.gender || '—'}</span>
                    <span className="text-gray-500 text-xs">Marital Status</span><span className="font-semibold text-gray-800 text-xs">{employee.marital_status || '—'}</span>
                    <span className="text-gray-500 text-xs">Personal Email</span><span className="font-semibold text-gray-800 text-xs">{employee.email}</span>
                    <span className="text-gray-500 text-xs">Phone</span><span className="font-semibold text-gray-800 text-xs">{employee.phone}</span>
                    <span className="text-gray-500 text-xs">Joining Date</span><span className="font-semibold text-gray-800 text-xs">{formatDate(employee.joiningDate || new Date())}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-gray-500 text-xs">Account Number</span><span className="font-mono font-bold text-[#502D55] text-xs">{employee.account_number || '—'}</span>
                    <span className="text-gray-500 text-xs">Bank Name</span><span className="font-semibold text-gray-800 text-xs">{employee.bank_name || '—'}</span>
                    <span className="text-gray-500 text-xs">IFSC Code</span><span className="font-mono font-bold text-gray-800 text-xs">{employee.ifsc_code || '—'}</span>
                    <span className="text-gray-500 text-xs">PAN No</span><span className="font-mono font-bold text-gray-800 text-xs">—</span>
                    <span className="text-gray-500 text-xs">UAN No</span><span className="font-mono font-bold text-gray-800 text-xs">—</span>
                    <span className="text-gray-500 text-xs">Employee ID</span><span className="font-mono font-bold text-gray-800 text-xs">{employee.employeeId || employee.login_id || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SALARY INFO TAB (Admin-Only Wireframe Implementation with Real-Time Calculations) */}
          {activeTab === 'salary' && isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8 shadow-sm">
              {/* Header Wage & Schedule Controls (Live Dynamic Inputs) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b border-gray-200">
                {/* Left Wage Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Month Wage</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        value={monthWage}
                        onChange={e => setMonthWage(Math.max(0, Number(e.target.value) || 0))}
                        className="w-36 text-sm font-mono font-bold text-[#502D55] border border-gray-200 rounded-lg px-3 py-1.5 text-right focus:border-[#502D55] focus:outline-none"
                      />
                      <span className="text-xs text-gray-500 font-medium">/ Month</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Yearly wage</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#502D55] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 w-36 text-right">
                        {yearlyWage.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">/ Yearly</span>
                    </div>
                  </div>
                </div>

                {/* Right Schedule Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">No of working days in a week:</span>
                    <input 
                      type="number"
                      value={workingDays}
                      onChange={e => setWorkingDays(Number(e.target.value))}
                      className="w-20 text-xs font-mono font-bold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 text-center focus:border-[#502D55] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Break Time:</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        value={breakTime}
                        onChange={e => setBreakTime(Number(e.target.value))}
                        className="w-20 text-xs font-mono font-bold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 text-center focus:border-[#502D55] focus:outline-none"
                      />
                      <span className="text-xs text-gray-500 font-medium">/ hrs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown: Salary Components (Left) vs PF & Taxes (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Salary Components */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-[#502D55] font-serif uppercase tracking-wider pb-2 border-b border-gray-100">
                    Salary Components
                  </h4>

                  {/* Basic Salary */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">Basic Salary</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-[#171923]">{basicSalary.toFixed(2)} ₹ / month</span>
                        <span className="font-mono font-semibold text-[#502D55]">50.00 %</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">Define Basic salary from company cost compute is based on monthly Wages</p>
                  </div>

                  {/* House Rent Allowance */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">House Rent Allowance</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-[#171923]">{hra.toFixed(2)} ₹ / month</span>
                        <span className="font-mono font-semibold text-[#502D55]">50.00 %</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">HRA provided to employees 50% of the basic salary</p>
                  </div>

                  {/* Standard Allowance */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">Standard Allowance</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-[#171923]">{standardAllowance.toFixed(2)} ₹ / month</span>
                        <span className="font-mono font-semibold text-[#502D55]">16.67 %</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">A standard allowance is a predetermined, fixed amount provided to employee as part of their salary</p>
                  </div>

                  {/* Performance Bonus */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">Performance Bonus</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-[#171923]">{performanceBonus.toFixed(2)} ₹ / month</span>
                        <span className="font-mono font-semibold text-[#502D55]">8.33 %</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary</p>
                  </div>

                  {/* Leave Travel Allowance */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">Leave Travel Allowance</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-[#171923]">{lta.toFixed(2)} ₹ / month</span>
                        <span className="font-mono font-semibold text-[#502D55]">8.33 %</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">LTA is paid by the company to employee to cover their travel expenses and calculated as a % of the basic salary</p>
                  </div>

                  {/* Fixed Allowance */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">Fixed Allowance</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-[#171923]">{fixedAllowance.toFixed(2)} ₹ / month</span>
                        <span className="font-mono font-semibold text-[#502D55]">
                          {monthWage > 0 ? ((fixedAllowance / monthWage) * 100).toFixed(2) : '0.00'} %
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">Fixed allowance portion of wages is determined after calculating all salary components</p>
                  </div>
                </div>

                {/* Right Column: PF Contribution & Tax Deductions */}
                <div className="space-y-6">
                  {/* PF Contribution */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#502D55] font-serif uppercase tracking-wider pb-2 border-b border-gray-100">
                      Provident Fund (PF) Contribution
                    </h4>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-800">Employee</span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-[#171923]">{pfEmployee.toFixed(2)} ₹ / month</span>
                          <span className="font-mono font-semibold text-[#935073]">12.00 %</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 italic">PF is calculated based on the basic salary</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-800">Employer's</span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-[#171923]">{pfEmployer.toFixed(2)} ₹ / month</span>
                          <span className="font-mono font-semibold text-[#935073]">12.00 %</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 italic">PF is calculated based on the basic salary</p>
                    </div>
                  </div>

                  {/* Tax Deductions */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold text-[#502D55] font-serif uppercase tracking-wider pb-2 border-b border-gray-100">
                      Tax Deductions
                    </h4>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-800">Professional Tax</span>
                        <span className="font-mono font-bold text-red-600">{professionalTax.toFixed(2)} ₹ / month</span>
                      </div>
                      <p className="text-[11px] text-gray-400 italic">Professional Tax deducted from the gross salary</p>
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

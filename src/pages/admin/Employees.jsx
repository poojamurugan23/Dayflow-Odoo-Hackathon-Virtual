import { useState, useEffect } from 'react';
import { DEPARTMENTS, formatDate } from '../../lib/mockData';
import { Search, Plus, LayoutGrid, List, Eye, Edit3, X, Loader2, ChevronDown, ChevronUp, Mail, Phone, Briefcase } from 'lucide-react';
import { EmployeeProfileModal } from '../../components/EmployeeProfileModal';

/* ── Salary auto-calc helper ──────────────────────────────── */
function calcSalary(monthWage) {
  const w = Number(monthWage) || 0;
  const basic        = w * 0.50;
  const hra          = basic * 0.50;
  const std          = basic * 0.16668;
  const perf         = basic * 0.0833;
  const lta          = basic * 0.0833;
  const fixed        = Math.max(0, w - (basic + hra + std + perf + lta));
  const pfEmp        = basic * 0.12;
  const pfEmpr       = basic * 0.12;
  const proTax       = 200;
  const yearlyWage   = w * 12;
  return { yearlyWage, basic, hra, std, perf, lta, fixed, pfEmp, pfEmpr, proTax };
}

function fmt(n) { return n.toFixed(2); }

/* ── Salary Preview Panel ─────────────────────────────────── */
function SalaryPreview({ monthWage }) {
  const [open, setOpen] = useState(true);
  const s = calcSalary(monthWage);

  if (!monthWage || Number(monthWage) <= 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-[#502D55]/20 bg-[#502D55]/3 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#502D55]/8 hover:bg-[#502D55]/12 text-xs font-bold text-[#502D55] uppercase tracking-wider transition-colors">
        <span>Salary Auto-Calculation Preview</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="p-4 space-y-4 text-xs">
          {/* Wage summary */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
            <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100">
              <span className="text-gray-500 font-medium">Month Wage</span>
              <span className="font-mono font-bold text-[#502D55]">₹{Number(monthWage).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100">
              <span className="text-gray-500 font-medium">Yearly Wage</span>
              <span className="font-mono font-bold text-[#502D55]">₹{s.yearlyWage.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Salary Components */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Salary Components</p>
            <div className="space-y-1.5">
              {[
                { name: 'Basic Salary',          amt: s.basic, pct: '50.00', desc: 'Define Basic salary from company cost compute based on monthly Wages' },
                { name: 'House Rent Allowance',  amt: s.hra,   pct: '50.00', desc: 'HRA provided to employees 50% of the basic salary' },
                { name: 'Standard Allowance',    amt: s.std,   pct: '16.67', desc: 'A standard allowance is a predetermined, fixed amount provided as part of their salary' },
                { name: 'Performance Bonus',     amt: s.perf,  pct: '8.33',  desc: 'Variable amount paid during payroll, calculated as a % of the basic salary' },
                { name: 'Leave Travel Allowance',amt: s.lta,   pct: '8.33',  desc: 'LTA to cover travel expenses, calculated as a % of the basic salary' },
                { name: 'Fixed Allowance',       amt: s.fixed, pct: fmt(s.fixed / (Number(monthWage) || 1) * 100), desc: 'Remaining fixed allowance after all other components' },
              ].map(c => (
                <div key={c.name} className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-700">{c.name}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-mono font-bold text-[#171923]">₹{fmt(c.amt)}</span>
                      <span className="text-[#502D55] font-bold w-14 text-right">{c.pct}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 italic">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PF */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Provident Fund (PF) Contribution</p>
            <div className="space-y-1.5">
              {[{ name: 'Employee PF', amt: s.pfEmp }, { name: "Employer's PF", amt: s.pfEmpr }].map(p => (
                <div key={p.name} className="bg-white rounded-lg px-3 py-2 border border-gray-100 flex justify-between items-center">
                  <span className="font-semibold text-gray-700">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#171923]">₹{fmt(p.amt)}</span>
                    <span className="text-[#935073] font-bold w-14 text-right">12.00%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tax Deductions</p>
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Professional Tax</span>
              <span className="font-mono font-bold text-red-600">₹200.00 / month</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export function AdminEmployees() {
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showToast, setShowToast] = useState(null);

  // Real data state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addedEmployeeData, setAddedEmployeeData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Salary state for the Add modal — live auto-calc
  const [monthWage, setMonthWage] = useState('');

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch('http://localhost:5000/api/data/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map(emp => ({
          ...emp, // Spread all fields including new schema fields
          id: emp._id,
          employeeId: emp.login_id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone || '+91 98765 43210',
          department: emp.department,
          position: emp.position,
          companyName: emp.company_name || 'Odoo India',
          manager: 'HR Department',
          status: emp.status || 'Active',
          joiningDate: emp.joining_date || new Date(),
          avatar: emp.name ? emp.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'EM'
        }));
        setEmployees(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    const form = e.target;

    try {
      const token = localStorage.getItem('dayflow_token');
      const userStr = localStorage.getItem('dayflow_user');
      const adminUser = userStr ? JSON.parse(userStr) : null;

      const response = await fetch('http://localhost:5000/api/data/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name.value,
          email: form.email.value,
          phone: form.phone.value,
          department: form.department.value,
          position: form.position.value,
          companyName: adminUser?.company_name || 'Odoo India',
          joiningDate: form.joiningDate.value,
          monthWage: Number(monthWage) || 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        const s = calcSalary(monthWage);
        setAddedEmployeeData({
          loginId: result.user.login_id,
          password: result.generatedPassword,
          salary: monthWage ? { monthWage: Number(monthWage), ...s } : null
        });
        toast('Employee added successfully!');
        fetchEmployees();
      } else {
        const err = await response.json();
        toast(`Error: ${err.message}`);
      }
    } catch (error) {
      toast('Failed to add employee');
    } finally {
      setAddLoading(false);
    }
  };

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  const filtered = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-[#502D55]" size={32} /></div>;

  return (
    <div className="space-y-6">
      {showToast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg">{showToast}</div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Employees</h1>
          <p className="mt-1 text-sm text-[#6B7280]">{employees.length} employees in your organization.</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setMonthWage(''); }} className="inline-flex items-center gap-2 rounded-lg bg-[#502D55] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5a3256] transition-colors">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded-lg text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]">
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('table')} className={`p-2.5 transition-colors ${view === 'table' ? 'bg-gray-100 text-[#171923]' : 'bg-white text-gray-400 hover:text-gray-700'}`}><List size={18} /></button>
            <button onClick={() => setView('grid')} className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-gray-100 text-[#171923]' : 'bg-white text-gray-400 hover:text-gray-700'}`}><LayoutGrid size={18} /></button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Manager</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Joined</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#502D55] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{emp.avatar}</div>
                        <div><p className="font-medium text-[#171923]">{emp.name}</p><p className="text-xs text-[#6B7280]">{emp.email}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280] font-mono text-xs">{emp.employeeId}</td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{emp.department}</td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{emp.position}</td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{emp.manager}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        emp.status === 'Active' ? 'bg-green-50 text-green-700' : emp.status === 'On Leave' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-600'
                      }`}>{emp.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280] text-xs">{formatDate(emp.joiningDate)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedEmployee(emp)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#502D55]" title="View Profile"><Eye size={16} /></button>
                        <button onClick={() => toast(`Editing ${emp.name}'s profile`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#502D55]" title="Edit"><Edit3 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center"><p className="text-sm text-[#6B7280]">No employees match your filters.</p></div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(emp => (
            <div key={emp.id} onClick={() => setSelectedEmployee(emp)}
              className="bg-white rounded-xl border border-gray-200 p-5 relative cursor-pointer hover:border-[#502D55]/40 hover:shadow-md transition-all group flex flex-col h-full"
            >
              {/* Header: Avatar + Details */}
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#502D55] to-[#935073] text-white flex items-center justify-center text-lg font-bold shadow-sm group-hover:scale-105 transition-transform shrink-0">
                    {emp.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-white">
                    <span className={`flex items-center justify-center h-3 w-3 rounded-full ring-2 ring-white shadow-sm ${
                      emp.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 pt-1 text-left">
                  <h3 className="text-sm font-bold text-[#171923] truncate leading-tight">{emp.name}</h3>
                  <p className="text-xs text-[#502D55] font-semibold mt-1 truncate">{emp.position}</p>
                  <p className="text-[11px] text-gray-500 font-medium truncate flex items-center gap-1 mt-0.5">
                    <Briefcase size={10} /> {emp.department}
                  </p>
                </div>
              </div>

              {/* Body: Contact Info */}
              <div className="space-y-2 mb-4 w-full">
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
              <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap items-end justify-between gap-2 w-full">
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

      {/* Comprehensive View-Only Employee Profile Modal */}
      {selectedEmployee && (
        <EmployeeProfileModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}

      {/* Add Employee Modal with Salary Auto-Calc */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (!addedEmployeeData) { setShowAddModal(false); setMonthWage(''); } }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-[#171923] font-serif">Add New Employee</h3>
              <button onClick={() => { setShowAddModal(false); setAddedEmployeeData(null); setMonthWage(''); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={20} />
              </button>
            </div>

            {addedEmployeeData ? (
              /* ─ Success screen ─ */
              <div className="p-8 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-[#171923] mb-2">Employee Created Successfully!</h3>
                <p className="text-sm text-gray-500 mb-6">Share these credentials securely with the employee.</p>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4 space-y-3 text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-500">Login ID:</span>
                    <span className="font-mono font-bold text-[#502D55]">{addedEmployeeData.loginId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Auto-Generated Password:</span>
                    <span className="font-mono font-bold text-[#502D55]">{addedEmployeeData.password}</span>
                  </div>
                </div>

                {addedEmployeeData.salary && (
                  <div className="bg-[#502D55]/4 rounded-xl border border-[#502D55]/15 p-4 mb-6 text-left">
                    <p className="text-xs font-bold text-[#502D55] uppercase tracking-wider mb-3">Salary Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Month Wage</span><span className="font-bold text-[#502D55]">₹{addedEmployeeData.salary.monthWage.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Yearly</span><span className="font-bold text-[#502D55]">₹{addedEmployeeData.salary.yearlyWage.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Basic</span><span className="font-mono">₹{fmt(addedEmployeeData.salary.basic)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">HRA</span><span className="font-mono">₹{fmt(addedEmployeeData.salary.hra)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Std Allowance</span><span className="font-mono">₹{fmt(addedEmployeeData.salary.std)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Perf Bonus</span><span className="font-mono">₹{fmt(addedEmployeeData.salary.perf)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">LTA</span><span className="font-mono">₹{fmt(addedEmployeeData.salary.lta)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Fixed Allow.</span><span className="font-mono">₹{fmt(addedEmployeeData.salary.fixed)}</span></div>
                    </div>
                  </div>
                )}

                <button onClick={() => { setShowAddModal(false); setAddedEmployeeData(null); setMonthWage(''); }} className="w-full rounded-xl bg-[#502D55] py-2.5 text-sm font-bold text-white hover:bg-[#5a3256]">Done</button>
              </div>
            ) : (
              /* ─ Form ─ */
              <form onSubmit={handleAddEmployee} className="p-6 space-y-6">
                
                {/* Section 1: Personal Details */}
                <div>
                  <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Personal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Full Name <span className="text-red-500">*</span></label>
                      <input name="name" type="text" required placeholder="e.g. Jane Doe" className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <input name="email" type="email" required placeholder="jane@example.com" className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Phone Number</label>
                      <input name="phone" type="tel" placeholder="+91 98765 43210" className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all placeholder:text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Section 2: Job Details */}
                <div>
                  <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Job Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Department <span className="text-red-500">*</span></label>
                      <select name="department" className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all">
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Position <span className="text-red-500">*</span></label>
                      <input name="position" type="text" required placeholder="e.g. Senior Engineer" className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all placeholder:text-gray-400" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Joining Date <span className="text-red-500">*</span></label>
                      <input name="joiningDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all text-gray-700" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Compensation & Schedule */}
                <div>
                  <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Compensation & Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Monthly Wage (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">₹</span>
                        <input
                          type="number"
                          value={monthWage}
                          onChange={e => setMonthWage(e.target.value)}
                          placeholder="50000"
                          min="0"
                          className="block w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all font-mono placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Working Days/Wk</label>
                      <input
                        type="number"
                        defaultValue={5}
                        min="1" max="7"
                        className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all font-mono"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-[#171923] mb-1.5">Break Time (hrs)</label>
                      <input
                        type="number"
                        defaultValue={1}
                        min="0" max="24"
                        className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Salary Preview — appears as soon as wage is typed */}
                <div className="mt-4">
                  <SalaryPreview monthWage={monthWage} />
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
                  <button type="button" onClick={() => { setShowAddModal(false); setMonthWage(''); }} className="rounded-lg bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={addLoading} className="rounded-lg bg-[#502D55] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#5a3256] disabled:opacity-70 transition-colors flex items-center gap-2 shadow-md shadow-[#502D55]/20">
                    {addLoading ? <Loader2 className="animate-spin" size={16} /> : null}Create Employee
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

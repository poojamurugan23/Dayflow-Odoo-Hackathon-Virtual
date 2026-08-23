import { useState, useRef } from 'react';
import { X, Save, Edit3, Loader2, Download, Printer } from 'lucide-react';
import { formatDate } from '../lib/mockData';

export function EmployeeProfileModal({ employee, onClose, isHrView = false, refreshList }) {
  const [activeTab, setActiveTab] = useState('resume');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...employee });

  const canEdit = !isHrView || employee.role === 'employee';

  const TABS = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    { id: 'salary', label: 'Salary Info' },
    { id: 'idcard', label: 'ID Card' },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`http://localhost:5000/api/data/employees/${employee.id || employee._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsEditing(false);
        if (refreshList) refreshList();
      }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-5xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Premium Header Section */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#171923] via-[#2D1B33] to-[#502D55] p-8 text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
            {canEdit && (
              <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md transition-all ${isEditing ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? <Save size={16} /> : <Edit3 size={16} />)}
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
            )}
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all">
              <X size={18} />
            </button>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center text-white text-4xl font-bold relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {employee.profile_picture ? (
                <img src={employee.profile_picture} alt={employee.name} className="h-full w-full object-cover" />
              ) : (
                employee.avatar || employee.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()
              )}
            </div>
            <div className="pb-2">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold font-serif tracking-tight">{employee.name}</h2>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${employee.status === 'Active' || !employee.status ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'}`}>
                  {employee.status || 'Active'}
                </span>
                {employee.role === 'hr' && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">HR</span>}
              </div>
              <p className="text-sm text-gray-300 font-medium tracking-wide">{employee.position} <span className="opacity-50 mx-1">•</span> {employee.department}</p>
            </div>
          </div>
        </div>

        {/* Elegant Tabs Row */}
        <div className="px-8 border-b border-gray-100 bg-white shrink-0 relative z-10 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.1)]">
          <div className="flex gap-1 pt-4">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all relative overflow-hidden ${activeTab === t.id ? 'text-[#502D55] bg-gray-50/80 border-t border-l border-r border-gray-100' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'}`}>
                {activeTab === t.id && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#502D55] to-[#935073]"></div>}
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
                  {isEditing ? (
                    <textarea name="about" value={formData.about || ''} onChange={handleChange} rows="3" className="w-full text-xs text-[#171923] p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#502D55]" />
                  ) : (
                    <p className="text-xs text-[#6B7280] leading-relaxed">{employee.about || "No information provided."}</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-3">WHAT I LOVE ABOUT MY JOB</h3>
                  {isEditing ? (
                    <textarea name="job_love" value={formData.job_love || ''} onChange={handleChange} rows="3" className="w-full text-xs text-[#171923] p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#502D55]" />
                  ) : (
                    <p className="text-xs text-[#6B7280] leading-relaxed">{employee.job_love || "No information provided."}</p>
                  )}
                </div>
                {employee.resume_url && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-1">Attached Resume</h3>
                      <p className="text-xs text-[#6B7280]">Download or view the employee's uploaded resume.</p>
                    </div>
                    <a href={employee.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#502D55] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#683b6e] transition-colors shadow-md">
                      <Download size={16} /> Download
                    </a>
                  </div>
                )}
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
                    <span className="text-gray-500 text-xs flex items-center">Date of Birth</span>
                    {isEditing ? <input type="date" name="dob" value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''} onChange={handleChange} className="border p-1 text-xs rounded w-full" /> : <span className="font-semibold text-gray-800 text-xs">{employee.dob ? new Date(employee.dob).toLocaleDateString() : '—'}</span>}
                    
                    <span className="text-gray-500 text-xs flex items-center">Gender</span>
                    {isEditing ? (
                      <select name="gender" value={formData.gender || ''} onChange={handleChange} className="border p-1 text-xs rounded w-full">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : <span className="font-semibold text-gray-800 text-xs">{employee.gender || '—'}</span>}
                    
                    <span className="text-gray-500 text-xs flex items-center">Personal Email</span>
                    {isEditing ? <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="border p-1 text-xs rounded w-full" /> : <span className="font-semibold text-gray-800 text-xs">{employee.email}</span>}
                    
                    <span className="text-gray-500 text-xs flex items-center">Phone</span>
                    {isEditing ? <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="border p-1 text-xs rounded w-full" /> : <span className="font-semibold text-gray-800 text-xs">{employee.phone}</span>}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-gray-500 text-xs flex items-center">Account Number</span>
                    {isEditing ? <input type="text" name="account_number" value={formData.account_number || ''} onChange={handleChange} className="border p-1 text-xs rounded w-full font-mono" /> : <span className="font-mono font-bold text-[#502D55] text-xs">{employee.account_number || '—'}</span>}
                    
                    <span className="text-gray-500 text-xs flex items-center">Bank Name</span>
                    {isEditing ? <input type="text" name="bank_name" value={formData.bank_name || ''} onChange={handleChange} className="border p-1 text-xs rounded w-full" /> : <span className="font-semibold text-gray-800 text-xs">{employee.bank_name || '—'}</span>}
                    
                    <span className="text-gray-500 text-xs flex items-center">IFSC Code</span>
                    {isEditing ? <input type="text" name="ifsc_code" value={formData.ifsc_code || ''} onChange={handleChange} className="border p-1 text-xs rounded w-full font-mono" /> : <span className="font-mono font-bold text-gray-800 text-xs">{employee.ifsc_code || '—'}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SALARY INFO TAB */}
          {activeTab === 'salary' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-[#171923] font-serif">Salary Details</h3>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">Gross Wage: ₹</span>
                    <input type="number" name="month_wage" value={formData.month_wage || ''} onChange={handleChange} className="border border-gray-300 rounded p-1 w-24 text-right font-mono" />
                  </div>
                ) : (
                  <span className="px-3 py-1 bg-green-50 text-green-700 font-bold rounded-full text-xs border border-green-200">
                    Gross: ₹{(employee.month_wage || 0).toLocaleString('en-IN')} / month
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50 pb-2">Components (Monthly)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-gray-600 font-semibold">Basic (50%)</span><span className="font-mono font-bold text-[#171923]">₹{((employee.month_wage || 0) * 0.50).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600 font-semibold">HRA (20%)</span><span className="font-mono font-bold text-[#171923]">₹{((employee.month_wage || 0) * 0.20).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600 font-semibold">Allowances (20%)</span><span className="font-mono font-bold text-[#171923]">₹{((employee.month_wage || 0) * 0.20).toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50 pb-2">Deductions (Monthly)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-red-600 font-semibold">PF Deduction (10%)</span><span className="font-mono font-bold text-red-600">₹{((employee.month_wage || 0) * 0.10).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-red-600 font-semibold">Professional Tax</span><span className="font-mono font-bold text-red-600">₹200.00</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ID CARD TAB */}
          {activeTab === 'idcard' && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
              <button className="mb-6 flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors" onClick={() => window.print()}>
                <Printer size={16} /> Print ID Card
              </button>
              
              {/* ID Card UI */}
              <div id="print-id-card" className="w-[300px] h-[480px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col">
                <div className="h-32 bg-gradient-to-br from-[#502D55] to-[#935073] relative flex justify-center pt-6">
                  <h1 className="text-white font-bold tracking-widest text-lg uppercase">{employee.company_name || 'Odoo India'}</h1>
                  <div className="absolute -bottom-16 w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                    {employee.profile_picture ? (
                      <img src={employee.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400 font-bold">{employee.avatar}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 mt-20 px-6 text-center flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{employee.name}</h2>
                  <p className="text-sm text-[#502D55] font-semibold mt-1 uppercase tracking-wide">{employee.position}</p>
                  <div className="w-12 h-1 bg-gray-200 rounded my-4"></div>
                  
                  <div className="w-full space-y-2 text-left bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex flex-col text-xs">
                      <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Employee ID</span>
                      <span className="font-mono font-bold text-gray-800 text-sm">{employee.employeeId || employee.login_id}</span>
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Department</span>
                      <span className="font-semibold text-gray-800">{employee.department}</span>
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Blood Group</span>
                      <span className="font-bold text-red-600">O+</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-10 bg-gray-900 text-center flex items-center justify-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Authorized Signature</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

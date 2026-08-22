import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Phone, Edit3, Plus, CheckCircle, Save } from 'lucide-react';

export function AdminProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resume');
  const [showToast, setShowToast] = useState(null);
  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  // Resume state
  const [about, setAbout] = useState("Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.");
  const [loveJob, setLoveJob] = useState("Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.");
  const [hobbies, setHobbies] = useState("Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.");
  const [skills, setSkills] = useState(['Leadership', 'HR Management', 'Payroll', 'Compliance', 'Team Building']);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [certifications, setCertifications] = useState(['SHRM-CP Certified', 'PMP – Project Management Professional']);
  const [newCert, setNewCert] = useState('');
  const [showCertInput, setShowCertInput] = useState(false);

  // Private Info state
  const [info, setInfo] = useState({
    dob: '1988-06-20', residingAddress: 'House 12, MG Road, Bangalore, Karnataka',
    nationality: 'Indian', personalEmail: 'admin.personal@gmail.com',
    gender: 'Female', maritalStatus: 'Married', dateOfJoining: '2020-01-05',
    accountNumber: '50100123456789', bankName: 'HDFC Bank', ifscCode: 'HDFC0002345',
    panNo: 'FGHIJ5678K', uanNo: '100987654321', pinCode: '560001'
  });
  const upd = (k, v) => setInfo(p => ({ ...p, [k]: v }));

  // Salary state — live auto-calc
  const [monthWage, setMonthWage] = useState(50000);
  const [workingDays, setWorkingDays] = useState(5);
  const [breakTime, setBreakTime] = useState(1);
  const yearlyWage = monthWage * 12;
  const basic = monthWage * 0.50;
  const hra = basic * 0.50;
  const std = basic * 0.16668;
  const perf = basic * 0.0833;
  const lta = basic * 0.0833;
  const fixed = Math.max(0, monthWage - (basic + hra + std + perf + lta));
  const pfEmp = basic * 0.12;
  const pfEmpr = basic * 0.12;

  // Exactly 3 tabs — as per wireframe
  const TABS = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    { id: 'salary', label: 'Salary Info' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {showToast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />{showToast}
          </div>
        </div>
      )}

      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">My Profile</h1>
        <p className="mt-1 text-xs text-[#6B7280]">Manage your admin profile, resume, private info and salary details.</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#502D55] to-[#935073] text-white flex items-center justify-center text-3xl font-bold">
                {(user?.name || 'My Name').split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <button onClick={() => toast('Upload photo')} className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white border border-gray-200 text-[#502D55] shadow-sm hover:bg-gray-50">
                <Edit3 size={13} />
              </button>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#171923] font-serif">{user?.name || 'My Name'}</h2>
              <p className="text-xs text-[#6B7280]">Login ID: <span className="font-mono font-bold text-[#502D55]">{user?.employeeId || user?.login_id || 'OIADM20260001'}</span></p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1.5"><Mail size={12} className="text-gray-400" />{user?.email || 'admin@dayflow.demo'}</p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1.5"><Phone size={12} className="text-gray-400" />{user?.phone || '+91 98765 00001'}</p>
            </div>
          </div>
          <div className="w-full lg:w-72 bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5 text-xs">
            {[['Company', user?.company_name || 'Odoo India'], ['Department', user?.department || 'Human Resources'], ['Manager', 'Board of Directors'], ['Location', 'Bangalore, India']].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">{k}</span>
                <span className="font-semibold text-[#171923]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${activeTab === t.id ? 'bg-[#502D55] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── RESUME ─── */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {[{ title: 'About', val: about, set: setAbout }, { title: 'What I love about my job', val: loveJob, set: setLoveJob }, { title: 'My interests and hobbies', val: hobbies, set: setHobbies }].map(sec => (
              <div key={sec.title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-3">{sec.title}</h3>
                <textarea value={sec.val} onChange={e => sec.set(e.target.value)} rows={4}
                  className="w-full text-xs text-[#6B7280] leading-relaxed border-0 focus:ring-1 focus:ring-[#502D55] rounded-lg p-2 bg-gray-50/50 resize-none" />
              </div>
            ))}
          </div>
          <div className="space-y-5">
            {/* Skills */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[180px]">
              <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map(s => <span key={s} className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-medium text-[#171923]">{s}</span>)}
              </div>
              {showSkillInput && (
                <form onSubmit={e => { e.preventDefault(); if (!newSkill.trim()) return; setSkills([...skills, newSkill.trim()]); setNewSkill(''); setShowSkillInput(false); toast('Skill added'); }} className="mb-3 flex gap-2">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Enter skill..." autoFocus className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#502D55]" />
                  <button type="submit" className="px-3 py-1.5 bg-[#502D55] text-white text-xs font-semibold rounded-lg">Add</button>
                </form>
              )}
              <button onClick={() => setShowSkillInput(!showSkillInput)} className="text-xs font-semibold text-[#502D55] flex items-center gap-1 hover:text-[#935073]">
                <Plus size={13} />+ Add Skills
              </button>
            </div>
            {/* Certifications */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[180px]">
              <h3 className="text-xs font-bold text-[#171923] uppercase tracking-wider mb-4">Certification</h3>
              <div className="space-y-2 mb-4">
                {certifications.map((c, i) => <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-[#171923]">{c}</div>)}
              </div>
              {showCertInput && (
                <form onSubmit={e => { e.preventDefault(); if (!newCert.trim()) return; setCertifications([...certifications, newCert.trim()]); setNewCert(''); setShowCertInput(false); toast('Certification added'); }} className="mb-3 flex gap-2">
                  <input type="text" value={newCert} onChange={e => setNewCert(e.target.value)} placeholder="Enter certification..." autoFocus className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#502D55]" />
                  <button type="submit" className="px-3 py-1.5 bg-[#502D55] text-white text-xs font-semibold rounded-lg">Add</button>
                </form>
              )}
              <button onClick={() => setShowCertInput(!showCertInput)} className="text-xs font-semibold text-[#502D55] flex items-center gap-1 hover:text-[#935073]">
                <Plus size={13} />+ Add Skills
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRIVATE INFO ─── */}
      {activeTab === 'private' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#171923] font-serif">Private Information</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Confidential personal and banking information.</p>
            </div>
            <button onClick={() => toast('Details saved successfully')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#502D55] text-white text-xs font-bold hover:bg-[#3e2342] transition-colors">
              <Save size={13} />Save Details
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">Personal Information</h4>
              <F label="Date of Birth" type="date" value={info.dob} onChange={v => upd('dob', v)} />
              <F label="Residing Address" value={info.residingAddress} onChange={v => upd('residingAddress', v)} />
              <div className="grid grid-cols-2 gap-3">
                <F label="Nationality" value={info.nationality} onChange={v => upd('nationality', v)} />
                <S label="Gender" value={info.gender} options={['Female', 'Male', 'Other']} onChange={v => upd('gender', v)} />
              </div>
              <F label="Personal Email" type="email" value={info.personalEmail} onChange={v => upd('personalEmail', v)} />
              <div className="grid grid-cols-2 gap-3">
                <S label="Marital Status" value={info.maritalStatus} options={['Single', 'Married']} onChange={v => upd('maritalStatus', v)} />
                <F label="Date of Joining" type="date" value={info.dateOfJoining} onChange={v => upd('dateOfJoining', v)} />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">Bank Details</h4>
              <F label="Account Number" mono value={info.accountNumber} onChange={v => upd('accountNumber', v)} />
              <div className="grid grid-cols-2 gap-3">
                <F label="Bank Name" value={info.bankName} onChange={v => upd('bankName', v)} />
                <F label="IFSC Code" mono value={info.ifscCode} onChange={v => upd('ifscCode', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="PAN No" mono value={info.panNo} onChange={v => upd('panNo', v)} />
                <F label="UAN No" mono value={info.uanNo} onChange={v => upd('uanNo', v)} />
              </div>
              <F label="Pin Code" mono value={info.pinCode} onChange={v => upd('pinCode', v)} />
            </div>
          </div>
        </div>
      )}

      {/* ─── SALARY INFO (Admin only — always visible) ─── */}
      {activeTab === 'salary' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8 shadow-sm">
          {/* Wage & Schedule Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b border-gray-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Month Wage</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={monthWage} onChange={e => setMonthWage(Math.max(0, Number(e.target.value)))}
                    className="w-36 text-sm font-mono font-bold text-[#502D55] border border-gray-200 rounded-lg px-3 py-1.5 text-right focus:border-[#502D55] focus:outline-none" />
                  <span className="text-xs text-gray-500">/ Month</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Yearly wage</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#502D55] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 w-36 text-right block">
                    {yearlyWage.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-500">/ Yearly</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">No of working days in a week:</span>
                <input type="number" value={workingDays} onChange={e => setWorkingDays(Number(e.target.value))}
                  className="w-20 text-xs font-mono font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 text-center focus:border-[#502D55] focus:outline-none" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Break Time:</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={breakTime} onChange={e => setBreakTime(Number(e.target.value))}
                    className="w-20 text-xs font-mono font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 text-center focus:border-[#502D55] focus:outline-none" />
                  <span className="text-xs text-gray-500">/ hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Salary Components */}
            <div className="space-y-5">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">Salary Components</h4>
              {[
                { name: 'Basic Salary', amt: basic, pct: '50.00', desc: 'Define Basic salary from company cost compute it based on monthly Wages' },
                { name: 'House Rent Allowance', amt: hra, pct: '50.00', desc: 'HRA provided to employees 50% of the basic salary' },
                { name: 'Standard Allowance', amt: std, pct: '16.67', desc: 'A standard allowance is a predetermined, fixed amount provided to employee as part of their salary' },
                { name: 'Performance Bonus', amt: perf, pct: '8.33', desc: 'Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary' },
                { name: 'Leave Travel Allowance', amt: lta, pct: '8.33', desc: 'LTA is paid by the company to employees to cover their travel expenses and calculated as a % of the basic salary' },
                { name: 'Fixed Allowance', amt: fixed, pct: monthWage > 0 ? ((fixed / monthWage) * 100).toFixed(2) : '0.00', desc: 'Fixed allowance portion of wages is determined after calculating all salary components' },
              ].map(c => (
                <div key={c.name} className="space-y-0.5">
                  <div className="flex justify-between items-start text-xs gap-2">
                    <span className="font-semibold text-gray-800 shrink-0">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#171923]">{c.amt.toFixed(2)} ₹ / month</span>
                      <span className="font-mono font-semibold text-[#502D55] w-14 text-right">{c.pct} %</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 italic">{c.desc}</p>
                </div>
              ))}
            </div>

            {/* Right: PF + Tax */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100 mb-4">Provident Fund (PF) Contribution</h4>
                {[{ name: 'Employee', amt: pfEmp }, { name: "Employer's", amt: pfEmpr }].map(p => (
                  <div key={p.name} className="space-y-0.5 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#171923]">{p.amt.toFixed(2)} ₹ / month</span>
                        <span className="font-mono font-semibold text-[#935073] w-14 text-right">12.00 %</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">PF is calculated based on the basic salary</p>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100 mb-4">Tax Deductions</h4>
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800">Professional Tax</span>
                    <span className="font-mono font-bold text-red-600">200.00 ₹ / month</span>
                  </div>
                  <p className="text-[11px] text-gray-400 italic">Professional Tax deducted from the gross salary</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function F({ label, value, onChange, type = 'text', mono = false }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full text-xs ${mono ? 'font-mono font-bold' : 'font-semibold'} border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none`} />
    </div>
  );
}

function S({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

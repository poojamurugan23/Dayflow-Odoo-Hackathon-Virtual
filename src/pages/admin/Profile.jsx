import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import API_BASE, { getAvatarUrl } from '../../lib/api';
import { Mail, Phone, Edit3, Plus, CheckCircle, Save, Upload, Edit, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';

export function AdminProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resume');
  const [showToast, setShowToast] = useState(null);
  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };
  const [isEditingPrivateInfo, setIsEditingPrivateInfo] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  // Resume state
  const [about, setAbout] = useState('');
  const [loveJob, setLoveJob] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [newCert, setNewCert] = useState('');
  const [showCertInput, setShowCertInput] = useState(false);

  // Private Info state
  const [info, setInfo] = useState({
    dob: '', residingAddress: '', nationality: '', personalEmail: '',
    gender: '', maritalStatus: '', dateOfJoining: '',
    accountNumber: '', bankName: '', ifscCode: '', panNo: '', uanNo: '', pinCode: ''
  });
  const upd = (k, v) => setInfo(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (user) {
      setAbout(user.about || '');
      setLoveJob(user.job_love || '');
      setHobbies(user.hobbies || '');
      setSkills(user.skills || []);
      setCertifications(user.certifications || []);
      setInfo({
        dob: user.dob ? user.dob.split('T')[0] : '', 
        residingAddress: user.address || '',
        nationality: user.nationality || '', 
        personalEmail: user.email || '',
        gender: user.gender || '', 
        maritalStatus: user.marital_status || '', 
        dateOfJoining: user.joining_date ? user.joining_date.split('T')[0] : '',
        accountNumber: user.account_number || '', 
        bankName: user.bank_name || '', 
        ifscCode: user.ifsc_code || '',
        panNo: user.panNo || '', 
        uanNo: user.uanNo || '', 
        pinCode: user.pinCode || ''
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/employees/${user._id || user.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          about, job_love: loveJob, hobbies, skills, certifications,
          dob: info.dob, address: info.residingAddress, nationality: info.nationality,
          gender: info.gender, marital_status: info.maritalStatus, joining_date: info.dateOfJoining,
          account_number: info.accountNumber, bank_name: info.bankName, ifsc_code: info.ifscCode,
          panNo: info.panNo, uanNo: info.uanNo, pinCode: info.pinCode
        })
      });
      if (response.ok) {
        toast('Details saved to database successfully!');
      } else {
        toast('Failed to save details.');
      }
    } catch (error) {
      toast('Error saving details.');
    }
  };

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

  const TABS = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    { id: 'idcard', label: 'ID Card' },
  ];

  const handleDownloadIdCard = async () => {
    const element = document.getElementById('print-id-card');
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { 
        quality: 1, 
        pixelRatio: 3, 
        cacheBust: true,
        fontEmbedCSS: '',
        style: { margin: '0', transform: 'none' }
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ID_Card_${(user?.name || 'HR').replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download ID card', error);
    }
  };

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
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-xl bg-gray-100 flex items-center justify-center">
              <img src={getAvatarUrl(user)} alt={user?.name || 'My Name'} className="w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#171923] font-serif">{user?.name || 'My Name'}</h2>
              <p className="text-xs text-[#6B7280]">Login ID: <span className="font-mono font-bold text-[#502D55]">{user?.employeeId || user?.login_id || 'OIADM20260001'}</span></p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1.5"><Mail size={12} className="text-gray-400" />{user?.email || 'admin@dayflow.demo'}</p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1.5"><Phone size={12} className="text-gray-400" />{user?.phone || '+91 98765 00001'}</p>
            </div>
          </div>
          <div className="w-full lg:w-72 bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5 text-xs">
            {[['Company', user?.company_name || 'Odoo India'], ['Department', user?.department || 'Administration'], ['Role', (user?.role || 'admin').toUpperCase()], ['Status', user?.status || 'Active']].map(([k, v]) => (
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
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#171923]">Upload Resume</h3>
                <p className="text-xs text-gray-500">Upload your PDF or DOCX resume to auto-fill details.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">
                  <Save size={14} /> Save Resume
                </button>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#502D55] text-white rounded-lg text-xs font-semibold hover:bg-[#3e2342] transition-colors">
                  <Upload size={14} /> Auto-fill
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={async (e) => {
                    if (e.target.files.length > 0) {
                      const file = e.target.files[0];
                      toast('Resume uploaded! Parsing document...');
                      try {
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const fileContent = event.target.result;
                          const token = localStorage.getItem('dayflow_token');
                          const res = await fetch(`${API_BASE}/api/data/profile/parse-resume`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: file.name, content: fileContent })
                          });
                          
                          if (res.ok) {
                            const data = await res.json();
                            if (data.about) setAbout(data.about);
                            if (data.skills) setSkills(data.skills);
                            if (data.certifications) setCertifications(data.certifications);
                            
                            setInfo(prev => ({
                              ...prev,
                              personalEmail: data.personal_email || prev.personalEmail,
                              phone: data.phone || prev.phone
                            }));

                            toast('Resume autofilled successfully!');
                            setResumeUploaded(true);
                          } else {
                            toast('Failed to parse resume');
                          }
                        };
                        reader.readAsDataURL(file);
                      } catch (error) {
                        toast('Error uploading resume');
                      }
                    }
                  }} />
                </label>
              </div>
            </div>
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
                {skills.map((s, i) => <span key={`${s}-${i}`} className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-medium text-[#171923]">{s}</span>)}
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm relative">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#171923] font-serif flex items-center gap-2">
                Private Information
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Confidential personal and banking information.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditingPrivateInfo(!isEditingPrivateInfo)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${isEditingPrivateInfo ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-[#502D55] hover:bg-gray-200'}`}>
                <Edit size={13} /> {isEditingPrivateInfo ? 'Cancel Edit' : 'Edit'}
              </button>
              {isEditingPrivateInfo && (
                <button onClick={() => { setIsEditingPrivateInfo(false); handleSaveProfile(); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#502D55] text-white text-xs font-bold hover:bg-[#3e2342] transition-colors">
                  <Save size={13} />Save Details
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">Personal Information</h4>
              <F label="Date of Birth" type="date" value={info.dob} onChange={v => upd('dob', v)} disabled={!isEditingPrivateInfo} />
              <F label="Residing Address" value={info.residingAddress} onChange={v => upd('residingAddress', v)} disabled={!isEditingPrivateInfo} />
              <div className="grid grid-cols-2 gap-3">
                <F label="Nationality" value={info.nationality} onChange={v => upd('nationality', v)} disabled={!isEditingPrivateInfo} />
                <S label="Gender" value={info.gender} options={['Female', 'Male', 'Other']} onChange={v => upd('gender', v)} disabled={!isEditingPrivateInfo} />
              </div>
              <F label="Personal Email" type="email" value={info.personalEmail} onChange={v => upd('personalEmail', v)} disabled={!isEditingPrivateInfo} />
              <div className="grid grid-cols-2 gap-3">
                <S label="Marital Status" value={info.maritalStatus} options={['Single', 'Married']} onChange={v => upd('maritalStatus', v)} disabled={!isEditingPrivateInfo} />
                <F label="Date of Joining" type="date" value={info.dateOfJoining} onChange={v => upd('dateOfJoining', v)} disabled={!isEditingPrivateInfo} />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">Bank Details</h4>
              <F label="Account Number" mono value={info.accountNumber} onChange={v => upd('accountNumber', v)} disabled={!isEditingPrivateInfo} />
              <div className="grid grid-cols-2 gap-3">
                <F label="Bank Name" value={info.bankName} onChange={v => upd('bankName', v)} disabled={!isEditingPrivateInfo} />
                <F label="IFSC Code" mono value={info.ifscCode} onChange={v => upd('ifscCode', v)} disabled={!isEditingPrivateInfo} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="PAN No" mono value={info.panNo} onChange={v => upd('panNo', v)} disabled={!isEditingPrivateInfo} />
                <F label="UAN No" mono value={info.uanNo} onChange={v => upd('uanNo', v)} disabled={!isEditingPrivateInfo} />
              </div>
              <F label="Pin Code" mono value={info.pinCode} onChange={v => upd('pinCode', v)} disabled={!isEditingPrivateInfo} />
            </div>
          </div>
        </div>
      )}
      {/* ─── ID CARD ─── */}
      {activeTab === 'idcard' && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="mb-6 flex gap-3">
            <button className="flex items-center gap-2 bg-[#502D55] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#3e2342] transition-colors" onClick={handleDownloadIdCard}>
              <ImageIcon size={16} /> Download Image
            </button>
          </div>
          
          {/* ID Card UI */}
          <div id="print-id-card" className="w-[300px] h-[480px] bg-white rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] border border-gray-200 overflow-hidden relative flex flex-col">
            <div className="h-32 bg-gradient-to-br from-[#502D55] to-[#935073] relative flex justify-center pt-6">
              <h1 className="text-white font-bold tracking-widest text-lg uppercase">{user?.company_name || 'Odoo India'}</h1>
              <div className="absolute -bottom-16 w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center">
                <img src={getAvatarUrl(user)} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
              </div>
            </div>
            
            <div className="flex-1 mt-20 px-6 text-center flex flex-col items-center">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user?.name}</h2>
              <p className="text-sm text-[#502D55] font-semibold mt-1 uppercase tracking-wide">{user?.position || 'HR Manager'}</p>
              <div className="w-12 h-1 bg-gray-200 rounded my-4"></div>
              
              <div className="w-full space-y-3 text-left bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex flex-col text-xs">
                  <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Employee ID</span>
                  <span className="font-mono font-bold text-gray-800 text-sm">{user?.employeeId || user?.login_id}</span>
                </div>
                <div className="flex flex-col text-xs">
                  <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Department</span>
                  <span className="font-semibold text-gray-800">{user?.department || 'Administration'}</span>
                </div>
              </div>
            </div>
            
            <div className="h-24 bg-white border-t border-gray-100 flex flex-col items-end justify-end px-6 pb-4">
              <div className="relative w-32 flex flex-col items-center">
                <span className="absolute -top-7 left-1 z-10 transform -rotate-3" style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive", fontSize: '28px', color: '#171923' }}>Vikram Patel</span>
                <div className="w-28 border-t border-gray-400 relative z-0"></div>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1.5 text-center">Authorized Sign</p>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// Helpers
function F({ label, value, onChange, type = 'text', mono = false, disabled = false }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className={`w-full text-xs ${mono ? 'font-mono font-bold' : 'font-semibold'} border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`} />
    </div>
  );
}

function S({ label, value, options, onChange, disabled = false }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className={`w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

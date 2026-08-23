import { useState, useEffect } from 'react';
import API_BASE, { getAvatarUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Phone, MapPin, Briefcase, Calendar as CalendarIcon, Shield, Building, UserCheck, Edit3, Plus, CheckCircle, Lock, Eye, EyeOff, Loader2, Save, Upload, Download } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDate } from '../../lib/mockData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';

export function EmployeeProfile() {
  const { user, role, reloadUser } = useAuth();
  const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'private' | 'salary' | 'idcard'
  const [showToast, setShowToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = role === 'admin' || user?.role === 'admin';

  // --- Dynamic Live Salary Calculator State ---
  const [monthWage, setMonthWage] = useState(user?.month_wage || 50000);
  const [workingDays, setWorkingDays] = useState(user?.working_days || 5);
  const [breakTime, setBreakTime] = useState(user?.break_time || 1);

  useEffect(() => {
    if (user) {
      setMonthWage(user.month_wage || 50000);
      setWorkingDays(user.working_days || 5);
      setBreakTime(user.break_time || 1);
    }
  }, [user]);

  // Auto Calculations based on monthWage
  const yearlyWage = monthWage * 12;
  const basicSalary = user?.basic_salary || (monthWage * 0.50); // DB or 50% of Wage
  const hra = user?.hra || (basicSalary * 0.50); // DB or 50% of Basic (25% of Wage)
  const standardAllowance = user?.allowances || (basicSalary * 0.16668); // DB or ~4167
  const performanceBonus = user?.allowances ? 0 : (basicSalary * 0.0833); // DB or ~2082.50
  const lta = user?.allowances ? 0 : (basicSalary * 0.0833); // DB or ~2082.50
  const subTotalComponents = basicSalary + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, monthWage - subTotalComponents); // Remainder

  // PF & Tax Deductions
  const pfEmployee = user?.pf || (basicSalary * 0.12); // DB or 12% of Basic
  const pfEmployer = user?.pf || (basicSalary * 0.12); // DB or 12% of Basic
  const professionalTax = 200.00;

  // --- Resume Editable State ---
  const [about, setAbout] = useState(user?.about || 'Write a short bio about yourself.');
  const [loveJob, setLoveJob] = useState(user?.job_love || 'What do you love about your job?');
  const [hobbies, setHobbies] = useState(user?.hobbies || 'List your interests and hobbies here.');

  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);

  const [certifications, setCertifications] = useState(user?.certifications || []);
  const [newCert, setNewCert] = useState('');
  const [showCertInput, setShowCertInput] = useState(false);

  // --- Private Info State ---
  const [privateInfo, setPrivateInfo] = useState({
    dob: user?.dob ? new Date(user.dob) : null,
    residingAddress: user?.address || '',
    nationality: user?.nationality || '',
    gender: user?.gender || '',
    maritalStatus: user?.marital_status || '',
    personalEmail: user?.personal_email || '',
    bankName: user?.bank_name || '',
    ifscCode: user?.ifsc_code || '',
    accountNumber: user?.account_number || '',
    panNo: user?.pan_no || '',
    uanNo: user?.uan_no || '',
    emergencyContactName: user?.emergency_contact_name || '',
    emergencyContactPhone: user?.emergency_contact_phone || '',
    dateOfJoining: user?.joining_date ? new Date(user.joining_date) : null
  });

  // --- Security Password State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState(null);
  const [changePwSuccess, setChangePwSuccess] = useState(false);

  const [saveLoading, setSaveLoading] = useState(false);

  const handleDownloadPayslip = (pr = null) => {
    // If no specific payroll is provided, we use the current projected data.
    const dlBasic = pr ? pr.basic : basicSalary;
    const dlHRA = pr ? pr.hra : hra;
    const dlStd = pr ? pr.allowances : standardAllowance;
    const dlBonus = pr ? pr.bonus || 0 : performanceBonus;
    const dlLTA = pr ? 0 : lta; // simplify LTA for historical if missing
    const dlFixed = pr ? 0 : fixedAllowance; // simplify
    const dlPF = pr ? pr.pf : pfEmployee;
    const dlTax = pr ? pr.professional_tax : professionalTax;
    const dlNet = pr ? (dlBasic + dlHRA + dlStd + dlBonus - dlPF - dlTax) : (monthWage - pfEmployee - professionalTax);
    const periodStr = pr ? pr.pay_period : new Date().toLocaleString('default', { month: 'short', year: 'numeric' });

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.text('DAYFLOW - PAYSLIP', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee Name: ${user?.name || 'Employee'}`, 14, 30);
    doc.text(`Employee ID: ${user?.employeeId || user?.login_id || 'N/A'}`, 14, 35);
    doc.text(`Pay Period: ${periodStr}`, 14, 40);
    
    autoTable(doc, {
      startY: 50,
      head: [['Component', 'Amount (INR)']],
      body: [
        ['Basic Salary', dlBasic.toFixed(2)],
        ['HRA', dlHRA.toFixed(2)],
        ['Allowances', dlStd.toFixed(2)],
        ['Performance Bonus', dlBonus.toFixed(2)],
        ['PF Deduction (Employee)', `-${dlPF.toFixed(2)}`],
        ['Professional Tax', `-${dlTax.toFixed(2)}`],
        ['', ''],
        ['NET PAYABLE', dlNet.toFixed(2)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [80, 45, 85] } // #502D55
    });

    doc.save(`Payslip_${user?.name || 'Employee'}_${periodStr}.pdf`);
    toast('Payslip downloaded successfully');
  };

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  const handleSaveProfile = async (overrideData = null) => {
    setSaveLoading(true);
    try {
      const isEvent = overrideData && overrideData.preventDefault;
      if (isEvent) overrideData.preventDefault();
      
      const payloadBase = (overrideData && !isEvent) ? overrideData : {
        about, 
        job_love: loveJob, 
        hobbies, 
        skills, 
        certifications, 
        ...privateInfo
      };

      const payload = {
        about: payloadBase.about,
        job_love: payloadBase.job_love,
        hobbies: payloadBase.hobbies,
        skills: payloadBase.skills,
        certifications: payloadBase.certifications,
        address: payloadBase.residingAddress,
        nationality: payloadBase.nationality,
        gender: payloadBase.gender,
        marital_status: payloadBase.maritalStatus,
        personal_email: payloadBase.personalEmail,
        bank_name: payloadBase.bankName,
        ifsc_code: payloadBase.ifscCode,
        account_number: payloadBase.accountNumber,
        pan_no: payloadBase.panNo,
        uan_no: payloadBase.uanNo,
        pin_code: payloadBase.pinCode,
        emergency_contact_name: payloadBase.emergencyContactName,
        emergency_contact_phone: payloadBase.emergencyContactPhone,
        dob: payloadBase.dob,
        ...(isAdmin ? { 
          month_wage: payloadBase.month_wage || monthWage, 
          working_days: payloadBase.working_days || workingDays, 
          break_time: payloadBase.break_time || breakTime 
        } : {})
      };
      
      const token = localStorage.getItem('dayflow_token');
      const res = await fetch(`${API_BASE}/api/data/profile`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast('Profile saved successfully');
        if (reloadUser) reloadUser();
      } else {
        toast('Failed to save profile');
      }
    } catch (error) {
      toast('Server error');
    }
    setSaveLoading(false);
  };

  const [payrolls, setPayrolls] = useState([]);
  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        const token = localStorage.getItem('dayflow_token');
        const res = await fetch(`${API_BASE}/api/data/payroll`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPayrolls(data);
        }
      } catch (err) {
        console.error('Failed to fetch payrolls');
      }
    };
    fetchPayrolls();
  }, []);

  const handleDownloadIdCard = async () => {
    const element = document.getElementById('print-id-card');
    if (!element) return;
    try {
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: null
      });
      const link = document.createElement('a');
      link.download = `ID_Card_${user?.name?.replace(/\s+/g, '_') || 'Employee'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download ID card', error);
      toast('Failed to download ID card');
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
    setShowSkillInput(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddCert = (e) => {
    e.preventDefault();
    if (!newCert.trim()) return;
    setCertifications([...certifications, newCert.trim()]);
    setNewCert('');
    setShowCertInput(false);
  };

  const handleRemoveCert = (certToRemove) => {
    setCertifications(certifications.filter(c => c !== certToRemove));
  };

  // Dynamic Tabs
  const tabs = [
    { id: 'resume', name: 'Resume' },
    { id: 'private', name: 'Private Info' },
    { id: 'salary', name: 'Salary Info' },
    { id: 'idcard', name: 'ID Card' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />{showToast}
          </div>
        </div>
      )}

      {/* Global Edit Button */}
      <div className="absolute top-0 right-0 z-10 mt-2">
        <button 
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} 
          disabled={saveLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${
            isEditing 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {saveLoading ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? <Save size={16} /> : <Edit3 size={16} />)}
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      {/* Header title */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">My Profile</h1>
        <p className="mt-1 text-xs text-[#6B7280]">View and manage personal details, resume, and private employee information.</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Avatar & Personal info */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#502D55] to-[#935073] text-white flex items-center justify-center shadow-sm overflow-hidden border-2 border-gray-100">
                <img 
                  src={getAvatarUrl(user)} 
                  alt={user?.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#171923] font-serif">{user?.name || 'My Name'}</h2>
              </div>
              <p className="text-xs font-mono font-bold text-[#502D55]">{user?.employeeId || user?.login_id || 'OIPOOJ20260001'}</p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
                <Mail size={13} className="text-gray-400" /> {user?.email || 'employee@dayflow.demo'}
              </p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
                <Phone size={13} className="text-gray-400" /> {user?.phone || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Org & Manager info (Dynamic) */}
          <div className="w-full lg:w-72 bg-gray-50/70 border border-gray-100 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Company</span>
              <span className="font-semibold text-[#171923]">{user?.company_name || 'Odoo India'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Department</span>
              <span className="font-semibold text-[#171923]">{user?.department || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Role</span>
              <span className="font-semibold text-[#171923] uppercase tracking-wider text-[10px] bg-gray-200 px-2 py-0.5 rounded-md">{user?.role || 'EMPLOYEE'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Status</span>
              <span className={`font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md ${user?.status === 'Active' || !user?.status ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{user?.status || 'ACTIVE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
              activeTab === tab.id
                ? 'bg-[#502D55] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab 1: Resume */}
      {activeTab === 'resume' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#171923] font-serif">Resume & Skills</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Manage your professional background and skill set.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold shadow-xs hover:bg-gray-200 transition-colors">
                <Upload size={14} /> Upload Resume
                <input type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    toast('Resume uploaded! Parsing document...');
                    try {
                      // Read file as text or base64 (simplified text reading for this hackathon)
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
                          
                          // Also update local privateInfo so it displays immediately if tab switches
                          setPrivateInfo(prev => ({
                            ...prev,
                            personalEmail: data.personal_email || prev.personalEmail,
                            emergencyContactPhone: data.phone || prev.emergencyContactPhone
                          }));

                          toast('Resume autofilled successfully!');
                          
                          // Trigger save instantly to persist (preserves unsaved form edits)
                          handleSaveProfile({
                            about: data.about || about,
                            job_love: loveJob,
                            hobbies: hobbies,
                            skills: data.skills || skills,
                            certifications: data.certifications || certifications,
                            ...privateInfo,
                            personalEmail: data.personal_email || privateInfo.personalEmail,
                            emergencyContactPhone: data.phone || privateInfo.emergencyContactPhone,
                            ...(isAdmin ? { month_wage: monthWage, working_days: workingDays, break_time: breakTime } : {})
                          });
                        } else {
                          toast('Failed to parse resume');
                        }
                      };
                      reader.readAsDataURL(file); // sending base64 to backend
                    } catch (error) {
                      toast('Error uploading resume');
                    }
                  }
                }} />
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: About, Love about job, Interests */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">About</h3>
                </div>
                <textarea 
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full text-xs text-[#6B7280] leading-relaxed border border-gray-200 focus:ring-1 focus:ring-[#502D55] rounded-lg p-3 bg-gray-50/50 disabled:bg-transparent disabled:border-transparent resize-none"
                />
              </div>

            {/* What I love about my job */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">What I love about my job</h3>
              </div>
              <textarea 
                value={loveJob}
                onChange={e => setLoveJob(e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full text-xs text-[#6B7280] leading-relaxed border border-gray-100 focus:ring-1 focus:ring-[#502D55] rounded-lg p-3 bg-gray-50/50 disabled:bg-transparent disabled:border-transparent resize-none"
              />
            </div>

            {/* My interests and hobbies */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">My interests and hobbies</h3>
              </div>
              <textarea 
                value={hobbies}
                onChange={e => setHobbies(e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full text-xs text-[#6B7280] leading-relaxed border border-gray-100 focus:ring-1 focus:ring-[#502D55] rounded-lg p-3 bg-gray-50/50 disabled:bg-transparent disabled:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Right Column: Skills & Certifications */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">Skills</h3>
                {isEditing && (
                  <button 
                    onClick={() => setShowSkillInput(!showSkillInput)}
                    className="text-xs font-semibold text-[#502D55] hover:text-[#935073] flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Skills
                  </button>
                )}
              </div>

              {showSkillInput && (
                <form onSubmit={handleAddSkill} className="mb-3 flex gap-2">
                  <input 
                    type="text"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    placeholder="Enter skill..."
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#502D55]"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-[#502D55] text-white text-xs font-semibold rounded-lg">Add</button>
                </form>
              )}

              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="inline-flex items-center rounded-lg bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-medium text-[#171923]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">Certification</h3>
                {isEditing && (
                  <button 
                    onClick={() => setShowCertInput(!showCertInput)}
                    className="text-xs font-semibold text-[#502D55] hover:text-[#935073] flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Certs
                  </button>
                )}
              </div>

              {showCertInput && (
                <form onSubmit={handleAddCert} className="mb-3 flex gap-2">
                  <input 
                    type="text"
                    value={newCert}
                    onChange={e => setNewCert(e.target.value)}
                    placeholder="Enter certification..."
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#502D55]"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-[#502D55] text-white text-xs font-semibold rounded-lg">Add</button>
                </form>
              )}

              <div className="space-y-2">
                {certifications.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-[#171923]">
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ─── PRIVATE INFO (Admin Format) ─── */}
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
              <button onClick={() => setIsEditing(!isEditing)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${!isEditing ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-[#502D55] hover:bg-gray-200'}`}>
                <Edit3 size={13} /> {!isEditing ? 'Edit' : 'Cancel Edit'}
              </button>
              {isEditing && (
                <button onClick={() => { handleSaveProfile(); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#502D55] text-white text-xs font-bold hover:bg-[#3e2342] transition-colors">
                  <Save size={13} />Save Details
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">Personal Information</h4>
              <F label="Date of Birth" type="date" value={privateInfo.dob} onChange={v => setPrivateInfo({...privateInfo, dob: v})} disabled={!isEditing} />
              <F label="Residing Address" value={privateInfo.residingAddress} onChange={v => setPrivateInfo({...privateInfo, residingAddress: v})} disabled={!isEditing} />
              <div className="grid grid-cols-2 gap-3">
                <F label="Nationality" value={privateInfo.nationality} onChange={v => setPrivateInfo({...privateInfo, nationality: v})} disabled={!isEditing} />
                <S label="Gender" value={privateInfo.gender} options={['Female', 'Male', 'Other']} onChange={v => setPrivateInfo({...privateInfo, gender: v})} disabled={!isEditing} />
              </div>
              <F label="Personal Email" type="email" value={privateInfo.personalEmail} onChange={v => setPrivateInfo({...privateInfo, personalEmail: v})} disabled={!isEditing} />
              <div className="grid grid-cols-2 gap-3">
                <S label="Marital Status" value={privateInfo.maritalStatus} options={['Single', 'Married']} onChange={v => setPrivateInfo({...privateInfo, maritalStatus: v})} disabled={!isEditing} />
                <F label="Date of Joining" type="date" value={privateInfo.dateOfJoining} onChange={v => setPrivateInfo({...privateInfo, dateOfJoining: v})} disabled={!isEditing} />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">Bank Details</h4>
              <F label="Account Number" mono value={privateInfo.accountNumber} onChange={v => setPrivateInfo({...privateInfo, accountNumber: v})} disabled={!isEditing} />
              <div className="grid grid-cols-2 gap-3">
                <F label="Bank Name" value={privateInfo.bankName} onChange={v => setPrivateInfo({...privateInfo, bankName: v})} disabled={!isEditing} />
                <F label="IFSC Code" mono value={privateInfo.ifscCode} onChange={v => setPrivateInfo({...privateInfo, ifscCode: v})} disabled={!isEditing} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="PAN No" mono value={privateInfo.panNo} onChange={v => setPrivateInfo({...privateInfo, panNo: v})} disabled={!isEditing} />
                <F label="UAN No" mono value={privateInfo.uanNo} onChange={v => setPrivateInfo({...privateInfo, uanNo: v})} disabled={!isEditing} />
              </div>
              <F label="Pin Code" mono value={privateInfo.pinCode} onChange={v => setPrivateInfo({...privateInfo, pinCode: v})} disabled={!isEditing} />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 text-[10px] text-gray-400 font-medium text-center uppercase tracking-widest">
            Identity Card Generation Date: {new Date().toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Tab 3: Salary Info (Read-only for employee, Editable for Admin) */}
      {activeTab === 'salary' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8 shadow-xs">
          
          {isAdmin && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-[#6B7280]">Update employee salary components here. (Admin/HR Only)</span>
              <button 
                onClick={handleSaveProfile}
                disabled={saveLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#502D55] text-white text-xs font-bold shadow-xs hover:bg-[#3e2342] transition-colors disabled:opacity-70"
              >
                {saveLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                Save Salary Info
              </button>
            </div>
          )}

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
                    disabled={!isAdmin}
                    className={`w-36 text-sm font-mono font-bold text-[#502D55] border border-gray-200 rounded-lg px-3 py-1.5 text-right focus:border-[#502D55] focus:outline-none ${!isAdmin ? 'bg-gray-50' : 'bg-white'}`}
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
                  disabled={!isAdmin}
                  className={`w-20 text-xs font-mono font-bold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 text-center focus:border-[#502D55] focus:outline-none ${!isAdmin ? 'bg-gray-50' : 'bg-white'}`}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Break Time:</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={breakTime}
                    onChange={e => setBreakTime(Number(e.target.value))}
                    disabled={!isAdmin}
                    className={`w-20 text-xs font-mono font-bold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 text-center focus:border-[#502D55] focus:outline-none ${!isAdmin ? 'bg-gray-50' : 'bg-white'}`}
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
                <p className="text-[11px] text-gray-400 italic">HRA provided to employee 50% of the basic salary</p>
              </div>

              {/* Standard / Consolidated Allowance */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-800">{user?.allowances ? 'Allowances' : 'Standard Allowance'}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-[#171923]">{standardAllowance.toFixed(2)} ₹ / month</span>
                    <span className="font-mono font-semibold text-[#502D55]">{user?.allowances ? '20.00 %' : '16.67 %'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 italic">A predetermined, fixed amount provided to employee as part of their salary</p>
              </div>

              {!user?.allowances && (
                <>
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
                </>
              )}
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

          {/* Salary History Table & Actions */}
          <div className="pt-8 border-t border-gray-100 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">Salary History</h4>
                <p className="text-xs text-gray-500">Your recent payslips and monthly payouts.</p>
              </div>
              <button 
                onClick={handleDownloadPayslip}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
              >
                <Download size={14} /> Download Latest Payslip
              </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Month</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Gross Pay</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Deductions</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Net Pay</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payrolls.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-gray-500">
                        No payroll records found for your account.
                      </td>
                    </tr>
                  ) : (
                    payrolls.map((pr) => {
                      const totalDeductions = pr.pf + pr.professional_tax + (pr.other_deductions || 0);
                      const grossPay = pr.basic + pr.hra + pr.allowances + (pr.bonus || 0);
                      const netPay = grossPay - totalDeductions;
                      
                      return (
                        <tr key={pr._id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-3.5 font-medium text-gray-900">{pr.pay_period}</td>
                          <td className="px-5 py-3.5 font-mono">₹ {grossPay.toFixed(2)}</td>
                          <td className="px-5 py-3.5 font-mono text-red-500">₹ {totalDeductions.toFixed(2)}</td>
                          <td className="px-5 py-3.5 font-mono font-bold text-[#502D55]">₹ {netPay.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                Credited
                              </span>
                              <button 
                                onClick={() => handleDownloadPayslip(pr)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#502D55] transition-colors"
                                title="Download Payslip"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: ID Card */}
      {activeTab === 'idcard' && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="mb-6 flex gap-3">
            <button className="flex items-center gap-2 bg-[#502D55] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#3e2342] transition-colors" onClick={handleDownloadIdCard}>
              <Download size={16} /> Download Image
            </button>
          </div>
          
          {/* ID Card UI */}
          <div id="print-id-card" className="w-[300px] h-[480px] bg-white rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] border border-gray-200 overflow-hidden relative flex flex-col">
            <div className="h-32 bg-gradient-to-br from-[#502D55] to-[#935073] relative flex justify-center pt-6">
              <h1 className="text-white font-bold tracking-widest text-lg uppercase">{user?.company_name || 'Odoo India'}</h1>
              <div className="absolute -bottom-16 w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg flex items-center justify-center">
                <img 
                  src={getAvatarUrl(user)} 
                  alt={user?.name} 
                  className="w-full h-full object-cover" 
                  crossOrigin="anonymous" 
                />
              </div>
            </div>
            
            <div className="flex-1 mt-20 px-6 text-center flex flex-col items-center">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user?.name}</h2>
              <p className="text-sm text-[#502D55] font-semibold mt-1 uppercase tracking-wide">{user?.position || user?.department}</p>
              <div className="w-12 h-1 bg-gray-200 rounded my-4"></div>
              
              <div className="w-full space-y-3 text-left bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex flex-col text-xs">
                  <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Employee ID</span>
                  <span className="font-mono font-bold text-gray-800 text-sm">{user?.employeeId || user?.login_id}</span>
                </div>
                <div className="flex flex-col text-xs">
                  <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Department</span>
                  <span className="font-semibold text-gray-800">{user?.department}</span>
                </div>
              </div>
            </div>
            
            <div className="h-24 bg-white border-t border-gray-100 flex flex-col items-end justify-end px-6 pb-4 mt-auto">
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
  // Format Date string if it's a date type so input understands it
  const displayValue = type === 'date' && value ? new Date(value).toISOString().split('T')[0] : (value || '');
  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1">{label}</label>
      <input type={type} value={displayValue} onChange={e => onChange(e.target.value)} disabled={disabled}
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

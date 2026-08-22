import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Phone, MapPin, Briefcase, Calendar, Shield, Building, UserCheck, Edit3, Plus, CheckCircle, Lock, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { formatDate } from '../../lib/mockData';

export function EmployeeProfile() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'private' | 'salary' | 'security'
  const [showToast, setShowToast] = useState(null);

  const isAdmin = role === 'admin' || user?.role === 'admin';

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

  // --- Resume Editable State ---
  const [about, setAbout] = useState(
    'Dedicated professional passionate about building reliable software solutions and optimizing workforce productivity. Experienced in team leadership and agile development.'
  );
  const [loveJob, setLoveJob] = useState(
    'I love collaborating with cross-functional teams, solving complex architectural challenges, and seeing products make a measurable impact.'
  );
  const [hobbies, setHobbies] = useState(
    'Reading tech blogs, playing chess, outdoor trekking, and exploring new coffee brewing techniques.'
  );

  const [skills, setSkills] = useState(['React.js', 'Node.js', 'MongoDB', 'System Design', 'Team Leadership', 'HR Operations']);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);

  const [certifications, setCertifications] = useState([
    'AWS Certified Solutions Architect',
    'Certified Scrum Master (CSM)',
    'Full Stack Web Development Professional'
  ]);
  const [newCert, setNewCert] = useState('');
  const [showCertInput, setShowCertInput] = useState(false);

  // --- Private Info State (Exact Wireframe Fields) ---
  const [privateInfo, setPrivateInfo] = useState({
    dob: '1996-03-15',
    residingAddress: 'Flat 402, Lotus Residency, Indiranagar, Bangalore',
    nationality: 'Indian',
    personalEmail: 'pooja.personal@gmail.com',
    gender: 'Female',
    maritalStatus: 'Single',
    dateOfJoining: '2026-01-10',
    // Bank Details
    accountNumber: '91827364501928',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    panNo: 'ABCDE1234F',
    uanNo: '100928374651',
    pinCode: '560038'
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

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
    setShowSkillInput(false);
    toast('Skill added successfully');
  };

  const handleAddCert = (e) => {
    e.preventDefault();
    if (!newCert.trim()) return;
    setCertifications([...certifications, newCert.trim()]);
    setNewCert('');
    setShowCertInput(false);
    toast('Certification added successfully');
  };

  // Dynamic Tabs: Salary Info is visible to Admin only
  const tabs = [
    { id: 'resume', name: 'Resume' },
    { id: 'private', name: 'Private Info' },
    ...(isAdmin ? [{ id: 'salary', name: 'Salary Info' }] : []),
    { id: 'security', name: 'Security' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />{showToast}
          </div>
        </div>
      )}

      {/* Header title */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">My Profile</h1>
        <p className="mt-1 text-xs text-[#6B7280]">View and manage personal details, resume, and private employee information.</p>
      </div>

      {/* Profile Header Card (Exact Wireframe Format) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Avatar & Personal info */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#502D55] to-[#935073] text-white flex items-center justify-center text-3xl font-bold font-serif shadow-sm">
                {(user?.name || 'My Name').split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <button 
                onClick={() => toast('Profile photo upload')} 
                title="Change Photo"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white border border-gray-200 text-[#502D55] shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Edit3 size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#171923] font-serif">{user?.name || 'My Name'}</h2>
                <button onClick={() => toast('Edit Name')} className="text-gray-400 hover:text-[#502D55]">
                  <Edit3 size={15} />
                </button>
              </div>
              <p className="text-xs font-mono font-bold text-[#502D55]">{user?.employeeId || user?.login_id || 'OIPOOJ20260001'}</p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
                <Mail size={13} className="text-gray-400" /> {user?.email || 'employee@dayflow.demo'}
              </p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
                <Phone size={13} className="text-gray-400" /> {user?.phone || '+91 98765 43210'}
              </p>
            </div>
          </div>

          {/* Org & Manager info (Right side of header) */}
          <div className="w-full lg:w-72 bg-gray-50/70 border border-gray-100 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Company</span>
              <span className="font-semibold text-[#171923]">{user?.company_name || 'Odoo India'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Department</span>
              <span className="font-semibold text-[#171923]">{user?.department || 'Engineering'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Manager</span>
              <span className="font-semibold text-[#171923]">HR Department</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Location</span>
              <span className="font-semibold text-[#171923]">Bangalore, India</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: About, Love about job, Interests */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">About</h3>
                <button onClick={() => toast('Editing About section')} className="text-gray-400 hover:text-[#502D55]">
                  <Edit3 size={15} />
                </button>
              </div>
              <textarea 
                value={about}
                onChange={e => setAbout(e.target.value)}
                rows={3}
                className="w-full text-xs text-[#6B7280] leading-relaxed border-0 focus:ring-1 focus:ring-[#502D55] rounded-lg p-2 bg-gray-50/50"
              />
            </div>

            {/* What I love about my job */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">What I love about my job</h3>
                <button onClick={() => toast('Editing section')} className="text-gray-400 hover:text-[#502D55]">
                  <Edit3 size={15} />
                </button>
              </div>
              <textarea 
                value={loveJob}
                onChange={e => setLoveJob(e.target.value)}
                rows={3}
                className="w-full text-xs text-[#6B7280] leading-relaxed border-0 focus:ring-1 focus:ring-[#502D55] rounded-lg p-2 bg-gray-50/50"
              />
            </div>

            {/* My interests and hobbies */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">My interests and hobbies</h3>
                <button onClick={() => toast('Editing section')} className="text-gray-400 hover:text-[#502D55]">
                  <Edit3 size={15} />
                </button>
              </div>
              <textarea 
                value={hobbies}
                onChange={e => setHobbies(e.target.value)}
                rows={3}
                className="w-full text-xs text-[#6B7280] leading-relaxed border-0 focus:ring-1 focus:ring-[#502D55] rounded-lg p-2 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Right Column: Skills & Certifications */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#171923] font-serif uppercase tracking-wider">Skills</h3>
                <button 
                  onClick={() => setShowSkillInput(!showSkillInput)}
                  className="text-xs font-semibold text-[#502D55] hover:text-[#935073] flex items-center gap-1"
                >
                  <Plus size={14} /> Add Skills
                </button>
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
                <button 
                  onClick={() => setShowCertInput(!showCertInput)}
                  className="text-xs font-semibold text-[#502D55] hover:text-[#935073] flex items-center gap-1"
                >
                  <Plus size={14} /> Add Skills
                </button>
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
      )}

      {/* Tab 2: Private Info (Exact Wireframe Fields & Layout) */}
      {activeTab === 'private' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#171923] font-serif">Private Information</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Confidential employee identity and banking information.</p>
            </div>
            <button 
              onClick={() => toast('Private details saved successfully')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#502D55] text-white text-xs font-bold shadow-xs hover:bg-[#3e2342] transition-colors"
            >
              <Save size={14} /> Save Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Personal Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">
                Personal Information
              </h4>

              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Date of Birth</label>
                <input 
                  type="date"
                  value={privateInfo.dob}
                  onChange={e => setPrivateInfo({ ...privateInfo, dob: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Residing Address</label>
                <input 
                  type="text"
                  value={privateInfo.residingAddress}
                  onChange={e => setPrivateInfo({ ...privateInfo, residingAddress: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Nationality</label>
                  <input 
                    type="text"
                    value={privateInfo.nationality}
                    onChange={e => setPrivateInfo({ ...privateInfo, nationality: e.target.value })}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Gender</label>
                  <select 
                    value={privateInfo.gender}
                    onChange={e => setPrivateInfo({ ...privateInfo, gender: e.target.value })}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Personal Email</label>
                <input 
                  type="email"
                  value={privateInfo.personalEmail}
                  onChange={e => setPrivateInfo({ ...privateInfo, personalEmail: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Marital Status</label>
                  <select 
                    value={privateInfo.maritalStatus}
                    onChange={e => setPrivateInfo({ ...privateInfo, maritalStatus: e.target.value })}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Date of Joining</label>
                  <input 
                    type="date"
                    value={privateInfo.dateOfJoining}
                    onChange={e => setPrivateInfo({ ...privateInfo, dateOfJoining: e.target.value })}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Bank Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#502D55] uppercase tracking-wider pb-2 border-b border-gray-100">
                Bank Details
              </h4>

              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Account Number</label>
                <input 
                  type="text"
                  value={privateInfo.accountNumber}
                  onChange={e => setPrivateInfo({ ...privateInfo, accountNumber: e.target.value })}
                  className="w-full text-xs font-mono font-bold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Bank Name</label>
                  <input 
                    type="text"
                    value={privateInfo.bankName}
                    onChange={e => setPrivateInfo({ ...privateInfo, bankName: e.target.value })}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">IFSC Code</label>
                  <input 
                    type="text"
                    value={privateInfo.ifscCode}
                    onChange={e => setPrivateInfo({ ...privateInfo, ifscCode: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">PAN No</label>
                  <input 
                    type="text"
                    value={privateInfo.panNo}
                    onChange={e => setPrivateInfo({ ...privateInfo, panNo: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">UAN No</label>
                  <input 
                    type="text"
                    value={privateInfo.uanNo}
                    onChange={e => setPrivateInfo({ ...privateInfo, uanNo: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Pin Code</label>
                <input 
                  type="text"
                  value={privateInfo.pinCode}
                  onChange={e => setPrivateInfo({ ...privateInfo, pinCode: e.target.value })}
                  className="w-full text-xs font-mono font-bold border border-gray-200 rounded-lg p-2 bg-gray-50/50 focus:border-[#502D55] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Salary Info (Strictly Admin-Only Wireframe Implementation with Real-Time Calculations) */}
      {activeTab === 'salary' && isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8 shadow-xs">
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
                <p className="text-[11px] text-gray-400 italic">HRA provided to employee 50% of the basic salary</p>
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

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-[#171923] font-serif">Security Settings</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Manage your credentials and password security.</p>
          </div>

          {changePwSuccess ? (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2">
              <CheckCircle size={16} /> Password changed successfully!
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setChangePwError(null);
              if (newPassword !== confirmNewPassword) { setChangePwError('New passwords do not match.'); return; }
              if (newPassword.length < 6) { setChangePwError('Password must be at least 6 characters.'); return; }
              setChangePwLoading(true);
              try {
                const token = localStorage.getItem('dayflow_token');
                const res = await fetch('http://localhost:5000/api/auth/change-password', {
                  method: 'PUT',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();
                if (res.ok) {
                  setChangePwSuccess(true);
                  setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
                } else {
                  setChangePwError(data.message || 'Failed to change password');
                }
              } catch (err) {
                setChangePwError('Server error. Please try again.');
              } finally {
                setChangePwLoading(false);
              }
            }} className="space-y-4 max-w-md">
              {changePwError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">{changePwError}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Password</label>
                <div className="relative">
                  <input type={showCurrentPw ? 'text' : 'password'} required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3.5 py-2 pr-10 text-xs focus:border-[#502D55] focus:outline-none focus:ring-1 focus:ring-[#502D55]" placeholder="Enter current password" />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#502D55]">{showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showNewPw ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3.5 py-2 pr-10 text-xs focus:border-[#502D55] focus:outline-none focus:ring-1 focus:ring-[#502D55]" placeholder="Enter new password" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#502D55]">{showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                <input type="password" required value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3.5 py-2 text-xs focus:border-[#502D55] focus:outline-none focus:ring-1 focus:ring-[#502D55]" placeholder="Re-enter new password" />
              </div>
              <button type="submit" disabled={changePwLoading} className="rounded-xl bg-[#502D55] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#3e2342] disabled:opacity-70 flex items-center gap-2 shadow-xs transition-colors">
                {changePwLoading ? <Loader2 className="animate-spin" size={14} /> : <Lock size={14} />}
                Update Password
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

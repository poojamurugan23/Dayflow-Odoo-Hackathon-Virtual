import { useState, useEffect } from 'react';
import API_BASE, { getAvatarUrl } from '../../lib/api';
import { DEPARTMENTS } from '../../lib/mockData';
import { Search, Eye, X, Loader2, Users, ShieldCheck, Briefcase, Trash2 } from 'lucide-react';
import { EmployeeProfileModal } from '../../components/EmployeeProfileModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function SuperAdminProfiles() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showToast, setShowToast] = useState(null);

  // Real data state
  const [employees, setEmployees] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        const mapped = data.map(emp => {
          return {
            ...emp,
            id: emp._id,
            profile_picture: getAvatarUrl(emp),
            employeeId: emp.login_id,
            name: emp.name,
            email: emp.email,
            phone: emp.phone || '+91 98765 43210',
            department: emp.department,
            position: emp.position,
            companyName: emp.company_name || 'Odoo India',
            status: emp.status || 'Active',
            joiningDate: emp.joining_date || new Date()
          };
        });

        // Exclude super admin from the profiles list
        const withoutSuper = mapped.filter(e => e.role !== 'admin');
        setEmployees(withoutSuper.filter(e => e.role === 'employee'));
        setHrs(withoutSuper.filter(e => e.role === 'hr'));
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/employees/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast('Profile deleted successfully');
        setConfirmDelete(null);
        fetchProfiles();
      } else {
        const err = await response.json();
        toast(`Error: ${err.message}`);
      }
    } catch (error) {
      toast('Failed to delete profile');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Organization Profiles", 14, 15);
    const tableData = [...hrs, ...employees].map(e => [e.employeeId, e.name, e.department, e.position, e.email, e.phone]);
    autoTable(doc, {
      head: [['ID', 'Name', 'Department', 'Position', 'Email', 'Phone']],
      body: tableData,
      startY: 20
    });
    doc.save("Organization_Profiles.pdf");
    toast('Exported to PDF successfully');
  };

  const handleExportExcel = () => {
    const tableData = [...hrs, ...employees].map(e => ({
      ID: e.employeeId,
      Name: e.name,
      Department: e.department,
      Position: e.position,
      Email: e.email,
      Phone: e.phone
    }));
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Profiles");
    XLSX.writeFile(workbook, "Organization_Profiles.xlsx");
    toast('Exported to Excel successfully');
  };

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredHrs = hrs.filter(hr => {
    const matchesSearch = hr.name.toLowerCase().includes(search.toLowerCase()) || hr.employeeId.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-[#502D55]" size={32} /></div>;

  const renderProfileCard = (emp, isHr = false) => (
    <div key={emp.id} onClick={() => setSelectedEmployee(emp)}
      className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-[#502D55]/40 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative shrink-0">
          <img src={emp.profile_picture} alt={emp.name} className="h-14 w-14 rounded-full object-cover shadow-sm border border-gray-100 bg-gray-50" />
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-white">
            <span className={`flex h-3 w-3 rounded-full ${emp.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-bold text-[#171923] truncate">{emp.name}</h3>
            {isHr && <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 shrink-0 uppercase tracking-wider">HR Manager</span>}
            {!isHr && <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600 shrink-0 uppercase tracking-wider">Employee</span>}
          </div>
          <p className="text-xs text-gray-500 truncate mb-1">{emp.email} • {emp.phone}</p>
          <span className="inline-flex items-center rounded-md bg-[#502D55]/5 px-2 py-1 text-[11px] font-mono font-bold text-[#502D55] shrink-0">
            {emp.employeeId}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm md:w-1/3 justify-between md:justify-end shrink-0 pl-18 md:pl-0">
        <div className="text-left md:text-right flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#171923] truncate">{emp.position}</p>
          <p className="text-xs text-gray-500 truncate flex items-center md:justify-end gap-1 mt-1">
            <Briefcase size={12} /> {emp.department}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp); }} className="p-2.5 rounded-lg hover:bg-[#502D55]/5 text-gray-400 hover:text-[#502D55] transition-colors" title="View Profile"><Eye size={18} /></button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(emp); }} className="p-2.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete Profile"><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {showToast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg">{showToast}</div>
        </div>
      )}

      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Organization Profiles</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Manage and view all employee and HR profiles.</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Total HR Managers</p>
            <p className="text-2xl font-bold text-[#171923]">{hrs.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-purple-50 text-[#502D55] flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold text-[#171923]">{employees.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={handleExportPDF} className="px-3 py-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">PDF</button>
          <button onClick={handleExportExcel} className="px-3 py-2.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">Excel</button>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded-lg text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55]">
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Stacked View */}
      <div className="space-y-8">
        {/* HR Section */}
        <div>
          <h2 className="text-lg font-bold text-[#171923] mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-500" /> HR Team
          </h2>
          <div className="space-y-3">
            {filteredHrs.map(hr => renderProfileCard(hr, true))}
            {filteredHrs.length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200 border-dashed"><p className="text-sm text-[#6B7280]">No HR profiles match your filters.</p></div>
            )}
          </div>
        </div>

        {/* Employees Section */}
        <div>
          <h2 className="text-lg font-bold text-[#171923] mb-4 border-b border-gray-100 pb-2 flex items-center gap-2 mt-8">
            <Users size={20} className="text-[#502D55]" /> Employees
          </h2>
          <div className="space-y-3">
            {filteredEmployees.map(emp => renderProfileCard(emp, false))}
            {filteredEmployees.length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200 border-dashed"><p className="text-sm text-[#6B7280]">No employees match your filters.</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive View Profile Modal */}
      {selectedEmployee && (
        <EmployeeProfileModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
          isHrView={true}
          refreshList={fetchProfiles}
        />
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#171923]">Delete Profile</h3>
                <p className="text-sm text-gray-500">Are you sure you want to delete this profile?</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <p className="font-semibold text-gray-900">{confirmDelete.name}</p>
              <p className="text-xs text-gray-500 mt-1">{confirmDelete.position} • {confirmDelete.email}</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-70 flex items-center gap-2 transition-colors"
              >
                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

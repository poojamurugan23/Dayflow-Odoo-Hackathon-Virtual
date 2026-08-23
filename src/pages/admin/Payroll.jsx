import { Search, Download, Edit3, Loader2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import API_BASE, { getAvatarUrl } from '../../lib/api';
import * as XLSX from 'xlsx';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

export function AdminPayroll() {
  const [showToast, setShowToast] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Salary Modal State
  const [editEmp, setEditEmp] = useState(null);
  const [newWage, setNewWage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const res = await fetch(`${API_BASE}/api/data/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const emps = data.filter(e => e.role === 'employee');
        setEmployees(emps);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('dayflow_token');
      const res = await fetch(`${API_BASE}/api/data/employees/${editEmp._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month_wage: Number(newWage) })
      });
      if (res.ok) {
        setShowToast('Salary updated successfully!');
        setEditEmp(null);
        fetchEmployees();
        setTimeout(() => setShowToast(null), 3000);
      } else {
        const err = await res.json();
        setShowToast(`Error: ${err.message}`);
        setTimeout(() => setShowToast(null), 3000);
      }
    } catch (err) {
      setShowToast('Failed to update salary');
      setTimeout(() => setShowToast(null), 3000);
    } finally {
      setSaveLoading(false);
    }
  };

  // Compute live payroll row for each employee based on their actual DB month_wage
  const rows = employees.map(emp => {
    const monthWage = emp.month_wage || 50000; // fallback
    const basic = monthWage * 0.50;
    const hra = basic * 0.50;
    const allowances = basic * 0.16668;
    const bonus = basic * 0.0833;
    const pf = basic * 0.12;
    const tax = 200;
    const gross = basic + hra + allowances + bonus;
    const ded = pf + tax;
    const net = monthWage - ded; // Simplified net based on standard distribution
    
    return { 
      ...emp, 
      employeeId: emp.login_id || emp._id,
      avatar: getAvatarUrl(emp),
      basic, hra, allowances, bonus, pf, tax, gross, deductions: ded, net, monthWage
    };
  });

  const totalPayroll = rows.reduce((sum, r) => sum + r.net, 0);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
      ID: r.employeeId,
      Name: r.name,
      Department: r.department,
      BaseWage: r.monthWage,
      Gross: r.gross,
      Deductions: r.deductions,
      Net: r.net
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    XLSX.writeFile(wb, "Payroll_Report.xlsx");
    setShowToast('Exported to Excel');
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Payroll Management</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Manage employee compensation and generate payslips.</p>
        </div>
        <button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"><Download size={16} /> Export Payroll</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-[#6B7280] mb-1">Total Monthly Payroll</p>
          <p className="text-2xl font-bold text-[#171923]">{formatCurrency(totalPayroll)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-[#6B7280] mb-1">Employees on Payroll</p>
          <p className="text-2xl font-bold text-[#171923]">{rows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-[#6B7280] mb-1">Pay Period</p>
          <p className="text-2xl font-bold text-[#171923]">{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {showToast && (
        <div className="fixed top-20 right-6 z-50"><div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg">{showToast}</div></div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-base font-semibold text-[#171923] font-serif">Employee Payroll</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center items-center h-48">
               <Loader2 className="animate-spin text-[#502D55]" size={32} />
             </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Department</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Gross</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Deductions</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Net Salary</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.employeeId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#502D55] text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-gray-200">
                          <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                        </div>
                        <div><p className="font-medium text-[#171923]">{r.name}</p><p className="text-xs text-[#6B7280]">{r.employeeId}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#6B7280]">{r.department}</td>
                    <td className="px-5 py-3 text-right text-[#171923] font-medium">{formatCurrency(r.gross)}</td>
                    <td className="px-5 py-3 text-right text-red-600">{formatCurrency(r.deductions)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-[#171923]">{formatCurrency(r.net)}</td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => { setEditEmp(r); setNewWage(r.monthWage || ''); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#502D55]"><Edit3 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Salary Modal */}
      {editEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditEmp(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#171923] font-serif">Edit Salary</h3>
              <button onClick={() => setEditEmp(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateSalary} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#171923] mb-1">{editEmp.name}</p>
                <p className="text-xs text-gray-500 mb-4">{editEmp.department} • {editEmp.login_id}</p>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Monthly Base Wage (₹)</label>
                <input type="number" required value={newWage} onChange={e => setNewWage(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-[#502D55] focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditEmp(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saveLoading} className="rounded-lg bg-[#502D55] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3e2342] flex items-center gap-2">
                  {saveLoading && <Loader2 className="animate-spin" size={15} />}Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

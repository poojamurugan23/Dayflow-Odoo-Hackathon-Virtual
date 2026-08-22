import { EMPLOYEES, formatCurrency } from '../../lib/mockData';
import { Search, Download, Edit3 } from 'lucide-react';
import { useState } from 'react';

const salaries = [
  { emp: 'EMP-001', basic: 120000, hra: 48000, allowances: 25000, bonus: 20000, pf: 14400, tax: 200, other: 2500 },
  { emp: 'EMP-042', basic: 75000, hra: 30000, allowances: 15000, bonus: 10000, pf: 9000, tax: 200, other: 1500 },
  { emp: 'EMP-008', basic: 110000, hra: 44000, allowances: 22000, bonus: 18000, pf: 13200, tax: 200, other: 2200 },
  { emp: 'EMP-015', basic: 95000, hra: 38000, allowances: 19000, bonus: 15000, pf: 11400, tax: 200, other: 1800 },
  { emp: 'EMP-023', basic: 85000, hra: 34000, allowances: 17000, bonus: 12000, pf: 10200, tax: 200, other: 1600 },
  { emp: 'EMP-031', basic: 90000, hra: 36000, allowances: 18000, bonus: 14000, pf: 10800, tax: 200, other: 1700 },
  { emp: 'EMP-037', basic: 88000, hra: 35200, allowances: 17600, bonus: 13000, pf: 10560, tax: 200, other: 1650 },
  { emp: 'EMP-050', basic: 65000, hra: 26000, allowances: 13000, bonus: 8000, pf: 7800, tax: 200, other: 1200 },
];

export function AdminPayroll() {
  const [showToast, setShowToast] = useState(null);

  const rows = salaries.map(s => {
    const emp = EMPLOYEES.find(e => e.employeeId === s.emp);
    const gross = s.basic + s.hra + s.allowances + s.bonus;
    const ded = s.pf + s.tax + s.other;
    return { ...emp, ...s, gross, deductions: ded, net: gross - ded };
  });

  const totalPayroll = rows.reduce((sum, r) => sum + r.net, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Payroll Management</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Manage employee compensation and generate payslips.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"><Download size={16} /> Export Payroll</button>
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
          <p className="text-2xl font-bold text-[#171923]">August 2026</p>
        </div>
      </div>

      {showToast && (
        <div className="fixed top-20 right-6 z-50"><div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg">{showToast}</div></div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-base font-semibold text-[#171923] font-serif">Employee Payroll</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 w-56" />
          </div>
        </div>
        <div className="overflow-x-auto">
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
                      <div className="h-8 w-8 rounded-full bg-[#502D55] text-white flex items-center justify-center text-xs font-bold">{r.avatar}</div>
                      <div><p className="font-medium text-[#171923]">{r.name}</p><p className="text-xs text-[#6B7280]">{r.employeeId}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#6B7280]">{r.department}</td>
                  <td className="px-5 py-3 text-right text-[#171923] font-medium">{formatCurrency(r.gross)}</td>
                  <td className="px-5 py-3 text-right text-red-600">{formatCurrency(r.deductions)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-[#171923]">{formatCurrency(r.net)}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => { setShowToast(`Editing salary for ${r.name} is a demo feature`); setTimeout(() => setShowToast(null), 3000); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#502D55]"><Edit3 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

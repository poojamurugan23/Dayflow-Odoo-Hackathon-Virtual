import { useAuth } from '../../contexts/AuthContext';
import { PAYROLL_DATA, formatCurrency } from '../../lib/mockData';
import { Download, Printer, CreditCard, TrendingUp, Calendar } from 'lucide-react';

export function EmployeePayroll() {
  const { user } = useAuth();
  const payroll = PAYROLL_DATA[user?.employeeId] || PAYROLL_DATA['EMP-042'];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">My Payroll</h1>
          <p className="mt-1 text-sm text-[#6B7280]">View your salary details and payslips.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#6B7280]">Monthly Net</span>
            <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center"><CreditCard size={18} className="text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-[#171923]">{formatCurrency(payroll.net)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#6B7280]">Annual CTC</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp size={18} className="text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-[#171923]">{formatCurrency(payroll.gross * 12)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#6B7280]">Next Payment</span>
            <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center"><Calendar size={18} className="text-purple-600" /></div>
          </div>
          <p className="text-2xl font-bold text-[#171923]">{payroll.paymentDate}</p>
        </div>
      </div>

      {/* Salary Structure */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-[#171923] font-serif mb-6">Salary Breakdown — {payroll.payPeriod}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">Earnings</h4>
            {[['Basic Salary', payroll.basic], ['HRA', payroll.hra], ['Allowances', payroll.allowances], ['Performance Bonus', payroll.bonus]].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0"><span className="text-sm text-[#6B7280]">{label}</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(val)}</span></div>
            ))}
            <div className="flex justify-between py-3 mt-2 bg-green-50 rounded-lg px-3"><span className="text-sm font-semibold text-green-800">Gross Salary</span><span className="text-sm font-bold text-green-800">{formatCurrency(payroll.gross)}</span></div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-3">Deductions</h4>
            {[['Provident Fund', payroll.pf], ['Professional Tax', payroll.professionalTax], ['Other Deductions', payroll.otherDeductions]].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0"><span className="text-sm text-[#6B7280]">{label}</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(val)}</span></div>
            ))}
            <div className="flex justify-between py-3 mt-2 bg-red-50 rounded-lg px-3"><span className="text-sm font-semibold text-red-800">Total Deductions</span><span className="text-sm font-bold text-red-800">{formatCurrency(payroll.totalDeductions)}</span></div>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-[#502D55]/5 border border-[#502D55]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div><p className="text-base font-semibold text-[#502D55]">Net Salary</p><p className="text-xs text-[#6B7280]">Credited on {payroll.paymentDate}</p></div>
          <p className="text-2xl font-bold text-[#502D55]">{formatCurrency(payroll.net)}</p>
        </div>
      </div>

      {/* Recent Payslips */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-[#171923] font-serif">Recent Payslips</h3></div>
        <div className="divide-y divide-gray-50">
          {['August 2026', 'July 2026', 'June 2026', 'May 2026'].map((month, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-[#171923]">{month}</p>
                <p className="text-xs text-[#6B7280]">Net: {formatCurrency(payroll.net)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"><Download size={14} /> Download</button>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"><Printer size={14} /> Print</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

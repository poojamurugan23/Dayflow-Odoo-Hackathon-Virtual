import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/mockData';
import { Download, Printer, CreditCard, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import API_BASE from '../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function EmployeePayroll() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile salary info fallback
  const monthWage = user?.month_wage || 50000;
  
  const basicSalary = user?.basic_salary || (monthWage * 0.50); 
  const hra = user?.hra || (basicSalary * 0.50); 
  const standardAllowance = user?.allowances || (monthWage * 0.1667); 
  const performanceBonus = monthWage * 0.0833; 
  const lta = monthWage * 0.0833; 
  
  const subTotalComponents = basicSalary + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, monthWage - subTotalComponents);
  
  const pfEmployee = user?.pf || (basicSalary * 0.12);
  const professionalTax = 200;
  
  const currentNet = monthWage - pfEmployee - professionalTax;
  const currentGross = monthWage;

  const fetchPayrolls = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/payroll`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        let data = await response.json();
        
        if (data.length === 0) {
          // If no payroll records exist, display an empty list
          setPayrolls([]);
        } else {
          setPayrolls(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const handleDownloadPayslip = (pr = null) => {
    const dlBasic = pr ? pr.basic : basicSalary;
    const dlHRA = pr ? pr.hra : hra;
    const dlStd = pr ? pr.allowances : standardAllowance;
    const dlBonus = pr ? pr.bonus || 0 : performanceBonus;
    const dlPF = pr ? pr.pf : pfEmployee;
    const dlTax = pr ? pr.professional_tax : professionalTax;
    const dlNet = pr ? (dlBasic + dlHRA + dlStd + dlBonus - dlPF - dlTax) : currentNet;
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
      headStyles: { fillColor: [80, 45, 85] } 
    });

    doc.save(`Payslip_${user?.name || 'Employee'}_${periodStr}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-[#502D55]" size={40} />
      </div>
    );
  }

  // Determine latest payroll or fallback to projected
  const latestPayroll = payrolls[0] || null;
  const displayGross = latestPayroll ? (latestPayroll.basic + latestPayroll.hra + latestPayroll.allowances + (latestPayroll.bonus || 0)) : currentGross;
  const displayNet = latestPayroll ? (displayGross - latestPayroll.pf - latestPayroll.professional_tax - (latestPayroll.other_deductions || 0)) : currentNet;
  const displayPeriod = latestPayroll ? latestPayroll.pay_period : new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const paymentDate = latestPayroll ? new Date(latestPayroll.createdAt).toLocaleDateString() : 'Pending Processing';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">My Payroll</h1>
          <p className="mt-1 text-sm text-[#6B7280]">View your real-time salary details and payslips.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#6B7280]">Monthly Net</span>
            <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center"><CreditCard size={18} className="text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-[#171923]">{formatCurrency(displayNet)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#6B7280]">Annual CTC</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp size={18} className="text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-[#171923]">{formatCurrency(monthWage * 12)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#6B7280]">Last Payment Date</span>
            <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center"><Calendar size={18} className="text-purple-600" /></div>
          </div>
          <p className="text-lg font-bold text-[#171923]">{paymentDate}</p>
        </div>
      </div>

      {/* Salary Structure */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-semibold text-[#171923] font-serif">Salary Breakdown — {displayPeriod}</h3>
          <button 
            onClick={() => handleDownloadPayslip(latestPayroll)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#502D55] text-white text-xs font-bold hover:bg-[#3e2342] transition-colors"
          >
            <Download size={14} /> Download Payslip
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">Earnings</h4>
            {latestPayroll ? (
              <>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Basic Salary</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(latestPayroll.basic)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">HRA</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(latestPayroll.hra)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Allowances</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(latestPayroll.allowances)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Performance Bonus</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(latestPayroll.bonus || 0)}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Basic Salary</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(basicSalary)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">HRA</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(hra)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Allowances</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(user?.allowances ? user.allowances : (standardAllowance + fixedAllowance + lta))}</span></div>
                {!user?.allowances && <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Performance Bonus</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(performanceBonus)}</span></div>}
              </>
            )}
            <div className="flex justify-between py-3 mt-2 bg-green-50 rounded-lg px-3"><span className="text-sm font-semibold text-green-800">Gross Salary</span><span className="text-sm font-bold text-green-800">{formatCurrency(displayGross)}</span></div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-3">Deductions</h4>
            {latestPayroll ? (
              <>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Provident Fund</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(latestPayroll.pf)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Professional Tax</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(latestPayroll.professional_tax)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Other Deductions</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(latestPayroll.other_deductions || 0)}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Provident Fund</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(pfEmployee)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Professional Tax</span><span className="text-sm font-medium text-[#171923]">{formatCurrency(professionalTax)}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-sm text-[#6B7280]">Other Deductions</span><span className="text-sm font-medium text-[#171923]">₹ 0.00</span></div>
              </>
            )}
            <div className="flex justify-between py-3 mt-2 bg-red-50 rounded-lg px-3"><span className="text-sm font-semibold text-red-800">Total Deductions</span><span className="text-sm font-bold text-red-800">{formatCurrency(displayGross - displayNet)}</span></div>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-[#502D55]/5 border border-[#502D55]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div><p className="text-base font-semibold text-[#502D55]">Net Salary</p><p className="text-xs text-[#6B7280]">Credited on {paymentDate}</p></div>
          <p className="text-2xl font-bold text-[#502D55]">{formatCurrency(displayNet)}</p>
        </div>
      </div>

      {/* Recent Payslips */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-[#171923] font-serif">Recent Payslips</h3></div>
        <div className="divide-y divide-gray-50">
          {payrolls.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">
              No historical payroll records found.
            </div>
          ) : (
            payrolls.map((pr) => {
              const prGross = pr.basic + pr.hra + pr.allowances + (pr.bonus || 0);
              const prNet = prGross - pr.pf - pr.professional_tax - (pr.other_deductions || 0);
              
              return (
                <div key={pr._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[#171923]">{pr.pay_period}</p>
                    <p className="text-xs text-[#6B7280]">Net: {formatCurrency(prNet)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDownloadPayslip(pr)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Download size={14} /> Download
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Printer size={14} /> Print
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

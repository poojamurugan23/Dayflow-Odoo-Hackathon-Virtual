const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Payroll = require('./models/Payroll');

async function seedPayroll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dayflow');
    console.log('Connected to MongoDB');

    const employees = await User.find({ role: { $in: ['employee', 'hr', 'admin'] } });

    let createdCount = 0;
    const now = new Date();

    for (const emp of employees) {
      // Calculate realistic values based on employee's stored salary components
      const monthWage = emp.month_wage || 50000;
      const basic = emp.basic_salary || (monthWage * 0.50);
      const hra = emp.hra || (basic * 0.50);
      const allowances = emp.allowances || (monthWage * 0.1667);
      const bonus = emp.allowances ? 0 : (monthWage * 0.0833);
      const pf = emp.pf || (basic * 0.12);
      const professionalTax = 200;

      // Seed for last 2 months if not exists
      for (let i = 0; i < 2; i++) {
        const periodDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const payPeriodStr = periodDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        // Ensure they were actually joined before or during this month
        const joinDate = emp.joining_date ? new Date(emp.joining_date) : new Date(2020, 0, 1);
        if (joinDate > new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0)) {
           continue; // Joined after this month ended
        }

        const existing = await Payroll.findOne({ employee_id: emp._id, pay_period: payPeriodStr });
        if (!existing) {
          await Payroll.create({
            employee_id: emp._id,
            basic: basic,
            hra: hra,
            allowances: allowances,
            bonus: bonus,
            pf: pf,
            professional_tax: professionalTax,
            other_deductions: 0,
            pay_period: payPeriodStr,
            payment_date: new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0), // Last day of month
            createdAt: new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0)
          });
          createdCount++;
        }
      }
    }

    console.log(`Successfully seeded ${createdCount} payroll records.`);
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

seedPayroll();

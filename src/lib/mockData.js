// Mock data store for the entire Dayflow application
// This provides realistic data for the demo without needing a database

export const DEPARTMENTS = ['Engineering', 'Product', 'Human Resources', 'Finance', 'Marketing', 'Operations'];

export const EMPLOYEES = [
  { id: 'demo-hr-001', employeeId: 'EMP-001', name: 'Priya Sharma', email: 'hr@dayflow.demo', role: 'admin', department: 'Human Resources', position: 'HR Director', manager: '-', status: 'Active', joiningDate: '2022-01-15', employmentType: 'Full-time', location: 'Mumbai', phone: '+91 98765 43210', about: 'Experienced HR professional with 12+ years in people management and organizational development.', skills: ['People Management', 'Recruitment', 'Policy Design', 'Compliance', 'Training'], avatar: 'PS' },
  { id: 'demo-emp-001', employeeId: 'EMP-042', name: 'Arjun Mehta', email: 'employee@dayflow.demo', role: 'employee', department: 'Engineering', position: 'Senior Software Engineer', manager: 'Rahul Verma', status: 'Active', joiningDate: '2023-03-20', employmentType: 'Full-time', location: 'Bangalore', phone: '+91 99887 76655', about: 'Full-stack developer specializing in React and Node.js with a passion for building scalable applications.', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'], avatar: 'AM' },
  { id: 'emp-003', employeeId: 'EMP-008', name: 'Rahul Verma', email: 'rahul.v@dayflow.demo', role: 'employee', department: 'Engineering', position: 'Engineering Manager', manager: 'Priya Sharma', status: 'Active', joiningDate: '2021-07-10', employmentType: 'Full-time', location: 'Bangalore', phone: '+91 98123 45678', about: 'Engineering leader focused on delivering high-quality products.', skills: ['Team Leadership', 'Architecture', 'Python', 'Go', 'System Design'], avatar: 'RV' },
  { id: 'emp-004', employeeId: 'EMP-015', name: 'Sneha Kapoor', email: 'sneha.k@dayflow.demo', role: 'employee', department: 'Product', position: 'Product Manager', manager: 'Priya Sharma', status: 'Active', joiningDate: '2023-09-05', employmentType: 'Full-time', location: 'Mumbai', phone: '+91 91234 56789', about: 'Product manager with expertise in user research and data-driven decisions.', skills: ['Product Strategy', 'User Research', 'Data Analysis', 'Figma', 'SQL'], avatar: 'SK' },
  { id: 'emp-005', employeeId: 'EMP-023', name: 'Vikram Singh', email: 'vikram.s@dayflow.demo', role: 'employee', department: 'Finance', position: 'Financial Analyst', manager: 'Priya Sharma', status: 'Active', joiningDate: '2024-01-08', employmentType: 'Full-time', location: 'Delhi', phone: '+91 87654 32109', about: 'Experienced financial analyst specializing in SaaS business metrics.', skills: ['Financial Modeling', 'Excel', 'Tally', 'Budgeting', 'Compliance'], avatar: 'VS' },
  { id: 'emp-006', employeeId: 'EMP-031', name: 'Ananya Iyer', email: 'ananya.i@dayflow.demo', role: 'employee', department: 'Marketing', position: 'Marketing Lead', manager: 'Priya Sharma', status: 'On Leave', joiningDate: '2022-11-14', employmentType: 'Full-time', location: 'Hyderabad', phone: '+91 90876 54321', about: 'Creative marketer with a track record in digital campaigns and brand strategy.', skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Google Ads', 'Analytics'], avatar: 'AI' },
  { id: 'emp-007', employeeId: 'EMP-037', name: 'Karan Patel', email: 'karan.p@dayflow.demo', role: 'employee', department: 'Operations', position: 'Operations Manager', manager: 'Priya Sharma', status: 'Active', joiningDate: '2023-06-01', employmentType: 'Full-time', location: 'Pune', phone: '+91 88765 43210', about: 'Operations expert focused on process optimization and efficiency.', skills: ['Process Optimization', 'Logistics', 'Vendor Management', 'ERP', 'Lean'], avatar: 'KP' },
  { id: 'emp-008', employeeId: 'EMP-050', name: 'Neha Gupta', email: 'neha.g@dayflow.demo', role: 'employee', department: 'Engineering', position: 'Frontend Developer', manager: 'Rahul Verma', status: 'Active', joiningDate: '2024-04-15', employmentType: 'Full-time', location: 'Bangalore', phone: '+91 97654 32100', about: 'Passionate frontend developer creating beautiful user interfaces.', skills: ['React', 'CSS', 'JavaScript', 'Figma', 'Storybook'], avatar: 'NG' },
  { id: 'emp-009', employeeId: 'EMP-055', name: 'Deepak Joshi', email: 'deepak.j@dayflow.demo', role: 'employee', department: 'Engineering', position: 'Backend Developer', manager: 'Rahul Verma', status: 'Active', joiningDate: '2024-02-20', employmentType: 'Full-time', location: 'Remote', phone: '+91 96543 21098', about: 'Backend engineer with deep expertise in distributed systems.', skills: ['Java', 'Spring Boot', 'Kafka', 'Docker', 'Kubernetes'], avatar: 'DJ' },
  { id: 'emp-010', employeeId: 'EMP-060', name: 'Meera Reddy', email: 'meera.r@dayflow.demo', role: 'employee', department: 'Human Resources', position: 'HR Specialist', manager: 'Priya Sharma', status: 'Active', joiningDate: '2024-06-10', employmentType: 'Full-time', location: 'Mumbai', phone: '+91 95432 10987', about: 'HR specialist focused on employee engagement and culture building.', skills: ['Recruitment', 'Employee Relations', 'HRIS', 'Onboarding', 'Training'], avatar: 'MR' },
];

export const ATTENDANCE_RECORDS = [
  { date: '2026-08-22', checkIn: '09:12 AM', checkOut: '-', hours: '-', status: 'Present', employeeId: 'EMP-042' },
  { date: '2026-08-21', checkIn: '09:05 AM', checkOut: '06:15 PM', hours: '09h 10m', status: 'Present', employeeId: 'EMP-042' },
  { date: '2026-08-20', checkIn: '09:30 AM', checkOut: '06:45 PM', hours: '09h 15m', status: 'Present', employeeId: 'EMP-042' },
  { date: '2026-08-19', checkIn: '-', checkOut: '-', hours: '-', status: 'Leave', employeeId: 'EMP-042' },
  { date: '2026-08-18', checkIn: '10:05 AM', checkOut: '06:30 PM', hours: '08h 25m', status: 'Present', employeeId: 'EMP-042' },
  { date: '2026-08-15', checkIn: '09:00 AM', checkOut: '05:50 PM', hours: '08h 50m', status: 'Present', employeeId: 'EMP-042' },
  { date: '2026-08-14', checkIn: '09:20 AM', checkOut: '01:30 PM', hours: '04h 10m', status: 'Half-day', employeeId: 'EMP-042' },
  { date: '2026-08-13', checkIn: '09:15 AM', checkOut: '06:00 PM', hours: '08h 45m', status: 'Present', employeeId: 'EMP-042' },
];

export const LEAVE_REQUESTS = [
  { id: 1, employeeId: 'EMP-042', employeeName: 'Arjun Mehta', type: 'Paid Leave', startDate: '2026-09-01', endDate: '2026-09-05', duration: '5 days', status: 'Pending', reason: 'Family vacation to Shimla', requestedAt: '2026-08-20' },
  { id: 2, employeeId: 'EMP-031', employeeName: 'Ananya Iyer', type: 'Sick Leave', startDate: '2026-08-22', endDate: '2026-08-23', duration: '2 days', status: 'Pending', reason: 'Not feeling well, doctor consultation', requestedAt: '2026-08-21' },
  { id: 3, employeeId: 'EMP-042', employeeName: 'Arjun Mehta', type: 'Sick Leave', startDate: '2026-07-15', endDate: '2026-07-16', duration: '2 days', status: 'Approved', reason: 'Flu and fever', requestedAt: '2026-07-14', reviewComment: 'Get well soon!' },
  { id: 4, employeeId: 'EMP-015', employeeName: 'Sneha Kapoor', type: 'Paid Leave', startDate: '2026-08-10', endDate: '2026-08-12', duration: '3 days', status: 'Approved', reason: 'Personal commitment', requestedAt: '2026-08-05' },
  { id: 5, employeeId: 'EMP-042', employeeName: 'Arjun Mehta', type: 'Unpaid Leave', startDate: '2026-06-10', endDate: '2026-06-12', duration: '3 days', status: 'Rejected', reason: 'Travel plans', requestedAt: '2026-06-05', reviewComment: 'Critical sprint in progress. Please reschedule.' },
  { id: 6, employeeId: 'EMP-050', employeeName: 'Neha Gupta', type: 'Paid Leave', startDate: '2026-09-15', endDate: '2026-09-17', duration: '3 days', status: 'Pending', reason: 'Sister\'s wedding', requestedAt: '2026-08-18' },
];

export const PAYROLL_DATA = {
  'EMP-042': {
    basic: 75000,
    hra: 30000,
    allowances: 15000,
    bonus: 10000,
    pf: 9000,
    professionalTax: 200,
    otherDeductions: 1500,
    get gross() { return this.basic + this.hra + this.allowances + this.bonus; },
    get totalDeductions() { return this.pf + this.professionalTax + this.otherDeductions; },
    get net() { return this.gross - this.totalDeductions; },
    paymentDate: '28 Aug 2026',
    payPeriod: 'August 2026',
  },
  'EMP-001': {
    basic: 120000,
    hra: 48000,
    allowances: 25000,
    bonus: 20000,
    pf: 14400,
    professionalTax: 200,
    otherDeductions: 2500,
    get gross() { return this.basic + this.hra + this.allowances + this.bonus; },
    get totalDeductions() { return this.pf + this.professionalTax + this.otherDeductions; },
    get net() { return this.gross - this.totalDeductions; },
    paymentDate: '28 Aug 2026',
    payPeriod: 'August 2026',
  },
};

export const NOTIFICATIONS = [
  { id: 1, title: 'Leave Request Approved', message: 'Your sick leave request for Jul 15-16 has been approved.', type: 'success', read: false, createdAt: '2026-08-21T10:30:00' },
  { id: 2, title: 'Payroll Updated', message: 'Your August 2026 salary slip is now available.', type: 'info', read: false, createdAt: '2026-08-20T14:00:00' },
  { id: 3, title: 'Profile Updated', message: 'Your emergency contact information has been updated.', type: 'info', read: true, createdAt: '2026-08-18T09:15:00' },
  { id: 4, title: 'Attendance Reminder', message: 'You forgot to check out yesterday. Please regularize.', type: 'warning', read: true, createdAt: '2026-08-17T08:00:00' },
  { id: 5, title: 'New Policy', message: 'Updated work-from-home policy effective September 2026.', type: 'info', read: true, createdAt: '2026-08-15T11:00:00' },
];

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

# Dashboard & Features Execution Tasks

## 1. Backend Models & Logic
- `[x]` Create `server/models/Complaint.js`
- `[x]` Update `server/models/User.js` with `is_approved`, `must_change_password`, and `serial_number`.
- `[x]` Update `server/routes/auth.js` for HR-only signup, auto-password generation, and ID generation logic.
- `[x]` Add HR approval endpoint (`/approve-hr`) for Super Admin.
- `[x]` Add `/change-password` endpoint.
- `[x]` Update `server/routes/api.js` for Complaints and Meetings endpoints.

## 2. Frontend Infrastructure
- `[x]` Update `App.jsx` to separate `/employee`, `/hr`, and `/superadmin` routes.
- `[x]` Update `DashboardLayout.jsx` navigation items for 3 distinct roles.
- `[x]` Implement `ForcePasswordChange.jsx` to enforce password updates.

## 3. Super Admin Dashboard
- `[ ]` Build `/superadmin/dashboard` overview.
- `[ ]` Build `/superadmin/hrs` (view HRs).
- `[x]` Build `/superadmin/hr-approval` (Approve pending HR signups).
- `[ ]` Build Employee Management page (`/superadmin/employees`).
- `[ ]` Build HR Management page (`/superadmin/hrs`).
- `[x]` Build Complaints Management (`/superadmin/complaints`).
- `[x]` Build Meetings Management (`/superadmin/meetings`).

## 4. Employee Dashboard
- `[ ]` Enhance Dashboard Home (Charts, Check-in, Working hours).
- `[ ]` Enhance Profile (Picture, Resume upload via Base64).
- `[ ]` Enhance Attendance (Date/month stacking).
- `[ ]` Enhance Time Off (Leave letter upload).
- `[ ]` Enhance Salary (Payslip PDF download).
- `[ ]` Build Complaints page (Raise ticket, Auto-generate PDF).

## 5. HR Dashboard
- `[ ]` Ensure HR can manage employee data.
- `[ ]` Ensure HR can raise complaints to Super Admin.

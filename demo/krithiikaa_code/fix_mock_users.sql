-- Fix 500 Internal Server Error by adding auth.identities
-- Run this in your Supabase SQL Editor

-- 1. Delete the old mock users to start fresh
DELETE FROM auth.users WHERE email IN (
  'hr@dayflow.demo', 'employee@dayflow.demo', 'rahul.v@dayflow.demo', 
  'sneha.k@dayflow.demo', 'vikram.s@dayflow.demo', 'ananya.i@dayflow.demo', 
  'karan.p@dayflow.demo', 'neha.g@dayflow.demo', 'deepak.j@dayflow.demo', 'meera.r@dayflow.demo'
);

-- 2. Insert into auth.users again
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'hr@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'employee@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'rahul.v@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'sneha.k@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'vikram.s@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'ananya.i@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated', 'karan.p@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'authenticated', 'authenticated', 'neha.g@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999', 'authenticated', 'authenticated', 'deepak.j@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now()),
('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'meera.r@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), now(), now());

-- 3. CRITICAL: Insert into auth.identities so Supabase Auth doesn't crash (500 Error)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'hr@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'employee@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', format('{"sub":"%s","email":"%s"}', '33333333-3333-3333-3333-333333333333', 'rahul.v@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', format('{"sub":"%s","email":"%s"}', '44444444-4444-4444-4444-444444444444', 'sneha.k@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', format('{"sub":"%s","email":"%s"}', '55555555-5555-5555-5555-555555555555', 'vikram.s@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', format('{"sub":"%s","email":"%s"}', '66666666-6666-6666-6666-666666666666', 'ananya.i@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', format('{"sub":"%s","email":"%s"}', '77777777-7777-7777-7777-777777777777', 'karan.p@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', format('{"sub":"%s","email":"%s"}', '88888888-8888-8888-8888-888888888888', 'neha.g@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', format('{"sub":"%s","email":"%s"}', '99999999-9999-9999-9999-999999999999', 'deepak.j@dayflow.demo')::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', format('{"sub":"%s","email":"%s"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'meera.r@dayflow.demo')::jsonb, 'email', now(), now(), now());

-- 4. Re-insert into Profiles (since they were cascade deleted when auth.users was deleted)
INSERT INTO profiles (id, login_id, role, name, email, phone, company_name, department, position, manager_id, status, joining_date, employment_type, location, about)
VALUES
('11111111-1111-1111-1111-111111111111', 'OIJODO20260001', 'admin', 'Priya Sharma', 'hr@dayflow.demo', '+91 98765 43210', 'Odoo India', 'Human Resources', 'HR Director', NULL, 'Active', '2022-01-15', 'Full-time', 'Mumbai', 'Experienced HR professional with 12+ years in people management.'),
('22222222-2222-2222-2222-222222222222', 'OIJODO20260002', 'employee', 'Arjun Mehta', 'employee@dayflow.demo', '+91 99887 76655', 'Odoo India', 'Engineering', 'Senior Software Engineer', '11111111-1111-1111-1111-111111111111', 'Active', '2023-03-20', 'Full-time', 'Bangalore', 'Full-stack developer specializing in React and Node.js.'),
('33333333-3333-3333-3333-333333333333', 'OIJODO20260003', 'employee', 'Rahul Verma', 'rahul.v@dayflow.demo', '+91 98123 45678', 'Odoo India', 'Engineering', 'Engineering Manager', '11111111-1111-1111-1111-111111111111', 'Active', '2021-07-10', 'Full-time', 'Bangalore', 'Engineering leader focused on delivering high-quality products.'),
('44444444-4444-4444-4444-444444444444', 'OIJODO20260004', 'employee', 'Sneha Kapoor', 'sneha.k@dayflow.demo', '+91 91234 56789', 'Odoo India', 'Product', 'Product Manager', '11111111-1111-1111-1111-111111111111', 'Active', '2023-09-05', 'Full-time', 'Mumbai', 'Product manager with expertise in user research and data.'),
('55555555-5555-5555-5555-555555555555', 'OIJODO20260005', 'employee', 'Vikram Singh', 'vikram.s@dayflow.demo', '+91 87654 32109', 'Odoo India', 'Finance', 'Financial Analyst', '11111111-1111-1111-1111-111111111111', 'Active', '2024-01-08', 'Full-time', 'Delhi', 'Experienced financial analyst specializing in SaaS.'),
('66666666-6666-6666-6666-666666666666', 'OIJODO20260006', 'employee', 'Ananya Iyer', 'ananya.i@dayflow.demo', '+91 90876 54321', 'Odoo India', 'Marketing', 'Marketing Lead', '11111111-1111-1111-1111-111111111111', 'On Leave', '2022-11-14', 'Full-time', 'Hyderabad', 'Creative marketer with digital campaign track record.'),
('77777777-7777-7777-7777-777777777777', 'OIJODO20260007', 'employee', 'Karan Patel', 'karan.p@dayflow.demo', '+91 88765 43210', 'Odoo India', 'Operations', 'Operations Manager', '11111111-1111-1111-1111-111111111111', 'Active', '2023-06-01', 'Full-time', 'Pune', 'Operations expert focused on process optimization.'),
('88888888-8888-8888-8888-888888888888', 'OIJODO20260008', 'employee', 'Neha Gupta', 'neha.g@dayflow.demo', '+91 97654 32100', 'Odoo India', 'Engineering', 'Frontend Developer', '33333333-3333-3333-3333-333333333333', 'Active', '2024-04-15', 'Full-time', 'Bangalore', 'Passionate frontend developer creating beautiful UIs.'),
('99999999-9999-9999-9999-999999999999', 'OIJODO20260009', 'employee', 'Deepak Joshi', 'deepak.j@dayflow.demo', '+91 96543 21098', 'Odoo India', 'Engineering', 'Backend Developer', '33333333-3333-3333-3333-333333333333', 'Active', '2024-02-20', 'Full-time', 'Remote', 'Backend engineer with deep expertise in distributed systems.'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OIJODO20260010', 'employee', 'Meera Reddy', 'meera.r@dayflow.demo', '+91 95432 10987', 'Odoo India', 'Human Resources', 'HR Specialist', '11111111-1111-1111-1111-111111111111', 'Active', '2024-06-10', 'Full-time', 'Mumbai', 'HR specialist focused on employee engagement.');

-- 5. Re-insert Attendance Records (since they were cascade deleted)
INSERT INTO attendance_records (employee_id, date, check_in, check_out, status)
VALUES
('22222222-2222-2222-2222-222222222222', CURRENT_DATE, CURRENT_DATE + interval '9 hours', NULL, 'Present'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - interval '1 day', CURRENT_DATE - interval '1 day' + interval '9 hours', CURRENT_DATE - interval '1 day' + interval '18 hours', 'Present'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - interval '2 days', CURRENT_DATE - interval '2 days' + interval '9.5 hours', CURRENT_DATE - interval '2 days' + interval '18.75 hours', 'Present'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - interval '3 days', NULL, NULL, 'Leave'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - interval '4 days', CURRENT_DATE - interval '4 days' + interval '10 hours', CURRENT_DATE - interval '4 days' + interval '18.5 hours', 'Present');

-- 6. Re-insert Leave Requests
INSERT INTO leave_requests (employee_id, type, start_date, end_date, status, reason, review_comment)
VALUES
('22222222-2222-2222-2222-222222222222', 'Paid Leave', CURRENT_DATE + interval '10 days', CURRENT_DATE + interval '15 days', 'Pending', 'Family vacation to Shimla', NULL),
('66666666-6666-6666-6666-666666666666', 'Sick Leave', CURRENT_DATE, CURRENT_DATE + interval '1 day', 'Pending', 'Not feeling well, doctor consultation', NULL),
('22222222-2222-2222-2222-222222222222', 'Sick Leave', CURRENT_DATE - interval '30 days', CURRENT_DATE - interval '28 days', 'Approved', 'Flu and fever', 'Get well soon!'),
('44444444-4444-4444-4444-444444444444', 'Paid Leave', CURRENT_DATE - interval '15 days', CURRENT_DATE - interval '12 days', 'Approved', 'Personal commitment', NULL),
('22222222-2222-2222-2222-222222222222', 'Unpaid Leave', CURRENT_DATE - interval '60 days', CURRENT_DATE - interval '58 days', 'Rejected', 'Travel plans', 'Critical sprint in progress. Please reschedule.');

-- 7. Re-insert Payroll Data
INSERT INTO payroll_data (employee_id, basic, hra, allowances, bonus, pf, professional_tax, other_deductions, pay_period, payment_date)
VALUES
('22222222-2222-2222-2222-222222222222', 75000, 30000, 15000, 10000, 9000, 200, 1500, 'August 2026', '2026-08-28'),
('11111111-1111-1111-1111-111111111111', 120000, 48000, 25000, 20000, 14400, 200, 2500, 'August 2026', '2026-08-28'),
('33333333-3333-3333-3333-333333333333', 110000, 44000, 20000, 15000, 13200, 200, 0, 'August 2026', '2026-08-28');

-- 8. Re-insert Notifications
INSERT INTO notifications (employee_id, title, message, type, is_read, created_at)
VALUES
('22222222-2222-2222-2222-222222222222', 'Leave Request Approved', 'Your sick leave request for last month was approved.', 'success', false, CURRENT_TIMESTAMP - interval '1 day'),
('22222222-2222-2222-2222-222222222222', 'Payroll Updated', 'Your August 2026 salary slip is now available.', 'info', false, CURRENT_TIMESTAMP - interval '2 days'),
('22222222-2222-2222-2222-222222222222', 'Profile Updated', 'Your emergency contact information has been updated.', 'info', true, CURRENT_TIMESTAMP - interval '4 days'),
('22222222-2222-2222-2222-222222222222', 'Attendance Reminder', 'You forgot to check out yesterday. Please regularize.', 'warning', true, CURRENT_TIMESTAMP - interval '5 days'),
('11111111-1111-1111-1111-111111111111', 'New Leave Request', 'Arjun Mehta has requested Paid Leave.', 'info', false, CURRENT_TIMESTAMP - interval '1 hour');

-- =============================================================
-- DAYFLOW HRMS - SEED MOCK DATA
-- Run this AFTER supabase_schema.sql has been run successfully
-- AND AFTER you have disabled "Confirm email" in Auth > Providers > Email
-- =============================================================

-- ===================== MOCK USERS =====================
-- These are created properly with auth.identities so login works!

-- User 1: Priya Sharma (Admin / HR Director)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'hr@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Priya Sharma","company_name":"Odoo India","role":"admin","phone":"+91 98765 43210"}'::jsonb, now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"hr@dayflow.demo"}'::jsonb, 'email', now(), now(), now());

-- User 2: Arjun Mehta (Employee / Senior Software Engineer)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'employee@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Arjun Mehta","company_name":"Odoo India","role":"employee","phone":"+91 99887 76655"}'::jsonb, now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"employee@dayflow.demo"}'::jsonb, 'email', now(), now(), now());

-- User 3: Rahul Verma (Employee / Engineering Manager)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'rahul.v@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Rahul Verma","company_name":"Odoo India","role":"employee","phone":"+91 98123 45678"}'::jsonb, now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"rahul.v@dayflow.demo"}'::jsonb, 'email', now(), now(), now());

-- User 4: Sneha Kapoor (Employee / Product Manager)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'sneha.k@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Sneha Kapoor","company_name":"Odoo India","role":"employee","phone":"+91 91234 56789"}'::jsonb, now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '{"sub":"44444444-4444-4444-4444-444444444444","email":"sneha.k@dayflow.demo"}'::jsonb, 'email', now(), now(), now());

-- User 5: Vikram Singh (Employee / Financial Analyst)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'vikram.s@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Vikram Singh","company_name":"Odoo India","role":"employee","phone":"+91 87654 32109"}'::jsonb, now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '{"sub":"55555555-5555-5555-5555-555555555555","email":"vikram.s@dayflow.demo"}'::jsonb, 'email', now(), now(), now());

-- User 6-10 (more employees)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'ananya.i@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Ananya Iyer","company_name":"Odoo India","role":"employee","phone":"+91 90876 54321"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated', 'karan.p@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Karan Patel","company_name":"Odoo India","role":"employee","phone":"+91 88765 43210"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'authenticated', 'authenticated', 'neha.g@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Neha Gupta","company_name":"Odoo India","role":"employee","phone":"+91 97654 32100"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999', 'authenticated', 'authenticated', 'deepak.j@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Deepak Joshi","company_name":"Odoo India","role":"employee","phone":"+91 96543 21098"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'meera.r@dayflow.demo', crypt('Demo@123', gen_salt('bf')), now(), '{"name":"Meera Reddy","company_name":"Odoo India","role":"employee","phone":"+91 95432 10987"}'::jsonb, now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '{"sub":"66666666-6666-6666-6666-666666666666","email":"ananya.i@dayflow.demo"}'::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '{"sub":"77777777-7777-7777-7777-777777777777","email":"karan.p@dayflow.demo"}'::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', '{"sub":"88888888-8888-8888-8888-888888888888","email":"neha.g@dayflow.demo"}'::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), '99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', '{"sub":"99999999-9999-9999-9999-999999999999","email":"deepak.j@dayflow.demo"}'::jsonb, 'email', now(), now(), now()),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"meera.r@dayflow.demo"}'::jsonb, 'email', now(), now(), now());

-- The handle_new_user trigger already created profiles automatically!
-- Now let's update them with extra details (department, position, etc.)

UPDATE profiles SET department = 'Human Resources', position = 'HR Director', status = 'Active', joining_date = '2022-01-15', location = 'Mumbai', about = 'Experienced HR professional with 12+ years in people management.' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE profiles SET department = 'Engineering', position = 'Senior Software Engineer', status = 'Active', joining_date = '2023-03-20', location = 'Bangalore', about = 'Full-stack developer specializing in React and Node.js.', manager_id = '11111111-1111-1111-1111-111111111111' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE profiles SET department = 'Engineering', position = 'Engineering Manager', status = 'Active', joining_date = '2021-07-10', location = 'Bangalore', about = 'Engineering leader focused on delivering high-quality products.', manager_id = '11111111-1111-1111-1111-111111111111' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE profiles SET department = 'Product', position = 'Product Manager', status = 'Active', joining_date = '2023-09-05', location = 'Mumbai', about = 'Product manager with expertise in user research.', manager_id = '11111111-1111-1111-1111-111111111111' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE profiles SET department = 'Finance', position = 'Financial Analyst', status = 'Active', joining_date = '2024-01-08', location = 'Delhi', about = 'Experienced financial analyst specializing in SaaS.', manager_id = '11111111-1111-1111-1111-111111111111' WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE profiles SET department = 'Marketing', position = 'Marketing Lead', status = 'On Leave', joining_date = '2022-11-14', location = 'Hyderabad', about = 'Creative marketer with digital campaign expertise.', manager_id = '11111111-1111-1111-1111-111111111111' WHERE id = '66666666-6666-6666-6666-666666666666';
UPDATE profiles SET department = 'Operations', position = 'Operations Manager', status = 'Active', joining_date = '2023-06-01', location = 'Pune', about = 'Operations expert focused on process optimization.', manager_id = '11111111-1111-1111-1111-111111111111' WHERE id = '77777777-7777-7777-7777-777777777777';
UPDATE profiles SET department = 'Engineering', position = 'Frontend Developer', status = 'Active', joining_date = '2024-04-15', location = 'Bangalore', about = 'Passionate frontend developer.', manager_id = '33333333-3333-3333-3333-333333333333' WHERE id = '88888888-8888-8888-8888-888888888888';
UPDATE profiles SET department = 'Engineering', position = 'Backend Developer', status = 'Active', joining_date = '2024-02-20', location = 'Remote', about = 'Backend engineer with distributed systems expertise.', manager_id = '33333333-3333-3333-3333-333333333333' WHERE id = '99999999-9999-9999-9999-999999999999';
UPDATE profiles SET department = 'Human Resources', position = 'HR Specialist', status = 'Active', joining_date = '2024-06-10', location = 'Mumbai', about = 'HR specialist focused on employee engagement.', manager_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';


-- ===================== SEED ATTENDANCE =====================
INSERT INTO attendance_records (employee_id, date, check_in, check_out, status) VALUES
('22222222-2222-2222-2222-222222222222', CURRENT_DATE, CURRENT_DATE + interval '9 hours 12 minutes', NULL, 'Present'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 1, (CURRENT_DATE - 1) + interval '9 hours 5 minutes', (CURRENT_DATE - 1) + interval '18 hours 15 minutes', 'Present'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 2, (CURRENT_DATE - 2) + interval '9 hours 30 minutes', (CURRENT_DATE - 2) + interval '18 hours 45 minutes', 'Present'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 3, NULL, NULL, 'Leave'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 4, (CURRENT_DATE - 4) + interval '10 hours 5 minutes', (CURRENT_DATE - 4) + interval '18 hours 30 minutes', 'Present');

-- ===================== SEED LEAVE REQUESTS =====================
INSERT INTO leave_requests (employee_id, type, start_date, end_date, status, reason, review_comment) VALUES
('22222222-2222-2222-2222-222222222222', 'Paid Leave', CURRENT_DATE + 10, CURRENT_DATE + 15, 'Pending', 'Family vacation to Shimla', NULL),
('66666666-6666-6666-6666-666666666666', 'Sick Leave', CURRENT_DATE, CURRENT_DATE + 1, 'Pending', 'Not feeling well, doctor consultation', NULL),
('22222222-2222-2222-2222-222222222222', 'Sick Leave', CURRENT_DATE - 30, CURRENT_DATE - 28, 'Approved', 'Flu and fever', 'Get well soon!'),
('44444444-4444-4444-4444-444444444444', 'Paid Leave', CURRENT_DATE - 15, CURRENT_DATE - 12, 'Approved', 'Personal commitment', NULL),
('22222222-2222-2222-2222-222222222222', 'Unpaid Leave', CURRENT_DATE - 60, CURRENT_DATE - 58, 'Rejected', 'Travel plans', 'Critical sprint in progress.');

-- ===================== SEED PAYROLL =====================
INSERT INTO payroll_data (employee_id, basic, hra, allowances, bonus, pf, professional_tax, other_deductions, pay_period, payment_date) VALUES
('22222222-2222-2222-2222-222222222222', 75000, 30000, 15000, 10000, 9000, 200, 1500, 'August 2026', '2026-08-28'),
('11111111-1111-1111-1111-111111111111', 120000, 48000, 25000, 20000, 14400, 200, 2500, 'August 2026', '2026-08-28'),
('33333333-3333-3333-3333-333333333333', 110000, 44000, 20000, 15000, 13200, 200, 0, 'August 2026', '2026-08-28');

-- ===================== SEED NOTIFICATIONS =====================
INSERT INTO notifications (employee_id, title, message, type, is_read, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'Leave Request Approved', 'Your sick leave request for last month was approved.', 'success', false, now() - interval '1 day'),
('22222222-2222-2222-2222-222222222222', 'Payroll Updated', 'Your August 2026 salary slip is now available.', 'info', false, now() - interval '2 days'),
('22222222-2222-2222-2222-222222222222', 'Profile Updated', 'Your emergency contact information has been updated.', 'info', true, now() - interval '4 days'),
('22222222-2222-2222-2222-222222222222', 'Attendance Reminder', 'You forgot to check out yesterday. Please regularize.', 'warning', true, now() - interval '5 days'),
('11111111-1111-1111-1111-111111111111', 'New Leave Request', 'Arjun Mehta has requested Paid Leave.', 'info', false, now() - interval '1 hour');

-- =============================================================
-- DAYFLOW HRMS - COMPLETE DATABASE RESET & FIX
-- Run this ENTIRE script in your Supabase SQL Editor
-- This will fix ALL 500/401/404 errors
-- =============================================================

-- ===================== STEP 1: CLEAN UP =====================
-- Drop all existing tables and policies to start completely fresh

-- Drop policies first (they depend on tables)
DO $$ BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  -- attendance
  DROP POLICY IF EXISTS "Users see own attendance" ON attendance_records;
  DROP POLICY IF EXISTS "Users can create own attendance" ON attendance_records;
  DROP POLICY IF EXISTS "Users can update own attendance" ON attendance_records;
  -- leaves
  DROP POLICY IF EXISTS "Users see own leaves" ON leave_requests;
  DROP POLICY IF EXISTS "Users can create own leaves" ON leave_requests;
  DROP POLICY IF EXISTS "Admins can update leaves" ON leave_requests;
  -- payroll
  DROP POLICY IF EXISTS "Users see own payroll" ON payroll_data;
  DROP POLICY IF EXISTS "Only Admins/HR can modify payroll" ON payroll_data;
  -- notifications
  DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
  DROP POLICY IF EXISTS "System/Admins can insert notifications" ON notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payroll_data CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop old trigger and function
DROP TRIGGER IF EXISTS set_login_id_trigger ON profiles;
DROP FUNCTION IF EXISTS generate_login_id() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP SEQUENCE IF EXISTS login_id_seq;

-- Delete ALL broken mock users from auth
DELETE FROM auth.users WHERE email LIKE '%@dayflow.demo';


-- ===================== STEP 2: CREATE TABLES =====================

-- Sequence for login IDs
CREATE SEQUENCE login_id_seq START 1;

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    login_id TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'employee')),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    company_name TEXT,
    department TEXT,
    position TEXT,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Active',
    joining_date DATE DEFAULT CURRENT_DATE,
    employment_type TEXT DEFAULT 'Full-time',
    location TEXT,
    about TEXT,
    skills TEXT[],
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'Present',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Leave Requests
CREATE TABLE leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reason TEXT NOT NULL,
    review_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll
CREATE TABLE payroll_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    basic NUMERIC NOT NULL DEFAULT 0,
    hra NUMERIC NOT NULL DEFAULT 0,
    allowances NUMERIC NOT NULL DEFAULT 0,
    bonus NUMERIC NOT NULL DEFAULT 0,
    pf NUMERIC NOT NULL DEFAULT 0,
    professional_tax NUMERIC NOT NULL DEFAULT 0,
    other_deductions NUMERIC NOT NULL DEFAULT 0,
    pay_period TEXT NOT NULL,
    payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, pay_period)
);

-- Notifications
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ===================== STEP 3: AUTO-CREATE PROFILE ON SIGNUP =====================
-- This is the KEY fix: when someone signs up via the app,
-- this trigger automatically creates their profile row.
-- It runs as SECURITY DEFINER so it bypasses RLS (no more 401 errors!)

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    company_prefix TEXT;
    year_prefix TEXT;
    seq_val INT;
    final_login_id TEXT;
    user_name TEXT;
    user_company TEXT;
    user_role TEXT;
    user_phone TEXT;
BEGIN
    -- Read metadata passed during signUp()
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'New User');
    user_company := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Company');
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
    user_phone := NEW.raw_user_meta_data->>'phone';

    -- Generate the Login ID: OIJ + first 3 letters of company + year + sequence
    IF user_company IS NOT NULL AND length(user_company) >= 3 THEN
        company_prefix := upper(substring(regexp_replace(user_company, '[^a-zA-Z]', '', 'g') from 1 for 3));
    ELSE
        company_prefix := 'EMP';
    END IF;
    IF length(company_prefix) < 3 THEN
        company_prefix := 'EMP';
    END IF;

    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    seq_val := nextval('login_id_seq');
    final_login_id := 'OIJ' || company_prefix || year_prefix || lpad(seq_val::text, 4, '0');

    -- Insert into profiles
    INSERT INTO profiles (id, login_id, email, name, role, company_name, phone)
    VALUES (NEW.id, final_login_id, NEW.email, user_name, user_role, user_company, user_phone);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: fires automatically after a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- ===================== STEP 4: ROW LEVEL SECURITY =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Attendance
CREATE POLICY "View own or admin views all attendance" ON attendance_records FOR SELECT
  USING (auth.uid() = employee_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "Insert own attendance" ON attendance_records FOR INSERT
  WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "Update own attendance" ON attendance_records FOR UPDATE
  USING (auth.uid() = employee_id);

-- Leave Requests
CREATE POLICY "View own or admin views all leaves" ON leave_requests FOR SELECT
  USING (auth.uid() = employee_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "Insert own leave" ON leave_requests FOR INSERT
  WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "Update own or admin updates leaves" ON leave_requests FOR UPDATE
  USING (auth.uid() = employee_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Payroll
CREATE POLICY "View own or admin views all payroll" ON payroll_data FOR SELECT
  USING (auth.uid() = employee_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "Admin manages payroll" ON payroll_data FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Notifications
CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (auth.uid() = employee_id);
CREATE POLICY "Admin inserts notifications" ON notifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

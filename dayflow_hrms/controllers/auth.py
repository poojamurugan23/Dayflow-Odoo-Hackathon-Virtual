# -*- coding: utf-8 -*-
import base64
import datetime
import re
import werkzeug
from odoo import http, _
from odoo.http import request
from odoo.exceptions import AccessDenied


class DayflowAuthController(http.Controller):

    @http.route(['/dayflow/login', '/web/login'], type='http', auth='none', methods=['GET', 'POST'], csrf=False)
    def dayflow_login(self, **kw):
        """
        Dayflow HRMS Sign In Controller
        Supports authentication by Employee / Login ID (e.g. OIJODO20260001) or Email
        """
        # If user is already logged in, redirect to Dayflow HRMS main app
        if request.session.uid:
            redirect_url = kw.get('redirect') or '/web'
            return werkzeug.utils.redirect(redirect_url)

        values = {
            'error': kw.get('error', ''),
            'success': kw.get('success', ''),
            'msg': kw.get('msg', ''),
            'login': kw.get('login', ''),
            'redirect': kw.get('redirect', '/web'),
        }

        if request.httprequest.method == 'POST':
            login_input = (kw.get('login') or '').strip()
            password = (kw.get('password') or '').strip()
            redirect_target = kw.get('redirect') or '/web'

            if not login_input or not password:
                values['error'] = 'Please enter your Login ID / Email and password.'
                values['login'] = login_input
                return request.render('dayflow_hrms.dayflow_login_template', values)

            # Determine the actual Odoo res.users login identifier
            # Search order:
            # 1. Direct login in res.users
            # 2. Email in res.users
            # 3. Employee ID in dayflow.employee -> linked user
            # 4. Email in dayflow.employee -> linked user
            db = request.db or kw.get('db')
            user_sudo = request.env['res.users'].sudo()
            emp_sudo = request.env['dayflow.employee'].sudo()

            actual_login = login_input

            # Check res.users direct match or email match
            user = user_sudo.search([('login', '=ilike', login_input)], limit=1)
            if not user:
                user = user_sudo.search([('email', '=ilike', login_input)], limit=1)

            # Check dayflow.employee ID or email
            if not user:
                emp = emp_sudo.search([('employee_id', '=ilike', login_input)], limit=1)
                if not emp:
                    emp = emp_sudo.search([('email', '=ilike', login_input)], limit=1)
                if emp and emp.user_id:
                    user = emp.user_id

            if user and user.login:
                actual_login = user.login

            # Authenticate with Odoo session
            try:
                request.session.authenticate(db, actual_login, password)
                return werkzeug.utils.redirect(redirect_target)
            except AccessDenied:
                values['error'] = 'Invalid Login ID / Email or Password. Please verify your credentials.'
                values['login'] = login_input
                return request.render('dayflow_hrms.dayflow_login_template', values)
            except Exception as e:
                values['error'] = f'Authentication error: {str(e)}'
                values['login'] = login_input
                return request.render('dayflow_hrms.dayflow_login_template', values)

        return request.render('dayflow_hrms.dayflow_login_template', values)

    @http.route('/dayflow/signup', type='http', auth='none', methods=['GET', 'POST'], csrf=False)
    def dayflow_signup(self, **kw):
        """
        Dayflow HRMS Company & Initial HR/Admin Registration Controller
        Strictly for creating new organization accounts (NOT employee self-registration)
        """
        # If already logged in, redirect to app
        if request.session.uid:
            return werkzeug.utils.redirect('/web')

        values = {
            'error': kw.get('error', ''),
            'company_name': kw.get('company_name', ''),
            'first_name': kw.get('first_name', ''),
            'last_name': kw.get('last_name', ''),
            'email': kw.get('email', ''),
            'phone': kw.get('phone', ''),
        }

        if request.httprequest.method == 'POST':
            company_name = (kw.get('company_name') or '').strip()
            first_name = (kw.get('first_name') or '').strip()
            last_name = (kw.get('last_name') or '').strip()
            email = (kw.get('email') or '').strip()
            phone = (kw.get('phone') or '').strip()
            password = (kw.get('password') or '').strip()
            confirm_password = (kw.get('confirm_password') or '').strip()

            values.update({
                'company_name': company_name,
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': phone,
            })

            # Validation 1: Required fields
            if not company_name:
                values['error'] = 'Company Name is required.'
                return request.render('dayflow_hrms.dayflow_signup_template', values)
            if not first_name or not last_name:
                values['error'] = 'Both First Name and Last Name of HR/Admin are required.'
                return request.render('dayflow_hrms.dayflow_signup_template', values)
            if not email:
                values['error'] = 'Work Email is required.'
                return request.render('dayflow_hrms.dayflow_signup_template', values)
            if not password:
                values['error'] = 'Password is required.'
                return request.render('dayflow_hrms.dayflow_signup_template', values)

            # Validation 2: Email format
            email_pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not re.match(email_pattern, email):
                values['error'] = 'Please enter a valid email address.'
                return request.render('dayflow_hrms.dayflow_signup_template', values)

            # Validation 3: Passwords match
            if password != confirm_password:
                values['error'] = 'Passwords do not match. Please re-enter.'
                return request.render('dayflow_hrms.dayflow_signup_template', values)

            if len(password) < 6:
                values['error'] = 'Password must be at least 6 characters in length.'
                return request.render('dayflow_hrms.dayflow_signup_template', values)

            # Validation 4: Duplicate user / email check
            user_sudo = request.env['res.users'].sudo()
            existing_user = user_sudo.search([
                '|',
                ('login', '=ilike', email),
                ('email', '=ilike', email)
            ], limit=1)
            if existing_user:
                values['error'] = 'An account with this email address already exists. Please sign in.'
                return request.render('dayflow_hrms.dayflow_signup_template', values)

            # Process Company Logo upload
            logo_base64 = False
            if 'company_logo' in request.httprequest.files:
                logo_file = request.httprequest.files['company_logo']
                if logo_file and logo_file.filename:
                    try:
                        content = logo_file.read()
                        if content:
                            logo_base64 = base64.b64encode(content)
                    except Exception:
                        pass

            try:
                # 1. Create Company in res.company
                company_vals = {
                    'name': company_name,
                    'phone': phone or False,
                    'email': email,
                }
                if logo_base64:
                    company_vals['logo'] = logo_base64

                new_company = request.env['res.company'].sudo().create(company_vals)

                # 2. Create Initial HR / Admin User in res.users
                full_name = f"{first_name} {last_name}".strip()
                emp_model = request.env['dayflow.employee'].sudo()
                joining_date = datetime.date.today()

                # Generate standardized Login ID
                login_id = emp_model._generate_employee_login_id(
                    first_name=first_name,
                    last_name=last_name,
                    full_name=full_name,
                    joining_date=joining_date
                )

                admin_group = request.env.ref('dayflow_hrms.group_dayflow_admin', raise_if_not_found=False)
                base_group = request.env.ref('base.group_user', raise_if_not_found=False)
                group_ids = [g.id for g in [base_group, admin_group] if g]

                user_vals = {
                    'name': full_name,
                    'login': email, # Primary login is email (and controller supports login_id as well)
                    'email': email,
                    'password': password,
                    'company_id': new_company.id,
                    'company_ids': [(6, 0, [new_company.id])],
                }
                if group_ids:
                    user_vals['groups_id'] = [(6, 0, group_ids)]

                new_user = user_sudo.create(user_vals)

                # 3. Create Corresponding Initial HR/Admin dayflow.employee record
                emp_vals = {
                    'name': full_name,
                    'first_name': first_name,
                    'last_name': last_name,
                    'employee_id': login_id,
                    'email': email,
                    'phone': phone or False,
                    'job_position': 'HR Administrator & Founder',
                    'department': 'Human Resources',
                    'joining_date': joining_date,
                    'company_id': new_company.id,
                    'user_id': new_user.id,
                }
                if logo_base64:
                    emp_vals['image_1920'] = logo_base64

                emp_model.create(emp_vals)

                # 4. Authenticate session & redirect directly to Dayflow HRMS
                db = request.db or kw.get('db')
                try:
                    request.session.authenticate(db, new_user.login, password)
                    return werkzeug.utils.redirect('/web')
                except Exception:
                    # Fallback redirect to login with prefilled email
                    success_msg = f"Company '{company_name}' registered successfully! Your Login ID is {login_id}. Please sign in."
                    return werkzeug.utils.redirect(
                        f'/dayflow/login?success=1&login={email}&msg={werkzeug.urls.url_quote(success_msg)}'
                    )

            except Exception as e:
                values['error'] = f"Registration error: {str(e)}"
                return request.render('dayflow_hrms.dayflow_signup_template', values)

        return request.render('dayflow_hrms.dayflow_signup_template', values)

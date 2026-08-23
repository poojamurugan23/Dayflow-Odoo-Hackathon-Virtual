# -*- coding: utf-8 -*-
from odoo import models, fields, api, exceptions
import datetime
import re
import secrets


class DayflowEmployee(models.Model):
    _name = 'dayflow.employee'
    _description = 'Dayflow HRMS Employee'
    _order = 'name asc'

    name = fields.Char(
        string='Full Name',
        required=True,
        index=True,
        help='Full name of the employee'
    )
    first_name = fields.Char(
        string='First Name',
        help='Employee first name'
    )
    last_name = fields.Char(
        string='Last Name',
        help='Employee last name / surname'
    )
    employee_id = fields.Char(
        string='Employee / Login ID',
        required=True,
        copy=False,
        index=True,
        default=lambda self: self._generate_default_employee_id(),
        help='Unique identifier and login ID for the employee (e.g. OIJODO20260001)'
    )
    temp_password = fields.Char(
        string='Initial Temporary Password',
        readonly=True,
        copy=False,
        help='System-generated temporary password for initial onboarding. Provide this securely to the employee.'
    )
    email = fields.Char(
        string='Email',
        index=True,
        help='Work or contact email address'
    )
    phone = fields.Char(
        string='Phone Number',
        help='Work or contact phone number'
    )
    image_1920 = fields.Image(
        string='Profile Picture',
        max_width=1920,
        max_height=1920,
        help='Employee profile photo'
    )
    job_position = fields.Char(
        string='Job Position',
        help='Designation or job title of the employee'
    )
    department = fields.Char(
        string='Department',
        help='Assigned department name'
    )
    joining_date = fields.Date(
        string='Joining Date',
        default=fields.Date.context_today,
        help='Date when the employee joined the company'
    )
    user_id = fields.Many2one(
        'res.users',
        string='Related User Login',
        index=True,
        help='Odoo user login associated with this employee record'
    )
    company_id = fields.Many2one(
        'res.company',
        string='Company',
        default=lambda self: self.env.company,
        help='Company this employee belongs to'
    )
    active = fields.Boolean(
        string='Active',
        default=True,
        help='Set to False to archive this employee record'
    )
    attendance_ids = fields.One2many(
        'dayflow.attendance',
        'employee_id',
        string='Attendance Records'
    )
    attendance_count = fields.Integer(
        string='Attendance Count',
        compute='_compute_attendance_count'
    )
    attendance_state = fields.Selection(
        [
            ('checked_in', 'Checked In'),
            ('checked_out', 'Checked Out'),
        ],
        string='Attendance Status',
        compute='_compute_attendance_state',
        default='checked_out'
    )

    _sql_constraints = [
        ('employee_id_unique', 'unique(employee_id)', 'The Employee ID must be unique across the organization!')
    ]

    @api.onchange('first_name', 'last_name')
    def _onchange_first_last_name(self):
        """Update full name when first name or last name changes"""
        parts = [p.strip() for p in [self.first_name, self.last_name] if p and p.strip()]
        if parts:
            self.name = ' '.join(parts)

    @api.onchange('name')
    def _onchange_full_name(self):
        """Auto-populate first and last name from full name if empty"""
        if self.name and not self.first_name and not self.last_name:
            parts = self.name.strip().split(maxsplit=1)
            if len(parts) == 1:
                self.first_name = parts[0]
                self.last_name = ''
            elif len(parts) >= 2:
                self.first_name = parts[0]
                self.last_name = parts[1]

    @api.depends('attendance_ids')
    def _compute_attendance_count(self):
        for employee in self:
            employee.attendance_count = len(employee.attendance_ids)

    @api.depends('attendance_ids.check_out')
    def _compute_attendance_state(self):
        for employee in self:
            last_attendance = self.env['dayflow.attendance'].search([
                ('employee_id', '=', employee.id)
            ], order='check_in desc, id desc', limit=1)
            if last_attendance and not last_attendance.check_out:
                employee.attendance_state = 'checked_in'
            else:
                employee.attendance_state = 'checked_out'

    def action_view_attendance(self):
        self.ensure_one()
        return {
            'name': f'Attendance - {self.name}',
            'type': 'ir.actions.act_window',
            'res_model': 'dayflow.attendance',
            'view_mode': 'tree,kanban,form',
            'domain': [('employee_id', '=', self.id)],
            'context': {'default_employee_id': self.id},
        }

    @api.model
    def _extract_initials(self, text, default='XX'):
        """Extracts first 2 alphabetic characters in uppercase from given text"""
        if not text:
            return default
        clean = re.sub(r'[^a-zA-Z]', '', str(text)).upper()
        if len(clean) >= 2:
            return clean[:2]
        elif len(clean) == 1:
            return f"{clean}X"
        return default

    @api.model
    def _generate_employee_login_id(self, first_name=None, last_name=None, full_name=None, joining_date=None):
        """
        Generates employee Login ID in format:
        OI + FIRST2 + LAST2 + YYYY + SERIAL4
        Example: John Doe, 2026 -> OIJODO20260001
        """
        if not first_name and not last_name and full_name:
            parts = full_name.strip().split(maxsplit=1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ''

        first2 = self._extract_initials(first_name, default='EM')

        if last_name and last_name.strip():
            last2 = self._extract_initials(last_name, default='XX')
        elif first_name and len(re.sub(r'[^a-zA-Z]', '', first_name)) >= 4:
            clean_first = re.sub(r'[^a-zA-Z]', '', first_name).upper()
            last2 = clean_first[-2:]
        elif first_name and len(re.sub(r'[^a-zA-Z]', '', first_name)) >= 2:
            clean_first = re.sub(r'[^a-zA-Z]', '', first_name).upper()
            last2 = clean_first[:2]
        else:
            last2 = 'XX'

        if isinstance(joining_date, str):
            try:
                year = datetime.datetime.strptime(joining_date, '%Y-%m-%d').year
            except Exception:
                year = datetime.date.today().year
        elif isinstance(joining_date, (datetime.date, datetime.datetime)):
            year = joining_date.year
        else:
            year = datetime.date.today().year

        year_str = str(year)
        prefix = f"OI{first2}{last2}{year_str}"

        # Find existing employees for this joining year to calculate next serial
        all_year_emps = self.search([
            '|',
            ('employee_id', '=like', f"OI%{year_str}%"),
            '&',
            ('joining_date', '>=', f"{year_str}-01-01"),
            ('joining_date', '<=', f"{year_str}-12-31"),
        ])

        max_serial = 0
        pattern = re.compile(rf'OI[A-Z]{{4}}{year_str}(\d{{4}})')
        legacy_pattern = re.compile(rf'OI{year_str}(\d{{4}})')
        for emp in all_year_emps:
            if not emp.employee_id:
                continue
            m = pattern.search(emp.employee_id)
            if m:
                try:
                    max_serial = max(max_serial, int(m.group(1)))
                except ValueError:
                    pass
            else:
                lm = legacy_pattern.search(emp.employee_id)
                if lm:
                    try:
                        max_serial = max(max_serial, int(lm.group(1)))
                    except ValueError:
                        pass

        next_serial = max_serial + 1
        candidate_id = f"{prefix}{str(next_serial).zfill(4)}"

        # Ensure uniqueness
        while self.search_count([('employee_id', '=', candidate_id)]):
            next_serial += 1
            candidate_id = f"{prefix}{str(next_serial).zfill(4)}"

        return candidate_id

    @api.model
    def _generate_default_employee_id(self):
        """Default fallback generator when creating via form"""
        return self._generate_employee_login_id(
            full_name="New Employee",
            joining_date=fields.Date.context_today(self)
        )

    @api.model
    def _generate_secure_temp_password(self, first_name=None, year=None):
        """Generates a secure, unique temporary password for initial employee onboarding"""
        f_init = (first_name[:2].capitalize() if first_name and len(first_name) >= 2 else "Df")
        y = str(year or datetime.date.today().year)
        random_digits = secrets.randbelow(9000) + 1000
        return f"Dayflow@{f_init}{y}#{random_digits}"

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            # Sync name parts
            first_name = vals.get('first_name', '')
            last_name = vals.get('last_name', '')
            name = vals.get('name', '')
            if not name and (first_name or last_name):
                vals['name'] = f"{first_name} {last_name}".strip()
            elif name and not first_name and not last_name:
                parts = name.strip().split(maxsplit=1)
                vals['first_name'] = parts[0]
                vals['last_name'] = parts[1] if len(parts) > 1 else ''

            joining_date = vals.get('joining_date') or fields.Date.context_today(self)

            # Auto-generate standardized Login ID if default placeholder or not set
            emp_id = vals.get('employee_id')
            if not emp_id or emp_id.startswith('OI20') or emp_id.startswith('OINEEM'):
                vals['employee_id'] = self._generate_employee_login_id(
                    first_name=vals.get('first_name'),
                    last_name=vals.get('last_name'),
                    full_name=vals.get('name'),
                    joining_date=joining_date
                )

            # Automatically provision Odoo res.users account if not linked
            if not vals.get('user_id'):
                temp_pwd = self._generate_secure_temp_password(
                    first_name=vals.get('first_name'),
                    year=datetime.date.today().year
                )
                vals['temp_password'] = temp_pwd

                login_id = vals.get('employee_id')
                user_vals = {
                    'name': vals.get('name') or login_id,
                    'login': login_id,
                    'email': vals.get('email') or False,
                    'password': temp_pwd,
                    'company_id': vals.get('company_id') or self.env.company.id,
                }

                emp_group = self.env.ref('dayflow_hrms.group_dayflow_employee', raise_if_not_found=False)
                base_user_group = self.env.ref('base.group_user', raise_if_not_found=False)
                group_ids = [g.id for g in [base_user_group, emp_group] if g]
                if group_ids:
                    user_vals['groups_id'] = [(6, 0, group_ids)]

                try:
                    new_user = self.env['res.users'].sudo().create(user_vals)
                    vals['user_id'] = new_user.id
                except Exception:
                    pass

        return super(DayflowEmployee, self).create(vals_list)

    def action_reset_temp_password(self):
        """Action for HR/Admin to generate a fresh temporary password for the employee"""
        for employee in self:
            temp_pwd = self._generate_secure_temp_password(
                first_name=employee.first_name or employee.name,
                year=employee.joining_date.year if employee.joining_date else datetime.date.today().year
            )
            employee.temp_password = temp_pwd
            if employee.user_id:
                employee.user_id.sudo().write({'password': temp_pwd})
            else:
                user_vals = {
                    'name': employee.name,
                    'login': employee.employee_id,
                    'email': employee.email or False,
                    'password': temp_pwd,
                    'company_id': employee.company_id.id if employee.company_id else self.env.company.id,
                }
                emp_group = self.env.ref('dayflow_hrms.group_dayflow_employee', raise_if_not_found=False)
                base_user_group = self.env.ref('base.group_user', raise_if_not_found=False)
                group_ids = [g.id for g in [base_user_group, emp_group] if g]
                if group_ids:
                    user_vals['groups_id'] = [(6, 0, group_ids)]
                new_user = self.env['res.users'].sudo().create(user_vals)
                employee.user_id = new_user.id
        return True

# -*- coding: utf-8 -*-
from odoo import models, fields, api
import datetime

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
    employee_id = fields.Char(
        string='Employee ID / Code',
        required=True,
        copy=False,
        index=True,
        default=lambda self: self._generate_default_employee_id(),
        help='Unique identifier for the employee (e.g. OI20260001)'
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
        string='Related User',
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

    _sql_constraints = [
        ('employee_id_unique', 'unique(employee_id)', 'The Employee ID must be unique across the organization!')
    ]

    @api.model
    def _generate_default_employee_id(self):
        """Generates a default employee code format: OI + Year + Serial (e.g., OI20260001)"""
        current_year = datetime.date.today().year
        prefix = f"OI{current_year}"
        last_emp = self.search([('employee_id', '=like', f"{prefix}%")], order='id desc', limit=1)
        if last_emp and last_emp.employee_id:
            try:
                suffix = int(last_emp.employee_id.replace(prefix, ''))
                next_serial = suffix + 1
            except ValueError:
                next_serial = self.search_count([]) + 1
        else:
            next_serial = self.search_count([]) + 1
        return f"{prefix}{str(next_serial).zfill(4)}"

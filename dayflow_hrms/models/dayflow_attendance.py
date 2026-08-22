# -*- coding: utf-8 -*-
from odoo import models, fields, api, exceptions


class DayflowAttendance(models.Model):
    _name = 'dayflow.attendance'
    _description = 'Dayflow HRMS Attendance'
    _order = 'check_in desc, id desc'

    employee_id = fields.Many2one(
        'dayflow.employee',
        string='Employee',
        required=True,
        index=True,
        ondelete='cascade',
        default=lambda self: self._default_employee_id(),
        help='Select the employee for this attendance record'
    )
    employee_image = fields.Image(
        related='employee_id.image_1920',
        string='Photo',
        readonly=True
    )
    department = fields.Char(
        related='employee_id.department',
        string='Department',
        store=True,
        readonly=True
    )
    job_position = fields.Char(
        related='employee_id.job_position',
        string='Job Position',
        store=True,
        readonly=True
    )
    check_in = fields.Datetime(
        string='Check In',
        required=True,
        default=fields.Datetime.now,
        index=True,
        help='Timestamp when the employee checked in'
    )
    check_out = fields.Datetime(
        string='Check Out',
        index=True,
        help='Timestamp when the employee checked out'
    )
    worked_hours = fields.Float(
        string='Worked Hours',
        compute='_compute_worked_hours',
        store=True,
        readonly=True,
        digits=(16, 2),
        help='Computed total hours worked between check in and check out'
    )
    attendance_date = fields.Date(
        string='Attendance Date',
        compute='_compute_attendance_date',
        store=True,
        readonly=False,
        index=True,
        help='Date of attendance'
    )
    status = fields.Selection(
        [
            ('present', 'Present'),
            ('late', 'Late'),
            ('half_day', 'Half Day'),
            ('absent', 'Absent'),
        ],
        string='Status',
        default='present',
        required=True,
        index=True,
        help='Attendance status category'
    )
    notes = fields.Text(
        string='Notes / Justification',
        help='Additional remarks, reason for late arrival, or special notes'
    )
    company_id = fields.Many2one(
        'res.company',
        string='Company',
        default=lambda self: self.env.company,
        required=True,
        help='Company associated with this record'
    )
    active = fields.Boolean(
        string='Active',
        default=True,
        help='Uncheck to archive the attendance record'
    )

    @api.model
    def _default_employee_id(self):
        """Default to current user's linked employee record if available"""
        emp = self.env['dayflow.employee'].search([('user_id', '=', self.env.uid)], limit=1)
        return emp.id if emp else False

    @api.depends('check_in', 'check_out')
    def _compute_worked_hours(self):
        """Compute the total worked hours between check_in and check_out"""
        for record in self:
            if record.check_in and record.check_out:
                delta = record.check_out - record.check_in
                hours = delta.total_seconds() / 3600.0
                record.worked_hours = round(max(hours, 0.0), 2)
            else:
                record.worked_hours = 0.0

    @api.depends('check_in')
    def _compute_attendance_date(self):
        """Set attendance_date automatically based on check_in timestamp"""
        for record in self:
            if record.check_in:
                record.attendance_date = fields.Date.to_date(record.check_in)
            elif not record.attendance_date:
                record.attendance_date = fields.Date.context_today(record)

    @api.constrains('check_in', 'check_out')
    def _check_validity_check_in_check_out(self):
        """Prevent check-out from being earlier than check-in"""
        for record in self:
            if record.check_in and record.check_out:
                if record.check_out < record.check_in:
                    raise exceptions.ValidationError(
                        "Check-out time (%s) cannot be earlier than Check-in time (%s) for employee '%s'." % (
                            record.check_out,
                            record.check_in,
                            record.employee_id.name or 'Unknown'
                        )
                    )

    @api.constrains('employee_id', 'check_in', 'check_out')
    def _check_overlapping_active_checkins(self):
        """Ensure an employee cannot have multiple active check-ins simultaneously"""
        for record in self:
            if record.employee_id and not record.check_out:
                active_records = self.search([
                    ('employee_id', '=', record.employee_id.id),
                    ('check_out', '=', False),
                    ('id', '!=', record.id)
                ])
                if active_records:
                    raise exceptions.ValidationError(
                        "Employee '%s' already has an active check-in session. Please check out before starting a new one." % (
                            record.employee_id.name
                        )
                    )

    def action_check_in(self):
        """Button action to check in"""
        for record in self:
            if not record.check_in:
                record.check_in = fields.Datetime.now()
            if not record.attendance_date:
                record.attendance_date = fields.Date.context_today(record)
        return True

    def action_check_out(self):
        """Button action to check out"""
        for record in self:
            if not record.check_in:
                raise exceptions.ValidationError("Cannot check out without a valid check-in time.")
            record.check_out = fields.Datetime.now()
        return True

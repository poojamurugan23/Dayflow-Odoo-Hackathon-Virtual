# -*- coding: utf-8 -*-
{
    'name': 'Dayflow – Human Resource Management System',
    'version': '1.0.0',
    'category': 'Human Resources',
    'summary': 'Core HRMS foundation module for Dayflow',
    'description': """
Dayflow HRMS - Core Foundation Module
====================================
This module builds the base foundation for the Dayflow Human Resource Management System.

Features in Step 1:
- Employee Management Model (dayflow.employee)
- Dayflow Security Roles:
  - Employee: Restricted strictly to own employee record.
  - HR/Admin: Full management permissions for all employee records.
- Standard Kanban, List (Tree), Form, and Search views.
- Clean Dayflow HRMS Menu hierarchy.
- Minimal test sample data.
    """,
    'author': 'Dayflow Team',
    'website': 'https://github.com/dayflow-hrms',
    'license': 'LGPL-3',
    'depends': [
        'base',
    ],
    'data': [
        'security/dayflow_security.xml',
        'security/ir.model.access.csv',
        'views/dayflow_employee_views.xml',
        'views/dayflow_attendance_views.xml',
        'views/dayflow_menus.xml',
        'views/dayflow_auth_templates.xml',
        'data/dayflow_demo_data.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}

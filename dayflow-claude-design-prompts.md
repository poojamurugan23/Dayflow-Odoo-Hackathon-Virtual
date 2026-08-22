# Dayflow HRMS — Claude Design Prompts

Two prompts. Run **Prompt 1** first (web app), then **Prompt 2** in the same
session so the mobile design inherits the design system.

---

# PROMPT 1 — Web / Desktop UI Mockup

Copy everything between the lines into Claude Design.

---

Design a high-fidelity web application UI for **Dayflow**, a Human Resource
Management System. Tagline: *"Every workday, perfectly aligned."*

## Design direction

Modern enterprise SaaS, dense but breathable — closer to Linear or Odoo 17
than to a consumer app. It is a tool people open every morning, so favour
clarity and scan-speed over decoration.

**Theme:** Dark mode primary (design light mode as a variant).

- Canvas `#0D0D0F`, elevated surfaces `#16161A`, cards `#1C1C21`
- Borders `#2A2A31`, hairline dividers `#232329`
- Primary accent: violet `#8B5CF6` — buttons, active tabs, focus rings
- Text: primary `#F4F4F5`, secondary `#A1A1AA`, muted `#71717A`
- Status: present `#22C55E`, absent `#F59E0B`, on-leave `#3B82F6`,
  rejected/danger `#EF4444`

**Type:** Inter or Geist. Page title 24/600, section header 16/600,
body 14/400, table cell 13/400, label 12/500 uppercase with 0.04em tracking.
Tabular numerals for all money, times, and durations.

**Shape:** 8px radius on cards and inputs, 6px on buttons, 999px on status
pills. Elevation via border + subtle inner glow, not heavy shadows.
8px spacing grid throughout.

## Global chrome

A single top navigation bar — no sidebar:

`[Company Logo]  Employees · Attendance · Time Off` on the left,
`[Check In systray] [Settings gear] [Avatar]` on the right.

Active nav item gets a violet underline and brighter text.

**Check In systray:** a compact pill in the top bar. Idle state shows
`Check In →`. Active state shows a live timer `Since 09:12 AM · 03:24`
with a pulsing green dot and a `Check Out →` action. This is always
visible, on every screen.

**Avatar dropdown:** two items only — *My Profile*, *Log Out*.

## Screens to produce

### 1. Sign In
Centred card on dark canvas, company logo above. Fields: **Login ID / Email**,
**Password** (with reveal toggle). Full-width violet `SIGN IN` button.
Below: "Don't have an account? Sign Up". Show an inline error state for
invalid credentials.

### 2. Sign Up — company registration
This registers a **company**, not an employee. Fields: **Company Name** with
an inline logo-upload square beside it, **Name**, **Email**, **Phone**,
**Password**, **Confirm Password** (both with reveal toggles). Violet `Sign Up`
button, then "Already have an account? Sign In".

Add a small annotated callout explaining: *employees cannot self-register.
HR/Admin creates each employee, and the system auto-generates their Login ID
in the format `OIJODO20220001` = company initials + first two letters of first
and last name + year of joining + serial number, plus a one-time password the
employee changes on first login.*

### 3. Employees — card grid (Admin landing page)
Toolbar: violet `NEW` button on the left, centred search field, Settings on
the right.

A responsive grid (4 columns at 1440px) of employee cards. Each card:
64px avatar, employee name (15/600), job position (13/400 secondary),
department (12/400 muted), and a **status indicator pinned to the top-right
corner**:

- 🟢 solid green dot — present in office
- ✈️ blue airplane glyph — on approved leave
- 🟡 amber dot — absent, no time off applied

Cards are clickable and hover-lift subtly. Show 9–12 cards with a realistic
mix of all three statuses.

### 4. Employee Profile — Admin form view
Header block: large circular avatar, editable name field (24/600), job
position beneath it. Two info columns below the header —
left: **Login ID, Email, Mobile**; right: **Company, Department, Manager,
Location**.

Tab bar: `Resume · Private Info · Salary Info`

**Resume tab (shown):** left column has three stacked text sections —
*About*, *What I love about my job*, *My interests and hobbies*.
Right column has *Skills* and *Certification* panels, each with tag chips and
a `+ Add Skills` affordance.

### 5. Salary Info tab — Admin only
The most information-dense screen. Two columns.

**Left — Wage & components:**
- `Month Wage` **50,000** `/ Month` · `Yearly Wage` **600,000** `/ Yearly`
- `No. of working days in a week` · `Break Time __ /hrs`
- A **Salary Components** table. Each row: component name, one-line
  description in muted text, computed amount, `₹ / month`, editable
  percentage, `%`:

| Component | Amount | % |
|---|---|---|
| Basic Salary — *computed from monthly wage* | 25,000.00 | 50.00 |
| House Rent Allowance — *50% of basic salary* | 12,500.00 | 50.00 |
| Standard Allowance — *fixed predetermined amount* | 4,167.00 | 16.67 |
| Performance Bonus — *variable, % of basic* | 2,082.50 | 8.33 |
| Leave Travel Allowance — *travel expenses, % of basic* | 2,082.50 | 8.33 |
| Fixed Allowance — *wage minus all other components* | 4,168.00 | — |

Show a live-recalculation cue: when Month Wage changes, every amount updates
and Fixed Allowance absorbs the remainder. Add a validation strip showing
`Total components ₹50,000.00 / ₹50,000.00 ✓` that turns red if components
exceed the defined wage.

**Right — Deductions:**
- **Provident Fund (PF) Contribution** — Employee `3,000.00 ₹/month  12.00%`,
  Employer `3,000.00 ₹/month  12.00%`, both labelled *calculated on basic salary*
- **Tax Deductions** — Professional Tax `200.00 ₹/month`,
  *deducted from gross salary*

Mark this whole tab with a small violet `Admin only` badge.

### 6. My Profile — employee's own view
Same layout, but tabs are `Resume · Private Info · Salary Info · Security`,
and every field is read-only except the ones an employee may edit.

**Private Info tab (shown):** two columns.
Left: Date of Birth, Residing Address, Nationality, Personal Email, Gender,
Marital Status, Date of Joining.
Right: **Bank Details** — Account Number, Bank Name, IFSC Code, PAN No,
UAN No, Emp Code.

Bank fields display a small "Change requires HR approval" hint.

### 7. Attendance — Admin/HR view
Toolbar: search field, `←` `→` date steppers, `Date ▾` picker, `Day` toggle.
Centred heading: **22 October 2025**.

Table columns: `Emp` (avatar + name) · `Check In` · `Check Out` ·
`Work Hours` · `Extra Hours`. Extra hours over zero render in green.
Rows with a missing check-out show an amber `Missing` chip in place of the time.

### 8. Attendance — Employee view
Toolbar: `←` `→`, `Oct ▾` month picker, then three summary stat cards:
**Count of days present**, **Leaves count**, **Total working days**.

Table columns: `Date` · `Check In` · `Check Out` · `Work Hours` ·
`Extra Hours`, listing the current month day by day.

Add a footnote strip: *"Attendance is the basis for payslip generation.
Unpaid leave and missing attendance reduce payable days."*

### 9. Time Off — Admin/HR view
Sub-tabs: `Time Off | Allocation`. Violet `NEW` button, search field.

Two balance chips side by side: **Paid Time Off — 24 Days Available** and
**Sick Time Off — 07 Days Available**.

Table columns: `Name` · `Start Date` · `End Date` · `Time Off Type` ·
`Status`. The Status cell holds a state pill (Pending / Approved / Rejected)
plus, for pending rows only, a green ✓ approve button and a red ✕ reject
button.

### 10. Time Off — Employee view
Same balance chips, own records only, no approve/reject controls. Below the
table, a **multi-month calendar grid** (4 months visible) where leave days are
colour-filled by type, with a legend keyed to Paid / Sick / Unpaid.

### 11. Time Off Request — modal
Centred dialog over a dimmed backdrop, `✕` close top-right.
Title: **Time Off Request**.

Fields: `Employee` (prefilled, violet link text) · `Time Off Type` (dropdown:
Paid Time Off, Sick Leave, Unpaid Leaves) · `Validity Period` (May 13 → May 14)
· `Allocation` (01.00 Days, auto-computed from the date range) ·
`Attachment` (upload square, with helper text *"For sick leave certificate"* —
required only when type is Sick Leave).

Footer: violet `Submit`, ghost `Discard`.

## Also produce

- A **design system sheet**: colour swatches with hex values, type scale,
  button variants (primary / secondary / ghost / danger), input states
  (default / focus / error / disabled / read-only), status pills, and the
  three employee-status indicators.
- **Empty states** for the employee grid, attendance table, and time-off list.

Use realistic Indian HR data throughout — names, ₹ amounts, IST times,
DD/MM/YYYY dates. No lorem ipsum.

---

# PROMPT 2 — Mobile App UI

Run this in the same session so it inherits the system above.

---

Now design the **Dayflow mobile app** (iOS, 393×852). Reuse the exact colour
palette, type scale, and component language from the web design.

## Mobile-specific rethinking

The web top bar does not translate. Restructure as:

- **Bottom tab bar**, 5 items: `Home · Attendance · Time Off · Team · Profile`
  — icons with labels, violet fill on the active tab.
- **Check In/Out becomes the primary action**, not a systray pill. It is a
  large card on the Home screen and the single most prominent element in the
  app.
- Tables become **stacked cards**. Never horizontally scroll a table.
- Modals become **bottom sheets** with a drag handle.
- Multi-column form layouts collapse to single-column sections.

## Screens

**1. Sign In** — logo, Login ID / Email, Password, full-width violet button,
plus a Face ID / biometric option below.

**2. First-login password change** — the flow the web mockup implies but never
shows. "Your temporary password must be changed" + new password, confirm,
and a live strength meter.

**3. Home / Dashboard** — greeting with the employee's first name and today's
date. Then:
- A large **Check In** card, dominant on the screen. Idle: violet gradient with
  a big `Check In` control and current time. Active: green-tinged, showing a
  live running timer `03:24:11`, the check-in time, and a `Check Out` control.
- Three compact stat tiles: `Present this month`, `Leave balance`,
  `Extra hours`.
- **Who's out today** — a horizontal avatar strip of colleagues on leave.
- **My requests** — the latest 2 time-off requests with status pills.

**4. Attendance** — month selector chip row at the top, three summary tiles,
then a vertical list of day cards. Each card: date on the left, check-in →
check-out on one line, work hours and extra hours as small chips on the right,
status colour as a 3px left edge. Missing check-outs show an amber
`Regularize` action inline.

**5. Time Off — list** — two balance cards at the top (Paid 24 / Sick 07) with
a subtle radial progress ring showing used vs available. Below, request cards
in reverse-chronological order. A violet FAB bottom-right opens the request
sheet.

**6. Time Off — request bottom sheet** — drag handle, then Type as a segmented
control (Paid / Sick / Unpaid), an inline calendar range picker, auto-computed
`01.00 Days`, an attachment tile that appears only for Sick Leave, and a
full-width violet `Submit`.

**7. Team directory** — search bar, then a 2-column card grid of colleagues.
Each card: avatar with the status dot on the corner, name, role. Filter chips
across the top: `All · Present · On Leave · Absent`.

**8. Employee detail** — collapsing header with a large avatar, name, and role.
Segmented tabs `About · Info`. Quick-action row: call, email, message.

**9. My Profile** — avatar header, then grouped list sections (iOS Settings
style): Personal Info, Bank Details, Salary, Security, Log Out. Bank rows show
a lock glyph indicating HR approval is needed.

**10. Salary detail** — a wage summary card at the top, then components as an
expandable list, then a deductions section, then a net figure. Read-only
throughout, with a clear visual distinction between earnings (neutral) and
deductions (amber).

**11. Approvals — HR/Admin only** — a pending-requests queue. Each request is a
card showing the employee avatar, dates, type, and reason. Swipe right to
approve (green), swipe left to reject (red); show one card mid-swipe to make
the gesture legible.

**12. Notifications** — grouped by Today / This Week. Types: leave approved,
leave rejected, missing check-out reminder, payslip available.

## Also produce

- A **light-mode variant** of the Home screen.
- The **empty state** for Time Off ("No requests yet").
- A small **iOS home-screen widget**: current check-in status and a one-tap
  check-in/out control.

Present all screens on device frames arranged in flow order, with connector
arrows showing navigation between them.

---

# Discrepancies to resolve before finalising

1. **Salary Info visibility.** The wireframe puts a Salary Info tab on the
   employee's own profile while a note says it is admin-only. Recommendation:
   employees see their own salary read-only; only admins see it for *other*
   employees, and only admins can edit.
2. **Fixed Allowance arithmetic.** The wireframe shows ₹2,918 (11.67%), but
   `wage − sum(components)` = 50,000 − 45,832 = **₹4,168**. The prompt above
   uses 4,168 so the totals reconcile. Confirm which rule is intended.
3. **No payslip screen exists.** Attendance is explicitly stated as the basis
   for payslip generation, yet nothing renders one. A Payslip list + detail
   screen is a required addition.
4. **No attendance regularization flow.** With payable days derived from
   attendance, a missed check-out silently costs the employee money. The mobile
   prompt adds a `Regularize` action — mirror it on web.

<div align="center">
  
  <img src="https://capsule-render.vercel.app/api?type=waving&color=502D55&height=200&section=header&text=DayFlow%20HRMS&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Modern%20HR%20Management%20for%20the%20Future%20of%20Work&descAlignY=55&descAlign=50" />

  <a href="https://github.com/poojamurugan23/Dayflow-Odoo-Hackathon-Virtual">
    <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=22&duration=3000&pause=1000&color=935073&center=true&vCenter=true&width=600&lines=Seamless+Employee+Onboarding;Real-time+Attendance+Tracking;Automated+Salary+Calculations;Smart+Leave+Management;Odoo+Hackathon+Virtual+2026" alt="Typing SVG" />
  </a>

  <br />

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Odoo](https://img.shields.io/badge/Odoo-714B67?style=for-the-badge&logo=odoo&logoColor=white)

</div>

<br/>

## 🌟 About DayFlow
**DayFlow** is a modern, real-time Human Resource Management System (HRMS) engineered to bridge the gap between complex enterprise resource planning and seamless employee experiences. Designed as part of the **Odoo Hackathon - Virtual**, DayFlow integrates intuitive React-based frontends with a robust backend architecture, ensuring companies can manage their workforce efficiently.

<br/>

## 🚀 Key Features

### 👔 Admin Dashboard & Controls
- **Live Workforce Overview:** Real-time visibility into who is present, absent, or on leave through a dynamic directory grid.
- **Smart Onboarding & Salary Automation:** Add new employees in seconds. Simply input the *Monthly Wage*, and DayFlow's intelligent calculator instantly distributes Basic Salary (50%), HRA (50%), Standard Allowances, PF, and Professional Tax automatically.
- **Time-Off Management:** One-click approvals and rejections (with comments) for employee leave requests.
- **Comprehensive Profiles:** Access sensitive employee data through secure, role-restricted tabs (Resume, Private Info, Salary structure).

### 👨‍💻 Employee Portal
- **Real-Time Attendance Systray:** Employees can Check-In and Check-Out with a live-running `HH:MM:SS` elapsed timer directly from their dashboard.
- **Interactive Leave Calendar:** A full 12-month calendar view allowing employees to seamlessly apply for time-off, viewing pending balances and historical requests in real-time.
- **Status Indicators:** Clear visual cues (Green dot = Present, Grey dot = Absent, Plane icon = On Leave) across the entire platform.

<br/>

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React, Vite, Tailwind CSS | High-performance, fully responsive UI wrapped in a sleek Purple & Grey modern design system. |
| **Backend** | Node.js, Express | Lightning-fast RESTful APIs handling real-time data flow and authentication. |
| **Database** | MongoDB & Mongoose | Flexible, schema-driven data storage for Payroll, Users, Attendance, and Leaves. |
| **Icons & Charts** | Lucide-React, Recharts | Beautiful iconography and interactive data visualization. |

<br/>

## 📸 Sneak Peek

<div align="center">
  <img src="https://github-production-user-asset-6210df.s3.amazonaws.com/assets/dayflow-dashboard.gif" alt="DayFlow Dashboard Animation" width="800" />
  <p><em>(Beautiful, responsive interface designed with the user in mind)</em></p>
</div>

<br/>

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/poojamurugan23/Dayflow-Odoo-Hackathon-Virtual.git
   cd Dayflow-Odoo-Hackathon-Virtual
   ```

2. **Install Client Dependencies**
   ```bash
   npm install
   ```

3. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Environment Variables**
   Create a `.env` file in the `/server` directory and configure your MongoDB URI and JWT secrets.
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

5. **Run the Application (Concurrent)**
   Open two terminals:
   ```bash
   # Terminal 1 - Start the backend server
   cd server
   npm run dev
   
   # Terminal 2 - Start the frontend client
   npm run dev
   ```

<br/>

## 🛡️ Architecture & Security
DayFlow implements robust JWT-based authentication combined with secure Role-Based Access Control (RBAC). A custom `<ProtectedRoute />` component ensures that Admin-only routes (like Payroll and Employee Onboarding) are strictly shielded from standard users, maintaining complete data integrity and privacy.

<br/>

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=502D55&height=100&section=footer" />
  <br/>
  <b>Built with ❤️ for the Odoo Hackathon</b>
</div>

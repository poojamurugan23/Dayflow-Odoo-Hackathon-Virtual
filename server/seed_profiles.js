const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/dayflow'; // Adjust if different, normally in .env

async function seedProfiles() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    const newEmployees = [
      {
        email: 'sarah.connor@odoo.com',
        password: defaultPassword,
        role: 'employee',
        name: 'Sarah Connor',
        company_name: 'Odoo India',
        phone: '+91 98765 11111',
        department: 'Engineering',
        position: 'Senior Frontend Developer',
        login_id: 'OISACO20260002',
        joining_date: new Date('2026-01-15'),
        about: 'Passionate about building intuitive and accessible user interfaces. With over 5 years of experience in React and modern JavaScript ecosystems.',
        job_love: 'I love the collaborative environment and the challenging problems we solve every day.',
        hobbies: 'Hiking, Photography, and reading sci-fi novels.',
        skills: ['React', 'JavaScript', 'Tailwind CSS', 'Next.js'],
        certifications: ['AWS Certified Developer', 'React Advanced Patterns'],
        month_wage: 85000,
        working_days: 5,
        break_time: 1
      },
      {
        email: 'david.miller@odoo.com',
        password: defaultPassword,
        role: 'employee',
        name: 'David Miller',
        company_name: 'Odoo India',
        phone: '+91 98765 22222',
        department: 'Design',
        position: 'UX/UI Designer',
        login_id: 'OIDAMI20260003',
        joining_date: new Date('2026-03-10'),
        about: 'Creative designer focused on crafting user-centric digital experiences. I believe good design is invisible.',
        job_love: 'Bringing ideas to life and seeing users interact with my designs.',
        hobbies: 'Sketching, playing guitar, and visiting art galleries.',
        skills: ['Figma', 'UI Design', 'Wireframing', 'Prototyping'],
        certifications: ['Google UX Design Certificate'],
        month_wage: 75000,
        working_days: 5,
        break_time: 1
      },
      {
        email: 'elena.rodriguez@odoo.com',
        password: defaultPassword,
        role: 'employee',
        name: 'Elena Rodriguez',
        company_name: 'Odoo India',
        phone: '+91 98765 33333',
        department: 'Marketing',
        position: 'Marketing Specialist',
        login_id: 'OIELRO20260004',
        joining_date: new Date('2026-05-20'),
        about: 'Data-driven marketing professional with a knack for identifying market trends and executing successful campaigns.',
        job_love: 'Analyzing campaign performance and optimizing strategies to achieve better ROI.',
        hobbies: 'Blogging, traveling, and trying out new cuisines.',
        skills: ['SEO', 'Content Marketing', 'Google Analytics', 'Social Media Management'],
        certifications: ['HubSpot Inbound Marketing', 'Google Analytics Individual Qualification'],
        month_wage: 65000,
        working_days: 5,
        break_time: 1
      }
    ];

    for (const emp of newEmployees) {
      const existing = await User.findOne({ email: emp.email });
      if (!existing) {
        await User.create(emp);
        console.log(`Created employee: ${emp.name}`);
      } else {
        console.log(`Employee ${emp.name} already exists.`);
      }
    }

    console.log('Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding profiles:', error);
    process.exit(1);
  }
}

seedProfiles();

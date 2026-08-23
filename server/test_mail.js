const nodemailer = require('nodemailer');
require('dotenv').config({ path: 'server/.env' });
const emailPass = (process.env.EMAIL_PASSWORD || 'missing_password').replace(/["' ]/g, '');
console.log('Using password:', emailPass);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'odooindiahawkinshackerzzz@gmail.com', pass: emailPass }
});
transporter.sendMail({
  from: '"Odoo-HRMS Team" <odooindiahawkinshackerzzz@gmail.com>',
  to: 'odooindiahawkinshackerzzz@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email'
}).then(info => console.log('Mail sent successfully!', info.messageId)).catch(console.error);

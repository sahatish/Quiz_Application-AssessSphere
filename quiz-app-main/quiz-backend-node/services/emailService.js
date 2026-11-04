const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send a plain-text or HTML email.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: `"AssessSphere" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };

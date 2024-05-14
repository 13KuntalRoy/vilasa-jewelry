// Import required modules
const nodemailer = require("nodemailer");

/**
 * Function to send an email using Nodemailer
 * @function sendEmail
 * @param {Object} options - Email options
 * @param {string} options.email - The recipient's email address
 * @param {string} options.subject - The email subject
 * @param {string} options.message - The email message
 * @returns {Promise<void>} A promise that resolves when the email is sent
 * @throws {Error} If an error occurs during email sending process
 * @author Kuntal Roy
 */
const sendEmail = async ({ email, subject, message }) => {
  try {
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    console.log("mill1")

    // Construct the mail options
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      html: message,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Throw an error if email sending fails
    throw new Error("Failed to send email. Please try again later.");
  }
};

module.exports = sendEmail;

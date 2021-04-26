const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

const sendWelcomeMessage = (email, name) => {
  transport.sendMail(
    {
      from: "contact@taskapp.com", // Sender address
      to: email, // List of recipients
      subject: "Welcome to your Task App!", // Subject line
      text: `Thank you ${name} for joining the Task App.`, // Plain text body
    },
    (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    }
  );
};

const sendCancelMessage = (email, name) => {
  transport.sendMail(
    {
      from: "contact@taskapp.com", // Sender address
      to: email, // List of recipients
      subject: "Sad to see you leave!", // Subject line
      text: `${name}, your account has been cancelled.`, // Plain text body
    },
    (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    }
  );
};

module.exports = { sendWelcomeMessage, sendCancelMessage };

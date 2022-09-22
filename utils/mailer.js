const nodeMailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

const transporterDetails = smtpTransport({
    host: "salarmiirzaeie@gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "salarmiirzaeie@gmail.com",
        pass: "Salar9757110041",
    },
    tls: {
        rejectUnauthorized: false,
    },
});

exports.sendEmail = (email, name, subject, message) => {
    const transporter = nodeMailer.createTransport(transporterDetails);
    transporter.sendMail({
        from: "salarmiirzaeie@gmail.com",
        to: email,
        subject: subject,
        html: `<h1> سلام ${name}</h1>
            <p>${message}</p>`,
    });
};

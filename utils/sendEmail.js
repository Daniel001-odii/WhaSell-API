const nodemailer = require("nodemailer");
const SMTPTransport = require("nodemailer/lib/smtp-transport");

let transporter;

const transporterInit = () => {
    // Define the nodemailer transporter
    transporter = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        secureConnection: false,
        port: 465,
        auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
        },
        tls: {
        rejectUnauthorized: true,
        },
    });
};

const sendEmail = async ({
    emailTo,
    subject,
    html
    }) => {
    // Init the nodemailer transporter
    transporterInit();

    try {
        let response = await transporter.sendMail({
            from: "Whasell",
            to: emailTo,
            subject: subject,
            html: html,
        });
        return response;
    } catch (error) {
        console.log("error", error)
        throw error;
    }
};

module.exports = sendEmail;


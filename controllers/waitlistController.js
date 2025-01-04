const waitlistUser = require('../models/wailtlistUserModel');
const sendEmail = require('../utils/sendEmail');
const { EMAIL_FOOTER_SECTION, EMAIL_HEADER_SECTION } = require('../utils/emailTemplates');

exports.addUserToWaitlist = async (req, res) => {
    try {
        // const user = await waitlistUser.create(req.body);
        // check if user has already been added...
        const userExists = await waitlistUser.findOne({
            email: req.body.email
        });
        if(userExists) {
            return res.status(200).json({
                status: 'failed',
                message: 'user already exists in waitlist'
            });
        };
        const user = await waitlistUser.create({
            email: req.body.email
        });

       

        const mail_options = {
            emailTo: user.email,
            subject: "WELCOME ONBOARD 🎉",
            html: `
                  <!DOCTYPE html>
                <html>
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
                <table style="border-spacing: 0; width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header Section -->
                    ${EMAIL_HEADER_SECTION}

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 20px;">
                            <p style="margin: 0 0 20px;">Hi ${user.email},</p>
                            <p>Congratulations on joining the WhatSell waitlist! 🎉</p>
                            <p>We are thrilled to have you on board and can't wait to share exciting updates with you.</p>
                            <p>Our official launch date is set for <strong>20th of January 2025</strong>. Mark your calendar!</p>
                            <p>In the meantime, feel free to explore our whatsapp channel and get to know more about what we offer.</p>
                            <p>Stay tuned for more information coming your way soon!</p>
                            <p style="text-align: left; margin: 20px 0;">
                                <a href="https://whatsapp.com/channel/0029Vae6Q3g4IBh7pV0IDP0f" style="background-color: #47C67F; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Our Channel</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    ${EMAIL_FOOTER_SECTION}

                </table>
                </body>
                </html>
            `
        };

       
        await sendEmail(mail_options);

        res.status(201).json({
            status: 'success',
            data: {
                user
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'failed to add user to waitlist',
            message: err.message
        });
    }
};

/* 
const mail_options = {
    emailTo: user.email,
    subject: "WELCOME ONBOARD 🎉",
    html: `
      <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
    <table style="border-spacing: 0; width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header Section -->
    ${EMAIL_HEADER_SECTION}

    <!-- Body Content -->
    <tr>
        <td style="padding: 20px;"></td>
            <p style="margin: 0 0 20px;">Hi ${user.email},</p>
            <p>Congratulations on joining the WhatSell waitlist! 🎉</p>
            <p>We are thrilled to have you on board and can't wait to share exciting updates with you.</p>
            <p>Our official launch date is set for <strong>20th of January 2025</strong>. Mark your calendar!</p>
            <p>In the meantime, feel free to explore our website and get to know more about what we offer.</p>
            <p>Stay tuned for more information coming your way soon!</p>
            <p style="text-align: center; margin: 20px 0;">
                <a href="https://www.whatsell.com" style="background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Our Channel</a>
            </p>
        </td>
    </tr>

    <!-- Footer Section -->
    ${EMAIL_FOOTER_SECTION}

    </table>
    </body>
    </html>
    `
};
 */
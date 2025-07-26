//nodemailer 
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: 465, //gmail ko 465 port huncha
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
});

const sendMail = async(to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL, // sender address
            to,
            subject, // Subject line
            html, // html body
        });
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

export { sendMail };
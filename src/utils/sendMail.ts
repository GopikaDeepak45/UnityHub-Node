import transporter from "../config/nodemailer"
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = (to: string, subject: string, text: string): void => {
    const mailOptions = {
        from: process.env.EMAIL_USER as string, // Cast to string or use a default value if necessary
        to,
        subject,
        text,
    };

    transporter.sendMail(mailOptions, (error: Error | null, info: any) => {
        if (error) {
            console.error('Error sending mail', error);
        } else {
            console.log('Email sent', info.response);
        }
    });
};

export default sendEmail;

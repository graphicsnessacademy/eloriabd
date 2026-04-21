import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';
import { OrderConfirmedEmail } from '../emails/OrderConfirmed';
import { OrderPackagedEmail } from '../emails/OrderPackaged';
import { OrderOnCourierEmail } from '../emails/OrderOnCourier';
import { OrderDeliveredEmail } from '../emails/OrderDelivered';
import { OrderCancelledEmail } from '../emails/OrderCancelled';
import { ReturnInitiatedEmail } from '../emails/ReturnInitiated';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export const sendEmail = async (to: string, subject: string, templateName: string, data: any) => {
    try {
        let reactElement: React.ReactElement;

        switch (templateName) {
            case 'OrderConfirmed':
                reactElement = React.createElement(OrderConfirmedEmail, { order: data });
                break;
            case 'OrderPackaged':
                reactElement = React.createElement(OrderPackagedEmail, { order: data });
                break;
            case 'OrderOnCourier':
                reactElement = React.createElement(OrderOnCourierEmail, { order: data });
                break;
            case 'OrderDelivered':
                reactElement = React.createElement(OrderDeliveredEmail, { order: data });
                break;
            case 'OrderCancelled':
                reactElement = React.createElement(OrderCancelledEmail, { order: data });
                break;
            case 'ReturnInitiated':
                reactElement = React.createElement(ReturnInitiatedEmail, { order: data });
                break;
            default:
                throw new Error(`Invalid template name: ${templateName}`);
        }

        const html = await render(reactElement);

        await resend.emails.send({
            from: 'Eloria BD <no-reply@eloriabd.com>', // Replace with verified domain
            to,
            subject,
            html,
        });

        console.log(`✅ Email sent to ${to} [${templateName}]`);
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error);
    }
};

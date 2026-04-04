import { resend, FROM_EMAIL } from '../config/resend.js';

/**
 * Send payment request email with Razorpay payment link
 */
export async function sendPaymentRequestEmail(customerEmail, customerName, invoices, paymentLink, businessName, userDetails = {}) {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const invoiceRows = invoices.map(inv => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333; width: 60%;">
                <strong>#${inv.invoiceNumber || 'N/A'}</strong><br/>
                <span style="font-size: 12px; color: #888;">${inv.items?.map(i => i.itemName).join(', ') || '-'}</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; color: #333; vertical-align: top;">
                ₹${inv.grandTotal.toLocaleString('en-IN')}
            </td>
        </tr>
    `).join('');

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px 20px;">
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <tr>
                <td style="text-align: left;">
                    <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: 700;">${businessName || 'Minimalist'}</h1>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                    <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">PAYMENT REQUEST</span>
                </td>
            </tr>
        </table>

        <!-- Body -->
        <h2 style="font-size: 22px; color: #333; margin: 0 0 15px 0; font-weight: 400;">Payment required for pending invoices</h2>
        
        <p style="font-size: 15px; color: #666; line-height: 1.6; margin: 0 0 25px 0;">
            Dear ${customerName}, you have pending invoice(s) that require payment. Please review the details below and complete your payment using the secure link provided.
        </p>

        <!-- Action Button -->
        <table style="margin-bottom: 50px;">
            <tr>
                <td>
                    <a href="${paymentLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 4px;">Pay Now ₹${totalAmount.toLocaleString('en-IN')}</a>
                </td>
                ${userDetails?.website ? `
                <td style="padding-left: 15px;">
                    <span style="color: #666; font-size: 14px;">or <a href="https://${userDetails.website}" style="color: #333; text-decoration: none;">Visit our store</a></span>
                </td>
                ` : ''}
            </tr>
        </table>

        <!-- Summary section -->
        <h3 style="font-size: 18px; color: #333; font-weight: 400; margin: 0 0 15px 0; border-top: 1px solid #eee; padding-top: 30px;">Invoice summary</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>${invoiceRows}</tbody>
        </table>

        <!-- Totals -->
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 15px 0 0 0; font-size: 16px; color: #333; font-weight: 600;">Total Due</td>
                <td style="padding: 15px 0 0 0; font-size: 18px; color: #000; font-weight: 700; text-align: right;">₹${totalAmount.toLocaleString('en-IN')}</td>
            </tr>
        </table>

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee;">
            ${userDetails?.businessName ? `<div style="font-size: 12px; color: #888; font-weight: 600; margin-bottom: 3px;">${userDetails.businessName}</div>` : ''}
            ${userDetails?.address ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.address}</div>` : ''}
            ${userDetails?.phoneNo ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.phoneNo}</div>` : ''}
            ${userDetails?.email ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.email}</div>` : ''}
            ${userDetails?.website ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.website}</div>` : ''}
            ${userDetails?.gstNumber ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">GST: ${userDetails.gstNumber}</div>` : ''}
        </div>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `Payment Request from ${businessName || 'BizzOps'}`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(customerEmail, customerName, invoices, totalPaid, balanceAfter, businessName, userDetails = {}) {
    const invoiceLines = invoices.map(inv =>
        `<tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333; width: 60%;">
                <strong>#${inv.invoiceNumber || 'N/A'}</strong>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; color: #333;">
                ₹${inv.grandTotal.toLocaleString('en-IN')}
            </td>
        </tr>`
    ).join('');

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px 20px;">
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <tr>
                <td style="text-align: left;">
                    <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: 700;">${businessName || 'Minimalist'}</h1>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                    <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">RECEIPT</span>
                </td>
            </tr>
        </table>

        <!-- Body -->
        <h2 style="font-size: 22px; color: #333; margin: 0 0 15px 0; font-weight: 400;">Payment received!</h2>
        
        <p style="font-size: 15px; color: #666; line-height: 1.6; margin: 0 0 25px 0;">
            Dear ${customerName}, we have successfully received your payment of <strong>₹${totalPaid.toLocaleString('en-IN')}</strong>. Here is a summary of your transaction.
        </p>

        <!-- Summary section -->
        <h3 style="font-size: 18px; color: #333; font-weight: 400; margin: 0 0 15px 0; border-top: 1px solid #eee; padding-top: 30px;">Invoices Cleared</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>${invoiceLines}</tbody>
        </table>

        <!-- Balance Status -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
            <tr>
                <td style="padding: 15px 0; font-size: 14px; color: #666; border-top: 1px solid #eee;">Remaining Account Balance</td>
                <td style="padding: 15px 0; font-size: 16px; color: ${balanceAfter > 0 ? '#333' : '#2e7d32'}; font-weight: 700; text-align: right; border-top: 1px solid #eee;">₹${balanceAfter.toLocaleString('en-IN')}</td>
            </tr>
        </table>

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee;">
            ${userDetails?.businessName ? `<div style="font-size: 12px; color: #888; font-weight: 600; margin-bottom: 3px;">${userDetails.businessName}</div>` : ''}
            ${userDetails?.address ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.address}</div>` : ''}
            ${userDetails?.phoneNo ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.phoneNo}</div>` : ''}
            ${userDetails?.email ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.email}</div>` : ''}
            ${userDetails?.website ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.website}</div>` : ''}
            ${userDetails?.gstNumber ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">GST: ${userDetails.gstNumber}</div>` : ''}
        </div>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `Payment Receipt — ₹${totalPaid.toLocaleString('en-IN')}`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Send sales thank-you email after a purchase
 */
export async function sendSalesThankYouEmail(customerEmail, customerName, invoice, balanceAfter, businessName, pdfBuffer = null, websiteUrl = 'example.com', userDetails = {}) {
    const itemRows = invoice.items.map(item => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333; width: 60%;">
                <strong>${item.itemName}</strong> × ${item.qty}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; color: #333;">
                ₹${item.total.toLocaleString('en-IN')}
            </td>
        </tr>
    `).join('');

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px 20px;">
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <tr>
                <td style="text-align: left;">
                    <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: 700;">${businessName || 'Minimalist'}</h1>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                    <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">ORDER #${invoice.invoiceNumber || 'N/A'}</span>
                </td>
            </tr>
        </table>

        <!-- Body -->
        <h2 style="font-size: 22px; color: #333; margin: 0 0 15px 0; font-weight: 400;">Thank you for your purchase!</h2>
        
        <p style="font-size: 15px; color: #666; line-height: 1.6; margin: 0 0 25px 0;">
            We have processed your order successfully. We will notify you when any relevant updates happen.
            ${pdfBuffer ? '<br/><br/><strong>A digital PDF copy of your invoice is attached to this email.</strong>' : ''}
        </p>

        <!-- Action Button -->
        <table style="margin-bottom: 50px;">
            <tr>
                <td>
                    <a href="https://${websiteUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 4px;">View your order</a>
                </td>
                <td style="padding-left: 15px;">
                    <span style="color: #666; font-size: 14px;">or <a href="https://${websiteUrl}" style="color: #333; text-decoration: none;">Visit our store</a></span>
                </td>
            </tr>
        </table>

        <!-- Summary section -->
        <h3 style="font-size: 18px; color: #333; font-weight: 400; margin: 0 0 15px 0; border-top: 1px solid #eee; padding-top: 30px;">Order summary</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>${itemRows}</tbody>
        </table>

        <!-- Totals -->
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 5px 0; font-size: 14px; color: #666;">Subtotal</td>
                <td style="padding: 5px 0; font-size: 14px; color: #333; text-align: right;">₹${invoice.subTotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; font-size: 14px; color: #666;">Tax</td>
                <td style="padding: 5px 0; font-size: 14px; color: #333; text-align: right;">₹${(invoice.grandTotal - invoice.subTotal).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
                <td style="padding: 15px 0 0 0; font-size: 16px; color: #333; font-weight: 600;">Total</td>
                <td style="padding: 15px 0 0 0; font-size: 18px; color: #000; font-weight: 700; text-align: right;">₹${invoice.grandTotal.toLocaleString('en-IN')}</td>
            </tr>
        </table>

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee;">
            ${userDetails?.businessName ? `<div style="font-size: 12px; color: #888; font-weight: 600; margin-bottom: 3px;">${userDetails.businessName}</div>` : ''}
            ${userDetails?.address ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.address}</div>` : ''}
            ${userDetails?.phoneNo ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.phoneNo}</div>` : ''}
            ${userDetails?.email ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.email}</div>` : ''}
            ${userDetails?.website ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${userDetails.website}</div>` : ''}
            ${userDetails?.gstNumber ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">GST: ${userDetails.gstNumber}</div>` : ''}
        </div>
    </div>`;

    const payload = {
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `Invoice Available: Purchase from ${businessName || 'BizzOps'}`,
        html,
    };

    if (pdfBuffer) {
        // Puppeteer >v20 returns Uint8Array, so wrap it in Buffer.from() safely before conversion.
        payload.attachments = [
            {
                filename: `Invoice_${invoice.invoiceNumber || 'Document'}.pdf`,
                content: Buffer.from(pdfBuffer).toString('base64'),
            }
        ];
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Send contact form email to admin
 */
export async function sendContactEmail(name, userEmail, subject, message) {
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New Contact Request</h1>
            <p style="color: #8888aa; margin: 8px 0 0; font-size: 13px;">via BizzOps Landing Page</p>
        </div>
        <div style="padding: 30px;">
            <p style="font-size: 15px; color: #333;"><strong>From:</strong> ${name} &lt;${userEmail}&gt;</p>
            <p style="font-size: 15px; color: #333;"><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <h3 style="font-size: 14px; color: #666; text-transform: uppercase;">Message:</h3>
            <p style="font-size: 15px; color: #444; line-height: 1.6; white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 8px;">${message}</p>
        </div>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `BizzOps Contact <${FROM_EMAIL}>`,
        to: ['bizzopsshyamkadiwar@gmail.com'],
        reply_to: userEmail,
        subject: `Contact Request: ${subject}`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(userEmail, userName, resetUrl) {
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px 20px; border-radius: 8px; border: 1px solid #eaebed;">
        <h1 style="color: #111827; margin: 0 0 20px; font-size: 24px; font-weight: 700;">Password Reset Request</h1>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Hello ${userName || 'there'},<br><br>
            We received a request to reset the password for your BizzOps account. Click the button below to choose a new password. <strong>This link is valid for 15 minutes.</strong>
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #3B82F6; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; text-align: center;">Reset Password</a>
        </div>
        <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <a href="${resetUrl}" style="color: #3B82F6; text-decoration: underline; word-break: break-all;">${resetUrl}</a>
        </p>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0; padding-top: 24px; border-top: 1px solid #E5E7EB;">
            If you did not request a password reset, please ignore this email or contact support if you have concerns.
        </p>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `BizzOps Security <${FROM_EMAIL}>`,
        to: [userEmail],
        subject: `Reset your BizzOps password`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}

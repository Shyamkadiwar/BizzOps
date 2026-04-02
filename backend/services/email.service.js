import { resend, FROM_EMAIL } from '../config/resend.js';

/**
 * Send payment request email with Razorpay payment link
 */
export async function sendPaymentRequestEmail(customerEmail, customerName, invoices, paymentLink, businessName) {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const invoiceRows = invoices.map(inv => `
        <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">
                #${inv.invoiceNumber || 'N/A'}
            </td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">
                ${inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
            </td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">
                ${inv.items?.map(i => i.itemName).join(', ') || '-'}
            </td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600; color: #c0392b; text-align: right;">
                ₹${inv.grandTotal.toLocaleString('en-IN')}
            </td>
        </tr>
    `).join('');

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: #1a1a2e; padding: 30px 30px 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">${businessName || 'BizzOps'}</h1>
            <p style="color: #8888aa; margin: 5px 0 0; font-size: 13px;">Payment Request</p>
        </div>

        <div style="padding: 30px;">
            <p style="font-size: 15px; color: #333; margin: 0 0 20px;">Dear <strong>${customerName}</strong>,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 25px;">
                You have pending invoice(s) that require payment. Please review the details below and complete your payment using the secure link provided.
            </p>

            <!-- Invoice Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 10px 15px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Invoice #</th>
                        <th style="padding: 10px 15px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Date</th>
                        <th style="padding: 10px 15px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Items</th>
                        <th style="padding: 10px 15px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Amount</th>
                    </tr>
                </thead>
                <tbody>${invoiceRows}</tbody>
            </table>

            <!-- Total -->
            <div style="background: #f8f9fa; padding: 15px 20px; border-radius: 8px; text-align: right; margin: 0 0 25px;">
                <span style="font-size: 14px; color: #666;">Total Due: </span>
                <span style="font-size: 20px; font-weight: 700; color: #c0392b;">₹${totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <!-- Pay Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${paymentLink}" target="_blank"
                   style="display: inline-block; background: #528FF0; color: #ffffff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                    💳 Pay Now — ₹${totalAmount.toLocaleString('en-IN')}
                </a>
            </div>

            <p style="font-size: 12px; color: #999; text-align: center; margin: 20px 0 0;">
                This is a secure payment link powered by Razorpay. Click the button above to complete your payment.
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
                ${businessName || 'BizzOps'} — This is an automated system-generated email. Please do not reply directly to this message.
            </p>
            <p style="font-size: 11px; color: #aaa; margin: 5px 0 0;">
                Payment is strictly due as per the terms agreed upon during purchase.
            </p>
        </div>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `Payment Request: Invoice from ${businessName || 'BizzOps'}`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(customerEmail, customerName, invoices, totalPaid, balanceAfter, businessName) {
    const invoiceLines = invoices.map(inv =>
        `<li style="padding: 5px 0; font-size: 14px; color: #333;">
            Invoice <strong>#${inv.invoiceNumber || 'N/A'}</strong> — ₹${inv.grandTotal.toLocaleString('en-IN')} ✅
        </li>`
    ).join('');

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">${businessName || 'BizzOps'}</h1>
            <p style="color: #66bb6a; margin: 8px 0 0; font-size: 14px;">Payment Received</p>
        </div>

        <div style="padding: 30px;">
            <p style="font-size: 15px; color: #333;">Dear <strong>${customerName}</strong>,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
                We have successfully received your payment. Here is a summary of your transaction:
            </p>

            <!-- Payment Summary -->
            <div style="background: #e8f5e9; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="font-size: 13px; color: #2e7d32; margin: 0;">Amount Paid</p>
                <p style="font-size: 28px; font-weight: 700; color: #2e7d32; margin: 5px 0;">₹${totalPaid.toLocaleString('en-IN')}</p>
            </div>

            <h3 style="font-size: 14px; color: #333; margin: 20px 0 10px;">Invoices Cleared:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">${invoiceLines}</ul>

            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; display: flex; justify-content: space-between;">
                <div style="text-align: center; flex: 1;">
                    <p style="font-size: 12px; color: #999; margin: 0;">Remaining Balance</p>
                    <p style="font-size: 18px; font-weight: 700; color: ${balanceAfter > 0 ? '#c0392b' : '#2e7d32'}; margin: 5px 0;">
                        ₹${balanceAfter.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            ${balanceAfter <= 0 ? `
            <div style="text-align: center; padding: 15px; background: #e8f5e9; border-radius: 8px; margin: 15px 0;">
                <p style="font-size: 16px; font-weight: 600; color: #2e7d32; margin: 0;">All outstanding dues cleared. Current balance is ₹0</p>
            </div>` : ''}
        </div>

        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 13px; color: #666; margin: 0;">Thank you for your payment.</p>
            <p style="font-size: 12px; color: #999; margin: 5px 0 0;">${businessName || 'BizzOps'} — This is an automated system-generated receipt.</p>
        </div>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `Payment Receipt: ₹${totalPaid.toLocaleString('en-IN')} Received`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Send sales thank-you email after a purchase
 */
export async function sendSalesThankYouEmail(customerEmail, customerName, invoice, balanceAfter, businessName, pdfBuffer = null, websiteUrl = 'example.com') {
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
    </div>`;

    const payload = {
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `Invoice Available: Purchase from ${businessName || 'BizzOps'}`,
        html,
    };

    if (pdfBuffer) {
        payload.attachments = [
            {
                filename: `Invoice_${invoice.invoiceNumber || 'Document'}.pdf`,
                content: Buffer.isBuffer(pdfBuffer) ? pdfBuffer.toString('base64') : pdfBuffer,
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

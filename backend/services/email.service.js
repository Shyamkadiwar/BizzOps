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
                ${businessName || 'BizzOps'} — This is an automated email. Please do not reply.
            </p>
        </div>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `Payment Request — ₹${totalAmount.toLocaleString('en-IN')} due from ${businessName || 'BizzOps'}`,
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
            <p style="color: #66bb6a; margin: 8px 0 0; font-size: 14px;">✅ Payment Received</p>
        </div>

        <div style="padding: 30px;">
            <p style="font-size: 15px; color: #333;">Dear <strong>${customerName}</strong>,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
                We have successfully received your payment. Here's a summary:
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
                <p style="font-size: 16px; font-weight: 600; color: #2e7d32; margin: 0;">🎉 All dues cleared! Balance is ₹0</p>
            </div>` : ''}
        </div>

        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 13px; color: #666; margin: 0;">Thank you for your payment!</p>
            <p style="font-size: 12px; color: #999; margin: 5px 0 0;">${businessName || 'BizzOps'}</p>
        </div>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `✅ Payment Received — ₹${totalPaid.toLocaleString('en-IN')}`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Send sales thank-you email after a purchase
 */
export async function sendSalesThankYouEmail(customerEmail, customerName, invoice, balanceAfter, businessName) {
    const itemRows = invoice.items.map(item => `
        <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${item.itemName}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; text-align: center;">${item.qty}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; text-align: right; font-weight: 600;">₹${item.total.toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">${businessName || 'BizzOps'}</h1>
            <p style="color: #8888aa; margin: 8px 0 0; font-size: 13px;">Invoice #${invoice.invoiceNumber || 'N/A'}</p>
        </div>

        <div style="padding: 30px;">
            <p style="font-size: 15px; color: #333;">Dear <strong>${customerName}</strong>,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
                Thank you for your purchase! Here are your invoice details:
            </p>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #666; border-bottom: 2px solid #e0e0e0;">Item</th>
                        <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #666; border-bottom: 2px solid #e0e0e0;">Qty</th>
                        <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #666; border-bottom: 2px solid #e0e0e0;">Price</th>
                        <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #666; border-bottom: 2px solid #e0e0e0;">Total</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>

            <!-- Totals -->
            <div style="text-align: right; margin: 15px 0;">
                <p style="font-size: 13px; color: #666; margin: 5px 0;">Subtotal: ₹${invoice.subTotal.toLocaleString('en-IN')}</p>
                <p style="font-size: 13px; color: #666; margin: 5px 0;">Tax: ₹${(invoice.grandTotal - invoice.subTotal).toLocaleString('en-IN')}</p>
                <p style="font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 10px 0;">
                    Grand Total: ₹${invoice.grandTotal.toLocaleString('en-IN')}
                </p>
            </div>

            <!-- Status -->
            <div style="background: ${invoice.paid ? '#e8f5e9' : '#fff3e0'}; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
                <p style="font-size: 14px; font-weight: 600; color: ${invoice.paid ? '#2e7d32' : '#e65100'}; margin: 0;">
                    Status: ${invoice.paid ? '✅ PAID' : '⏳ UNPAID'}
                </p>
                ${!invoice.paid ? `<p style="font-size: 13px; color: #666; margin: 5px 0 0;">Outstanding Balance: ₹${(balanceAfter || 0).toLocaleString('en-IN')}</p>` : ''}
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 13px; color: #666; margin: 0;">Thank you for your business!</p>
            <p style="font-size: 12px; color: #999; margin: 5px 0 0;">${businessName || 'BizzOps'}</p>
        </div>
    </div>`;

    const { data, error } = await resend.emails.send({
        from: `${businessName || 'BizzOps'} <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `🛍️ Thank you for your purchase — Invoice #${invoice.invoiceNumber || 'N/A'}`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}

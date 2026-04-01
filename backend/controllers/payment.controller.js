import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { Invoice } from "../models/invoice.model.js";
import { Customer } from "../models/customer.models.js";
import { User } from "../models/user.model.js";
import { sendPaymentRequestEmail, sendPaymentConfirmationEmail } from "../services/email.service.js";

/**
 * Create a Razorpay Payment Link for selected invoices and send email to customer
 */
const createPaymentLink = asyncHandler(async (req, res) => {
    const { customerId, invoiceIds } = req.body;
    const owner = req.user?._id;

    if (!owner) throw new ApiError(401, "Unauthorized request");
    if (!customerId || !invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new ApiError(400, "Customer ID and at least one invoice are required");
    }

    const customer = await Customer.findOne({ _id: customerId, owner });
    if (!customer) throw new ApiError(404, "Customer not found");
    if (!customer.email) throw new ApiError(400, "Customer does not have an email address");

    // Fetch user details for business name
    const user = await User.findById(owner);
    const businessName = user?.businessName || 'BizzOps';

    // Fetch selected invoices
    const invoices = await Invoice.find({
        _id: { $in: invoiceIds },
        owner,
        customer: customerId,
        paid: false
    });
    if (invoices.length === 0) throw new ApiError(400, "No valid unpaid invoices found");
    if (invoices.length !== invoiceIds.length) {
        throw new ApiError(400, "Some invoices are invalid or already paid");
    }

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const amountInPaise = Math.round(totalAmount * 100);

    // Create Razorpay payment link
    const invoiceNumbers = invoices.map(inv => inv.invoiceNumber || inv._id).join(', ');
    const paymentLink = await razorpay.paymentLink.create({
        amount: amountInPaise,
        currency: 'INR',
        accept_partial: false,
        description: `Payment for invoice(s): ${invoiceNumbers}`,
        customer: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone || ''
        },
        notify: { sms: false, email: false }, // We send our own email
        reminder_enable: false,
        notes: {
            owner_id: owner.toString(),
            customer_id: customerId,
            invoice_ids: JSON.stringify(invoiceIds),
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
        callback_method: 'get'
    });

    // Store the payment link ID on each invoice
    for (const invoice of invoices) {
        invoice.razorpayPaymentLinkId = paymentLink.id;
        await invoice.save();
    }

    // Send payment request email
    try {
        await sendPaymentRequestEmail(
            customer.email,
            customer.name,
            invoices,
            paymentLink.short_url,
            businessName
        );
    } catch (emailErr) {
        console.error('Email sending failed:', emailErr.message);
        // Don't fail the whole request if email fails
    }

    return res.status(200).json(new ApiResponse(200, {
        paymentLink: paymentLink.short_url,
        paymentLinkId: paymentLink.id,
        amount: totalAmount,
        invoiceCount: invoices.length
    }, `Payment link created and email sent to ${customer.email}`));
});

/**
 * Handle Razorpay webhook — called when payment is completed
 * No JWT auth, uses Razorpay signature verification
 */
const handleWebhook = async (req, res) => {
    try {
        console.log('[WEBHOOK] Received Razorpay webhook');
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

        // req.body is a raw Buffer from express.raw()
        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : 
                         typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        // Verify signature
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            console.log('[WEBHOOK] Missing x-razorpay-signature header');
            return res.status(400).json({ error: 'Missing signature' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('[WEBHOOK] Signature mismatch');
            console.error('[WEBHOOK] Expected:', expectedSignature);
            console.error('[WEBHOOK] Received:', signature);
            return res.status(400).json({ error: 'Invalid signature' });
        }

        console.log('[WEBHOOK] Signature verified ✅');
        const event = JSON.parse(rawBody);
        console.log('[WEBHOOK] Event type:', event.event);

        // Handle payment_link.paid event
        if (event.event === 'payment_link.paid') {
            const paymentLinkEntity = event.payload?.payment_link?.entity;
            if (!paymentLinkEntity) {
                console.log('[WEBHOOK] No payment link entity in payload');
                return res.status(200).json({ status: 'ok', note: 'No payment link entity' });
            }

            const notes = paymentLinkEntity.notes || {};
            const ownerId = notes.owner_id;
            const customerId = notes.customer_id;
            let invoiceIds = [];

            try {
                invoiceIds = JSON.parse(notes.invoice_ids || '[]');
            } catch (e) {
                console.error('[WEBHOOK] Failed to parse invoice_ids from notes');
            }

            console.log('[WEBHOOK] Owner:', ownerId, '| Customer:', customerId, '| Invoices:', invoiceIds);

            if (!ownerId || !customerId || invoiceIds.length === 0) {
                console.log('[WEBHOOK] Missing metadata in notes');
                return res.status(200).json({ status: 'ok', note: 'Missing metadata' });
            }

            // Mark invoices as paid
            const invoices = await Invoice.find({
                _id: { $in: invoiceIds },
                owner: ownerId,
                paid: false
            });

            console.log('[WEBHOOK] Found', invoices.length, 'unpaid invoices to mark as paid');

            const paidDate = new Date();
            let totalPaid = 0;

            for (const invoice of invoices) {
                invoice.paid = true;
                invoice.paidDate = paidDate;
                await invoice.save();
                totalPaid += invoice.grandTotal;
            }

            // Update customer balance
            const customer = await Customer.findById(customerId);
            if (customer && totalPaid > 0) {
                customer.balance = Math.max(0, customer.balance - totalPaid);
                await customer.save();

                console.log('[WEBHOOK] Customer balance updated to:', customer.balance);

                // Create transaction record
                const { CustomerTransaction } = await import('../models/customerTransaction.model.js');
                await CustomerTransaction.create({
                    owner: ownerId,
                    customer: customerId,
                    type: 'payment',
                    amount: -totalPaid,
                    balanceAfter: customer.balance,
                    description: `Online payment via Razorpay (${invoices.map(i => '#' + (i.invoiceNumber || i._id)).join(', ')})`,
                    date: paidDate
                });

                // Send confirmation email
                const user = await User.findById(ownerId);
                try {
                    await sendPaymentConfirmationEmail(
                        customer.email,
                        customer.name,
                        invoices,
                        totalPaid,
                        customer.balance,
                        user?.businessName || 'BizzOps'
                    );
                    console.log('[WEBHOOK] Confirmation email sent ✅');
                } catch (emailErr) {
                    console.error('[WEBHOOK] Confirmation email failed:', emailErr.message);
                }
            }

            console.log(`[WEBHOOK] ✅ Processed: ${invoices.length} invoices paid, total ₹${totalPaid}`);
        }

        return res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('[WEBHOOK] Error:', error);
        return res.status(200).json({ status: 'ok', error: error.message });
    }
};

export { createPaymentLink, handleWebhook };

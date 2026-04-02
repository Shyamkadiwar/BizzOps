import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Razorpay from "razorpay";
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

    // Fetch user details for business name & razorpay keys
    const user = await User.findById(owner);
    if (!user) throw new ApiError(404, "Owner not found");
    if (!user.razorpayKeyId || !user.razorpayKeySecret) {
        throw new ApiError(400, "Payment gateway is not configured. Please add your Razorpay keys in Settings.");
    }
    const businessName = user.businessName || 'BizzOps';

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

    // Initialize User-specific Razorpay instance
    const rp = new Razorpay({
        key_id: user.razorpayKeyId,
        key_secret: user.razorpayKeySecret
    });

    // Create Razorpay payment link
    const invoiceNumbers = invoices.map(inv => inv.invoiceNumber || inv._id).join(', ');
    const paymentLink = await rp.paymentLink.create({
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
            businessName,
            user
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

        // req.body is a raw Buffer from express.raw()
        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : 
                         typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        // Before verifying signature, we need to know the Owner to get their Webhook Secret.
        // We will parse the body as JSON, ignoring signature temporarily, just to extract owner_id.
        let parsedBody;
        try {
            parsedBody = JSON.parse(rawBody);
        } catch (err) {
            console.error('[WEBHOOK] Failed to parse raw body:', err);
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const notes = parsedBody?.payload?.payment_link?.entity?.notes || {};
        const ownerId = notes.owner_id;

        if (!ownerId) {
            console.log('[WEBHOOK] Missing owner metadata in notes. Cannot verify multi-tenant webhook.');
            return res.status(200).json({ status: 'ok', note: 'Missing owner metadata' });
        }

        // Fetch user's webhook secret or fallback to their key secret
        const user = await User.findById(ownerId);
        if (!user) {
            console.log('[WEBHOOK] User not found for owner_id:', ownerId);
            return res.status(200).json({ status: 'ok', note: 'User not found' });
        }

        const webhookSecret = user.razorpayWebhookSecret || user.razorpayKeySecret;
        if (!webhookSecret) {
            console.log('[WEBHOOK] User has no razorpay secrets to verify webhook.');
            return res.status(200).json({ status: 'ok', note: 'Webhook secrets not configured' });
        }

        // Now Verify signature using the specific user's secret
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
        const event = parsedBody;
        console.log('[WEBHOOK] Event type:', event.event);

        // Handle payment_link.paid event
        if (event.event === 'payment_link.paid') {
            const paymentLinkEntity = event.payload?.payment_link?.entity;
            if (!paymentLinkEntity) {
                console.log('[WEBHOOK] No payment link entity in payload');
                return res.status(200).json({ status: 'ok', note: 'No payment link entity' });
            }

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
                        user?.businessName || 'BizzOps',
                        user
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

/**
 * Verify payment status by checking Razorpay API directly
 * Called from frontend to check if a payment link has been paid
 */
const verifyPayment = asyncHandler(async (req, res) => {
    const { customerId } = req.body;
    const owner = req.user?._id;

    if (!owner) throw new ApiError(401, "Unauthorized request");
    if (!customerId) throw new ApiError(400, "Customer ID is required");

    // Find all invoices for this customer that have a Razorpay payment link and are unpaid
    const invoices = await Invoice.find({
        owner,
        customer: customerId,
        paid: false,
        razorpayPaymentLinkId: { $exists: true, $ne: null }
    });

    if (invoices.length === 0) {
        return res.status(200).json(new ApiResponse(200, { updated: 0 }, "No pending payment links found"));
    }

    // Group invoices by payment link ID
    const linkGroups = {};
    for (const inv of invoices) {
        const linkId = inv.razorpayPaymentLinkId;
        if (!linkGroups[linkId]) linkGroups[linkId] = [];
        linkGroups[linkId].push(inv);
    }

    let totalUpdated = 0;
    let totalPaid = 0;

    const user = await User.findById(owner);
    if (!user || !user.razorpayKeyId || !user.razorpayKeySecret) {
        return res.status(400).json(new ApiResponse(400, null, "Razorpay keys not configured"));
    }

    const rp = new Razorpay({
        key_id: user.razorpayKeyId,
        key_secret: user.razorpayKeySecret
    });

    for (const [linkId, linkedInvoices] of Object.entries(linkGroups)) {
        try {
            // Fetch payment link status from Razorpay API
            const paymentLink = await rp.paymentLink.fetch(linkId);
            console.log(`[VERIFY] Payment link ${linkId}: status = ${paymentLink.status}`);

            if (paymentLink.status === 'paid') {
                const paidDate = new Date();

                // Mark all linked invoices as paid
                for (const invoice of linkedInvoices) {
                    invoice.paid = true;
                    invoice.paidDate = paidDate;
                    await invoice.save();
                    totalPaid += invoice.grandTotal;
                    totalUpdated++;
                }
            }
        } catch (err) {
            console.error(`[VERIFY] Error checking payment link ${linkId}:`, err.message);
        }
    }

    // If any invoices were newly marked as paid, update customer balance
    if (totalPaid > 0) {
        const customer = await Customer.findById(customerId);
        if (customer) {
            customer.balance = Math.max(0, customer.balance - totalPaid);
            await customer.save();

            // Create transaction record
            const { CustomerTransaction } = await import('../models/customerTransaction.model.js');
            await CustomerTransaction.create({
                owner,
                customer: customerId,
                type: 'payment',
                amount: -totalPaid,
                balanceAfter: customer.balance,
                description: `Online payment via Razorpay (${totalUpdated} invoice(s))`,
                date: new Date()
            });

            // Send confirmation email
            const user = await User.findById(owner);
            const paidInvoices = invoices.filter(inv => inv.paid);
            if (customer.email && paidInvoices.length > 0) {
                try {
                    await sendPaymentConfirmationEmail(
                        customer.email,
                        customer.name,
                        paidInvoices,
                        totalPaid,
                        customer.balance,
                        user?.businessName || 'BizzOps',
                        user
                    );
                } catch (emailErr) {
                    console.error('[VERIFY] Confirmation email failed:', emailErr.message);
                }
            }
        }
    }

    return res.status(200).json(new ApiResponse(200, {
        updated: totalUpdated,
        totalPaid
    }, totalUpdated > 0
        ? `${totalUpdated} invoice(s) verified as paid. ₹${totalPaid.toLocaleString('en-IN')} updated.`
        : "No new payments found"
    ));
});

export { createPaymentLink, handleWebhook, verifyPayment };
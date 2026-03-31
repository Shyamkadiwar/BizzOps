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
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

        // Verify signature
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing signature' });
        }

        const body = req.body; // This will be raw buffer for webhook route
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(typeof body === 'string' ? body : JSON.stringify(body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Webhook signature mismatch');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = typeof body === 'string' ? JSON.parse(body) : body;

        // Handle payment_link.paid event
        if (event.event === 'payment_link.paid') {
            const paymentLinkEntity = event.payload?.payment_link?.entity;
            if (!paymentLinkEntity) {
                return res.status(200).json({ status: 'ok', note: 'No payment link entity' });
            }

            const notes = paymentLinkEntity.notes || {};
            const ownerId = notes.owner_id;
            const customerId = notes.customer_id;
            let invoiceIds = [];

            try {
                invoiceIds = JSON.parse(notes.invoice_ids || '[]');
            } catch (e) {
                console.error('Failed to parse invoice_ids from notes');
            }

            if (!ownerId || !customerId || invoiceIds.length === 0) {
                return res.status(200).json({ status: 'ok', note: 'Missing metadata' });
            }

            // Mark invoices as paid
            const invoices = await Invoice.find({
                _id: { $in: invoiceIds },
                owner: ownerId,
                paid: false
            });

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
                } catch (emailErr) {
                    console.error('Confirmation email failed:', emailErr.message);
                }
            }

            console.log(`✅ Webhook processed: ${invoices.length} invoices paid, total ₹${totalPaid}`);
        }

        return res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(200).json({ status: 'ok', error: error.message });
    }
};

export { createPaymentLink, handleWebhook };

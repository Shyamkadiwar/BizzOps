import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Invoice } from "../models/invoice.model.js";
import { Inventory } from "../models/inventory.model.js";

const addInvoice = asyncHandler(async (req, res) => {
  const { name, items, paid, date } = req.body;
  const owner = req.user?._id;

  if (!name || !items || items.length === 0) {
    throw new ApiError(400, "Customer name and items are required.");
  }

  if (!owner) {
    throw new ApiError(401, "Unauthorized request");
  }

  // First, check inventory for each item
  for (const item of items) {
    const inventoryItem = await Inventory.findOne({
      owner,
      item: item.itemName
    });

    if (!inventoryItem) {
      throw new ApiError(404, `Inventory item not found: ${item.itemName}`);
    }

    if (inventoryItem.stockRemain < item.qty) {
      throw new ApiError(400, `Insufficient inventory for ${item.itemName}. Available: ${inventoryItem.stockRemain}, Requested: ${item.qty}`);
    }
  }

  // If we've made it this far, reduce inventory for each item
  for (const item of items) {
    await Inventory.findOneAndUpdate(
      { owner, item: item.itemName },
      { $inc: { stockRemain: -item.qty } }
    );
  }

  // Calculate subTotal and grandTotal for all items
  let subTotal = 0;
  let grandTotal = 0;

  items.forEach((item) => {
    if (!item.itemName || !item.qty || !item.price || item.tax === undefined) {
      throw new ApiError(400, "Each item must have a name, qty, price, and tax");
    }
    const itemSubTotal = item.qty * item.price;
    const itemGrandTotal = itemSubTotal * (1 + item.tax / 100);

    subTotal += itemSubTotal;
    grandTotal += itemGrandTotal;
  });

  // Look up customer by name and link
  const Customer = (await import('../models/customer.models.js')).Customer;
  const CustomerTransaction = (await import('../models/customerTransaction.model.js')).CustomerTransaction;
  let customerId = null;
  let customerDoc = null;

  if (name) {
    customerDoc = await Customer.findOne({ owner, name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (customerDoc) {
      customerId = customerDoc._id;
    }
  }

  const invoice = await Invoice.create({
    owner,
    name,
    customer: customerId,
    items,
    subTotal,
    grandTotal,
    paid,
    date
  });

  // Update customer balance if customer exists
  if (customerDoc) {
    const updateFields = {
      $inc: {
        totalSales: grandTotal
      }
    };

    // If unpaid, add to customer's outstanding balance
    if (!paid) {
      updateFields.$inc.balance = grandTotal;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updateFields,
      { new: true }
    );

    if (updatedCustomer) {
      await CustomerTransaction.create({
        owner,
        customer: customerId,
        type: 'sale',
        amount: grandTotal,
        balanceAfter: updatedCustomer.balance,
        description: `Invoice ${paid ? '(Paid)' : '(Unpaid)'}: ${name} - ₹${grandTotal.toFixed(2)}`,
        invoice: invoice._id,
        date: date ? new Date(date) : new Date()
      });
    }
  }

  // Send thank-you email to customer if they have an email
  console.log('[EMAIL DEBUG] customerDoc:', customerDoc ? `found (${customerDoc.name}, email: ${customerDoc.email})` : 'NOT FOUND');
  if (customerDoc && customerDoc.email) {
    try {
      const { sendSalesThankYouEmail } = await import('../services/email.service.js');
      const user = await (await import('../models/user.model.js')).User.findById(owner);
      const updatedCust = await Customer.findById(customerId);
      console.log('[EMAIL DEBUG] Sending thank-you email to:', customerDoc.email);
      await sendSalesThankYouEmail(
        customerDoc.email,
        customerDoc.name,
        invoice,
        updatedCust?.balance || 0,
        user?.businessName || 'BizzOps'
      );
      console.log('[EMAIL DEBUG] Thank-you email sent successfully');
    } catch (emailErr) {
      console.error('[EMAIL DEBUG] Thank-you email FAILED:', emailErr.message, emailErr);
    }
  } else {
    console.log('[EMAIL DEBUG] Skipping email - customerDoc:', !!customerDoc, ', email:', customerDoc?.email);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { invoice }, "Invoice added successfully"));
});

const getInvoice = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!owner) {
    throw new ApiError(400, "Unauthorized User")
  }

  const invoices = await Invoice.find({ owner })
    .populate('customer', 'name email phone')
    .populate('sale')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Invoice.countDocuments({ owner });

  if (!invoices) {
    throw new ApiError(400, "No invoices found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {
      invoices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    }, "Invoices retrieved successfully"))
})

const getPaidInvoices = asyncHandler(async (req, res) => {
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(401, "Unauthorized request");
  }

  // Fetch all paid invoices for the logged-in user
  const paidInvoices = await Invoice.find({ owner, paid: true });

  if (!paidInvoices || paidInvoices.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No paid invoices found"));
  }

  // Calculate the total paid amount
  const totalPaidAmount = paidInvoices.reduce((acc, invoice) => {
    return acc + invoice.grandTotal;
  }, 0);

  return res
    .status(200)
    .json(new ApiResponse(200, { totalPaidAmount, paidInvoices }, "Paid invoices retrieved successfully"));
});

const getUnpaidInvoices = asyncHandler(async (req, res) => {
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(401, "Unauthorized request");
  }

  const unpaidInvoices = await Invoice.find({ owner, paid: false });

  if (!unpaidInvoices) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No unpaid invoices found"));
  }

  // Calculate the total unpaid amount
  const totalUnpaidAmount = unpaidInvoices.reduce((acc, invoice) => {
    return acc + invoice.grandTotal;
  }, 0);

  return res
    .status(200)
    .json(new ApiResponse(200, { totalUnpaidAmount, unpaidInvoices }, "Unpaid invoices retrieved successfully"));
});

const countInvoices = asyncHandler(async (req, res) => {
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(401, "Unauthorized request");
  }

  const invoiceCount = await Invoice.countDocuments({ owner });

  return res
    .status(200)
    .json(new ApiResponse(200, { invoiceCount }, "Invoice count retrieved successfully"));
});

const markPaidUnpaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(401, "Unauthorized request");
  }

  const invoice = await Invoice.findOne({ _id: id, owner });

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  const wasPaid = invoice.paid;
  invoice.paid = !invoice.paid; // Toggle the paid status
  await invoice.save();

  // Update customer balance if customer is linked
  if (invoice.customer) {
    const Customer = (await import('../models/customer.models.js')).Customer;
    const CustomerTransaction = (await import('../models/customerTransaction.model.js')).CustomerTransaction;

    const customerDoc = await Customer.findById(invoice.customer);

    if (customerDoc) {
      let balanceChange = 0;
      let transactionType = '';
      let description = '';

      if (wasPaid && !invoice.paid) {
        // Was paid, now unpaid → increase balance (customer owes money again)
        balanceChange = invoice.grandTotal;
        transactionType = 'debit';
        description = `Invoice marked unpaid: ${invoice.name} - ₹${invoice.grandTotal.toFixed(2)}`;
      } else if (!wasPaid && invoice.paid) {
        // Was unpaid, now paid → decrease balance (customer paid up)
        balanceChange = -Math.min(invoice.grandTotal, customerDoc.balance);
        transactionType = 'payment';
        description = `Invoice marked paid: ${invoice.name} - ₹${invoice.grandTotal.toFixed(2)}`;
      }

      if (balanceChange !== 0) {
        const updatedCustomer = await Customer.findByIdAndUpdate(
          invoice.customer,
          { $inc: { balance: balanceChange } },
          { new: true }
        );

        if (updatedCustomer) {
          await CustomerTransaction.create({
            owner,
            customer: invoice.customer,
            type: transactionType,
            amount: balanceChange,
            balanceAfter: updatedCustomer.balance,
            description,
            invoice: invoice._id,
            date: new Date()
          });
        }
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { invoice }, `Invoice marked as ${invoice.paid ? "paid" : "unpaid"} successfully`));
});






const downloadInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(401, "Unauthorized request");
  }

  const invoice = await Invoice.findOne({ _id: id, owner }).populate('customer');

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  // TODO: Implement PDF generation later
  // For now, just return invoice data
  return res
    .status(200)
    .json(new ApiResponse(200, { invoice }, "Invoice retrieved successfully. PDF generation will be implemented later."));
});


export {
  addInvoice,
  getInvoice,
  getPaidInvoices,
  getUnpaidInvoices,
  countInvoices,
  markPaidUnpaid,
  downloadInvoice
}
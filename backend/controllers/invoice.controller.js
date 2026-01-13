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

  const invoice = await Invoice.create({
    owner,
    name,
    items,
    subTotal,
    grandTotal,
    paid,
    date
  });

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

  invoice.paid = !invoice.paid; // Toggle the paid status
  await invoice.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { invoice }, `Invoice marked as ${invoice.paid ? "paid" : "unpaid"} successfully`));
});



import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Make sure to add this to your .env file
});

// Helper function to process and structure invoice data for context
const prepareInvoiceContext = (invoiceData) => {
  // Group data by customer
  const customerSummary = invoiceData.reduce((acc, invoice) => {
    const customerName = invoice.name;

    if (!acc[customerName]) {
      acc[customerName] = {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaidAmount: 0,
        totalUnpaidAmount: 0,
        totalItems: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        averageInvoiceAmount: 0,
        items: {}
      };
    }

    acc[customerName].totalInvoices += 1;
    acc[customerName].totalAmount += invoice.grandTotal;

    if (invoice.paid) {
      acc[customerName].totalPaidAmount += invoice.grandTotal;
      acc[customerName].paidInvoices += 1;
    } else {
      acc[customerName].totalUnpaidAmount += invoice.grandTotal;
      acc[customerName].unpaidInvoices += 1;
    }

    // Process items for this customer
    invoice.items.forEach(item => {
      if (!acc[customerName].items[item.itemName]) {
        acc[customerName].items[item.itemName] = {
          totalQty: 0,
          totalValue: 0,
          avgPrice: 0,
          avgTax: 0,
          transactions: 0
        };
      }

      acc[customerName].items[item.itemName].totalQty += item.qty;
      acc[customerName].items[item.itemName].totalValue += (item.qty * item.price);
      acc[customerName].items[item.itemName].avgPrice += item.price;
      acc[customerName].items[item.itemName].avgTax += item.tax;
      acc[customerName].items[item.itemName].transactions += 1;
      acc[customerName].totalItems += item.qty;
    });

    return acc;
  }, {});

  // Calculate averages for customers
  Object.keys(customerSummary).forEach(customerName => {
    const customer = customerSummary[customerName];
    customer.averageInvoiceAmount = customer.totalAmount / customer.totalInvoices;

    // Calculate averages for items
    Object.keys(customer.items).forEach(itemName => {
      const item = customer.items[itemName];
      item.avgPrice = item.avgPrice / item.transactions;
      item.avgTax = item.avgTax / item.transactions;
    });
  });

  // Item summary across all invoices
  const itemSummary = invoiceData.reduce((acc, invoice) => {
    invoice.items.forEach(item => {
      if (!acc[item.itemName]) {
        acc[item.itemName] = {
          totalQty: 0,
          totalRevenue: 0,
          totalTaxCollected: 0,
          transactions: 0,
          avgPrice: 0,
          avgTax: 0,
          customers: new Set()
        };
      }

      const itemTotal = item.qty * item.price;
      const taxAmount = itemTotal * (item.tax / 100);

      acc[item.itemName].totalQty += item.qty;
      acc[item.itemName].totalRevenue += itemTotal;
      acc[item.itemName].totalTaxCollected += taxAmount;
      acc[item.itemName].transactions += 1;
      acc[item.itemName].avgPrice += item.price;
      acc[item.itemName].avgTax += item.tax;
      acc[item.itemName].customers.add(invoice.name);
    });

    return acc;
  }, {});

  // Calculate averages for items
  Object.keys(itemSummary).forEach(itemName => {
    const item = itemSummary[itemName];
    item.avgPrice = item.avgPrice / item.transactions;
    item.avgTax = item.avgTax / item.transactions;
    item.uniqueCustomers = item.customers.size;
    delete item.customers; // Remove Set for JSON serialization
  });

  // Overall summary
  const overallSummary = {
    totalInvoices: invoiceData.length,
    totalRevenue: invoiceData.reduce((sum, invoice) => sum + invoice.grandTotal, 0),
    totalSubTotal: invoiceData.reduce((sum, invoice) => sum + invoice.subTotal, 0),
    totalTaxCollected: invoiceData.reduce((sum, invoice) => sum + (invoice.grandTotal - invoice.subTotal), 0),
    paidInvoices: invoiceData.filter(invoice => invoice.paid).length,
    unpaidInvoices: invoiceData.filter(invoice => !invoice.paid).length,
    totalPaidAmount: invoiceData.filter(invoice => invoice.paid).reduce((sum, invoice) => sum + invoice.grandTotal, 0),
    totalUnpaidAmount: invoiceData.filter(invoice => !invoice.paid).reduce((sum, invoice) => sum + invoice.grandTotal, 0),
    uniqueCustomers: new Set(invoiceData.map(invoice => invoice.name)).size,
    averageInvoiceAmount: invoiceData.reduce((sum, invoice) => sum + invoice.grandTotal, 0) / invoiceData.length,
    dateRange: {
      earliest: invoiceData.filter(inv => inv.date).length > 0 ?
        new Date(Math.min(...invoiceData.filter(inv => inv.date).map(inv => new Date(inv.date)))) : null,
      latest: invoiceData.filter(inv => inv.date).length > 0 ?
        new Date(Math.max(...invoiceData.filter(inv => inv.date).map(inv => new Date(inv.date)))) : null
    }
  };

  return {
    customerSummary,
    itemSummary,
    overallSummary,
    rawData: invoiceData
  };
};

// RAG Query handler for invoices
export const queryInvoiceData = async (req, res) => {
  try {
    const { query, timeFilter = 'alltime' } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required"
      });
    }

    const owner = req.user?._id;
    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request"
      });
    }

    // Fetch invoice data for the logged-in user
    const invoiceData = await Invoice.find({ owner }).sort({ date: -1 });

    if (!invoiceData || invoiceData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No invoice data found"
      });
    }

    // Prepare structured context
    const invoiceContext = prepareInvoiceContext(invoiceData);

    // Create context string for the AI
    const contextString = `
INVOICE DATA SUMMARY:
====================

OVERALL METRICS:
- Total Invoices: ${invoiceContext.overallSummary.totalInvoices}
- Total Revenue: $${invoiceContext.overallSummary.totalRevenue.toLocaleString()}
- Total Sub Total: $${invoiceContext.overallSummary.totalSubTotal.toLocaleString()}
- Total Tax Collected: $${invoiceContext.overallSummary.totalTaxCollected.toLocaleString()}
- Paid Invoices: ${invoiceContext.overallSummary.paidInvoices}
- Unpaid Invoices: ${invoiceContext.overallSummary.unpaidInvoices}
- Total Paid Amount: $${invoiceContext.overallSummary.totalPaidAmount.toLocaleString()}
- Total Unpaid Amount: $${invoiceContext.overallSummary.totalUnpaidAmount.toLocaleString()}
- Unique Customers: ${invoiceContext.overallSummary.uniqueCustomers}
- Average Invoice Amount: $${invoiceContext.overallSummary.averageInvoiceAmount.toFixed(2)}
${invoiceContext.overallSummary.dateRange.earliest ?
        `- Date Range: ${invoiceContext.overallSummary.dateRange.earliest.toDateString()} to ${invoiceContext.overallSummary.dateRange.latest.toDateString()}` :
        '- Date Range: Not available for all invoices'}

CUSTOMER BREAKDOWN:
${Object.entries(invoiceContext.customerSummary).slice(0, 10).map(([customerName, customer]) => `
- ${customerName}:
  * Total Invoices: ${customer.totalInvoices}
  * Total Amount: $${customer.totalAmount.toLocaleString()}
  * Paid Amount: $${customer.totalPaidAmount.toLocaleString()}
  * Unpaid Amount: $${customer.totalUnpaidAmount.toLocaleString()}
  * Paid Invoices: ${customer.paidInvoices}
  * Unpaid Invoices: ${customer.unpaidInvoices}
  * Average Invoice: $${customer.averageInvoiceAmount.toFixed(2)}
  * Total Items Purchased: ${customer.totalItems}
`).join('')}

ITEM/PRODUCT BREAKDOWN:
${Object.entries(invoiceContext.itemSummary).slice(0, 10).map(([itemName, item]) => `
- ${itemName}:
  * Total Quantity Sold: ${item.totalQty}
  * Total Revenue: $${item.totalRevenue.toLocaleString()}
  * Total Tax Collected: $${item.totalTaxCollected.toFixed(2)}
  * Number of Transactions: ${item.transactions}
  * Average Price: $${item.avgPrice.toFixed(2)}
  * Average Tax Rate: ${item.avgTax.toFixed(2)}%
  * Unique Customers: ${item.uniqueCustomers}
`).join('')}

RECENT INVOICES (Last 5):
${invoiceData.slice(0, 5).map(invoice => `
- Invoice ID: ${invoice._id}
  Customer: ${invoice.name}
  Date: ${invoice.date ? new Date(invoice.date).toDateString() : 'Not specified'}
  Status: ${invoice.paid ? 'PAID' : 'UNPAID'}
  Sub Total: $${invoice.subTotal.toLocaleString()}
  Grand Total: $${invoice.grandTotal.toLocaleString()}
  Items: ${invoice.items.map(item => `${item.itemName} (Qty: ${item.qty}, Price: $${item.price}, Tax: ${item.tax}%)`).join(', ')}
`).join('')}
    `;

    // Query Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an invoice and business data analyst. Use the provided invoice data to answer questions accurately. 
          Provide specific numbers, insights, and actionable recommendations when possible. 
          Format your response clearly with bullet points or sections when appropriate.
          If asked about trends, calculate percentages and provide comparative analysis.
          Focus on business insights like customer payment behavior, popular items, tax analysis, revenue patterns, etc.
          Always base your answers strictly on the provided data.
          When discussing amounts, always use proper currency formatting.`
        },
        {
          role: "user",
          content: `Based on this invoice data:\n\n${contextString}\n\nQuestion: ${query}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    return res.status(200).json({
      success: true,
      data: {
        query,
        response: aiResponse,
        dataContext: {
          totalInvoices: invoiceContext.overallSummary.totalInvoices,
          totalRevenue: invoiceContext.overallSummary.totalRevenue,
          paidInvoices: invoiceContext.overallSummary.paidInvoices,
          unpaidInvoices: invoiceContext.overallSummary.unpaidInvoices,
          uniqueCustomers: invoiceContext.overallSummary.uniqueCustomers,
          dateRange: invoiceContext.overallSummary.dateRange
        }
      }
    });

  } catch (error) {
    console.error('Invoice RAG Query Error:', error);
    return res.status(500).json({
      success: false,
      message: "Error processing invoice query",
      error: error.message
    });
  }
};




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
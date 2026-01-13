import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import XLSX from 'xlsx';
import { Inventory } from "../models/inventory.model.js";
import { Sales } from "../models/sales.model.js";
import { Customer } from "../models/customer.models.js";
import { Expense } from "../models/expense.model.js";
import { Product } from "../models/product.model.js";
import fs from 'fs';
import path from 'path';

// Import Inventory from Excel
export const importInventory = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const results = {
            success: [],
            failed: []
        };

        for (const row of data) {
            try {
                // Auto-create product if needed
                let productId = null;
                if (row.Item && row.Category) {
                    const product = await Product.create({
                        owner,
                        name: row.Item,
                        category: row.Category,
                        cost: row.Cost || 0,
                        salePrice: row.SalePrice || 0,
                        vendor: row.Vendor || '',
                        taxes: [],
                        description: 'Imported from Excel'
                    });
                    productId = product._id;
                }

                const inventoryItem = await Inventory.create({
                    owner,
                    product: productId,
                    item: row.Item,
                    category: row.Category,
                    warehouse: row.Warehouse || 'Main',
                    cost: row.Cost || 0,
                    salePrice: row.SalePrice || 0,
                    vendor: row.Vendor || '',
                    stockRemain: row.Quantity || 0,
                    date: row.Date ? new Date(row.Date) : new Date()
                });

                results.success.push(row.Item);
            } catch (error) {
                results.failed.push({ item: row.Item, error: error.message });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        return res.status(200).json(
            new ApiResponse(200, results, `Imported ${results.success.length} items successfully`)
        );
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        throw new ApiError(500, `Import failed: ${error.message}`);
    }
});

// Import Customers from Excel
export const importCustomers = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const results = {
            success: [],
            failed: []
        };

        for (const row of data) {
            try {
                await Customer.create({
                    owner,
                    name: row.Name,
                    email: row.Email || '',
                    phone: row.Phone || '',
                    city: row.City || '',
                    address: row.Address || '',
                    company: row.Company || '',
                    gstNumber: row['GST Number'] || '',
                    state: row.State || '',
                    pincode: row.Pincode || ''
                });

                results.success.push(row.Name);
            } catch (error) {
                results.failed.push({ name: row.Name, error: error.message });
            }
        }

        fs.unlinkSync(req.file.path);

        return res.status(200).json(
            new ApiResponse(200, results, `Imported ${results.success.length} customers successfully`)
        );
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        throw new ApiError(500, `Import failed: ${error.message}`);
    }
});

// Import Expenses from Excel
export const importExpenses = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const results = {
            success: [],
            failed: []
        };

        for (const row of data) {
            try {
                await Expense.create({
                    owner,
                    description: row.Description,
                    amount: row.Amount || 0,
                    category: row.Category || 'Other',
                    date: row.Date ? new Date(row.Date) : new Date()
                });

                results.success.push(row.Description);
            } catch (error) {
                results.failed.push({ description: row.Description, error: error.message });
            }
        }

        fs.unlinkSync(req.file.path);

        return res.status(200).json(
            new ApiResponse(200, results, `Imported ${results.success.length} expenses successfully`)
        );
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        throw new ApiError(500, `Import failed: ${error.message}`);
    }
});

// Export Inventory to Excel
export const exportInventory = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    const items = await Inventory.find({ owner }).lean();

    const exportData = items.map(item => ({
        Item: item.item,
        Category: item.category,
        Warehouse: item.warehouse,
        Cost: item.cost,
        SalePrice: item.salePrice,
        Vendor: item.vendor,
        Quantity: item.stockRemain,
        Date: item.date
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=inventory.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
});

// Export Sales to Excel
export const exportSales = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    const sales = await Sales.find({ owner }).lean();

    const exportData = sales.map(sale => ({
        Product: sale.productName,
        Customer: sale.customerName || 'Walk-in',
        Quantity: sale.qty,
        Price: sale.price,
        Cost: sale.cost,
        Profit: sale.profit,
        'Profit %': sale.profitPercent,
        Sale: sale.sale,
        Date: sale.date
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=sales.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
});

// Export Customers to Excel
export const exportCustomers = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    const customers = await Customer.find({ owner }).lean();

    const exportData = customers.map(customer => ({
        Name: customer.name,
        Email: customer.email,
        Phone: customer.phone,
        City: customer.city,
        Company: customer.company,
        'GST Number': customer.gstNumber,
        State: customer.state,
        Address: customer.address
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
});

// Export Expenses to Excel
export const exportExpenses = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    const expenses = await Expense.find({ owner }).lean();

    const exportData = expenses.map(expense => ({
        Description: expense.description,
        Amount: expense.amount,
        Category: expense.category,
        Date: expense.date
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
});

// Download sample templates
export const downloadTemplate = asyncHandler(async (req, res) => {
    const { type } = req.params;

    const templates = {
        inventory: [
            { Item: 'Laptop', Category: 'Electronics', Warehouse: 'WH-01', Cost: 50000, SalePrice: 65000, Vendor: 'Dell', Quantity: 10, Date: '2024-01-12' }
        ],
        customers: [
            { Name: 'John Doe', Email: 'john@example.com', Phone: '9876543210', City: 'Mumbai', Company: 'ABC Corp', 'GST Number': '27AABCU9603R1ZM', State: 'Maharashtra', Address: '123 Main St' }
        ],
        expenses: [
            { Description: 'Office Rent', Amount: 50000, Category: 'Rent', Date: '2024-01-12' }
        ]
    };

    const templateData = templates[type];
    if (!templateData) {
        throw new ApiError(400, "Invalid template type");
    }

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type.charAt(0).toUpperCase() + type.slice(1));

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=${type}_template.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
});

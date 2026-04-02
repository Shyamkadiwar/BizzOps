import puppeteer from 'puppeteer';

export const generateInvoicePDFBuffer = async (invoice, userDetails) => {
    const formattedDate = new Date(invoice.date || Date.now())
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        .toUpperCase();

    const renderItems = invoice.items.map(item => `
        <tr>
            <td style="border: 1px solid #000; padding: 10px; text-align: left; vertical-align: top;">
                <div style="font-weight: normal; font-size: 14px;">${item.itemName}</div>
            </td>
            <td style="border: 1px solid #000; padding: 10px; text-align: center; vertical-align: top;">${item.qty}</td>
            <td style="border: 1px solid #000; padding: 10px; text-align: right; vertical-align: top;">${Number(item.price).toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 10px; text-align: right; vertical-align: top;">${Number(item.total).toFixed(2)}</td>
        </tr>
    `).join('');

    const emptyRowsCount = Math.max(0, 10 - invoice.items.length);
    let emptyRows = '';
    for(let i=0; i<emptyRowsCount; i++){
        emptyRows += `
            <tr>
            <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 10px;">&nbsp;</td>
            <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 10px;">&nbsp;</td>
            <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 10px;">&nbsp;</td>
            <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 10px;">&nbsp;</td>
            </tr>
        `;
    }

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 40px;
                color: #000;
                font-size: 14px;
            }
            .header-layout {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
            }
            .company-info {
                max-width: 45%;
                font-size: 14px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                margin: 0 0 5px 0;
            }
            .invoice-title-block {
                text-align: right;
            }
            .invoice-title {
                font-size: 38px;
                font-weight: bold;
                margin: 0 0 20px 0;
                letter-spacing: 2px;
            }
            .meta-table {
                margin-left: auto;
                text-align: right;
                font-size: 13px;
            }
            .meta-table td {
                padding: 3px 0 3px 15px;
            }
            .meta-bold {
                font-weight: bold;
            }
            
            .addresses-layout {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
                font-size: 14px;
            }
            .address-block {
                width: 45%;
            }
            .address-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            table.main-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 0;
                table-layout: fixed;
            }
            .main-table th {
                border: 1px solid #000;
                background-color: #fff;
                color: #000;
                font-weight: bold;
                padding: 10px;
                font-size: 13px;
                text-align: center;
            }
            .col-desc { width: 50%; }
            .col-qty { width: 15%; }
            .col-price { width: 15%; }
            .col-total { width: 20%; }
            
            .totals-block {
                width: 35%;
                float: right;
                border: 1px solid #000;
                border-top: none;
                margin-bottom: 30px;
            }
            .totals-row {
                display: flex;
                border-bottom: 1px solid #000;
                font-size: 13px;
            }
            .totals-row:last-child {
                border-bottom: none;
                font-weight: bold;
            }
            .totals-label {
                width: 50%;
                padding: 8px;
                text-align: left;
                border-right: 1px solid #000;
            }
            .totals-value {
                width: 50%;
                padding: 8px;
                text-align: right;
            }
            .clearfix::after {
                content: "";
                clear: both;
                display: table;
            }
            
            .footer-info {
                margin-top: 30px;
            }
            .info-label {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 13px;
            }
            .info-box {
                border: 1px solid #000;
                padding: 15px;
                min-height: 80px;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <div class="header-layout">
            <div class="company-info">
                ${userDetails?.businessLogo ? `<img src="${userDetails.businessLogo}" style="max-height: 80px; margin-bottom: 15px;" />` : ''}
                <div class="company-name">${userDetails?.businessName || 'Business Name'}</div>
                ${userDetails?.address ? `<div>${userDetails.address}</div>` : ''}
                ${userDetails?.phoneNo ? `<div>Phone: ${userDetails.phoneNo}</div>` : ''}
                ${userDetails?.email ? `<div>Email: ${userDetails.email}</div>` : ''}
                ${userDetails?.website ? `<div>${userDetails.website}</div>` : ''}
                ${userDetails?.gstNumber ? `<div>GST No: ${userDetails.gstNumber}</div>` : ''}
            </div>
            <div class="invoice-title-block">
                <div class="invoice-title">INVOICE</div>
                <table class="meta-table">
                    <tr>
                        <td class="meta-bold">INVOICE #</td>
                        <td>[${invoice?.invoiceNumber || '100'}]</td>
                    </tr>
                    <tr>
                        <td class="meta-bold">DATE:</td>
                        <td>${formattedDate}</td>
                    </tr>
                    <tr>
                        <td class="meta-bold">STATUS:</td>
                        <td style="color: ${invoice?.paid ? 'green' : 'red'};">${invoice?.paid ? 'PAID' : 'UNPAID'}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="addresses-layout">
            <div class="address-block">
                <div class="address-title">TO:</div>
                <div>${invoice?.customerName || 'Walk-in Customer'}</div>
                ${invoice?.customerAddress ? `<div>${invoice.customerAddress}</div>` : ''}
                ${invoice?.customerPhone ? `<div>${invoice.customerPhone}</div>` : ''}
                ${invoice?.customerEmail ? `<div>${invoice.customerEmail}</div>` : ''}
            </div>
        </div>

        <table class="main-table">
            <thead>
                <tr>
                    <th class="col-desc">DESCRIPTION</th>
                    <th class="col-qty">QUANTITY</th>
                    <th class="col-price">UNIT PRICE</th>
                    <th class="col-total">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${renderItems}
                ${emptyRows}
                <tr>
                    <td style="border-top: 1px solid #000;"></td>
                    <td style="border-top: 1px solid #000;"></td>
                    <td style="border-top: 1px solid #000;"></td>
                    <td style="border-top: 1px solid #000; border-left: 1px solid #000; border-right: 1px solid #000;"></td>
                </tr>
            </tbody>
        </table>

        <div class="clearfix">
            <div class="totals-block">
                <div class="totals-row">
                    <div class="totals-label">SUBTOTAL</div>
                    <div class="totals-value">${Number(invoice?.subTotal || 0).toFixed(2)}</div>
                </div>
                <div class="totals-row">
                    <div class="totals-label">SALES TAX</div>
                    <div class="totals-value">${Number((invoice?.grandTotal || 0) - (invoice?.subTotal || 0)).toFixed(2)}</div>
                </div>
                <div class="totals-row" style="font-weight: bold;">
                    <div class="totals-label">TOTAL DUE</div>
                    <div class="totals-value">₹${Number(invoice?.grandTotal || 0).toFixed(2)}</div>
                </div>
            </div>
        </div>

        <div class="footer-info">
            <div class="info-label">Additional Information/Comments:</div>
            <div class="info-box">
                Thank you for your business! Payment is due within 30 days unless otherwise agreed. 
                <br><br>
                <i>This is an auto-generated invoice securely provided by BizzOps Platform.</i>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const browser = await puppeteer.launch({
            headless: true, // safe flag
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const page = await browser.newPage();
        
        await page.setContent(htmlTemplate, { waitUntil: 'load', timeout: 15000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
        });

        await browser.close();

        return pdfBuffer;
    } catch (err) {
        console.error('[PDFGenerator] Failed completely:', err.message);
        return null; // Always return null on failure to prevent crashing the email service
    }
};

/**
 * Universal Quote/Invoice Template Generator
 * 
 * This module provides a consistent HTML template for both quotes and invoices
 * across all parts of the Stellar Tree Management system.
 */

/**
 * Generate HTML for quote or invoice documents
 * @param {Object} data - Document data
 * @param {string} data.documentType - 'QUOTE' or 'INVOICE'
 * @param {string} data.documentNumber - Document number (e.g., 'QT-123', 'INV-456')
 * @param {string} data.documentDate - Formatted date string
 * @param {string} data.clientName - Client name
 * @param {string} data.clientPhone - Client phone number
 * @param {string} data.clientEmail - Client email
 * @param {string} data.clientAddress - Client address
 * @param {Array} data.serviceItems - Array of service items
 * @param {number} data.subtotal - Subtotal amount
 * @param {boolean} data.taxEnabled - Whether tax is enabled
 * @param {number} data.taxAmount - Tax amount (calculated)
 * @param {number} data.totalAmount - Total amount
 * @returns {string} Complete HTML document
 */
function generateDocumentHTML(data) {
    const {
        documentType,
        documentNumber,
        documentDate,
        clientName,
        clientPhone,
        clientEmail,
        clientAddress,
        serviceItems = [],
        subtotal = 0,
        taxEnabled = false,
        taxAmount = 0,
        totalAmount = 0
    } = data;

    // Format currency values
    const formatCurrency = (amount) => `$ ${amount.toFixed(2)}`;

    // Generate service items HTML
    const serviceItemsHTML = serviceItems.map((item, index) => `
        <tr>
            <td>${item.description || 'Service'}</td>
            <td>${formatCurrency(item.price || 0)}</td>
            <td>${item.quantity || 1}</td>
            <td>${formatCurrency(item.total || 0)}</td>
        </tr>
    `).join('');

    // Determine payment terms based on document type
    const paymentTerms = documentType === 'INVOICE' 
        ? 'Payment is due upon receipt of this invoice. We accept check and e-transfer. Please include the invoice number with your payment.'
        : 'All estimates are valid for 60 days after the estimate has been delivered. Payment is due upon completion of work unless otherwise agreed upon. We accept check and e-transfer.';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stellar Tree Management - ${documentType}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #fafafa;
            padding: 40px 20px;
        }

        .container {
            max-width: 850px;
            margin: 0 auto;
            background: white;
            padding: 60px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 10px;
            flex-wrap: nowrap;
        }

        .header-left {
            display: flex;
            flex-direction: column;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .logo-placeholder {
            width: 55px;
            height: 55px;
            background: #7cb342;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 22px;
            font-weight: bold;
            flex-shrink: 0;
        }

        .company-logo {
            width: 55px;
            height: 55px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        }

        .company-name {
            font-size: 18px;
            font-weight: 700;
            color: #2c3e50;
        }

        .company-contact {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
        }

        .document-title-section {
            text-align: right;
        }

        .document-title {
            font-size: 42px;
            font-weight: 700;
            color: #2c3e50;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }

        .document-meta {
            font-size: 13px;
            color: #666;
        }

        .client-section {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            margin-bottom: 25px;
        }

        .client-block {
            flex: 1;
            min-width: 0;
        }

        .block-title {
            font-size: 12px;
            font-weight: 700;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }

        .client-info {
            font-size: 14px;
            color: #666;
            line-height: 1.8;
        }

        .client-info strong {
            color: #2c3e50;
        }

        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .services-table thead {
            background: #2c3e50;
        }

        .services-table th {
            padding: 12px 20px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .services-table th:nth-child(2) {
            text-align: right;
        }

        .services-table th:nth-child(3) {
            text-align: center;
            width: 80px;
        }

        .services-table th:nth-child(4) {
            text-align: right;
            width: 120px;
        }

        .services-table tbody td {
            padding: 12px 20px;
            border-bottom: 1px solid #e8e8e8;
            font-size: 14px;
            color: #666;
        }

        .services-table tbody td:first-child {
            color: #2c3e50;
            font-weight: 500;
        }

        .services-table tbody td:nth-child(2),
        .services-table tbody td:nth-child(4) {
            text-align: right;
        }

        .services-table tbody td:nth-child(3) {
            text-align: center;
        }

        .services-table tbody tr:last-child td {
            border-bottom: none;
        }

        .totals-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 40px;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }

        .payment-info {
            flex: 1;
            max-width: 350px;
            min-width: 0;
        }

        .payment-title {
            font-size: 12px;
            font-weight: 700;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }

        .payment-details {
            font-size: 13px;
            color: #666;
            line-height: 1.8;
        }

        .payment-details div {
            margin-bottom: 5px;
        }

        .payment-label {
            display: inline-block;
            min-width: 80px;
            color: #999;
        }

        .totals-box {
            min-width: 280px;
            flex-shrink: 0;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 14px;
        }

        .total-row:not(:last-child) {
            border-bottom: 1px solid #e8e8e8;
        }

        .total-label {
            color: #666;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        .total-value {
            color: #2c3e50;
            font-weight: 600;
        }

        .total-row.final {
            background: #2c3e50;
            padding: 18px 20px;
            margin-top: 10px;
        }

        .total-row.final .total-label,
        .total-row.final .total-value {
            color: white;
            font-size: 16px;
        }

        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-message {
            font-size: 16px;
            font-style: italic;
            color: #666;
        }

        .signature {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
        }

        .terms-section {
            margin-top: 20px;
            padding: 8px 15px;
            background: #f8f9fa;
            border-left: 3px solid #7cb342;
        }

        .terms-title {
            font-size: 9px;
            font-weight: 700;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }

        .terms-content {
            font-size: 9px;
            color: #666;
            line-height: 1.4;
        }

        @media print {
            body {
                padding: 0;
                background: white;
                margin: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            .container {
                max-width: 100%;
                padding: 20px;
                margin: 0 auto;
                box-shadow: none;
            }

            /* Prevent flex items from breaking across pages */
            .header,
            .client-section,
            .totals-section {
                page-break-inside: avoid;
            }

            /* Ensure proper spacing for print */
            .totals-section {
                gap: 45px;
            }

            .client-section {
                gap: 30px;
            }

            /* Fix print popup layout issues */
            .header {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                justify-content: space-between !important;
            }

            .client-section,
            .totals-section {
                display: flex !important;
                flex-direction: row !important;
            }

            .client-block,
            .payment-info,
            .totals-box {
                flex: 1 !important;
                min-width: 0 !important;
            }

            /* Force colors to print */
            .services-table thead,
            .total-row.final {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
        }

        @media (max-width: 768px) {
            .container {
                padding: 30px;
            }
            
            .header,
            .client-section,
            .totals-section {
                flex-direction: column;
            }

            .document-title-section {
                text-align: left;
                margin-top: 30px;
            }

            .client-block {
                margin-bottom: 30px;
            }

            .totals-box {
                margin-top: 30px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <div class="logo-section">
                    <img src="images/logo.png" alt="Stellar Tree Management" class="company-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="logo-placeholder" style="display: none;">ST</div>
                    <div class="company-name">Stellar Tree Management</div>
                </div>
                <div class="company-contact">
                    1932 9a Ave NE<br>
                    Calgary, Alberta<br>
                    (250) 551-1021<br>
                    stellartmanagement@outlook.com
                </div>
            </div>
            <div class="document-title-section">
                <div class="document-title">${documentType}</div>
                <div class="document-meta">
                    ${documentDate}
                </div>
            </div>
        </div>

        <div class="client-section">
            <div class="client-block">
                <div class="block-title">Quote To</div>
                <div class="client-info">
                    <strong>${clientName || 'N/A'}</strong><br>
                    ${clientPhone || 'N/A'}<br>
                    ${clientEmail || 'N/A'}<br>
                    ${clientAddress || 'N/A'}
                </div>
            </div>
            <div class="client-block">
                <div class="block-title">Bill To</div>
                <div class="client-info">
                    <strong>${clientName || 'N/A'}</strong><br>
                    ${clientAddress || 'N/A'}
                </div>
            </div>
        </div>

        <table class="services-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${serviceItemsHTML}
            </tbody>
        </table>

        <div class="totals-section">
            <div class="payment-info">
                <div class="payment-title">Payment Method</div>
                <div class="payment-details">
                    <div><span class="payment-label">Method:</span> E-Transfer / Check</div>
                    <div><span class="payment-label">Email:</span> stellartmanagement@outlook.com</div>
                </div>
            </div>
            <div class="totals-box">
                <div class="total-row">
                    <span class="total-label">Sub-Total</span>
                    <span class="total-value">${formatCurrency(subtotal)}</span>
                </div>
                ${taxEnabled && taxAmount > 0 ? `
                <div class="total-row">
                    <span class="total-label">Tax (5%)</span>
                    <span class="total-value">${formatCurrency(taxAmount)}</span>
                </div>
                ` : ''}
                <div class="total-row final">
                    <span class="total-label">Total</span>
                    <span class="total-value">${formatCurrency(totalAmount)}</span>
                </div>
            </div>
        </div>

        <div class="terms-section">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-content">
                ${paymentTerms}
            </div>
        </div>

        <div class="footer">
            <div class="footer-message">Thank You For Your Business</div>
            <div class="signature">Stellar Tree Management</div>
        </div>
    </div>
</body>
</html>`;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateDocumentHTML };
}

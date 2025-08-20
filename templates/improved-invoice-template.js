// Improved Invoice Email Template
// This template is sent when admin sends an invoice to customer
// ✅ Email-client compatible CSS (no flexbox, SVG, or modern CSS)

function generateImprovedInvoiceTemplate(bookingId, service, totalAmount, workDescription, name, address, notes, serviceItems = []) {
    const subject = `Invoice for Tree Services - ${bookingId}`;
    
    // Ensure all parameters are properly converted to strings and handle undefined values
    const safeName = name ? String(name) : 'Valued Customer';
    const safeService = service ? String(service) : 'Tree Service';
    const safeWorkDescription = workDescription ? String(workDescription) : 'Tree maintenance and care';
    const safeAddress = address ? String(address) : '';
    const safeNotes = notes ? String(notes) : '';
    const safeTotalAmount = totalAmount ? String(totalAmount) : '0.00';
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - ${bookingId}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
                
                body { 
                    margin: 0; 
                    padding: 0; 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    line-height: 1.6; 
                    color: #2a2a2a; 
                    background-color: #f8f9fa; 
                }
                
                .email-container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: #ffffff; 
                    border-radius: 16px; 
                    overflow: hidden; 
                    box-shadow: 0 12px 40px rgba(42, 42, 42, 0.12);
                }
                
                .header { 
                    background: linear-gradient(135deg, #2a2a2a 0%, #404040 100%); 
                    color: white; 
                    padding: 50px 30px; 
                    text-align: center; 
                    position: relative;
                }
                
                .header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 6px;
                    background: linear-gradient(90deg, #e83e8c 0%, #fd7e14 100%);
                }
                
                .logo-section {
                    margin-bottom: 25px;
                    text-align: center;
                }
                
                .logo {
                    width: 80px;
                    height: 80px;
                    background: #ffffff;
                    border-radius: 50%;
                    display: inline-block;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                    border: 4px solid #e83e8c;
                    text-align: center;
                    line-height: 80px;
                    font-size: 40px;
                }
                
                .company-name { 
                    font-family: 'Poppins', sans-serif; 
                    font-size: 32px; 
                    font-weight: 700; 
                    margin: 0; 
                    color: white;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                
                .invoice-badge {
                    background: linear-gradient(135deg, #e83e8c 0%, #fd7e14 100%);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 15px;
                    font-weight: 600;
                    margin-top: 20px;
                    display: inline-block;
                    box-shadow: 0 4px 12px rgba(232, 62, 140, 0.3);
                }
                
                .content { 
                    padding: 50px 30px; 
                    background: #ffffff; 
                }
                
                .greeting {
                    font-size: 24px;
                    font-weight: 600;
                    color: #2a2a2a;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .message {
                    font-size: 16px;
                    color: #5a5a5a;
                    margin-bottom: 30px;
                    text-align: center;
                    line-height: 1.7;
                }
                
                .invoice-details {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 25px;
                    margin: 30px 0;
                    border-left: 4px solid #e83e8c;
                }
                
                .invoice-details h3 {
                    margin: 0 0 20px 0;
                    color: #2a2a2a;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .detail-row {
                    display: table;
                    width: 100%;
                    margin-bottom: 12px;
                }
                
                .detail-row:last-child {
                    margin-bottom: 0;
                }
                
                .detail-label {
                    display: table-cell;
                    width: 120px;
                    font-weight: 600;
                    color: #5a5a5a;
                    font-size: 14px;
                }
                
                .detail-value {
                    display: table-cell;
                    color: #2a2a2a;
                    font-weight: 500;
                    font-size: 14px;
                }
                
                .total-amount {
                    background: linear-gradient(135deg, #e83e8c 0%, #fd7e14 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    text-align: center;
                    margin: 30px 0;
                }
                
                .total-amount h3 {
                    margin: 0 0 10px 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .total-amount .amount {
                    font-size: 32px;
                    font-weight: 700;
                    margin: 0;
                }
                
                .payment-section {
                    text-align: center;
                    margin: 40px 0;
                    padding: 30px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 16px;
                    border: 2px solid #e83e8c;
                }
                
                .payment-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #2a2a2a;
                    margin-bottom: 15px;
                }
                
                .payment-description {
                    font-size: 16px;
                    color: #5a5a5a;
                    margin-bottom: 25px;
                    line-height: 1.6;
                }
                
                .payment-methods {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }
                
                .payment-method {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e83e8c;
                    text-align: center;
                }
                
                .payment-method h4 {
                    margin: 0 0 10px 0;
                    color: #e83e8c;
                    font-size: 16px;
                }
                
                .payment-method p {
                    margin: 0;
                    font-size: 14px;
                    color: #5a5a5a;
                }
                
                .important-note {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 30px 0;
                    text-align: center;
                }
                
                .important-note h4 {
                    margin: 0 0 10px 0;
                    color: #856404;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .important-note p {
                    margin: 0;
                    color: #856404;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .footer {
                    background: #2a2a2a;
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                
                .footer-content {
                    max-width: 400px;
                    margin: 0 auto;
                }
                
                .footer-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    color: #e83e8c;
                }
                
                .footer-text {
                    font-size: 14px;
                    color: #b0b0b0;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                
                .contact-info {
                    font-size: 14px;
                    color: #b0b0b0;
                    line-height: 1.8;
                }
                
                .contact-info strong {
                    color: #e83e8c;
                }
                
                @media only screen and (max-width: 600px) {
                    .email-container {
                        margin: 10px;
                        border-radius: 12px;
                    }
                    
                    .header {
                        padding: 30px 20px;
                    }
                    
                    .content {
                        padding: 30px 20px;
                    }
                    
                    .company-name {
                        font-size: 24px;
                    }
                    
                    .greeting {
                        font-size: 20px;
                    }
                    
                    .payment-section {
                        padding: 20px;
                        margin: 20px 0;
                    }
                    
                    .detail-label {
                        width: 100px;
                        font-size: 13px;
                    }
                    
                    .detail-value {
                        font-size: 13px;
                    }
                }
                
                .service-items {
                    margin: 30px 0;
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 25px;
                    border-left: 4px solid #e83e8c;
                }
                
                .service-items h3 {
                    margin: 0 0 20px 0;
                    color: #2a2a2a;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .table-header {
                    display: table;
                    width: 100%;
                    background: #e83e8c;
                    color: white;
                    font-weight: 600;
                    border-radius: 8px 8px 0 0;
                    overflow: hidden;
                }
                
                .header-item {
                    display: table-cell;
                    padding: 12px 8px;
                    text-align: center;
                    font-size: 14px;
                }
                
                .header-item:first-child {
                    text-align: left;
                    padding-left: 16px;
                }
                
                .header-item:last-child {
                    text-align: right;
                    padding-right: 16px;
                }
                
                .table-row {
                    display: table;
                    width: 100%;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .table-row:last-child {
                    border-bottom: none;
                }
                
                .item-description {
                    display: table-cell;
                    padding: 12px 8px;
                    color: #2a2a2a;
                    font-weight: 500;
                    font-size: 14px;
                    width: 40%;
                }
                
                .item-quantity {
                    display: table-cell;
                    padding: 12px 8px;
                    color: #5a5a5a;
                    text-align: center;
                    font-size: 14px;
                    width: 15%;
                }
                
                .item-price {
                    display: table-cell;
                    padding: 12px 8px;
                    color: #5a5a5a;
                    text-align: center;
                    font-size: 14px;
                    width: 20%;
                }
                
                .item-total {
                    display: table-cell;
                    padding: 12px 8px;
                    color: #2a2a2a;
                    font-weight: 600;
                    text-align: right;
                    font-size: 14px;
                    width: 25%;
                }
                
                .booking-status-link {
                    text-align: center;
                    margin: 30px 0;
                    padding: 25px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 16px;
                    border: 2px solid #28a745;
                }
                
                .booking-status-link h4 {
                    margin: 0 0 15px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #2a2a2a;
                }
                
                .booking-status-link p {
                    margin: 0 0 20px 0;
                    color: #5a5a5a;
                    line-height: 1.6;
                }
                
                .status-link {
                    display: inline-block;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                }
                
                .status-link:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo-section">
                        <div class="logo">
                            <img src="https://www.stellartreemanagement.ca/images/logo.png" alt="Stellar Tree Management Logo" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h1 class="company-name">Stellar Tree Management</h1>
                    </div>
                    <div class="invoice-badge">Invoice for Services Rendered</div>
                </div>
                
                <div class="content">
                    <h2 class="greeting">Hello ${safeName}! 📄</h2>
                    
                    <p class="message">
                        Thank you for choosing Stellar Tree Management! Your tree services have been completed and 
                        this invoice has been rendered for the work performed. Please review the details below.
                    </p>
                    
                    <div class="invoice-details">
                        <h3>📋 Invoice Details</h3>
                        <div class="detail-row">
                            <div class="detail-label">Invoice ID:</div>
                            <div class="detail-value">${bookingId}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Service:</div>
                            <div class="detail-value">${safeService}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Work Description:</div>
                            <div class="detail-value">${safeWorkDescription}</div>
                        </div>
                        ${safeAddress ? `
                        <div class="detail-row">
                            <div class="detail-label">Service Address:</div>
                            <div class="detail-value">${safeAddress}</div>
                        </div>
                        ` : ''}
                        ${safeNotes ? `
                        <div class="detail-row">
                            <div class="detail-label">Additional Notes:</div>
                            <div class="detail-value">${safeNotes}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${serviceItems && serviceItems.length > 0 ? `
                    <div class="service-items">
                        <h3>📋 Service Items</h3>
                        <div class="items-table">
                            <div class="table-header">
                                <div class="header-item">Description</div>
                                <div class="header-item">Quantity</div>
                                <div class="header-item">Price</div>
                                <div class="header-item">Total</div>
                            </div>
                            ${serviceItems.map(item => `
                                <div class="table-row">
                                    <div class="item-description">${item.description || 'Service Item'}</div>
                                    <div class="item-quantity">${item.quantity || '1'}</div>
                                    <div class="item-price">$${parseFloat(item.price || 0).toFixed(2)}</div>
                                    <div class="item-total">$${parseFloat(item.total || 0).toFixed(2)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="total-amount">
                        <h3>Total Amount Due</h3>
                        <div class="amount">$${safeTotalAmount}</div>
                    </div>
                    
                    <div class="payment-section">
                        <h3 class="payment-title">💳 Payment Options</h3>
                        <p class="payment-description">
                            We accept the following payment methods:
                        </p>
                        <div class="payment-methods">
                            <div class="payment-method">
                                <h4>💳 Credit Card</h4>
                                <p>Pay securely online</p>
                            </div>
                            <div class="payment-method">
                                <h4>🏦 Bank Transfer</h4>
                                <p>Direct bank deposit</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="important-note">
                        <h4>⚠️ Payment Terms</h4>
                        <p>
                            Payment is due within 30 days of invoice date. Please contact us if you have any 
                            questions about payment arrangements.
                        </p>
                    </div>
                    
                    <div class="booking-status-link">
                        <h4>✅ Services Completed - Invoice Rendered</h4>
                        <p>
                            Your tree services have been completed and this invoice has been rendered. 
                            You can track your booking history and view past services at any time:
                        </p>
                        <a href="https://stellartreemanagement.ca/booking-status.html?id=${bookingId}" class="status-link">
                            View Booking Status & History
                        </a>
                    </div>
                    
                    <p class="message">
                        Thank you for your business! If you have any questions about this invoice or need 
                        to make payment arrangements, please don't hesitate to contact us.
                    </p>
                </div>
                
                <div class="footer">
                    <div class="footer-content">
                        <h3 class="footer-title">Need Help?</h3>
                        <p class="footer-text">
                            Our team is ready to assist you with any questions about your invoice or payment.
                        </p>
                        <div class="contact-info">
                            <strong>📧 Email:</strong> stellartmanagement@outlook.com<br>
                            <strong>🌐 Website:</strong> www.stellartreemanagement.ca<br>
                            <strong>📱 Phone:</strong> Available on request
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const textContent = `
Invoice for Tree Services - ${bookingId}

Hello ${safeName}! 📄

Thank you for choosing Stellar Tree Management! Your tree services have been completed and 
this invoice has been rendered for the work performed. Please review the details below.

📋 Invoice Details:
- Invoice ID: ${bookingId}
- Service: ${safeService}
- Work Description: ${safeWorkDescription}
${safeAddress ? `- Service Address: ${safeAddress}` : ''}
${safeNotes ? `- Additional Notes: ${safeNotes}` : ''}

${serviceItems && serviceItems.length > 0 ? `
📋 Service Items:
${serviceItems.map(item => `- ${item.description || 'Service Item'}: ${item.quantity || '1'} x $${parseFloat(item.price || 0).toFixed(2)} = $${parseFloat(item.total || 0).toFixed(2)}`).join('\n')}
` : ''}

Total Amount Due: $${safeTotalAmount}

💳 Payment Options:
We accept the following payment methods:
- Credit Card: Pay securely online
- Bank Transfer: Direct bank deposit

⚠️ Payment Terms
Payment is due within 30 days of invoice date. Please contact us if you have any questions about payment arrangements.

✅ Services Completed - Invoice Rendered
Your tree services have been completed and this invoice has been rendered. 
You can track your booking history and view past services at any time:
https://stellartreemanagement.ca/booking-status.html?id=${bookingId}

Thank you for your business! If you have any questions about this invoice or need to make payment arrangements, please don't hesitate to contact us.

Need Help?
Our team is ready to assist you with any questions about your invoice or payment.

📧 Email: stellartmanagement@outlook.com
🌐 Website: www.stellartreemanagement.ca
📱 Phone: Available on request

Best regards,
The Stellar Tree Management Team
    `;
    
    return {
        subject: subject,
        html: htmlContent,
        text: textContent
    };
}

module.exports = { generateImprovedInvoiceTemplate };

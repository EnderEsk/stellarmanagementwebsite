const { Resend } = require('resend');
const { generateImprovedQuoteEmailTemplate } = require('./templates/improved-quote-email-template');
const { generateImprovedBookingConfirmationTemplate } = require('./templates/improved-booking-confirmation-template');
const { generateImprovedBookingRequestTemplate } = require('./templates/improved-booking-request-template');
const { generateImprovedQuoteConfirmationTemplate } = require('./templates/improved-quote-confirmation-template');
const { generateImprovedQuoteSentTemplate } = require('./templates/improved-quote-sent-template');
const { generateImprovedInvoiceTemplate } = require('./templates/improved-invoice-template');
const { generateImprovedQuoteAcceptanceTemplate } = require('./templates/improved-quote-acceptance-template');

class EmailService {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY || 're_N5JbfnWV_8U98DXPSMLXQHmkAP4PAh897');
        
        // Easy to switch between test domain and custom domain
        this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        this.fromName = process.env.RESEND_FROM_NAME || 'Stellar Tree Management';
    }

    async sendEmail(to, subject, htmlContent, textContent = null, attachments = []) {
        try {
            const emailData = {
                from: `${this.fromName} <${this.fromEmail}>`,
                to: [to],
                subject: subject,
                html: htmlContent
            };
            
            if (textContent) {
                emailData.text = textContent;
            }
            
            const response = await this.resend.emails.send(emailData);
            console.log('📧 Email sent successfully via Resend:', response);
            return { success: true, messageId: response.data?.id };
        } catch (error) {
            console.error('❌ Error sending email via Resend:', error);
            return { success: false, error: error.message };
        }
    }

    async sendQuoteEmail(email, quoteId, clientName, quoteDate, totalAmount, serviceItems, bookingId = null, serviceItemPhotos = null) {
        const subject = `Your Quote from Stellar Tree Management - ${quoteId}`;
        
        // Format service items for email with photos
        const serviceItemsList = serviceItems.map((item, index) => {
            let photosHtml = '';
            if (serviceItemPhotos && serviceItemPhotos[index + 1] && serviceItemPhotos[index + 1].length > 0) {
                const photos = serviceItemPhotos[index + 1];
                photosHtml = `
                    <div style="margin-top: 10px;">
                        <div style="font-size: 12px; color: #fd7e14; font-weight: 600; margin-bottom: 5px;">📸 Photos:</div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${photos.map(photo => `
                                <img src="${photo}" alt="Service photo" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 2px solid #e5e7eb;">
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            return `<tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #2a2a2a;">
                    <div>${item.description}</div>
                    ${photosHtml}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #5a5a5a;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #5a5a5a;">$${item.price.toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #2a2a2a;">$${item.total.toFixed(2)}</td>
            </tr>`;
        }).join('');
        
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Quote - ${quoteId}</title>
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
                        background: linear-gradient(90deg, #fd7e14 0%, #ff8c42 100%);
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
                        border: 4px solid #fd7e14;
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
                    
                    .quote-badge {
                        background: linear-gradient(135deg, #fd7e14 0%, #ff8c42 100%);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 25px;
                        font-size: 15px;
                        font-weight: 600;
                        margin-top: 20px;
                        display: inline-block;
                        box-shadow: 0 4px 12px rgba(253, 126, 20, 0.3);
                    }
                    
                    .content { 
                        padding: 50px 30px; 
                        background: #ffffff; 
                    }
                    
                    .greeting {
                        font-size: 20px;
                        color: #2a2a2a;
                        margin-bottom: 25px;
                        font-weight: 600;
                    }
                    
                    .intro-text {
                        color: #5a5a5a;
                        margin-bottom: 35px;
                        font-size: 16px;
                        line-height: 1.7;
                    }
                    
                    .success-message {
                        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                        border: 1px solid #28a745;
                        padding: 25px;
                        border-radius: 16px;
                        text-align: center;
                        margin: 30px 0;
                        box-shadow: 0 4px 16px rgba(40, 167, 69, 0.15);
                    }
                    
                    .success-icon {
                        font-size: 32px;
                        margin-bottom: 15px;
                    }
                    
                    .success-title {
                        font-size: 20px;
                        font-weight: 700;
                        color: #155724;
                        margin-bottom: 10px;
                    }
                    
                    .success-text {
                        color: #155724;
                        margin: 0;
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    
                    .quote-details { 
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                        padding: 30px; 
                        margin: 35px 0; 
                        border-radius: 16px; 
                        border-left: 6px solid #fd7e14;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                    }
                    
                    .summary-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #fd7e14;
                        margin-bottom: 20px;
                        text-align: center;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    
                    .quote-meta {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 25px;
                        flex-wrap: wrap;
                        gap: 15px;
                    }
                    
                    .quote-info {
                        background: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        flex: 1;
                        min-width: 200px;
                    }
                    
                    .quote-info-label {
                        font-size: 12px;
                        color: #fd7e14;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 5px;
                    }
                    
                    .quote-info-value {
                        font-size: 16px;
                        color: #2a2a2a;
                        font-weight: 600;
                    }
                    
                    .services-table {
                        width: 100%;
                        border-collapse: collapse;
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        border: 1px solid #e5e7eb;
                        margin-top: 25px;
                    }
                    
                    .services-table th {
                        background: #2a2a2a;
                        color: white;
                        padding: 15px 12px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .services-table th:last-child,
                    .services-table td:last-child {
                        text-align: right;
                    }
                    
                    .total-section { 
                        background: linear-gradient(135deg, #fd7e14 0%, #ff8c42 100%); 
                        color: white; 
                        padding: 25px; 
                        text-align: center; 
                        font-size: 20px; 
                        font-weight: 700; 
                        margin: 30px 0;
                        border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(253, 126, 20, 0.3);
                    }
                    
                    .cta-section {
                        background: #f8f9fa;
                        padding: 25px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .cta-button {
                        background: #fd7e14;
                        color: white;
                        padding: 15px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        margin-top: 15px;
                        transition: all 0.3s ease;
                    }
                    
                    .cta-button:hover {
                        background: #ff8c42;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(253, 126, 20, 0.4);
                    }
                    
                    .booking-status-link {
                        background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                        color: white;
                        padding: 15px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        margin-top: 15px;
                        margin-left: 15px;
                        transition: all 0.3s ease;
                    }
                    
                    .booking-status-link:hover {
                        background: #138496;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(23, 162, 184, 0.4);
                    }
                    
                    .footer { 
                        background: linear-gradient(135deg, #2a2a2a 0%, #404040 100%); 
                        color: white; 
                        padding: 40px 30px; 
                        text-align: center; 
                    }
                    
                    .footer-content {
                        margin-bottom: 25px;
                    }
                    
                    .contact-info {
                        margin-bottom: 25px;
                    }
                    
                    .contact-item {
                        margin-bottom: 20px;
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 15px;
                        font-weight: 500;
                    }
                    
                    .contact-item:last-child {
                        margin-bottom: 0;
                    }
                    
                    .contact-icon {
                        display: inline-block;
                        width: 20px;
                        margin-right: 12px;
                        font-size: 18px;
                    }
                    
                    .contact-link {
                        color: rgba(255, 255, 255, 0.9);
                        text-decoration: none;
                        transition: color 0.2s ease;
                    }
                    
                    .contact-link:hover {
                        color: #fd7e14;
                    }
                    
                    .footer-note {
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 13px;
                        border-top: 1px solid rgba(255, 255, 255, 0.15);
                        padding-top: 25px;
                        line-height: 1.5;
                    }
                    
                    @media (max-width: 600px) {
                        .email-container { margin: 0 15px; }
                        .content { padding: 30px 20px; }
                        .header { padding: 40px 20px; }
                        .quote-meta { flex-direction: column; }
                        .cta-section .cta-button,
                        .cta-section .booking-status-link {
                            display: block;
                            margin: 10px 0;
                            margin-left: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-section">
                            <div class="logo">🌲</div>
                            <h1 class="company-name">Stellar Tree Management</h1>
                            <div class="quote-badge">Quote Ready</div>
                        </div>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">Hello ${clientName},</div>
                        
                        <div class="intro-text">
                            Thank you for choosing Stellar Tree Management! We're excited to work with you and have prepared a detailed quote for your tree care needs.
                        </div>
                        
                        <div class="success-message">
                            <div class="success-icon">📋</div>
                            <div class="success-title">Your Quote is Ready!</div>
                            <p class="success-text">Please review the details below and let us know if you'd like to proceed with scheduling.</p>
                        </div>
                        
                        <div class="quote-details">
                            <div class="summary-title">Quote Details</div>
                            <div class="quote-meta">
                                <div class="quote-info">
                                    <div class="quote-info-label">Quote ID</div>
                                    <div class="quote-info-value">${quoteId}</div>
                                </div>
                                <div class="quote-info">
                                    <div class="quote-info-label">Date Prepared</div>
                                    <div class="quote-info-value">${quoteDate}</div>
                                </div>
                            </div>
                            
                            <table class="services-table">
                                <thead>
                                    <tr>
                                        <th>Service Description</th>
                                        <th style="text-align: center;">Qty</th>
                                        <th style="text-align: right;">Price</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                ${serviceItemsList}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="total-section">
                            Total Quote Amount: $${totalAmount.toFixed(2)}
                        </div>
                        
                        <div class="cta-section">
                            <p style="margin: 0 0 10px 0; color: #2a2a2a; font-weight: 600;">Ready to proceed?</p>
                            <p style="margin: 0 0 15px 0; color: #5a5a5a; font-size: 14px;">Contact us to schedule your service or if you have any questions about this quote.</p>

                            ${bookingId ? `<a href="https://www.stellartreemanagement.ca/booking-status.html?id=${bookingId}" class="booking-status-link">View Booking Status</a>` : ''}
                        </div>
                        
                        <p style="color: #5a5a5a; margin-bottom: 0;">This quote is valid for 30 days. We're here to answer any questions you may have about our services.</p>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-content">
                            <div class="contact-info">
                                <div class="contact-item">
                                    <span class="contact-icon">📧</span>
                                    <a href="mailto:stellartmanagement@outlook.com" class="contact-link">stellartmanagement@outlook.com</a>
                                </div>
                                <div class="contact-item">
                                    <span class="contact-icon">🌐</span>
                                    <a href="https://www.stellartreemanagement.ca" class="contact-link">www.stellartreemanagement.ca</a>
                                </div>
                                <div class="contact-item">
                                    <span class="contact-icon">📞</span>
                                    <a href="tel:+12505511021" class="contact-link">(250) 551-1021</a>
                                </div>
                            </div>
                        </div>
                        <div class="footer-note">
                            © 2024 Stellar Tree Management. Professional tree care services in Calgary, Alberta.<br>
                            Serving Calgary and surrounding areas with quality tree care solutions.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const textContent = `
            Dear ${clientName},
            
            Thank you for choosing Stellar Tree Management! We're excited to work with you and have prepared a detailed quote for your tree care needs.
            
            📋 Your Quote is Ready!
            Please review the details below and let us know if you'd like to proceed with scheduling.
            
            Quote Details:
            - Quote ID: ${quoteId}
            - Date Prepared: ${quoteDate}
            
            Service Items:
            ${serviceItems.map(item => 
                `- ${item.description}: ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`
            ).join('\n')}
            
            Total Quote Amount: $${totalAmount.toFixed(2)}
            
            Ready to proceed? Contact us to schedule your service or if you have any questions about this quote.
            Email: stellartmanagement@outlook.com
            
            ${bookingId ? `View your booking status: https://www.stellartreemanagement.ca/booking-status.html?booking=${bookingId}` : ''}
            
            This quote is valid for 30 days. We're here to answer any questions you may have about our services.
            
            Best regards,
            Stellar Tree Management Team
            
            Contact Information:
            Email: stellartmanagement@outlook.com
            Website: www.stellartreemanagement.ca
            Phone: (250) 551-1021
            
            © 2024 Stellar Tree Management. Professional tree care services in Calgary, Alberta.
        `;
        
        return await this.sendEmail(email, subject, htmlContent, textContent);
    }

    async sendInvoiceEmail(email, invoiceId, clientName, invoiceDate, totalAmount, serviceItems, serviceItemPhotos = null) {
        const subject = `Invoice from Stellar Tree Management - ${invoiceId}`;
        
        // Format service items for email with photos
        const serviceItemsList = serviceItems.map((item, index) => {
            let photosHtml = '';
            if (serviceItemPhotos && serviceItemPhotos[index + 1] && serviceItemPhotos[index + 1].length > 0) {
                const photos = serviceItemPhotos[index + 1];
                photosHtml = `
                    <div style="margin-top: 10px;">
                        <div style="font-size: 12px; color: #dc3545; font-weight: 600; margin-bottom: 5px;">📸 Photos:</div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${photos.map(photo => `
                                <img src="${photo}" alt="Service photo" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 2px solid #e5e7eb;">
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            return `<tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #2a2a2a;">
                    <div>${item.description}</div>
                    ${photosHtml}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #5a5a5a;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #5a5a5a;">$${item.price.toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #2a2a2a;">$${item.total.toFixed(2)}</td>
            </tr>`;
        }).join('');
        
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice - ${invoiceId}</title>
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
                        border-radius: 12px; 
                        overflow: hidden; 
                        box-shadow: 0 8px 32px rgba(42, 42, 42, 0.08);
                    }
                    
                    .header { 
                        background: linear-gradient(135deg, #2a2a2a 0%, #404040 100%); 
                        color: white; 
                        padding: 40px 30px; 
                        text-align: center; 
                        position: relative;
                    }
                    
                    .header::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        height: 4px;
                        background: #fd7e14;
                    }
                    
                    .logo-section {
                        margin-bottom: 20px;
                    }
                    
                    .logo {
                        width: 60px;
                        height: 60px;
                        background: #fd7e14;
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        color: white;
                        margin-bottom: 15px;
                    }
                    
                    .company-name { 
                        font-family: 'Poppins', sans-serif; 
                        font-size: 28px; 
                        font-weight: 700; 
                        margin: 0; 
                        color: white;
                    }
                    
                    .invoice-badge {
                        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                        color: white;
                        padding: 8px 20px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: 600;
                        margin-top: 15px;
                        display: inline-block;
                    }
                    
                    .content { 
                        padding: 40px 30px; 
                        background: #ffffff; 
                    }
                    
                    .greeting {
                        font-size: 18px;
                        color: #2a2a2a;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    
                    .intro-text {
                        color: #5a5a5a;
                        margin-bottom: 30px;
                        font-size: 16px;
                        line-height: 1.7;
                    }
                    
                    .invoice-details { 
                        background: #f8f9fa; 
                        padding: 25px; 
                        margin: 30px 0; 
                        border-radius: 12px; 
                        border-left: 4px solid #dc3545;
                    }
                    
                    .invoice-meta {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 25px;
                        flex-wrap: wrap;
                        gap: 15px;
                    }
                    
                    .invoice-info {
                        background: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        flex: 1;
                        min-width: 200px;
                    }
                    
                    .invoice-info-label {
                        font-size: 12px;
                        color: #dc3545;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 5px;
                    }
                    
                    .invoice-info-value {
                        font-size: 16px;
                        color: #2a2a2a;
                        font-weight: 600;
                    }
                    
                    .services-table {
                        width: 100%;
                        border-collapse: collapse;
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .services-table th {
                        background: #2a2a2a;
                        color: white;
                        padding: 15px 12px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .services-table th:last-child,
                    .services-table td:last-child {
                        text-align: right;
                    }
                    
                    .total-section { 
                        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); 
                        color: white; 
                        padding: 25px; 
                        text-align: center; 
                        font-size: 20px; 
                        font-weight: 700; 
                        margin: 30px 0;
                        border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(220, 53, 69, 0.3);
                    }
                    
                    .payment-notice {
                        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                        border: 1px solid #f0ad4e;
                        padding: 25px;
                        border-radius: 12px;
                        margin: 30px 0;
                        text-align: center;
                    }
                    
                    .payment-notice-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #856404;
                        margin-bottom: 10px;
                    }
                    
                    .payment-notice-text {
                        color: #856404;
                        margin: 0;
                        font-size: 14px;
                        line-height: 1.6;
                    }
                    
                    .cta-section {
                        background: #f8f9fa;
                        padding: 25px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .cta-button {
                        background: #fd7e14;
                        color: white;
                        padding: 15px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        margin-top: 15px;
                        transition: all 0.3s ease;
                    }
                    
                    .footer { 
                        background: #2a2a2a; 
                        color: white; 
                        padding: 30px; 
                        text-align: center; 
                    }
                    
                    .footer-content {
                        margin-bottom: 20px;
                    }
                    
                    .contact-info {
                        display: flex;
                        justify-content: center;
                        gap: 30px;
                        margin-bottom: 20px;
                        flex-wrap: wrap;
                    }
                    
                    .contact-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 14px;
                    }
                    
                    .contact-icon {
                        color: #fd7e14;
                        width: 16px;
                    }
                    
                    .footer-note {
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        padding-top: 20px;
                    }
                    
                    @media (max-width: 600px) {
                        .email-container { margin: 0 15px; }
                        .content { padding: 25px 20px; }
                        .header { padding: 30px 20px; }
                        .invoice-meta { flex-direction: column; }
                        .contact-info { flex-direction: column; gap: 15px; }
                        .services-table th, .services-table td { padding: 10px 8px; font-size: 13px; }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-section">
                            <div class="logo">🌲</div>
                            <h1 class="company-name">Stellar Tree Management</h1>
                            <div class="invoice-badge">Payment Due</div>
                        </div>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">Hello ${clientName},</div>
                        
                        <div class="intro-text">
                            Thank you for choosing Stellar Tree Management! Please find your invoice details below for the services we've completed.
                        </div>
                        
                        <div class="invoice-details">
                            <div class="invoice-meta">
                                <div class="invoice-info">
                                    <div class="invoice-info-label">Invoice ID</div>
                                    <div class="invoice-info-value">${invoiceId}</div>
                                </div>
                                <div class="invoice-info">
                                    <div class="invoice-info-label">Invoice Date</div>
                                    <div class="invoice-info-value">${invoiceDate}</div>
                                </div>
                            </div>
                            
                            <table class="services-table">
                                <thead>
                                    <tr>
                                        <th>Service Description</th>
                                        <th style="text-align: center;">Qty</th>
                                        <th style="text-align: right;">Price</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                ${serviceItemsList}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="total-section">
                            Total Amount Due: $${totalAmount.toFixed(2)}
                        </div>
                        
                        <div class="payment-notice">
                            <div class="payment-notice-title">Payment Required</div>
                            <p class="payment-notice-text">Please remit payment as soon as possible. We appreciate your prompt attention to this invoice and thank you for your business!</p>
                        </div>
                        
                        <div class="cta-section">
                            <p style="margin: 0 0 10px 0; color: #2a2a2a; font-weight: 600;">Questions about this invoice?</p>
                            <p style="margin: 0 0 15px 0; color: #5a5a5a; font-size: 14px;">Contact us if you have any questions about this invoice or need assistance with payment.</p>
                            <a href="mailto:stellartmanagement@outlook.com?subject=Invoice ${invoiceId} - Payment Question" class="cta-button">Contact Us</a>
                        </div>
                        
                        <p style="color: #5a5a5a; margin-bottom: 0;">Thank you for choosing Stellar Tree Management for your tree care needs. We look forward to serving you again!</p>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-content">
                            <div class="contact-info">
                                <div class="contact-item">
                                    <span class="contact-icon">📧</span>
                                    <span>stellartmanagement@outlook.com</span>
                                </div>
                                <div class="contact-item">
                                    <span class="contact-icon">🌐</span>
                                    <span>www.stellartreemanagement.ca</span>
                                </div>
                            </div>
                        </div>
                        <div class="footer-note">
                            © 2024 Stellar Tree Management. Professional tree care services in Calgary.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const textContent = `
            Dear ${clientName},
            
            Please find your invoice from Stellar Tree Management below:
            
            Invoice ID: ${invoiceId}
            Date: ${invoiceDate}
            
            Service Items:
            ${serviceItems.map(item => 
                `- ${item.description}: ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`
            ).join('\n')}
            
            Total Amount: $${totalAmount.toFixed(2)}
            
            Payment Required: Please remit payment as soon as possible. Thank you for your business!
            
            Best regards,
            Stellar Tree Management Team
            Email: stellartmanagement@outlook.com
        `;
        
        return await this.sendEmail(email, subject, htmlContent, textContent);
    }

    async sendBookingConfirmationEmail(email, bookingId, service, date, time, name, address = '', notes = '') {
        const template = generateImprovedBookingRequestTemplate(bookingId, service, date, time, name, address, notes);
        return await this.sendEmail(email, template.subject, template.html, template.text);
    }

    async sendBookingFinalConfirmationEmail(email, bookingId, service, date, time, name, address = '', notes = '') {
        const template = generateImprovedBookingConfirmationTemplate(bookingId, service, date, time, name, address, notes);
        return await this.sendEmail(email, template.subject, template.html, template.text);
    }

    async sendQuoteRequestConfirmationEmail(email, bookingId, service, date, time, name, address, notes) {
        const template = generateImprovedQuoteEmailTemplate(bookingId, service, date, time, name, address, notes);
        return await this.sendEmail(email, template.subject, template.html, template.text);
    }

    async sendQuoteConfirmationEmail(email, bookingId, service, estimatedCost, workDescription, name, address, notes) {
        const template = generateImprovedQuoteConfirmationTemplate(bookingId, service, estimatedCost, workDescription, name, address, notes);
        return await this.sendEmail(email, template.subject, template.html, template.text);
    }

    async sendQuoteSentEmail(email, bookingId, service, estimatedCost, workDescription, name, address, notes) {
        const template = generateImprovedQuoteSentTemplate(bookingId, service, estimatedCost, workDescription, name, address, notes);
        return await this.sendEmail(email, template.subject, template.html, template.text);
    }

    async sendQuoteAcceptanceEmail(email, bookingId, service, estimatedCost, workDescription, name, address, notes) {
        const template = generateImprovedQuoteAcceptanceTemplate(bookingId, service, estimatedCost, workDescription, name, address, notes);
        return await this.sendEmail(email, template.subject, template.html, template.text);
    }

    async sendConfirmationEmail(email, bookingId, service, date, time, name) {
        const subject = `Booking Confirmation - ${bookingId}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Confirmation - ${bookingId}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .booking-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Stellar Tree Management</h1>
                        <h2>Booking Confirmation</h2>
                    </div>
                    
                    <div class="content">
                        <p>Dear ${name},</p>
                        
                        <p>Thank you for booking with Stellar Tree Management!</p>
                        
                        <div class="booking-details">
                            <h3>Booking Details</h3>
                            <p><strong>Booking ID:</strong> ${bookingId}</p>
                            <p><strong>Service:</strong> ${service}</p>
                            <p><strong>Date:</strong> ${date}</p>
                            <p><strong>Time:</strong> ${time}</p>
                        </div>
                        
                        <p>We will contact you within 24 hours to confirm your appointment.</p>
                        
                        <p>Best regards,<br>
                        Stellar Tree Management Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>Email: stellartmanagement@outlook.com<br>
                        Website: www.stellartreemanagement.ca</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const textContent = `
            Dear ${name},
            
            Thank you for booking with Stellar Tree Management!
            
            Booking Details:
            - Booking ID: ${bookingId}
            - Service: ${service}
            - Date: ${date}
            - Time: ${time}
            
            We will contact you within 24 hours to confirm your appointment.
            
            Best regards,
            Stellar Tree Management Team
        `;
        
        return await this.sendEmail(email, subject, htmlContent, textContent);
    }

    async sendNewBookingNotificationEmail(adminEmail, bookingId, service, date, time, name, customerEmail, phone, address, notes) {
        const subject = `🆕 New Quote Request Received - ${bookingId}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Quote Request - ${bookingId}</title>
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
                        border-radius: 12px; 
                        overflow: hidden; 
                        box-shadow: 0 8px 32px rgba(42, 42, 42, 0.08);
                    }
                    
                    .header { 
                        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); 
                        color: white; 
                        padding: 40px 30px; 
                        text-align: center; 
                        position: relative;
                    }
                    
                    .header::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        height: 4px;
                        background: #fd7e14;
                    }
                    
                    .logo-section {
                        margin-bottom: 20px;
                    }
                    
                    .logo {
                        width: 60px;
                        height: 60px;
                        background: #8cc63f;
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        color: white;
                        margin-bottom: 15px;
                    }
                    
                    .company-name { 
                        font-family: 'Poppins', sans-serif; 
                        font-size: 28px; 
                        font-weight: 700; 
                        margin: 0; 
                        color: white;
                    }
                    
                    .notification-badge {
                        background: #dc3545;
                        color: white;
                        padding: 8px 20px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: 600;
                        margin-top: 15px;
                        display: inline-block;
                    }
                    
                    .content { 
                        padding: 40px 30px; 
                        background: #ffffff; 
                    }
                    
                    .notification-title {
                        font-size: 20px;
                        color: #dc3545;
                        margin-bottom: 20px;
                        font-weight: 700;
                        text-align: center;
                    }
                    
                    .booking-details { 
                        background: #f8f9fa; 
                        padding: 25px; 
                        margin: 30px 0; 
                        border-radius: 12px; 
                        border-left: 4px solid #dc3545;
                    }
                    
                    .details-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    
                    .detail-item {
                        background: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .detail-label {
                        font-size: 12px;
                        color: #dc3545;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 5px;
                    }
                    
                    .detail-value {
                        font-size: 16px;
                        color: #2a2a2a;
                        font-weight: 600;
                    }
                    
                    .customer-info {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        margin-bottom: 20px;
                    }
                    
                    .notes-section {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .action-buttons {
                        background: #f8f9fa;
                        padding: 25px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .action-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #2a2a2a;
                        margin-bottom: 15px;
                    }
                    
                    .action-buttons-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-top: 20px;
                    }
                    
                    .action-button {
                        background: #fd7e14;
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        transition: all 0.3s ease;
                        font-size: 14px;
                    }
                    
                    .action-button.secondary {
                        background: #6c757d;
                    }
                    
                    .footer { 
                        background: #2a2a2a; 
                        color: white; 
                        padding: 30px; 
                        text-align: center; 
                    }
                    
                    .footer-content {
                        margin-bottom: 20px;
                    }
                    
                    .contact-info {
                        display: flex;
                        justify-content: center;
                        gap: 30px;
                        margin-bottom: 20px;
                        flex-wrap: wrap;
                    }
                    
                    .contact-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 14px;
                    }
                    
                    .contact-icon {
                        color: #fd7e14;
                        width: 16px;
                    }
                    
                    .footer-note {
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        padding-top: 20px;
                    }
                    
                    @media (max-width: 600px) {
                        .email-container { margin: 0 15px; }
                        .content { padding: 25px 20px; }
                        .header { padding: 30px 20px; }
                        .details-grid { grid-template-columns: 1fr; }
                        .action-buttons-grid { grid-template-columns: 1fr; }
                        .contact-info { flex-direction: column; gap: 15px; }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-section">
                            <div class="logo">🌲</div>
                            <h1 class="company-name">Stellar Tree Management</h1>
                            <div class="notification-badge">New Quote Request</div>
                        </div>
                    </div>
                    
                    <div class="content">
                        <div class="notification-title">🆕 New Quote Request Received!</div>
                        
                        <div class="booking-details">
                            <div class="details-grid">
                                <div class="detail-item">
                                    <div class="detail-label">Booking ID</div>
                                    <div class="detail-value">${bookingId}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Service Requested</div>
                                    <div class="detail-value">${service}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Requested Date</div>
                                    <div class="detail-value">${date}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Requested Time</div>
                                    <div class="detail-value">${time}</div>
                                </div>
                            </div>
                            
                            <div class="customer-info">
                                <div class="detail-label">Customer Information</div>
                                <div class="detail-value">
                                    <strong>Name:</strong> ${name}<br>
                                    <strong>Email:</strong> ${customerEmail}<br>
                                    <strong>Phone:</strong> ${phone}<br>
                                    <strong>Address:</strong> ${address}
                                </div>
                            </div>
                            
                            ${notes ? `<div class="notes-section">
                                <div class="detail-label">Additional Notes</div>
                                <div class="detail-value">${notes}</div>
                            </div>` : ''}
                        </div>
                        
                        <div class="action-buttons">
                            <div class="action-title">Quick Actions</div>
                            <div class="action-buttons-grid">
                                <a href="mailto:${customerEmail}?subject=Re: Quote Request ${bookingId}" class="action-button">
                                    📧 Reply to Customer
                                </a>
                                <a href="tel:${phone}" class="action-button secondary">
                                    📞 Call Customer
                                </a>
                            </div>
                        </div>
                        
                        <p style="color: #5a5a5a; margin-bottom: 0; text-align: center; font-size: 14px;">
                            This is an automated notification. Please review the quote request and respond to the customer within 24 hours.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-content">
                            <div class="contact-info">
                                <div class="contact-item">
                                    <span class="contact-icon">📧</span>
                                    <span>stellartmanagement@outlook.com</span>
                                </div>
                                <div class="contact-item">
                                    <span class="contact-icon">🌐</span>
                                    <span>www.stellartreemanagement.ca</span>
                                </div>
                            </div>
                        </div>
                        <div class="footer-note">
                            © 2024 Stellar Tree Management. Professional tree care services in Calgary.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const textContent = `
            New Quote Request Received!
            
            Booking ID: ${bookingId}
            Service: ${service}
            Date: ${date}
            Time: ${time}
            
            Customer Information:
            Name: ${name}
            Email: ${customerEmail}
            Phone: ${phone}
            Address: ${address}
            ${notes ? `Notes: ${notes}` : ''}
            
            Please review this quote request and respond to the customer within 24 hours.
            
            Stellar Tree Management
        `;
        
        return await this.sendEmail(adminEmail, subject, htmlContent, textContent);
    }

    async sendInvoiceEmail(email, bookingId, service, totalAmount, workDescription, name, address, notes, serviceItems = []) {
        try {
            const template = generateImprovedInvoiceTemplate(bookingId, service, totalAmount, workDescription, name, address, notes, serviceItems);
            return await this.sendEmail(email, template.subject, template.html, template.text);
        } catch (error) {
            console.error('Error sending invoice email:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = EmailService;

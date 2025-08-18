// Improved Quote Sent Email Template
// This template is sent when admin sends a quote to customer for confirmation
// ✅ Email-client compatible CSS (no flexbox, SVG, or modern CSS)

function generateImprovedQuoteSentTemplate(bookingId, service, estimatedCost, workDescription, name, address, notes) {
    const subject = `Your Quote is Ready - ${bookingId} - Please Review & Confirm`;
    
    // Generate the booking status URL
    const baseUrl = process.env.BASE_URL || 'https://stellartreemanagement.ca';
    const bookingStatusUrl = `${baseUrl}/booking-status.html?id=${bookingId}`;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Quote is Ready - ${bookingId}</title>
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
                    background: linear-gradient(90deg, #8cc63f 0%, #17a2b8 100%);
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
                    border: 4px solid #8cc63f;
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
                
                .quote-details {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 25px;
                    margin: 30px 0;
                    border-left: 4px solid #fd7e14;
                }
                
                .quote-details h3 {
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
                
                .cta-section {
                    text-align: center;
                    margin: 40px 0;
                    padding: 30px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 16px;
                    border: 2px solid #fd7e14;
                }
                
                .cta-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #2a2a2a;
                    margin-bottom: 15px;
                }
                
                .cta-description {
                    font-size: 16px;
                    color: #5a5a5a;
                    margin-bottom: 25px;
                    line-height: 1.6;
                }
                
                .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #fd7e14 0%, #ff8c42 100%);
                    color: white;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 16px;
                    box-shadow: 0 8px 24px rgba(253, 126, 20, 0.3);
                    transition: all 0.3s ease;
                    margin: 10px;
                }
                
                .cta-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(253, 126, 20, 0.4);
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
                    color: #8cc63f;
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
                    color: #8cc63f;
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
                    
                    .cta-section {
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
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo-section">
                        <div class="logo">🌳</div>
                        <h1 class="company-name">Stellar Tree Management</h1>
                    </div>
                    <div class="quote-badge">Quote Ready for Review ✓</div>
                </div>
                
                <div class="content">
                    <h2 class="greeting">Hello ${name}! 📋</h2>
                    
                    <p class="message">
                        Great news! We've completed our assessment and prepared your quote for tree services. 
                        Please review the details below and confirm if you'd like to proceed.
                    </p>
                    
                    <div class="quote-details">
                        <h3>📋 Quote Details</h3>
                        <div class="detail-row">
                            <div class="detail-label">Booking ID:</div>
                            <div class="detail-value">${bookingId}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Service:</div>
                            <div class="detail-value">${service}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Estimated Cost:</div>
                            <div class="detail-value">${estimatedCost === 'TBD' ? 'Quote being prepared' : `$${estimatedCost}`}</div>
                        </div>
                        ${workDescription && workDescription.trim() !== 't' && workDescription.trim().length > 1 ? `
                        <div class="detail-row">
                            <div class="detail-label">Work Description:</div>
                            <div class="detail-value">${workDescription}</div>
                        </div>
                        ` : ''}
                        ${address && address.trim() !== 't' && address.trim().length > 1 ? `
                        <div class="detail-row">
                            <div class="detail-label">Address:</div>
                            <div class="detail-value">${address}</div>
                        </div>
                        ` : ''}
                        ${notes && notes.trim() !== 't' && notes.trim().length > 1 ? `
                        <div class="detail-row">
                            <div class="detail-label">Notes:</div>
                            <div class="detail-value">${notes}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="cta-section">
                        <h3 class="cta-title">📝 Review & Confirm Your Quote</h3>
                        <p class="cta-description">
                            Click the button below to access your quote and confirm if you'd like to proceed:
                        </p>
                        <a href="${bookingStatusUrl}" class="cta-button">
                            📋 Review Quote & Confirm
                        </a>
                    </div>
                    
                    <div class="important-note">
                        <h4>⚠️ Action Required</h4>
                        <p>
                            Please review and confirm your quote to proceed with scheduling your tree service. 
                            Once confirmed, you'll be able to choose your preferred date and time.
                        </p>
                    </div>
                    
                    <p class="message">
                        If you have any questions about the quote or need to make changes, 
                        please don't hesitate to contact us. We're here to help!
                    </p>
                </div>
                
                <div class="footer">
                    <div class="footer-content">
                        <h3 class="footer-title">Need Help?</h3>
                        <p class="footer-text">
                            Our team is ready to assist you with any questions about your quote.
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
Your Quote is Ready - ${bookingId}

Hello ${name}! 📋

Great news! We've completed our assessment and prepared your quote for tree services. Please review the details below and confirm if you'd like to proceed.

📋 Quote Details:
- Booking ID: ${bookingId}
- Service: ${service}
- Estimated Cost: ${estimatedCost === 'TBD' ? 'Quote being prepared' : `$${estimatedCost}`}
${workDescription && workDescription.trim() !== 't' && workDescription.trim().length > 1 ? `- Work Description: ${workDescription}` : ''}
${address && address.trim() !== 't' && address.trim().length > 1 ? `- Address: ${address}` : ''}
${notes && notes.trim() !== 't' && notes.trim().length > 1 ? `- Notes: ${notes}` : ''}

📝 Review & Confirm Your Quote

Click the link below to access your quote and confirm if you'd like to proceed:

📋 Review Quote & Confirm: ${bookingStatusUrl}

⚠️ Action Required
Please review and confirm your quote to proceed with scheduling your tree service. Once confirmed, you'll be able to choose your preferred date and time.

If you have any questions about the quote or need to make changes, please don't hesitate to contact us. We're here to help!

Need Help?
Our team is ready to assist you with any questions about your quote.

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

module.exports = { generateImprovedQuoteSentTemplate };

// Improved Quote Acceptance Email Template
// This template is sent when customer accepts a quote and needs to schedule their job
// ✅ Email-client compatible CSS (no flexbox, SVG, or modern CSS)

function generateImprovedQuoteAcceptanceTemplate(bookingId, service, estimatedCost, workDescription, name, address, notes) {
    const subject = `Quote Accepted - ${bookingId} - Schedule Your Job Now!`;
    
    // Generate the scheduling URL
    const baseUrl = process.env.BASE_URL || 'https://stellartreemanagement.ca';
    const schedulingUrl = `${baseUrl}/schedule-job.html?booking_id=${bookingId}`;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quote Accepted - ${bookingId}</title>
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
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
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
                    border: 4px solid #28a745;
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
                
                .acceptance-badge {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 15px;
                    font-weight: 600;
                    margin-top: 20px;
                    display: inline-block;
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                }
                
                .content { 
                    padding: 50px 30px; 
                    background: #ffffff; 
                }
                
                .greeting {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--primary-color);
                    margin: 0 0 1.5rem 0;
                    text-align: center;
                }
                
                .message {
                    font-size: 16px;
                    color: var(--secondary-color);
                    margin-bottom: 2rem;
                    text-align: center;
                    line-height: 1.6;
                }
                
                .quote-summary {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 2rem;
                    margin: 2rem 0;
                    border: 2px solid #e9ecef;
                }
                
                .quote-summary h3 {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--primary-color);
                    margin: 0 0 1.5rem 0;
                    text-align: center;
                }
                
                .summary-grid {
                    display: table;
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .summary-row {
                    display: table-row;
                }
                
                .summary-label {
                    display: table-cell;
                    font-weight: 600;
                    color: var(--primary-color);
                    padding: 12px 16px 12px 0;
                    border-bottom: 1px solid #e9ecef;
                    vertical-align: top;
                    width: 40%;
                }
                
                .summary-value {
                    display: table-cell;
                    color: var(--secondary-color);
                    padding: 12px 0 12px 16px;
                    border-bottom: 1px solid #e9ecef;
                    vertical-align: top;
                    width: 60%;
                }
                
                .summary-row:last-child .summary-label,
                .summary-row:last-child .summary-value {
                    border-bottom: none;
                }
                
                .cta-section {
                    text-align: center;
                    margin: 3rem 0;
                    padding: 2rem;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 16px;
                    border: 2px solid #8cc63f;
                }
                
                .cta-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--primary-color);
                    margin: 0 0 1rem 0;
                }
                
                .cta-description {
                    font-size: 16px;
                    color: var(--secondary-color);
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                
                .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #8cc63f 0%, #7ab32e 100%);
                    color: white;
                    padding: 18px 36px;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 18px;
                    box-shadow: 0 8px 24px rgba(140, 198, 63, 0.3);
                    transition: all 0.3s ease;
                    margin: 1rem 0;
                }
                
                .cta-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(140, 198, 63, 0.4);
                }
                
                .steps-list {
                    text-align: left;
                    display: inline-block;
                    margin: 2rem 0;
                    padding: 0;
                    list-style: none;
                }
                
                .steps-list li {
                    margin-bottom: 1rem;
                    padding-left: 0;
                    position: relative;
                    padding-left: 2rem;
                }
                
                .steps-list li::before {
                    content: '✓';
                    position: absolute;
                    left: 0;
                    top: 0;
                    background: #8cc63f;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .important-note {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                    text-align: center;
                }
                
                .important-note h4 {
                    color: #856404;
                    margin: 0 0 1rem 0;
                    font-size: 18px;
                }
                
                .important-note p {
                    color: #856404;
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .footer {
                    background: #2a2a2a;
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }
                
                .footer-content {
                    margin-bottom: 2rem;
                }
                
                .footer-title {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0 0 1rem 0;
                    color: white;
                }
                
                .footer-text {
                    font-size: 14px;
                    color: #b0b0b0;
                    margin: 0 0 1.5rem 0;
                    line-height: 1.6;
                }
                
                .contact-info {
                    font-size: 14px;
                    color: #b0b0b0;
                    line-height: 1.8;
                }
                
                .contact-info strong {
                    color: white;
                }
                
                .footer-note {
                    border-top: 1px solid #404040;
                    padding-top: 2rem;
                    font-size: 12px;
                    color: #808080;
                    line-height: 1.5;
                }
                
                @media (max-width: 600px) {
                    .email-container {
                        margin: 0;
                        border-radius: 0;
                    }
                    
                    .header, .content, .footer {
                        padding: 30px 20px;
                    }
                    
                    .greeting {
                        font-size: 24px;
                    }
                    
                    .cta-title {
                        font-size: 20px;
                    }
                    
                    .cta-button {
                        padding: 16px 28px;
                        font-size: 16px;
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
                    <div class="acceptance-badge">Quote Accepted ✓</div>
                </div>
                
                <div class="content">
                    <h2 class="greeting">Excellent choice, ${name}! 🎉</h2>
                    
                    <p class="message">
                        Thank you for accepting our quote! We're excited to have you as a customer and can't wait to provide you with exceptional tree care services.
                    </p>
                    
                    <div class="quote-summary">
                        <h3>📋 Accepted Quote Summary</h3>
                        <div class="summary-grid">
                            <div class="summary-row">
                                <div class="summary-label">Booking ID:</div>
                                <div class="summary-value">${bookingId}</div>
                            </div>
                            <div class="summary-row">
                                <div class="summary-label">Service:</div>
                                <div class="summary-value">${service}</div>
                            </div>
                            <div class="summary-row">
                                <div class="summary-label">Estimated Cost:</div>
                                <div class="summary-value">$${estimatedCost}</div>
                            </div>
                            <div class="summary-row">
                                <div class="summary-label">Work Description:</div>
                                <div class="summary-value">${workDescription}</div>
                            </div>
                            ${address ? `
                            <div class="summary-row">
                                <div class="summary-label">Service Address:</div>
                                <div class="summary-value">${address}</div>
                            </div>
                            ` : ''}
                            ${notes ? `
                            <div class="summary-row">
                                <div class="summary-label">Additional Notes:</div>
                                <div class="summary-value">${notes}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="cta-section">
                        <h3 class="cta-title">🚀 Next Step: Schedule Your Job!</h3>
                        <p class="cta-description">
                            Now that you've accepted our quote, it's time to choose when you'd like us to complete your tree service. 
                            Click the button below to access our scheduling system where you can:
                        </p>
                        <ul class="steps-list">
                            <li>📅 View our available dates on an interactive calendar</li>
                            <li>⏰ Select your preferred time slot from our available options</li>
                            <li>✅ Confirm your job booking details</li>
                            <li>📱 Receive instant confirmation of your scheduled appointment</li>
                        </ul>
                        
                        <a href="${schedulingUrl}" class="cta-button">
                            📅 Schedule My Job Now
                        </a>
                    </div>
                    
                    <div class="important-note">
                        <h4>⚠️ Action Required</h4>
                        <p>
                            You must complete the scheduling process to secure your appointment. 
                            Your job will not be scheduled until you choose a date and time through the link above.
                        </p>
                    </div>
                    
                    <p class="message">
                        If you have any questions about scheduling or need assistance, please don't hesitate to contact us. 
                        We're here to help make this process as smooth as possible!
                    </p>
                </div>
                
                <div class="footer">
                    <div class="footer-content">
                        <h3 class="footer-title">Need Help with Scheduling?</h3>
                        <p class="footer-text">
                            Our team is ready to assist you with any questions about scheduling your job or if you encounter any issues.
                        </p>
                        <div class="contact-info">
                            <strong>📧 Email:</strong> stellartmanagement@outlook.com<br>
                            <strong>🌐 Website:</strong> www.stellartreemanagement.ca<br>
                            <strong>📱 Phone:</strong> Available on request
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
Quote Accepted - ${bookingId}

Excellent choice, ${name}! 🎉

Thank you for accepting our quote! We're excited to have you as a customer and can't wait to provide you with exceptional tree care services.

📋 Accepted Quote Summary:
- Booking ID: ${bookingId}
- Service: ${service}
- Estimated Cost: $${estimatedCost}
- Work Description: ${workDescription}
${address ? `- Service Address: ${address}` : ''}
${notes ? `- Additional Notes: ${notes}` : ''}

🚀 Next Step: Schedule Your Job!

Now that you've accepted our quote, it's time to choose when you'd like us to complete your tree service. 

Click the link below to access our scheduling system where you can:
- 📅 View our available dates on an interactive calendar
- ⏰ Select your preferred time slot from our available options
- ✅ Confirm your job booking details
- 📱 Receive instant confirmation of your scheduled appointment

📅 Schedule My Job Now: ${schedulingUrl}

⚠️ Action Required
You must complete the scheduling process to secure your appointment. Your job will not be scheduled until you choose a date and time through the link above.

If you have any questions about scheduling or need assistance, please don't hesitate to contact us. We're here to help make this process as smooth as possible!

Need Help with Scheduling?
Our team is ready to assist you with any questions about scheduling your job or if you encounter any issues.

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

module.exports = { generateImprovedQuoteAcceptanceTemplate };



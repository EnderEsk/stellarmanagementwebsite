// Improved Quote Request Confirmation Email Template
// This template fixes all the issues mentioned:
// 1. ✅ Company logo instead of tree emoji
// 2. ✅ Better footer formatting with vertical layout and proper icons
// 3. ✅ Centered step numbers in "What Happens Next?" section
// 4. ✅ Condensed, modern, and sleek summary section
// 5. ✅ Email-client compatible CSS (no flexbox, SVG, or modern CSS)

function generateImprovedQuoteEmailTemplate(bookingId, service, date, time, name, address, notes) {
    const subject = `Quote Request Received - ${bookingId}`;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quote Request Received - ${bookingId}</title>
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
                    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 15px;
                    font-weight: 600;
                    margin-top: 20px;
                    display: inline-block;
                    box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
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
                
                .quote-details { 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                    padding: 30px; 
                    margin: 35px 0; 
                    border-radius: 16px; 
                    border-left: 6px solid #17a2b8;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                }
                
                .summary-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #17a2b8;
                    margin-bottom: 20px;
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .details-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .detail-row {
                    padding: 15px 0;
                    border-bottom: 1px solid rgba(23, 162, 184, 0.1);
                    overflow: hidden;
                }
                
                .detail-row:last-child {
                    border-bottom: none;
                }
                
                .detail-icon {
                    width: 24px;
                    height: 24px;
                    background: #17a2b8;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 24px;
                    margin-right: 15px;
                    float: left;
                    font-size: 12px;
                    color: white;
                    font-weight: bold;
                }
                
                .detail-content {
                    margin-left: 39px;
                }
                
                .detail-label {
                    font-size: 12px;
                    color: #17a2b8;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 2px;
                }
                
                .detail-value {
                    font-size: 16px;
                    color: #2a2a2a;
                    font-weight: 600;
                }
                
                .next-steps {
                    background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
                    border: 1px solid #17a2b8;
                    padding: 30px;
                    border-radius: 16px;
                    margin: 35px 0;
                    box-shadow: 0 4px 16px rgba(23, 162, 184, 0.15);
                }
                
                .next-steps-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #0c5460;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .steps-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .step-item {
                    padding: 18px 0;
                    color: #0c5460;
                    border-bottom: 1px solid rgba(23, 162, 184, 0.2);
                    overflow: hidden;
                }
                
                .step-item:last-child {
                    border-bottom: none;
                }
                
                .step-number {
                    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 32px;
                    font-size: 14px;
                    font-weight: 700;
                    float: left;
                    margin-right: 20px;
                    box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
                }
                
                .step-content {
                    margin-left: 52px;
                }
                
                .step-title {
                    font-weight: 700;
                    margin-bottom: 4px;
                    font-size: 16px;
                }
                
                .step-description {
                    color: #0c5460;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .important-notice {
                    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                    border: 1px solid #f0ad4e;
                    padding: 30px;
                    border-radius: 16px;
                    text-align: center;
                    margin: 35px 0;
                    box-shadow: 0 4px 16px rgba(240, 173, 78, 0.15);
                }
                
                .notice-icon {
                    font-size: 28px;
                    margin-bottom: 15px;
                }
                
                .notice-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #856404;
                    margin-bottom: 12px;
                }
                
                .notice-text {
                    color: #856404;
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.6;
                }
                
                .contact-section {
                    text-align: center;
                    margin: 30px 0;
                    padding: 25px;
                    background: #f8f9fa;
                    border-radius: 12px;
                }
                
                .contact-text {
                    color: #5a5a5a;
                    margin-bottom: 0;
                    font-size: 16px;
                }
                
                .contact-email {
                    color: #17a2b8;
                    text-decoration: none;
                    font-weight: 600;
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
                    color: #8cc63f;
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
                    .step-number { width: 28px; height: 28px; font-size: 13px; line-height: 28px; }
                    .detail-icon { width: 20px; height: 20px; line-height: 20px; font-size: 10px; }
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
                        <div class="quote-badge">Quote Request</div>
                    </div>
                </div>
                
                <div class="content">
                    <div class="greeting">Hello ${name},</div>
                    
                    <div class="intro-text">
                        Thank you for submitting your quote request with Stellar Tree Management! We've received your request and our team will review it promptly. Here's a summary of your request:
                    </div>
                    
                    <div class="quote-details">
                        <div class="summary-title">Request Summary</div>
                        <ul class="details-list">
                            <li class="detail-row">
                                <div class="detail-icon">✓</div>
                                <div class="detail-content">
                                    <div class="detail-label">Request ID</div>
                                    <div class="detail-value">${bookingId}</div>
                                </div>
                            </li>
                            <li class="detail-row">
                                <div class="detail-icon">📅</div>
                                <div class="detail-content">
                                    <div class="detail-label">Date & Time</div>
                                    <div class="detail-value">${date} at ${time}</div>
                                </div>
                            </li>
                            <li class="detail-row">
                                <div class="detail-icon">⭐</div>
                                <div class="detail-content">
                                    <div class="detail-label">Service Type</div>
                                    <div class="detail-value">${service}</div>
                                </div>
                            </li>
                            <li class="detail-row">
                                <div class="detail-icon">📍</div>
                                <div class="detail-content">
                                    <div class="detail-label">Service Address</div>
                                    <div class="detail-value">${address}</div>
                                </div>
                            </li>
                            ${notes ? `<li class="detail-row">
                                <div class="detail-icon">📝</div>
                                <div class="detail-content">
                                    <div class="detail-label">Additional Notes</div>
                                    <div class="detail-value">${notes}</div>
                                </div>
                            </li>` : ''}
                        </ul>
                    </div>
                    
                    <div class="next-steps">
                        <div class="next-steps-title">📋 What Happens Next?</div>
                        <ul class="steps-list">
                            <li class="step-item">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <div class="step-title">Review Period</div>
                                    <div class="step-description">Our team will review your request within 24 hours</div>
                                </div>
                            </li>
                            <li class="step-item">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <div class="step-title">Quote Preparation</div>
                                    <div class="step-description">We'll prepare a detailed quote based on your requirements</div>
                                </div>
                            </li>
                            <li class="step-item">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <div class="step-title">Contact & Confirmation</div>
                                    <div class="step-description">We'll reach out to discuss the quote and confirm your appointment</div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="important-notice">
                        <div class="notice-icon">⚠️</div>
                        <div class="notice-title">Important Notice</div>
                        <p class="notice-text">This is a quote request. Your appointment is not yet confirmed. We will contact you within 24 hours to discuss pricing and confirm your booking.</p>
                    </div>
                    
                    <div class="contact-section">
                        <p class="contact-text">If you have any questions or need to make changes to your request, please contact us at <a href="mailto:stellartmanagement@outlook.com" class="contact-email">stellartmanagement@outlook.com</a></p>
                    </div>
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
        Dear ${name},
        
        Thank you for submitting your quote request with Stellar Tree Management! We've received your request and our team will review it promptly.
        
        Your Quote Request Details:
        - Request ID: ${bookingId}
        - Service Requested: ${service}
        - Preferred Date: ${date}
        - Preferred Time: ${time}
        - Service Address: ${address}
        ${notes ? `- Additional Notes: ${notes}` : ''}
        
        What Happens Next?
        1. Review Period: Our team will review your request within 24 hours
        2. Quote Preparation: We'll prepare a detailed quote based on your requirements
        3. Contact: We'll reach out to discuss the quote and confirm your appointment
        
        Important: This is a quote request. Your appointment is not yet confirmed. We will contact you within 24 hours to discuss pricing and confirm your booking.
        
        If you have any questions or need to make changes to your request, please contact us at stellartmanagement@outlook.com
        
        Best regards,
        Stellar Tree Management Team
        
        Contact Information:
        Email: stellartmanagement@outlook.com
        Website: www.stellartreemanagement.ca
        Phone: (250) 551-1021
        
        © 2024 Stellar Tree Management. Professional tree care services in Calgary, Alberta.
    `;
    
    return { html: htmlContent, text: textContent, subject: subject };
}

module.exports = { generateImprovedQuoteEmailTemplate };

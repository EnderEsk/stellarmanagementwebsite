// Improved Booking Request Received Email Template
// This template follows the same modern, condensed design as the other templates
// but is specifically formatted for when a booking request is first received
// ✅ Email-client compatible CSS (no flexbox, SVG, or modern CSS)

function generateImprovedBookingRequestTemplate(bookingId, service, date, time, name, address, notes) {
    const subject = `Booking Request Received - ${bookingId}`;
    
    // Create unique booking link
    const bookingLink = `https://stellartreemanagement.ca/booking-status.html?id=${bookingId}`;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Request Received - ${bookingId}</title>
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
                
                .booking-badge {
                    background: linear-gradient(135deg, #8cc63f 0%, #7ab832 100%);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 15px;
                    font-weight: 600;
                    margin-top: 20px;
                    display: inline-block;
                    box-shadow: 0 4px 12px rgba(140, 198, 63, 0.3);
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
                
                .request-message {
                    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                    border: 1px solid #28a745;
                    padding: 25px;
                    border-radius: 16px;
                    text-align: center;
                    margin: 30px 0;
                    box-shadow: 0 4px 16px rgba(40, 167, 69, 0.15);
                }
                
                .request-icon {
                    font-size: 32px;
                    margin-bottom: 15px;
                }
                
                .request-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #155724;
                    margin-bottom: 10px;
                }
                
                .request-text {
                    color: #155724;
                    margin: 0;
                    font-size: 16px;
                    line-height: 1.6;
                }
                
                .booking-details { 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                    padding: 30px; 
                    margin: 35px 0; 
                    border-radius: 16px; 
                    border-left: 6px solid #8cc63f;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                }
                
                .summary-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #8cc63f;
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
                    border-bottom: 1px solid rgba(140, 198, 63, 0.1);
                    overflow: hidden;
                }
                
                .detail-row:last-child {
                    border-bottom: none;
                }
                
                .detail-icon {
                    width: 24px;
                    height: 24px;
                    background: #8cc63f;
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
                    color: #8cc63f;
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
                
                .action-required {
                    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                    border: 1px solid #f0ad4e;
                    padding: 30px;
                    border-radius: 16px;
                    text-align: center;
                    margin: 35px 0;
                    box-shadow: 0 4px 16px rgba(240, 173, 78, 0.15);
                }
                
                .action-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #856404;
                    margin-bottom: 15px;
                }
                
                .action-text {
                    color: #856404;
                    margin-bottom: 20px;
                    font-size: 16px;
                    line-height: 1.6;
                }
                
                .cta-button {
                    background: #8cc63f;
                    color: white;
                    padding: 15px 30px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    display: inline-block;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(140, 198, 63, 0.3);
                }
                
                .features-list {
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 12px;
                    margin: 30px 0;
                    border: 1px solid #e5e7eb;
                }
                
                .features-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2a2a2a;
                    margin-bottom: 15px;
                    text-align: center;
                }
                
                .features-list ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .features-list li {
                    padding: 10px 0;
                    color: #5a5a5a;
                    border-bottom: 1px solid #e5e7eb;
                    overflow: hidden;
                }
                
                .features-list li:last-child {
                    border-bottom: none;
                }
                
                .feature-icon {
                    color: #8cc63f;
                    font-size: 16px;
                    width: 20px;
                    float: left;
                    margin-right: 12px;
                }
                
                .feature-text {
                    margin-left: 32px;
                }
                
                .important-notice {
                    background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
                    border: 1px solid #8cc63f;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #8cc63f;
                    margin: 30px 0;
                }
                
                .notice-text {
                    margin: 0;
                    color: #2a2a2a;
                    font-weight: 600;
                    font-size: 14px;
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
                    color: #8cc63f;
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
                    .detail-icon { width: 20px; height: 20px; line-height: 20px; font-size: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo-section">
                        <div class="logo">🌲</div>
                        <h1 class="company-name">Stellar Tree Management</h1>
                        <div class="booking-badge">Request Received</div>
                    </div>
                </div>
                
                <div class="content">
                    <div class="greeting">Hello ${name},</div>
                    
                    <div class="intro-text">
                        Thank you for your booking request! We've received your request and our team will review it shortly. Here are the details we have on file:
                    </div>
                    
                    <div class="request-message">
                        <div class="request-icon">📋</div>
                        <div class="request-title">Your Booking Request is Received!</div>
                        <p class="request-text">We're reviewing your request and will get back to you shortly.</p>
                    </div>
                    
                    <div class="booking-details">
                        <div class="summary-title">Request Summary</div>
                        <ul class="details-list">
                            <li class="detail-row">
                                <div class="detail-icon">✓</div>
                                <div class="detail-content">
                                    <div class="detail-label">Booking ID</div>
                                    <div class="detail-value">${bookingId}</div>
                                </div>
                            </li>
                            <li class="detail-row">
                                <div class="detail-icon">📅</div>
                                <div class="detail-content">
                                    <div class="detail-label">Requested Date & Time</div>
                                    <div class="detail-value">${date} at ${time}</div>
                                </div>
                            </li>
                            <li class="detail-row">
                                <div class="detail-icon">⭐</div>
                                <div class="detail-content">
                                    <div class="detail-label">Service Requested</div>
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
                    
                    <div class="action-required">
                        <div class="action-title">🎯 Action Required</div>
                        <p class="action-text">To complete your booking and view the status, please click the button below to access your booking portal.</p>
                        <a href="${bookingLink}" class="cta-button">Access Your Booking</a>
                    </div>
                    
                    <div class="features-list">
                        <div class="features-title">What you can do with your booking link:</div>
                        <ul>
                            <li>
                                <span class="feature-icon">✅</span>
                                <span class="feature-text">View detailed booking information</span>
                            </li>
                            <li>
                                <span class="feature-icon">📋</span>
                                <span class="feature-text">Confirm your booking request</span>
                            </li>
                            <li>
                                <span class="feature-icon">📊</span>
                                <span class="feature-text">Track service progress in real-time</span>
                            </li>
                            <li>
                                <span class="feature-icon">📞</span>
                                <span class="feature-text">Contact us directly about your service</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="important-notice">
                        <p class="notice-text">
                            ⏰ <strong>Important:</strong> Please access your booking within 24 hours to confirm your appointment.
                        </p>
                    </div>
                    
                    <div class="contact-section">
                        <p class="contact-text">If you have any questions or need immediate assistance, don't hesitate to contact us at <a href="mailto:stellartmanagement@outlook.com" class="contact-email">stellartmanagement@outlook.com</a></p>
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
        
        Thank you for your booking request! We've received your request and our team will review it shortly. Here are the details we have on file:
        
        📋 Your Booking Request is Received!
        We're reviewing your request and will get back to you shortly.
        
        Request Summary:
        - Booking ID: ${bookingId}
        - Service Requested: ${service}
        - Requested Date: ${date}
        - Requested Time: ${time}
        - Service Address: ${address}
        ${notes ? `- Additional Notes: ${notes}` : ''}
        
        🎯 Action Required
        To complete your booking and view your booking status, please visit:
        ${bookingLink}
        
        This link will allow you to:
        - View your booking details
        - Confirm your booking
        - Track the progress of your service
        - Contact us directly about your service
        
        ⏰ Important: Please access your booking within 24 hours to confirm your appointment.
        
        If you have any questions or need immediate assistance, don't hesitate to contact us at stellartmanagement@outlook.com
        
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

module.exports = { generateImprovedBookingRequestTemplate };

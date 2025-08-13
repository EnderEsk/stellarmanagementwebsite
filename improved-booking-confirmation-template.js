// Improved Booking Confirmation Email Template
// This template follows the same modern, condensed design as the quote request template
// but is specifically formatted for booking confirmations

function generateImprovedBookingConfirmationTemplate(bookingId, service, date, time, name, address, notes) {
    const subject = `Booking Confirmed - ${bookingId}`;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmed - ${bookingId}</title>
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
                }
                
                .logo {
                    width: 80px;
                    height: 80px;
                    background: #ffffff;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                    border: 4px solid #8cc63f;
                }
                
                .logo img {
                    width: 60px;
                    height: 60px;
                    object-fit: contain;
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
                
                .booking-details { 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                    padding: 30px; 
                    margin: 35px 0; 
                    border-radius: 16px; 
                    border-left: 6px solid #28a745;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                }
                
                .summary-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #28a745;
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
                    display: flex;
                    align-items: center;
                    padding: 15px 0;
                    border-bottom: 1px solid rgba(40, 167, 69, 0.1);
                }
                
                .detail-row:last-child {
                    border-bottom: none;
                }
                
                .detail-icon {
                    width: 24px;
                    height: 24px;
                    background: #28a745;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 15px;
                    flex-shrink: 0;
                }
                
                .detail-icon svg {
                    width: 14px;
                    height: 14px;
                    fill: white;
                }
                
                .detail-content {
                    flex: 1;
                }
                
                .detail-label {
                    font-size: 12px;
                    color: #28a745;
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
                
                .arrival-instructions {
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border: 1px solid #2196f3;
                    padding: 30px;
                    border-radius: 16px;
                    margin: 35px 0;
                    box-shadow: 0 4px 16px rgba(33, 150, 243, 0.15);
                }
                
                .instructions-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #0d47a1;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .instructions-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .instruction-item {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 15px 0;
                    color: #0d47a1;
                    border-bottom: 1px solid rgba(33, 150, 243, 0.2);
                }
                
                .instruction-item:last-child {
                    border-bottom: none;
                }
                
                .instruction-icon {
                    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: 700;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
                }
                
                .instruction-content {
                    flex: 1;
                    font-size: 15px;
                    line-height: 1.5;
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
                    color: #28a745;
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
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 25px;
                }
                
                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 15px;
                    font-weight: 500;
                }
                
                .contact-icon {
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .contact-icon svg {
                    width: 18px;
                    height: 18px;
                    fill: #8cc63f;
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
                    .instruction-item { gap: 15px; }
                    .instruction-icon { width: 28px; height: 28px; font-size: 14px; }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo-section">
                        <div class="logo">
                            <img src="https://stellartreemanagement.ca/images/logo.png" alt="Stellar Tree Management Logo" />
                        </div>
                        <h1 class="company-name">Stellar Tree Management</h1>
                        <div class="booking-badge">Booking Confirmed</div>
                    </div>
                </div>
                
                <div class="content">
                    <div class="greeting">Hello ${name},</div>
                    
                    <div class="intro-text">
                        Great news! Your booking with Stellar Tree Management has been confirmed. We're excited to provide you with professional tree care services. Here are your confirmed booking details:
                    </div>
                    
                    <div class="success-message">
                        <div class="success-icon">🎉</div>
                        <div class="success-title">Your Booking is Confirmed!</div>
                        <p class="success-text">We're looking forward to serving you on the scheduled date.</p>
                    </div>
                    
                    <div class="booking-details">
                        <div class="summary-title">Confirmed Booking Details</div>
                        <ul class="details-list">
                            <li class="detail-row">
                                <div class="detail-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                </div>
                                <div class="detail-content">
                                    <div class="detail-label">Booking ID</div>
                                    <div class="detail-value">${bookingId}</div>
                                </div>
                            </li>
                            <li class="detail-row">
                                <div class="detail-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                    </svg>
                                </div>
                                <div class="detail-content">
                                    <div class="detail-label">Scheduled Date & Time</div>
                                    <div class="detail-value">${date} at ${time}</div>
                                </div>
                            </li>
                            <li class="detail-row">
                                <div class="detail-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </div>
                                <div class="detail-content">
                                    <div class="detail-label">Service Type</div>
                                    <div class="detail-value">${service}</div>
                                </div>
                            </li>
                            <li class="detail-row">
                                <div class="detail-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                    </svg>
                                </div>
                                <div class="detail-content">
                                    <div class="detail-label">Service Address</div>
                                    <div class="detail-value">${address}</div>
                                </div>
                            </li>
                            ${notes ? `<li class="detail-row">
                                <div class="detail-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                    </svg>
                                </div>
                                <div class="detail-content">
                                    <div class="detail-label">Special Instructions</div>
                                    <div class="detail-value">${notes}</div>
                                </div>
                            </li>` : ''}
                        </ul>
                    </div>
                    
                    <div class="arrival-instructions">
                        <div class="instructions-title">📋 Arrival Instructions</div>
                        <ul class="instructions-list">
                            <li class="instruction-item">
                                <div class="instruction-icon">1</div>
                                <div class="instruction-content">Please ensure access to your property is available at the scheduled time</div>
                            </li>
                            <li class="instruction-item">
                                <div class="instruction-icon">2</div>
                                <div class="instruction-content">Move any vehicles from the work area to allow our team full access</div>
                            </li>
                            <li class="instruction-item">
                                <div class="instruction-icon">3</div>
                                <div class="instruction-content">Secure pets indoors for their safety and to avoid any interruptions</div>
                            </li>
                            <li class="instruction-item">
                                <div class="instruction-icon">4</div>
                                <div class="instruction-content">Our team will arrive within 15 minutes of the scheduled time</div>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="contact-section">
                        <p class="contact-text">If you need to make any changes or have questions about your booking, please contact us immediately at <a href="mailto:stellartmanagement@outlook.com" class="contact-email">stellartmanagement@outlook.com</a></p>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-content">
                        <div class="contact-info">
                            <div class="contact-item">
                                <div class="contact-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                </div>
                                <a href="mailto:stellartmanagement@outlook.com" class="contact-link">stellartmanagement@outlook.com</a>
                            </div>
                            <div class="contact-item">
                                <div class="contact-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    </svg>
                                </div>
                                <a href="https://www.stellartreemanagement.ca" class="contact-link">www.stellartreemanagement.ca</a>
                            </div>
                            <div class="contact-item">
                                <div class="contact-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                    </svg>
                                </div>
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
        
        Great news! Your booking with Stellar Tree Management has been confirmed. We're excited to provide you with professional tree care services.
        
        🎉 Your Booking is Confirmed!
        We're looking forward to serving you on the scheduled date.
        
        Confirmed Booking Details:
        - Booking ID: ${bookingId}
        - Service Requested: ${service}
        - Scheduled Date: ${date}
        - Scheduled Time: ${time}
        - Service Address: ${address}
        ${notes ? `- Special Instructions: ${notes}` : ''}
        
        Arrival Instructions:
        1. Please ensure access to your property is available at the scheduled time
        2. Move any vehicles from the work area to allow our team full access
        3. Secure pets indoors for their safety and to avoid any interruptions
        4. Our team will arrive within 15 minutes of the scheduled time
        
        If you need to make any changes or have questions about your booking, please contact us immediately at stellartmanagement@outlook.com
        
        Thank you for choosing Stellar Tree Management!
        
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

module.exports = { generateImprovedBookingConfirmationTemplate };

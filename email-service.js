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
            return { success: true, messageId: response.data?.id };
        } catch (error) {
            console.error('❌ Error sending email via Resend:', error);
            return { success: false, error: error.message };
        }
    }

    async sendEventConfirmationEmail(to, eventData, isUpdate = false) {
        const action = isUpdate ? 'updated' : 'created';
        const subject = `Event ${action}: ${eventData.title}`;
        
        // Format date and time
        const eventDate = new Date(eventData.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Format time
        const startTime = new Date(`2000-01-01T${eventData.startTime}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const endTime = new Date(`2000-01-01T${eventData.endTime}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Event ${action}</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2a2a2a; background-color: #f8f9fa;">
                
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                                
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #2a2a2a; color: #ffffff; padding: 30px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
                                            📅 Event ${isUpdate ? 'Updated' : 'Created'}
                                        </h1>
                                        <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 16px;">
                                            Stellar Tree Management
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 30px;">
                                        
                                        <!-- Event Card -->
                                        <div style="background-color: #f8f9fa; border: 2px solid ${eventData.color}; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                                            <h2 style="margin: 0 0 15px 0; color: #2a2a2a; font-size: 20px; font-weight: 600;">
                                                ${eventData.title}
                                            </h2>
                                            
                                            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="color: ${eventData.color}; font-size: 16px;">📅</span>
                                                    <span style="font-weight: 500;">${formattedDate}</span>
                                                </div>
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="color: ${eventData.color}; font-size: 16px;">⏰</span>
                                                    <span style="font-weight: 500;">${startTime} - ${endTime}</span>
                                                </div>
                                            </div>
                                            
                                            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="color: ${eventData.color}; font-size: 16px;">🏷️</span>
                                                    <span style="background-color: ${eventData.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                                        ${eventData.type}
                                                    </span>
                                                </div>
                                                ${eventData.location ? `
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="color: ${eventData.color}; font-size: 16px;">📍</span>
                                                    <span>${eventData.location}</span>
                                                </div>
                                                ` : ''}
                                            </div>
                                            
                                            ${eventData.description ? `
                                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                                                <p style="margin: 0; color: #5a5a5a; line-height: 1.5;">
                                                    ${eventData.description}
                                                </p>
                                            </div>
                                            ` : ''}
                                        </div>
                                        
                                        <!-- Info -->
                                        <div style="background-color: #f0f9f0; border: 1px solid #8cc63f; border-radius: 8px; padding: 15px; text-align: center;">
                                            <p style="margin: 0; color: #2a2a2a; font-size: 14px;">
                                                ✅ This event has been ${action} successfully and is now visible on your admin calendar.
                                            </p>
                                        </div>
                                        
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #2a2a2a; color: #ffffff; padding: 20px; text-align: center;">
                                        <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.8);">
                                            © 2024 Stellar Tree Management<br>
                                            Professional tree care services in Calgary, Alberta
                                        </p>
                                    </td>
                                </tr>
                                
                            </table>
                            
                        </td>
                    </tr>
                </table>
                
            </body>
            </html>
        `;
        
        const textContent = `
Event ${isUpdate ? 'Updated' : 'Created'}: ${eventData.title}

Event Details:
- Title: ${eventData.title}
- Type: ${eventData.type}
- Date: ${formattedDate}
- Time: ${startTime} - ${endTime}
${eventData.location ? `- Location: ${eventData.location}` : ''}
${eventData.description ? `- Description: ${eventData.description}` : ''}

This event has been ${action} successfully and is now visible on your admin calendar.

© 2024 Stellar Tree Management
Professional tree care services in Calgary, Alberta
        `;
        
        return await this.sendEmail(to, subject, htmlContent, textContent);
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
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>Quote - ${quoteId}</title>
</head>
<body style="margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; line-height: 1.6 !important; color: #2a2a2a !important; background-color: #f8f9fa !important; color-scheme: light only !important;">
    
    <!-- Main Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa !important; color-scheme: light only !important;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                
                <!-- Email Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff !important; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(42, 42, 42, 0.12); color-scheme: light only !important;">
                    
                    <!-- Header Section -->
                    <tr>
                        <td style="background-color: #2a2a2a !important; color: #ffffff !important; padding: 40px 30px; color-scheme: light only !important;">
                            <!-- Updated header layout with logo left, business info right -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="120" valign="middle" style="padding-right: 20px;">
                                        <!-- Logo -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <!-- Adjusted logo positioning slightly to the right -->
                                                <td align="left" style="width: 80px; height: 80px; background-color: #ffffff !important; border-radius: 50%; border: 4px solid #8cc63f !important; text-align: center; vertical-align: middle; color-scheme: light only !important; padding: 0; box-sizing: border-box;">
                                                    <img src="https://www.stellartreemanagement.ca/images/logo.png" alt="Stellar Tree Management Logo" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto;">
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="middle" align="left">
                                        <!-- Business Name and Status Stacked -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; font-size: 28px; font-weight: 700; color: #ffffff !important; margin: 0; padding: 0 0 10px 0; line-height: 1.2; color-scheme: light only !important;">
                                                    Stellar Tree Management
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="background-color: #8cc63f !important; color: #ffffff !important; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; color-scheme: light only !important;">
                                                    Quote Ready
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #ffffff !important; color-scheme: light only !important;">
                            
                            <!-- Success Message -->
                            <!-- Made entire green box clickable and moved it higher up -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 15px 0;">
                                <tr>
                                    <td>
                                        ${
                                          bookingId
                                            ? `<a href="https://www.stellartreemanagement.ca/booking-status.html?id=${bookingId}" style="text-decoration: none; display: block;">`
                                            : ""
                                        }
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f9f0 !important; border: 2px solid #8cc63f !important; padding: 25px; border-radius: 12px; text-align: center; color-scheme: light only !important; cursor: pointer;">
                                            <tr>
                                                <td style="font-size: 32px; padding-bottom: 15px; color-scheme: light only !important;">📋</td>
                                            </tr>
                                            <!-- Added greeting to the green box header -->
                                            <tr>
                                                <td style="font-size: 18px; font-weight: 600; color: #2a2a2a !important; padding-bottom: 8px; color-scheme: light only !important;">
                                                    Hello ${clientName}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2a2a2a !important; padding-bottom: 10px; color-scheme: light only !important;">
                                                    Your Quote is Ready
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #2a2a2a !important; font-size: 16px; line-height: 1.6; padding-bottom: 20px; color-scheme: light only !important;">
                                                    Please review the details below and let us know if you'd like to proceed with scheduling.
                                                </td>
                                            </tr>
                                            ${
                                              bookingId
                                                ? `
                                            <tr>
                                                <td>
                                                    <!-- Button remains clickable as backup -->
                                                    <span style="background-color: #8cc63f !important; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color-scheme: light only !important;">Click Here</span>
                                                </td>
                                            </tr>
                                            `
                                                : ""
                                            }
                                        </table>
                                        ${bookingId ? "</a>" : ""}
                                    </td>
                                </tr>
                            </table>
                            
                            
                            
                            <!-- Footer Note -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="color: #5a5a5a !important; font-size: 16px; line-height: 1.6; color-scheme: light only !important;">
                                        This quote is valid for 30 days. We're here to answer any questions you may have about our services.
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #2a2a2a !important; color: #ffffff !important; padding: 40px 30px; text-align: center; color-scheme: light only !important;">
                            
                            <!-- Contact Info -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
                                <tr>
                                    <td style="padding-bottom: 15px; color: rgba(255, 255, 255, 0.9) !important; font-size: 15px; font-weight: 500; color-scheme: light only !important;">
                                        <span style="display: inline-block; width: 20px; margin-right: 12px; font-size: 18px;">📧</span>
                                        <a href="mailto:stellartmanagement@outlook.com" style="color: rgba(255, 255, 255, 0.9) !important; text-decoration: none; color-scheme: light only !important;">stellartmanagement@outlook.com</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 15px; color: rgba(255, 255, 255, 0.9) !important; font-size: 15px; font-weight: 500; color-scheme: light only !important;">
                                        <span style="display: inline-block; width: 20px; margin-right: 12px; font-size: 18px;">🌐</span>
                                        <a href="https://www.stellartreemanagement.ca" style="color: rgba(255, 255, 255, 0.9) !important; text-decoration: none; color-scheme: light only !important;">www.stellartreemanagement.ca</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: rgba(255, 255, 255, 0.9) !important; font-size: 15px; font-weight: 500; color-scheme: light only !important;">
                                        <span style="display: inline-block; width: 20px; margin-right: 12px; font-size: 18px;">📞</span>
                                        <a href="tel:+12505511021" style="color: rgba(255, 255, 255, 0.9) !important; text-decoration: none; color-scheme: light only !important;">(250) 551-1021</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Footer Note -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="color: rgba(255, 255, 255, 0.7) !important; font-size: 13px; border-top: 1px solid rgba(255, 255, 255, 0.15); padding-top: 25px; line-height: 1.5; color-scheme: light only !important;">
                                        © 2024 Stellar Tree Management. Professional tree care services in Calgary, Alberta.<br>
                                        Serving Calgary and surrounding areas with quality tree care solutions.
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
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

    async sendInvoiceEmailFromInvoice(email, invoiceId, clientName, invoiceDate, totalAmount, serviceItems, serviceItemPhotos = null, bookingId = null) {
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
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light">
    <title>Invoice - ${invoiceId}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2a2a2a !important; background-color: #f8f9fa !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; color-scheme: light only;">
    
    <!-- Email Wrapper -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #f8f9fa !important; padding: 20px 10px; color-scheme: light only;">
        <tr>
            <td align="center">
                
                <!-- Email Container -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff !important; border-radius: 12px; overflow: hidden; border: 1px solid #e9ecef; color-scheme: light only;">
                    
                    <!-- Header -->
                    <tr>
                        <td class="email-header" style="background-color: #2a2a2a !important; padding: 40px 30px; position: relative; color-scheme: light only;">
                            <!-- Logo Column (Left) -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <!-- Logo Column (Left) -->
                                    <td style="width: 100px; vertical-align: middle; padding-right: 20px;">
                                        <div style="width: 70px; height: 70px; border-radius: 50%; background-color: #ffffff !important; border: 3px solid #8cc63f !important; padding: 6px; margin: 0 auto;">
                                            <img src="https://www.stellartreemanagement.ca/images/logo.png" alt="Stellar Tree Management Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain; border: 0; display: block;">
                                        </div>
                                    </td>
                                    
                                    <!-- Business Name and Status Column (Right) -->
                                    <td style="vertical-align: middle; text-align: left;">
                                        <h1 style="color: #ffffff !important; font-size: 28px; font-weight: 700; margin: 0 0 15px 0; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Stellar Tree Management</h1>
                                        <div class="status-badge" style="background-color: #8cc63f !important; color: #ffffff !important; padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Invoice</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #ffffff;">
                            
                            <!-- Success Message with Green Box Styling (Same as Quote Template) -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 15px 0;">
                                <tr>
                                    <td>
                                        <a href="https://stellartreemanagement.ca/booking-status.html?id=${bookingId || invoiceId}" style="text-decoration: none; display: block;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f9f0 !important; border: 2px solid #8cc63f !important; padding: 25px; border-radius: 12px; text-align: center; color-scheme: light only !important; cursor: pointer;">
                                            <tr>
                                                <td style="font-size: 32px; padding-bottom: 15px; color-scheme: light only !important;">📋</td>
                                            </tr>
                                            <!-- Added greeting to the green box header -->
                                            <tr>
                                                <td style="font-size: 18px; font-weight: 600; color: #2a2a2a !important; padding-bottom: 8px; color-scheme: light only !important;">
                                                    Hello ${clientName}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2a2a2a !important; padding-bottom: 10px; color-scheme: light only !important;">
                                                    Services Completed - Invoice Ready!
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #2a2a2a !important; font-size: 16px; line-height: 1.6; padding-bottom: 20px; color-scheme: light only !important;">
                                                    Your tree services have been completed. Please review your invoice below.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <!-- Button remains clickable as backup -->
                                                    <span style="background-color: #8cc63f !important; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color-scheme: light only !important;">Click Here</span>
                                                </td>
                                            </tr>
                                        </table>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Invoice Details -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-left: 4px solid #4a90e2; border-radius: 8px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 30px;">
                                        
                                        <!-- Section Title -->
                                        <h3 style="font-size: 18px; font-weight: 700; color: #2a2a2a; margin: 0 0 25px 0; text-align: center; text-transform: uppercase; letter-spacing: 1px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            Invoice Details
                                        </h3>
                                        
                                        <!-- Detail Items -->
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 0 0 18px 0; border-bottom: 1px solid #e9ecef;">
                                                    <div style="font-size: 12px; font-weight: 600; color: #5a5a5a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Invoice ID</div>
                                                    <div style="font-size: 16px; font-weight: 600; color: #2a2a2a; word-wrap: break-word; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${invoiceId}</div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 18px 0 0 0;">
                                                    <div style="font-size: 12px; font-weight: 600; color: #5a5a5a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Invoice Date</div>
                                                    <div style="font-size: 16px; font-weight: 600; color: #2a2a2a; word-wrap: break-word; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${invoiceDate}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Services Table -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin: 30px 0; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e9ecef;">
                                <thead>
                                    <tr>
                                        <th style="background-color: #8cc63f !important; color: #ffffff !important; padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Service Description</th>
                                        <th style="background-color: #8cc63f !important; color: #ffffff !important; padding: 15px 12px; text-align: center; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Qty</th>
                                        <th style="background-color: #8cc63f !important; color: #ffffff !important; padding: 15px 12px; text-align: right; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Price</th>
                                        <th style="background-color: #8cc63f !important; color: #ffffff !important; padding: 15px 12px; text-align: right; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${serviceItemsList}
                                </tbody>
                            </table>
                            
                            <!-- Total Section -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #2a2a2a !important; border-radius: 8px; margin: 25px 0;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <div style="color: #ffffff !important; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            Total Amount Due: <span style="color: #8cc63f !important;">$${totalAmount.toFixed(2)}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Payment Notice -->
                            <p style="color: #5a5a5a; margin: 20px 0; text-align: center; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                Payment is due within 30 days. Please contact us if you have any questions about payment arrangements.
                            </p>
                            
                            <!-- Action Button -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://stellartreemanagement.ca/booking-status.html?id=${bookingId || invoiceId}" style="background-color: #4a90e2 !important; color: #ffffff !important; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: 600; font-size: 16px; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            View Booking Status & History
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Contact Section -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 25px; text-align: center;">
                                        <p style="font-size: 15px; color: #5a5a5a; margin: 0; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            If you have any questions about your invoice or payment, please contact us at 
                                            <a href="mailto:stellartmanagement@outlook.com" style="color: #4a90e2; text-decoration: none; font-weight: 600;">stellartmanagement@outlook.com</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2a2a2a !important; padding: 30px; text-align: center; color-scheme: light only;">
                            
                            <!-- Contact Items -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <div style="margin-bottom: 12px; font-size: 15px; color: rgba(255, 255, 255, 0.9) !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            📧 <a href="mailto:stellartmanagement@outlook.com" style="color: rgba(255, 255, 255, 0.9) !important; text-decoration: none;">stellartmanagement@outlook.com</a>
                                        </div>
                                        <div style="margin-bottom: 12px; font-size: 15px; color: rgba(255, 255, 255, 0.9) !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            🌐 <a href="https://www.stellartreemanagement.ca" style="color: rgba(255, 255, 255, 0.9) !important; text-decoration: none;">www.stellartreemanagement.ca</a>
                                        </div>
                                        <div style="margin-bottom: 12px; font-size: 15px; color: rgba(255, 255, 255, 0.9) !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            📞 <a href="tel:+12505511021" style="color: rgba(255, 255, 255, 0.9) !important; text-decoration: none;">(250) 551-1021</a>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 15px;">
                                        <p style="color: rgba(255, 255, 255, 0.7) !important; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            © 2024 Stellar Tree Management. Professional tree care services in Calgary, Alberta.<br>
                                            Serving Calgary and surrounding areas with quality tree care solutions.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
        `;
        
        const textContent = `
Invoice from Stellar Tree Management - ${invoiceId}

Hello ${clientName},

Thank you for choosing Stellar Tree Management! Your tree services have been completed. Please find your invoice below for the work performed.

📋 Invoice Details:
- Invoice ID: ${invoiceId}
- Invoice Date: ${invoiceDate}

Service Items:
${serviceItems.map(item => `- ${item.description}: ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`).join('\n')}

Total Amount Due: $${totalAmount.toFixed(2)}

Payment is due within 30 days. Please contact us if you have any questions about payment arrangements.

✅ Services Completed - Invoice Rendered
Your tree services have been completed and this invoice has been rendered. 
You can track your booking history and view past services at any time:
https://stellartreemanagement.ca/booking-status.html?id=${bookingId || invoiceId}

Need Help?
Our team is ready to assist you with any questions about your invoice or payment.

📧 Email: stellartmanagement@outlook.com
🌐 Website: www.stellartreemanagement.ca
📱 Phone: Available on request

Best regards,
The Stellar Tree Management Team
        `;
        
        return await this.sendEmail(email, subject, htmlContent, textContent);
    }

    async sendInvoiceEmailFromQuote(email, invoiceId, clientName, invoiceDate, totalAmount, serviceItems) {
        const subject = `Invoice from Stellar Tree Management - ${invoiceId}`;
        
        // Format service items for email
        const serviceItemsList = serviceItems.map(item => 
            `<tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #2a2a2a;">${item.description}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #5a5a5a;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #5a5a5a;">$${item.price.toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #2a2a2a;">$${item.total.toFixed(2)}</td>
            </tr>`
        ).join('');
        
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
                        box-shadow: 0 4px 12px rgba(253, 126, 20, 0.3);
                    }
                    
                    .company-name { 
                        font-family: 'Poppins', sans-serif; 
                        font-size: 28px; 
                        font-weight: 700; 
                        margin: 0; 
                        color: white;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    }
                    
                    .invoice-badge {
                        background: #fd7e14;
                        color: white;
                        padding: 8px 16px;
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
                        font-size: 22px;
                        font-weight: 600;
                        color: #2a2a2a;
                        margin-bottom: 15px;
                    }
                    
                    .intro-text {
                        font-size: 16px;
                        color: #5a5a5a;
                        margin-bottom: 25px;
                        line-height: 1.6;
                    }
                    
                    .invoice-details {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 25px 0;
                        border-left: 4px solid #fd7e14;
                    }
                    
                    .invoice-details h3 {
                        margin: 0 0 15px 0;
                        color: #2a2a2a;
                        font-size: 18px;
                        font-weight: 600;
                    }
                    
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        padding: 8px 0;
                        border-bottom: 1px solid #e9ecef;
                    }
                    
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    
                    .detail-label {
                        font-weight: 600;
                        color: #5a5a5a;
                        font-size: 14px;
                    }
                    
                    .detail-value {
                        color: #2a2a2a;
                        font-weight: 500;
                        font-size: 14px;
                    }
                    
                    .services-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 25px 0;
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                    
                    .services-table th {
                        background: #fd7e14;
                        color: white;
                        padding: 15px 12px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .services-table td {
                        padding: 12px;
                        border-bottom: 1px solid #e5e7eb;
                        color: #2a2a2a;
                        font-size: 14px;
                    }
                    
                    .total-section {
                        background: linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        margin: 25px 0;
                        font-size: 18px;
                        font-weight: 600;
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
                        color: #fd7e14;
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
                        color: #fd7e14;
                    }
                    
                    @media (max-width: 600px) {
                        .email-container { margin: 0 15px; }
                        .content { padding: 30px 20px; }
                        .header { padding: 30px 20px; }
                        .detail-row { flex-direction: column; gap: 5px; }
                        .services-table { font-size: 13px; }
                        .services-table th, .services-table td { padding: 10px 8px; }
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
                            <div class="invoice-badge">Invoice Rendered</div>
                        </div>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">Hello ${clientName},</div>
                        
                        <div class="intro-text">
                            Thank you for choosing Stellar Tree Management! Your tree services have been completed. 
                            Please find your invoice below for the work performed.
                        </div>
                        
                        <div class="invoice-details">
                            <h3>📋 Invoice Details</h3>
                            <div class="detail-row">
                                <div class="detail-label">Invoice ID:</div>
                                <div class="detail-value">${invoiceId}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Invoice Date:</div>
                                <div class="detail-value">${invoiceDate}</div>
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
                        
                        <div class="total-section">
                            Total Amount Due: $${totalAmount.toFixed(2)}
                        </div>
                        
                        <p style="color: #5a5a5a; margin-bottom: 0; text-align: center; font-size: 14px;">
                            Payment is due within 30 days. Please contact us if you have any questions about payment arrangements.
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
Invoice from Stellar Tree Management - ${invoiceId}

Hello ${clientName},

Thank you for choosing Stellar Tree Management! Your tree services have been completed. Please find your invoice below for the work performed.

📋 Invoice Details:
- Invoice ID: ${invoiceId}
- Invoice Date: ${invoiceDate}

Service Items:
${serviceItems.map(item => `- ${item.description}: ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`).join('\n')}

Total Amount Due: $${totalAmount.toFixed(2)}

Payment is due within 30 days. Please contact us if you have any questions about payment arrangements.

Need Help?
Our team is ready to assist you with any questions about your invoice or payment.

📧 Email: stellartmanagement@outlook.com
🌐 Website: www.stellartreemanagement.ca
📱 Phone: Available on request

Best regards,
The Stellar Tree Management Team
        `;
        
        return await this.sendEmail(email, subject, htmlContent, textContent);
    }

    // Main method for sending invoice emails from bookings (uses improved template)
    async sendInvoiceEmail(email, bookingId, service, totalAmount, workDescription, name, address, notes, serviceItems = []) {
        try {
            const template = generateImprovedInvoiceTemplate(bookingId, service, totalAmount, workDescription, name, address, notes, serviceItems);
            return await this.sendEmail(email, template.subject, template.html, template.text);
        } catch (error) {
            console.error('Error sending invoice email:', error);
            return { success: false, error: error.message };
        }
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

    async sendQuoteAcceptanceEmail(email, bookingId, service, estimatedCost, workDescription, name, address, notes, jobDate = null, jobTime = null) {
        const template = generateImprovedQuoteAcceptanceTemplate(bookingId, service, estimatedCost, workDescription, name, address, notes, jobDate, jobTime);
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
                            <div class="logo">
    <img src="https://www.stellartreemanagement.ca/images/logo.png" alt="Stellar Tree Management Logo" style="width: 100%; height: 100%; object-fit: contain;">
</div>
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
}

module.exports = EmailService;

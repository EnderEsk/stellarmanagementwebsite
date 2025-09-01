// Email-Compatible Quote Request Template
// All styles are inline for maximum email client compatibility
// Tested for Gmail, Outlook, Yahoo Mail, Apple Mail, and mobile clients

function generateImprovedQuoteEmailTemplate(bookingId, service, date, time, name, address, notes) {
    const subject = `Quote Request Received - ${bookingId}`
  
    const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <!-- Updated color scheme meta tags to prevent dark mode inversion -->
      <meta name="color-scheme" content="light only">
      <meta name="supported-color-schemes" content="light">
      <title>Quote Request Received - ${bookingId}</title>
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
                          <!-- Removed accent stripe from header -->
                          <td class="email-header" style="background-color: #2a2a2a !important; padding: 40px 30px; position: relative; color-scheme: light only;">
                              <!-- Logo Column (Left) -->
                              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                      <!-- Logo Column (Left) -->
                                      <td style="width: 100px; vertical-align: middle; padding-right: 20px;">
                                          <div style="width: 70px; height: 70px; border-radius: 50%; background-color: #ffffff !important; border: 3px solid #8cc63f !important; padding: 6px;">
                                              <img src="https://www.stellartreemanagement.ca/images/logo.png" alt="Stellar Tree Management Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain; border: 0; display: block;">
                                          </div>
                                      </td>
                                      
                                      <!-- Business Name and Status Column (Right) -->
                                      <td style="vertical-align: middle; text-align: left;">
                                          <!-- Added !important to force white text color -->
                                          <h1 style="color: #ffffff !important; font-size: 28px; font-weight: 700; margin: 0 0 15px 0; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Stellar Tree Management</h1>
                                          <div class="status-badge" style="background-color: #4a90e2 !important; color: #ffffff !important; padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Quote Request</div>
                                      </td>
                                  </tr>
                              </table>
                              
                              <!-- Mobile Layout (Hidden by default, shown on mobile) -->
                              <!--[if !mso]><!-->
                              <div style="display: none;">
                                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="display: none;">
                                      <tr>
                                          <td align="center" style="padding-bottom: 20px;">
                                              <div style="width: 70px; height: 70px; border-radius: 50%; background-color: #ffffff !important; display: inline-block; border: 3px solid #8cc63f !important; padding: 6px;">
                                                  <img src="https://www.stellartreemanagement.ca/images/logo.png" alt="Stellar Tree Management Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain; border: 0; display: block;">
                                              </div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td align="center">
                                              <!-- Added !important to force white text color in mobile layout -->
                                              <h1 style="color: #ffffff !important; font-size: 24px; font-weight: 700; margin: 0 0 15px 0; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Stellar Tree Management</h1>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td align="center">
                                              <div style="background-color: #4a90e2 !important; color: #ffffff !important; padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Quote Request</div>
                                          </td>
                                      </tr>
                                  </table>
                              </div>
                              <!--<![endif]-->
                              
                              <!-- Added media query styles for mobile responsiveness -->
                              <style type="text/css">
                                  @media only screen and (max-width: 600px) {
                                      .desktop-header { display: none !important; }
                                      .mobile-header { display: block !important; }
                                      .mobile-header table { display: table !important; }
                                  }
                                  /* Added CSS to prevent dark mode color inversion */
                                  @media (prefers-color-scheme: dark) {
                                      .email-header { background-color: #2a2a2a !important; }
                                      .email-header h1 { color: #ffffff !important; }
                                      .email-header .status-badge { background-color: #4a90e2 !important; color: #ffffff !important; }
                                  }
                              </style>
                              
                              <!-- Removed accent stripe div from bottom of header -->
                          </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                          <td style="padding: 40px 30px; background-color: #ffffff;">
                              
                              <!-- Greeting -->
                              <h2 style="font-size: 22px; font-weight: 600; color: #2a2a2a; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Hello ${name},</h2>
                              
                              <!-- Intro Text -->
                              <p style="font-size: 16px; color: #5a5a5a; margin: 0 0 30px 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                  Thank you for submitting your quote request with Stellar Tree Management! We've received your request and our team will review it promptly. Here's a summary of your request:
                              </p>
                              
                              <!-- Quote Details -->
                              <!-- Removed accent stripe from request summary section -->
                              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-left: 4px solid #4a90e2; border-radius: 8px; margin: 30px 0;">
                                  <tr>
                                      <td style="padding: 30px;">
                                          
                                          <!-- Section Title -->
                                          <h3 style="font-size: 18px; font-weight: 700; color: #2a2a2a; margin: 0 0 25px 0; text-align: center; text-transform: uppercase; letter-spacing: 1px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                              Request Summary
                                          </h3>
                                          
                                          <!-- Detail Items -->
                                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                              <tr>
                                                  <td style="padding: 0 0 18px 0; border-bottom: 1px solid #e9ecef;">
                                                      <div style="font-size: 12px; font-weight: 600; color: #5a5a5a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Request ID</div>
                                                      <div style="font-size: 16px; font-weight: 600; color: #2a2a2a; word-wrap: break-word; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${bookingId}</div>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 18px 0; border-bottom: 1px solid #e9ecef;">
                                                      <div style="font-size: 12px; font-weight: 600; color: #5a5a5a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Date & Time</div>
                                                      <div style="font-size: 16px; font-weight: 600; color: #2a2a2a; word-wrap: break-word; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${date} at ${time}</div>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 18px 0; border-bottom: 1px solid #e9ecef;">
                                                      <div style="font-size: 12px; font-weight: 600; color: #5a5a5a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Service Type</div>
                                                      <div style="font-size: 16px; font-weight: 600; color: #2a2a2a; word-wrap: break-word; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${service}</div>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 18px 0; ${notes ? "border-bottom: 1px solid #e9ecef;" : ""}">
                                                      <div style="font-size: 12px; font-weight: 600; color: #5a5a5a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Service Address</div>
                                                      <div style="font-size: 16px; font-weight: 600; color: #2a2a2a; word-wrap: break-word; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${address}</div>
                                                  </td>
                                              </tr>
                                              ${
                                                notes
                                                  ? `
                                              <tr>
                                                  <td style="padding: 18px 0 0 0;">
                                                      <div style="font-size: 12px; font-weight: 600; color: #5a5a5a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Additional Notes</div>
                                                      <div style="font-size: 16px; font-weight: 600; color: #2a2a2a; word-wrap: break-word; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${notes}</div>
                                                  </td>
                                              </tr>
                                              `
                                                  : ""
                                              }
                                          </table>
                                          
                                      </td>
                                  </tr>
                              </table>
                              
                              <!-- Next Steps -->
                              <!-- Fixed horizontal stretching for what happens next section -->
                              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f0f8f0; border: 1px solid #8cc63f; border-radius: 8px; margin: 30px 0; width: 100% !important;">
                                  <tr>
                                      <td style="padding: 30px; width: 100%;">
                                          
                                          <!-- Section Title -->
                                          <h3 style="font-size: 18px; font-weight: 700; color: #2a2a2a; margin: 0 0 25px 0; text-align: center; text-transform: uppercase; letter-spacing: 1px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                              What Happens Next?
                                          </h3>
                                          
                                          <!-- Step Items -->
                                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100% !important;">
                                              <tr>
                                                  <td style="padding: 0 0 20px 0; width: 100%;">
                                                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.8); border-radius: 8px; border-left: 3px solid #8cc63f; width: 100% !important;">
                                                          <tr>
                                                              <td style="padding: 15px; vertical-align: top; width: 50px;">
                                                                  <div style="width: 32px; height: 32px; background-color: #8cc63f; color: #ffffff; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">1</div>
                                                              </td>
                                                              <td style="padding: 15px; vertical-align: top; width: calc(100% - 50px);">
                                                                  <div style="font-size: 16px; font-weight: 700; color: #2a2a2a; margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Review Period</div>
                                                                  <div style="font-size: 14px; color: #5a5a5a; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Our team will review your request within 24 hours</div>
                                                              </td>
                                                          </tr>
                                                      </table>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 0 0 20px 0; width: 100%;">
                                                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.8); border-radius: 8px; border-left: 3px solid #8cc63f; width: 100% !important;">
                                                          <tr>
                                                              <td style="padding: 15px; vertical-align: top; width: 50px;">
                                                                  <div style="width: 32px; height: 32px; background-color: #8cc63f; color: #ffffff; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">2</div>
                                                              </td>
                                                              <td style="padding: 15px; vertical-align: top; width: calc(100% - 50px);">
                                                                  <div style="font-size: 16px; font-weight: 700; color: #2a2a2a; margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Quote Preparation</div>
                                                                  <div style="font-size: 14px; color: #5a5a5a; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">We'll prepare a detailed quote based on your requirements</div>
                                                              </td>
                                                          </tr>
                                                      </table>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 0; width: 100%;">
                                                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.8); border-radius: 8px; border-left: 3px solid #8cc63f; width: 100% !important;">
                                                          <tr>
                                                              <td style="padding: 15px; vertical-align: top; width: 50px;">
                                                                  <div style="width: 32px; height: 32px; background-color: #8cc63f; color: #ffffff; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">3</div>
                                                              </td>
                                                              <td style="padding: 15px; vertical-align: top; width: calc(100% - 50px);">
                                                                  <div style="font-size: 16px; font-weight: 700; color: #2a2a2a; margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Contact & Confirmation</div>
                                                                  <div style="font-size: 14px; color: #5a5a5a; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">We'll reach out to discuss the quote and confirm your appointment</div>
                                                              </td>
                                                          </tr>
                                                      </table>
                                                  </td>
                                              </tr>
                                          </table>
                                          
                                      </td>
                                  </tr>
                              </table>
                              
                              <!-- Important Notice -->
                              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fff8e1; border: 1px solid #ff9800; border-radius: 8px; margin: 30px 0;">
                                  <tr>
                                      <td style="padding: 25px; text-align: center; position: relative;">
                                          <div style="font-size: 24px; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background-color: #fff8e1; padding: 0 10px;">⚠️</div>
                                          <h4 style="font-size: 18px; font-weight: 700; color: #e65100; margin: 8px 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Important Notice</h4>
                                          <p style="font-size: 14px; color: #f57c00; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">This is a quote request. Your appointment is not yet confirmed. We will contact you within 24 hours to discuss pricing and confirm your booking.</p>
                                      </td>
                                  </tr>
                              </table>
                              
                              <!-- Contact Section -->
                              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; margin: 30px 0;">
                                  <tr>
                                      <td style="padding: 25px; text-align: center;">
                                          <p style="font-size: 15px; color: #5a5a5a; margin: 0; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                              If you have any questions or need to make changes to your request, please contact us at 
                                              <a href="mailto:stellartmanagement@outlook.com" style="color: #4a90e2; text-decoration: none; font-weight: 600;">stellartmanagement@outlook.com</a>
                                          </p>
                                      </td>
                                  </tr>
                              </table>
                              
                          </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                          <!-- Added !important and color-scheme to footer background -->
                          <td style="background-color: #2a2a2a !important; padding: 30px; text-align: center; color-scheme: light only;">
                              
                              <!-- Contact Items -->
                              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                      <td align="center" style="padding-bottom: 20px;">
                                          <!-- Added !important to footer text colors -->
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
      `
  
    const textContent = `
  Dear ${name},
  
  Thank you for submitting your quote request with Stellar Tree Management! We've received your request and our team will review it promptly.
  
  Your Quote Request Details:
  - Request ID: ${bookingId}
  - Service Requested: ${service}
  - Preferred Date: ${date}
  - Preferred Time: ${time}
  - Service Address: ${address}
  ${notes ? `- Additional Notes: ${notes}` : ""}
  
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
      `
  
    return { html: htmlContent, text: textContent, subject: subject }
  }
  
  module.exports = { generateImprovedQuoteEmailTemplate }
  
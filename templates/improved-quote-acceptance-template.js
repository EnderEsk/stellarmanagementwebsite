const generateImprovedQuoteAcceptanceTemplate = (
    bookingId,
    service,
    estimatedCost,
    workDescription,
    name,
    address,
    notes,
    scheduledDate,
    scheduledTime,
  ) => {
    const subject = `Job Confirmed - ${bookingId} - Your Tree Service is Scheduled!`
  
    const htmlContent = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>Job Confirmed - ${bookingId}</title>
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
                            <!-- Applied stellar template header layout with logo left, business info right -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="120" valign="middle" style="padding-right: 20px;">
                                        <!-- Logo -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
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
                                                    Job Confirmed ✓
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
                            <!-- Made entire green box clickable and moved higher up, added greeting to header -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 15px 0;">
                                <tr>
                                    <td>
                                        <a href="https://www.stellartreemanagement.ca/booking-status.html?id=${bookingId}" style="text-decoration: none; display: block;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f9f0 !important; border: 2px solid #8cc63f !important; padding: 25px; border-radius: 12px; text-align: center; color-scheme: light only !important; cursor: pointer;">
                                            <tr>
                                                <td style="font-size: 32px; padding-bottom: 15px; color-scheme: light only !important;">🎉</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 18px; font-weight: 600; color: #2a2a2a !important; padding-bottom: 8px; color-scheme: light only !important;">
                                                    Hello ${name}! 🎉
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2a2a2a !important; padding-bottom: 10px; color-scheme: light only !important;">
                                                    All Set, Your Job is Confirmed!
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #2a2a2a !important; font-size: 16px; line-height: 1.6; padding-bottom: 20px; color-scheme: light only !important;">
                                                    Thank you for choosing Stellar Tree Management! Your job is confirmed and scheduled. No further action is required from you at this time.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <span style="background-color: #8cc63f !important; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color-scheme: light only !important;">View Job Status</span>
                                                </td>
                                            </tr>
                                        </table>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Job Details Section -->
                            <!-- Applied stellar template styling to job details section -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="background-color: #f8f9fa !important; padding: 30px; border-radius: 12px; border-left: 6px solid #8cc63f !important; color-scheme: light only !important;">
                                        
                                        <!-- Section Title -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 18px; font-weight: 700; color: #2a2a2a !important; text-align: center; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 25px; color-scheme: light only !important;">
                                                    Job Confirmation Details
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Detail Items -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="background-color: #ffffff !important; padding: 15px 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 15px; color-scheme: light only !important;">
                                                    <div style="font-size: 12px; color: #2a2a2a !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color-scheme: light only !important;">Booking ID</div>
                                                    <div style="font-size: 16px; color: #2a2a2a !important; font-weight: 600; color-scheme: light only !important;">${bookingId}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 15px;">
                                            <tr>
                                                <td style="background-color: #ffffff !important; padding: 15px 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 15px; color-scheme: light only !important;">
                                                    <div style="font-size: 12px; color: #2a2a2a !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color-scheme: light only !important;">Scheduled Date & Time</div>
                                                    <div style="font-size: 16px; color: #2a2a2a !important; font-weight: 600; color-scheme: light only !important;">${scheduledDate} at ${scheduledTime}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 15px;">
                                            <tr>
                                                <td width="48%" style="background-color: #ffffff !important; padding: 15px 20px; border-radius: 8px; border: 1px solid #e5e7eb; vertical-align: top; color-scheme: light only !important;">
                                                    <div style="font-size: 12px; color: #2a2a2a !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color-scheme: light only !important;">Service Type</div>
                                                    <div style="font-size: 16px; color: #2a2a2a !important; font-weight: 600; color-scheme: light only !important;">${service}</div>
                                                </td>
                                                <td width="4%"></td>
                                                <td width="48%" style="background-color: #ffffff !important; padding: 15px 20px; border-radius: 8px; border: 1px solid #e5e7eb; vertical-align: top; color-scheme: light only !important;">
                                                    <div style="font-size: 12px; color: #2a2a2a !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color-scheme: light only !important;">Total Cost</div>
                                                    <div style="font-size: 16px; color: #2a2a2a !important; font-weight: 600; color-scheme: light only !important;">$${estimatedCost}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 15px;">
                                            <tr>
                                                <td style="background-color: #ffffff !important; padding: 15px 20px; border-radius: 8px; border: 1px solid #e5e7eb; color-scheme: light only !important;">
                                                    <div style="font-size: 12px; color: #2a2a2a !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color-scheme: light only !important;">Work Description</div>
                                                    <div style="font-size: 16px; color: #2a2a2a !important; font-weight: 600; color-scheme: light only !important;">${workDescription}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        ${
                                          address
                                            ? `
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 15px;">
                                            <tr>
                                                <td style="background-color: #ffffff !important; padding: 15px 20px; border-radius: 8px; border: 1px solid #e5e7eb; color-scheme: light only !important;">
                                                    <div style="font-size: 12px; color: #2a2a2a !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color-scheme: light only !important;">Service Address</div>
                                                    <div style="font-size: 16px; color: #2a2a2a !important; font-weight: 600; color-scheme: light only !important;">${address}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        `
                                            : ""
                                        }
                                        
                                        ${
                                          notes
                                            ? `
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 15px;">
                                            <tr>
                                                <td style="background-color: #ffffff !important; padding: 15px 20px; border-radius: 8px; border: 1px solid #e5e7eb; color-scheme: light only !important;">
                                                    <div style="font-size: 12px; color: #2a2a2a !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color-scheme: light only !important;">Additional Notes</div>
                                                    <div style="font-size: 16px; color: #2a2a2a !important; font-weight: 600; color-scheme: light only !important;">${notes}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        `
                                            : ""
                                        }
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- What to Expect Section -->
                            <!-- Applied stellar template styling to what to expect section -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="background-color: #f0f9f0 !important; border: 2px solid #8cc63f !important; padding: 30px; border-radius: 12px; color-scheme: light only !important;">
                                        
                                        <!-- Section Title -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 18px; font-weight: 700; color: #2a2a2a !important; text-align: center; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 25px; color-scheme: light only !important;">
                                                    What to Expect
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Step Items -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 20px;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.8) !important; border-radius: 8px; border-left: 3px solid #8cc63f !important;">
                                                        <tr>
                                                            <td width="50" style="padding: 15px; vertical-align: top;">
                                                                <div style="width: 32px; height: 32px; background-color: #8cc63f !important; color: #ffffff !important; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px;">1</div>
                                                            </td>
                                                            <td style="padding: 15px; vertical-align: top;">
                                                                <div style="font-size: 16px; font-weight: 700; color: #2a2a2a !important; margin-bottom: 5px;">Day Before Service</div>
                                                                <div style="font-size: 14px; color: #5a5a5a !important; line-height: 1.5;">We'll call to confirm your appointment and arrival time</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 20px;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.8) !important; border-radius: 8px; border-left: 3px solid #8cc63f !important;">
                                                        <tr>
                                                            <td width="50" style="padding: 15px; vertical-align: top;">
                                                                <div style="width: 32px; height: 32px; background-color: #8cc63f !important; color: #ffffff !important; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px;">2</div>
                                                            </td>
                                                            <td style="padding: 15px; vertical-align: top;">
                                                                <div style="font-size: 16px; font-weight: 700; color: #2a2a2a !important; margin-bottom: 5px;">Service Day</div>
                                                                <div style="font-size: 14px; color: #5a5a5a !important; line-height: 1.5;">Our professional team will arrive and complete your tree service</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.8) !important; border-radius: 8px; border-left: 3px solid #8cc63f !important;">
                                                        <tr>
                                                            <td width="50" style="padding: 15px; vertical-align: top;">
                                                                <div style="width: 32px; height: 32px; background-color: #8cc63f !important; color: #ffffff !important; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px;">3</div>
                                                            </td>
                                                            <td style="padding: 15px; vertical-align: top;">
                                                                <div style="font-size: 16px; font-weight: 700; color: #2a2a2a !important; margin-bottom: 5px;">Completion & Cleanup</div>
                                                                <div style="font-size: 14px; color: #5a5a5a !important; line-height: 1.5;">We'll complete the work and ensure your property is left clean and tidy</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Contact Section -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="background-color: #f8f9fa !important; border-radius: 8px; border: 1px solid #e5e7eb; padding: 25px; text-align: center; color-scheme: light only !important;">
                                        <p style="font-size: 15px; color: #5a5a5a !important; margin: 0; line-height: 1.6;">
                                            If you need to reschedule or have any questions, please contact us at 
                                            <a href="mailto:stellartmanagement@outlook.com" style="color: #4a90e2 !important; text-decoration: none; font-weight: 600;">stellartmanagement@outlook.com</a>
                                        </p>
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
      `
  
    const textContent = `
  Job Confirmed - ${bookingId}
  
  Hello ${name}
  
  All Set, Your Job is Confirmed!
  
  Thank you for choosing Stellar Tree Management! Your job is confirmed and scheduled. No further action is required from you at this time.
  
  Job Confirmation Details:
  - Booking ID: ${bookingId}
  - Scheduled Date & Time: ${scheduledDate} at ${scheduledTime}
  - Service Type: ${service}
  - Total Cost: $${estimatedCost}
  - Work Description: ${workDescription}
  ${address ? `- Service Address: ${address}` : ""}
  ${notes ? `- Additional Notes: ${notes}` : ""}
  
  What to Expect:
  1. Day Before Service: We'll call to confirm your appointment and arrival time
  2. Service Day: Our professional team will arrive and complete your tree service
  3. Completion & Cleanup: We'll complete the work and ensure your property is left clean and tidy
  
  If you need to reschedule or have any questions, please contact us at stellartmanagement@outlook.com
  
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
  
  module.exports = { generateImprovedQuoteAcceptanceTemplate }
  
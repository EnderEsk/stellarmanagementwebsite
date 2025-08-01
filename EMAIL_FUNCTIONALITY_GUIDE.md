# Email Functionality Guide

## Overview

The Stellar Tree Management system now includes email functionality for quotes and invoices. When a quote or invoice is created, users can send an email directly to the customer from the preview modal.

## Features

### Quote Email
- **From**: stellartmanagement@outlook.com
- **Subject**: Quote - [Quote ID]
- **Content**: Includes quote details, service items, and total amount
- **Button**: Blue "Send Email" button in quote preview modal

### Invoice Email
- **From**: stellartmanagement@outlook.com
- **Subject**: Invoice - [Invoice ID]
- **Content**: Includes invoice details, service items, total amount, and payment request
- **Button**: Blue "Send Email" button in invoice preview modal

## How to Use

### Sending Quote Emails
1. Create or edit a quote in the admin panel
2. Click "Save Quote" to generate the quote preview
3. In the quote preview modal, click the "Send Email" button
4. The system will send an email to the customer's email address
5. A success notification will appear confirming the email was sent

### Sending Invoice Emails
1. Create an invoice from a quote in the admin panel
2. Click "Create Invoice" to generate the invoice preview
3. In the invoice preview modal, click the "Send Email" button
4. The system will send an email to the customer's email address
5. A success notification will appear confirming the email was sent

## Email Content

### Quote Email Template
```
Dear [Customer Name],

Thank you for your interest in Stellar Tree Management services!

Please find your quote details below:

Quote ID: [Quote ID]
Date: [Quote Date]

Service Items:
- [Service Description]: [Quantity] x $[Price] = $[Total]
- [Additional Services...]

Total Amount: $[Total Amount]

Please review this quote and contact us if you have any questions.

Best regards,
Stellar Tree Management Team
Email: stellartmanagement@outlook.com
```

### Invoice Email Template
```
Dear [Customer Name],

Please find your invoice from Stellar Tree Management below:

Invoice ID: [Invoice ID]
Date: [Invoice Date]

Service Items:
- [Service Description]: [Quantity] x $[Price] = $[Total]
- [Additional Services...]

Total Amount: $[Total Amount]

Please remit payment as soon as possible. Thank you for your business!

Best regards,
Stellar Tree Management Team
Email: stellartmanagement@outlook.com
```

## Technical Implementation

### Backend API Endpoints
- `POST /api/quotes/:quoteId/email` - Send quote email
- `POST /api/invoices/:invoiceId/email` - Send invoice email

### Frontend Functions
- `sendQuoteEmail()` - Handles quote email sending
- `sendInvoiceEmail()` - Handles invoice email sending

### Email Functions
- `sendQuoteEmail()` - Server-side quote email function
- `sendInvoiceEmail()` - Server-side invoice email function

## Current Status

**Note**: The email functionality is currently implemented as a placeholder that logs the email content to the console. In a production environment, you would need to integrate with an email service such as:

- SendGrid
- Mailgun
- AWS SES
- Nodemailer with SMTP

The email content is properly formatted and ready for integration with any email service provider.

## Error Handling

The system includes proper error handling for:
- Missing quote/invoice data
- Network errors
- Invalid quote/invoice IDs
- Database errors

Users will receive appropriate notifications for both success and error cases.

## Future Enhancements

Potential improvements for the email system:
1. Email templates with HTML formatting
2. PDF attachments for quotes/invoices
3. Email tracking and delivery status
4. Email history and resend functionality
5. Customizable email templates
6. Bulk email sending for multiple quotes/invoices 
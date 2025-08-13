# MailerSend Integration Setup Guide

This guide will help you set up MailerSend to send professional emails for quotes, invoices, and booking confirmations in your Stellar Tree Management system.

## 🚨 IMPORTANT: Trial Account Restrictions

**Your MailerSend trial account has these restrictions:**
1. **Domain Verification Required**: The from.email domain must be verified in your account
2. **Recipient Restriction**: Trial accounts can only send emails to the administrator's email
3. **Limited Sending**: 100 emails per day

## 🚀 Quick Start - Fix Trial Account Issues

### Option 1: Verify Your Domain (Recommended for Production)

1. **Go to MailerSend Dashboard**
   - Login to [MailerSend.com](https://www.mailersend.com)
   - Navigate to **Domains** section

2. **Add Your Domain**
   - Click **Add Domain**
   - Enter: `stellartreemanagement.ca`
   - Follow the DNS verification steps

3. **Update DNS Records**
   Add these records to your domain's DNS:
   ```
   Type: TXT
   Name: @
   Value: mailersend-verification=your_verification_code
   
   Type: TXT
   Name: @
   Value: v=spf1 include:mailersend.net ~all
   
   Type: CNAME
   Name: mailersend
   Value: mailersend.net
   ```

4. **Wait for Verification** (can take up to 48 hours)

5. **Update Config**
   Once verified, update `config.js`:
   ```javascript
   MAILERSEND_FROM_EMAIL: 'noreply@stellartreemanagement.ca'
   ```

### Option 2: Use Verified Email (Quick Fix for Testing)

1. **Verify Your Email in MailerSend**
   - Go to **Senders** section
   - Add your email: `endereeska@gmail.com`
   - Check your email for verification link
   - Click the verification link

2. **Current Config is Already Set**
   Your `config.js` is already configured to use your verified email:
   ```javascript
   MAILERSEND_FROM_EMAIL: 'endereeska@gmail.com'
   ```

## 📧 Email Types Available

### 1. Quote Emails
- **When sent:** When creating/sending quotes to customers
- **Content:** Service details, pricing, quote ID
- **Design:** Professional green theme with clear pricing breakdown

### 2. Invoice Emails
- **When sent:** When sending invoices to customers
- **Content:** Service details, total amount, payment instructions
- **Design:** Professional red theme with payment call-to-action

### 3. Booking Confirmation Emails
- **When sent:** When customers book appointments
- **Content:** Booking details, confirmation link, next steps
- **Design:** Professional green theme with action buttons

### 4. Final Booking Confirmation Emails
- **When sent:** When bookings are confirmed by staff
- **Content:** Confirmed details, arrival instructions, contact info
- **Design:** Success-themed with clear instructions

## 🧪 Testing the Integration

### Current Status
✅ **Email Service**: Fully implemented and integrated
✅ **API Integration**: Connected to your MailerSend account
✅ **Email Templates**: Professional HTML templates ready
✅ **Server Endpoints**: All email endpoints updated

### Test the Integration
```bash
node test-mailersend.js
```

**Expected Results:**
- If using verified email: ✅ All tests should pass
- If domain not verified: ❌ Domain verification error
- If trial restrictions: ❌ Recipient restriction error

## 🔧 How to Use in Your System

### 1. Send Quote Email
- In admin panel, view a quote
- Click **"Send Email"** button
- Email will be sent via MailerSend with professional template

### 2. Send Invoice Email
- In admin panel, view an invoice
- Click **"Send Email"** button
- Email will be sent via MailerSend with payment instructions

### 3. Send Booking Confirmations
- When admin confirms a booking
- System automatically sends confirmation email
- Customer gets professional email with booking details

## 🚨 Current Issues & Solutions

### Issue 1: Domain Not Verified
**Error:** "The from.email domain must be verified in your account"
**Solution:** Follow Option 1 above to verify your domain

### Issue 2: Trial Account Recipient Restriction
**Error:** "Trial accounts can only send emails to the administrator's email"
**Solution:** 
- For testing: Send to your email only
- For production: Upgrade to paid plan or verify domain

### Issue 3: Email Not Received
**Solutions:**
- Check spam/junk folders
- Verify recipient email addresses
- Check MailerSend delivery logs

## 💰 Pricing & Upgrade Options

### Current Trial Plan
- **Cost:** Free
- **Emails:** 100 per day
- **Restrictions:** Domain verification, recipient limits

### Recommended Upgrade
- **Starter Plan:** $25/month for 25,000 emails
- **Benefits:** No domain restrictions, send to any email
- **Perfect for:** Small business needs

## 🔒 Security Best Practices

### API Key Security
- ✅ API key is stored in `config.js` (not committed to git)
- ✅ Never share your API key publicly
- ✅ Rotate keys regularly

### Email Security
- ✅ Verify sender domains
- ✅ Implement SPF, DKIM, and DMARC
- ✅ Monitor for suspicious activity

## 📱 Mobile Optimization

All email templates are mobile-responsive and include:
- Responsive CSS design
- Mobile-friendly button sizes
- Optimized text formatting
- Touch-friendly navigation

## 🎯 Next Steps

### Immediate Actions
1. **Verify your email** in MailerSend dashboard
2. **Test the integration** with `node test-mailersend.js`
3. **Send test emails** from your admin panel

### Production Setup
1. **Verify your domain** `stellartreemanagement.ca`
2. **Update config** to use domain email
3. **Test with real customers**
4. **Monitor delivery rates**

### Customization
1. **Add your company logo** to email templates
2. **Update color schemes** to match your brand
3. **Modify email content** as needed
4. **Add tracking links** for analytics

## 📞 Support

### MailerSend Support
- **Documentation:** [docs.mailersend.com](https://docs.mailersend.com)
- **Support:** Available in your MailerSend dashboard
- **Community:** [MailerSend Community](https://community.mailersend.com)

### Your System
- Check server logs for detailed error messages
- Use the test script to verify functionality
- Review this guide for common solutions

---

## 🎉 Current Status

**✅ COMPLETED:**
- Email service fully implemented
- MailerSend API integration
- Professional email templates
- Server endpoints updated
- Configuration file created

**🔄 NEXT STEPS:**
1. Verify your email in MailerSend
2. Test the integration
3. Start sending emails to customers

**Need Help?** If you encounter issues, check the troubleshooting section above or contact your development team.

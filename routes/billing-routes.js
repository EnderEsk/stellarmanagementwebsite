/**
 * Billing API Routes
 * Handles all billing-related API endpoints
 */

const express = require('express');
const router = express.Router();
const billingService = require('../services/billing-service');
const EmailService = require('../email-service');

// Initialize email service instance
const emailService = new EmailService();

// Authentication middleware - reuse existing admin auth pattern
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Admin authentication required' });
    }
    
    // Extract email from Bearer token (matches existing pattern)
    const token = authHeader.replace('Bearer ', '');
    const email = token; // The token is the email address from OAuth
    
    // Get allowed emails from environment
    const allowedEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',') || [];
    
    // Check if email is in allowed list
    if (!allowedEmails.includes(email)) {
        return res.status(403).json({ error: 'Access denied. This email is not authorized to access the admin panel.' });
    }
    
    // Add admin info to request (matches existing pattern)
    req.user = { email: email };
    req.adminEmail = email;
    req.adminId = email; // Use email as ID
    
    next();
}

// Error handling middleware for billing routes
function billingErrorHandler(err, req, res, next) {
    console.error('Billing API Error:', err);
    
    // Stripe-specific errors
    if (err.type && err.type.startsWith('Stripe')) {
        if (err.type === 'StripeCardError') {
            return res.status(400).json({
                error: 'card_error',
                message: err.message
            });
        }
        
        if (err.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
                error: 'invalid_request',
                message: 'Invalid payment request'
            });
        }
        
        if (err.type === 'StripeAPIError') {
            return res.status(500).json({
                error: 'api_error',
                message: 'Payment service temporarily unavailable'
            });
        }
    }
    
    // Generic errors
    res.status(500).json({
        error: 'server_error',
        message: err.message || 'An unexpected error occurred'
    });
}

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/billing/config
 * Returns payment mode and configuration
 */
router.get('/config', async (req, res, next) => {
    try {
        const config = billingService.getBillingConfig();
        res.json(config);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/balance
 * Get remaining balance for admin
 */
router.get('/balance', async (req, res, next) => {
    try {
        const { adminEmail } = req;
        const remainingBalance = await billingService.getRemainingBalance(adminEmail);
        res.json({
            remainingBalance: remainingBalance
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/update-balance
 * Update remaining balance after payment
 */
router.post('/update-balance', async (req, res, next) => {
    try {
        const { adminEmail } = req;
        const { paymentAmount } = req.body;
        
        if (!paymentAmount || paymentAmount < 0) {
            return res.status(400).json({
                error: 'invalid_amount',
                message: 'Invalid payment amount'
            });
        }
        
        const newBalance = await billingService.updateRemainingBalance(adminEmail, paymentAmount);
        
        res.json({
            success: true,
            newBalance: newBalance,
            paymentAmount: paymentAmount
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/customer
 * Get or create Stripe customer for admin
 */
router.get('/customer', async (req, res, next) => {
    try {
        const { adminEmail, adminId } = req;
        
        // Get or create customer
        const customer = await billingService.getOrCreateCustomer(adminEmail, adminId);
        
        // Get payment methods
        const paymentMethods = await billingService.getCustomerPaymentMethods(customer.id);
        
        // Get subscription (if in subscription mode)
        let subscription = null;
        if (billingService.paymentMode === 'subscription') {
            subscription = await billingService.getCustomerSubscription(customer.id);
        }
        
        res.json({
            id: customer.id,
            email: customer.email,
            paymentMethods,
            subscription
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/payment-methods
 * Get all payment methods for the admin
 */
router.get('/payment-methods', async (req, res, next) => {
    try {
        const { adminEmail, adminId } = req;
        
        // Get customer
        const customer = await billingService.getOrCreateCustomer(adminEmail, adminId);
        
        // Get payment methods
        const paymentMethods = await billingService.getCustomerPaymentMethods(customer.id);
        
        res.json(paymentMethods);
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/payment-methods
 * Add new payment method
 */
router.post('/payment-methods', async (req, res, next) => {
    try {
        const { adminEmail, adminId } = req;
        const { paymentMethodId } = req.body;
        
        if (!paymentMethodId) {
            return res.status(400).json({ error: 'Payment method ID is required' });
        }
        
        // Get customer
        const customer = await billingService.getOrCreateCustomer(adminEmail, adminId);
        
        // Add payment method
        await billingService.addPaymentMethod(customer.id, paymentMethodId);
        
        // Return updated payment methods list
        const paymentMethods = await billingService.getCustomerPaymentMethods(customer.id);
        
        res.json({
            success: true,
            paymentMethods
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/billing/payment-methods/:id
 * Remove payment method
 */
router.delete('/payment-methods/:id', async (req, res, next) => {
    try {
        const { id: paymentMethodId } = req.params;
        
        if (!paymentMethodId) {
            return res.status(400).json({ error: 'Payment method ID is required' });
        }
        
        // Remove payment method
        await billingService.removePaymentMethod(paymentMethodId);
        
        res.json({
            success: true,
            message: 'Payment method removed successfully'
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/subscription
 * Get current subscription status
 */
router.get('/subscription', async (req, res, next) => {
    try {
        const { adminEmail, adminId } = req;
        
        // Get customer
        const customer = await billingService.getOrCreateCustomer(adminEmail, adminId);
        
        // Get subscription
        const subscription = await billingService.getCustomerSubscription(customer.id);
        
        if (!subscription) {
            return res.json({ subscription: null });
        }
        
        // Format subscription data for frontend
        const subscriptionData = {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            plan: {
                amount: subscription.items.data[0].price.unit_amount,
                currency: subscription.items.data[0].price.currency,
                interval: subscription.items.data[0].price.recurring.interval
            }
        };
        
        res.json({ subscription: subscriptionData });
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/subscription
 * Create or update subscription
 */
router.post('/subscription', async (req, res, next) => {
    try {
        const { adminEmail, adminId } = req;
        const { billingInfo } = req.body;
        
        // Get customer
        const customer = await billingService.getOrCreateCustomer(adminEmail, adminId);
        
        // Check if customer has payment methods
        const paymentMethods = await billingService.getCustomerPaymentMethods(customer.id);
        if (paymentMethods.length === 0) {
            return res.status(400).json({ 
                error: 'payment_method_required',
                message: 'Please add a payment method first' 
            });
        }
        
        // Create subscription
        const subscription = await billingService.createSubscription(customer.id);
        
        // Format response
        const subscriptionData = {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            plan: {
                amount: subscription.items.data[0].price.unit_amount,
                currency: subscription.items.data[0].price.currency,
                interval: subscription.items.data[0].price.recurring.interval
            }
        };
        
        // Send receipt email if billing info provided
        if (billingInfo && billingInfo.email) {
            try {
                await sendReceiptEmail(billingInfo, subscriptionData, 'subscription');
            } catch (emailError) {
                console.error('Failed to send receipt email:', emailError);
                // Don't fail the request if email fails
            }
        }
        
        res.json({
            success: true,
            subscription: subscriptionData
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/billing/subscription
 * Cancel subscription
 */
router.delete('/subscription', async (req, res, next) => {
    try {
        const { adminEmail, adminId } = req;
        const { immediately = false } = req.body;
        
        // Get customer
        const customer = await billingService.getOrCreateCustomer(adminEmail, adminId);
        
        // Get current subscription
        const subscription = await billingService.getCustomerSubscription(customer.id);
        
        if (!subscription) {
            return res.status(404).json({ 
                error: 'subscription_not_found',
                message: 'No active subscription found' 
            });
        }
        
        // Cancel subscription
        const cancelledSubscription = await billingService.cancelSubscription(
            subscription.id, 
            immediately
        );
        
        res.json({
            success: true,
            subscription: {
                id: cancelledSubscription.id,
                status: cancelledSubscription.status,
                cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
                canceled_at: cancelledSubscription.canceled_at
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/payment-intent
 * Create one-time payment intent
 */
router.post('/payment-intent', async (req, res, next) => {
    try {
        const { adminEmail, adminId } = req;
        const { amount, billingInfo, paymentMethodId } = req.body;
        
        // Use configured amount if not provided
        const paymentAmount = amount || billingService.subscriptionAmount;
        
        if (!paymentAmount || paymentAmount < 50) { // Stripe minimum is $0.50
            return res.status(400).json({ 
                error: 'invalid_amount',
                message: 'Invalid payment amount' 
            });
        }
        
        // Get customer
        const customer = await billingService.getOrCreateCustomer(adminEmail, adminId);
        
        // Create payment intent with payment method if provided
        const paymentIntent = await billingService.createPaymentIntent(
            customer.id, 
            paymentAmount,
            'usd',
            paymentMethodId
        );
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount: paymentIntent.amount,
            paymentIntentId: paymentIntent.id
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/payment-history
 * Get payment history
 */
router.get('/payment-history', async (req, res, next) => {
    try {
        const { adminEmail, adminId } = req;
        const { limit = 10 } = req.query;
        
        // Get customer
        const customer = await billingService.getOrCreateCustomer(adminEmail, adminId);
        
        // Get payment history
        const payments = await billingService.getPaymentHistory(
            customer.id, 
            parseInt(limit)
        );
        
        res.json(payments);
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/log-error
 * Log frontend errors for monitoring
 */
router.post('/log-error', async (req, res, next) => {
    try {
        const { error, context, timestamp } = req.body;
        const { adminEmail } = req;
        
        console.error('Frontend Billing Error:', {
            adminEmail,
            error,
            context,
            timestamp,
            userAgent: req.headers['user-agent']
        });
        
        res.json({ success: true });
        
    } catch (error) {
        next(error);
    }
});

// Helper function to send receipt email
async function sendReceiptEmail(billingInfo, paymentData, paymentType) {
    const amount = paymentType === 'subscription' 
        ? paymentData.plan.amount 
        : paymentData.amount;
    const amountFormatted = (amount / 100).toFixed(2);
    
    const paymentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const subject = paymentType === 'subscription' 
        ? `Subscription Receipt - ${amountFormatted}`
        : `Payment Receipt - $${amountFormatted}`;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Receipt</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2a2a2a; background-color: #f8f9fa;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #2a2a2a; color: #ffffff; padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
                                        💳 Payment Receipt
                                    </h1>
                                    <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 16px;">
                                        Stellar Tree Management
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #2a2a2a;">
                                        Thank you for your payment! This is your receipt for the transaction.
                                    </p>
                                    
                                    <!-- Payment Details -->
                                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                        <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #2a2a2a;">
                                            Payment Details
                                        </h2>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Payment Type:</td>
                                                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2a2a2a; font-size: 14px;">
                                                    ${paymentType === 'subscription' ? 'Monthly Subscription' : 'One-Time Payment'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Amount:</td>
                                                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #2a2a2a; font-size: 18px;">
                                                    $${amountFormatted}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Date:</td>
                                                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2a2a2a; font-size: 14px;">
                                                    ${paymentDate}
                                                </td>
                                            </tr>
                                            ${paymentData.statement_descriptor ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Statement Descriptor:</td>
                                                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2a2a2a; font-size: 14px;">
                                                    ${paymentData.statement_descriptor}
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${paymentType === 'subscription' && paymentData.current_period_end ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Next Billing:</td>
                                                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2a2a2a; font-size: 14px;">
                                                    ${new Date(paymentData.current_period_end * 1000).toLocaleDateString()}
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </div>
                                    
                                    <!-- Billing Information -->
                                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                        <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #2a2a2a;">
                                            Billing Information
                                        </h2>
                                        <p style="margin: 0; font-size: 14px; color: #2a2a2a; line-height: 1.8;">
                                            ${billingInfo.fullName || ''}<br>
                                            ${billingInfo.address || ''}<br>
                                            ${billingInfo.city || ''}, ${billingInfo.state || ''} ${billingInfo.zip || ''}<br>
                                            ${billingInfo.email || ''}
                                        </p>
                                    </div>
                                    
                                    <p style="margin: 20px 0 0 0; font-size: 14px; color: #6c757d; text-align: center;">
                                        If you have any questions about this receipt, please contact us.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0; font-size: 12px; color: #6c757d;">
                                        © ${new Date().getFullYear()} Stellar Tree Management. All rights reserved.
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
    
    await emailService.sendEmail(billingInfo.email, subject, htmlContent);
}

// Add endpoint to send receipt after payment confirmation
router.post('/send-receipt', async (req, res, next) => {
    try {
        const { billingInfo, paymentData, paymentType } = req.body;
        
        if (!billingInfo || !billingInfo.email) {
            return res.status(400).json({ error: 'Billing information with email is required' });
        }
        
        await sendReceiptEmail(billingInfo, paymentData, paymentType || 'one-time');
        
        res.json({ success: true, message: 'Receipt email sent successfully' });
        
    } catch (error) {
        next(error);
    }
});

// Apply error handling middleware
router.use(billingErrorHandler);

module.exports = router;
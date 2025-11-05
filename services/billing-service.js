/**
 * Billing Service
 * Handles all Stripe API interactions for admin billing
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDatabase } = require('../database');

class BillingService {
    constructor() {
        this.paymentMode = process.env.PAYMENT_MODE || 'subscription';
        this.subscriptionPriceId = process.env.SUBSCRIPTION_PRICE_ID;
        this.subscriptionAmount = parseInt(process.env.SUBSCRIPTION_AMOUNT) || 2999;
        this.customPriceId = process.env.CUSTOM_PRICE_ID;
        this.initialBalance = parseInt(process.env.INITIAL_BALANCE) || 244300; // $2443.00 in cents
        
        console.log('BillingService initialized:', {
            paymentMode: this.paymentMode,
            subscriptionPriceId: this.subscriptionPriceId,
            subscriptionAmount: this.subscriptionAmount,
            customPriceId: this.customPriceId,
            initialBalance: this.initialBalance
        });
    }

    /**
     * Get or create a Stripe customer for the admin
     * @param {string} adminEmail - Admin's email address
     * @param {string} adminId - Admin's unique ID
     * @returns {Promise<Object>} Stripe customer object
     */
    async getOrCreateCustomer(adminEmail, adminId) {
        try {
            const db = getDatabase();
            const billingCollection = db.collection('admin_billing');

            // Check if customer exists in our database
            let billingRecord = await billingCollection.findOne({ admin_email: adminEmail });

            if (billingRecord && billingRecord.stripe_customer_id) {
                // Verify customer still exists in Stripe
                try {
                    const customer = await stripe.customers.retrieve(billingRecord.stripe_customer_id);
                    if (!customer.deleted) {
                        console.log('Found existing Stripe customer:', customer.id);
                        return customer;
                    }
                } catch (error) {
                    console.log('Stripe customer not found, creating new one');
                }
            }

            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: adminEmail,
                description: `Admin billing for ${adminEmail}`,
                metadata: {
                    admin_id: adminId,
                    admin_email: adminEmail,
                    created_by: 'stellar-tree-management'
                }
            });

            console.log('Created new Stripe customer:', customer.id);

            // Store or update in database
            await billingCollection.updateOne(
                { admin_email: adminEmail },
                {
                    $set: {
                        admin_email: adminEmail,
                        admin_id: adminId,
                        stripe_customer_id: customer.id,
                        updated_at: new Date()
                    },
                    $setOnInsert: {
                        created_at: new Date()
                    }
                },
                { upsert: true }
            );

            return customer;

        } catch (error) {
            console.error('Error in getOrCreateCustomer:', error);
            throw new Error(`Failed to get or create customer: ${error.message}`);
        }
    }

    /**
     * Get all payment methods for a customer
     * @param {string} customerId - Stripe customer ID
     * @returns {Promise<Array>} Array of payment method objects
     */
    async getCustomerPaymentMethods(customerId) {
        try {
            const paymentMethods = await stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });

            // Format payment methods for frontend
            return paymentMethods.data.map(pm => ({
                id: pm.id,
                type: pm.type,
                card: {
                    brand: pm.card.brand,
                    last4: pm.card.last4,
                    exp_month: pm.card.exp_month,
                    exp_year: pm.card.exp_year
                },
                is_default: false // We'll determine this based on customer's default payment method
            }));

        } catch (error) {
            console.error('Error getting payment methods:', error);
            throw new Error(`Failed to get payment methods: ${error.message}`);
        }
    }

    /**
     * Add a payment method to a customer
     * @param {string} customerId - Stripe customer ID
     * @param {string} paymentMethodId - Stripe payment method ID
     * @returns {Promise<Object>} Updated payment method object
     */
    async addPaymentMethod(customerId, paymentMethodId) {
        try {
            // Attach payment method to customer
            const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });

            // Get current payment methods count
            const existingMethods = await this.getCustomerPaymentMethods(customerId);
            
            // If this is the first payment method, set it as default
            if (existingMethods.length === 0) {
                await stripe.customers.update(customerId, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
            }

            console.log('Added payment method:', paymentMethodId, 'to customer:', customerId);
            return paymentMethod;

        } catch (error) {
            console.error('Error adding payment method:', error);
            throw new Error(`Failed to add payment method: ${error.message}`);
        }
    }

    /**
     * Remove a payment method from a customer
     * @param {string} paymentMethodId - Stripe payment method ID
     * @returns {Promise<Object>} Detached payment method object
     */
    async removePaymentMethod(paymentMethodId) {
        try {
            const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
            console.log('Removed payment method:', paymentMethodId);
            return paymentMethod;

        } catch (error) {
            console.error('Error removing payment method:', error);
            throw new Error(`Failed to remove payment method: ${error.message}`);
        }
    }

    /**
     * Create a subscription for a customer
     * @param {string} customerId - Stripe customer ID
     * @param {string} priceId - Stripe price ID (optional, uses env var if not provided)
     * @returns {Promise<Object>} Stripe subscription object
     */
    async createSubscription(customerId, priceId = null) {
        try {
            const actualPriceId = priceId || this.subscriptionPriceId;
            
            if (!actualPriceId) {
                throw new Error('No subscription price ID configured');
            }

            // Check if customer already has an active subscription
            const existingSubscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1
            });

            if (existingSubscriptions.data.length > 0) {
                console.log('Customer already has active subscription:', existingSubscriptions.data[0].id);
                return existingSubscriptions.data[0];
            }

            // Create new subscription
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{
                    price: actualPriceId,
                }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
            });

            // Update database record
            const db = getDatabase();
            const billingCollection = db.collection('admin_billing');
            
            await billingCollection.updateOne(
                { stripe_customer_id: customerId },
                {
                    $set: {
                        subscription_id: subscription.id,
                        subscription_status: subscription.status,
                        updated_at: new Date()
                    }
                }
            );

            console.log('Created subscription:', subscription.id, 'for customer:', customerId);
            return subscription;

        } catch (error) {
            console.error('Error creating subscription:', error);
            throw new Error(`Failed to create subscription: ${error.message}`);
        }
    }

    /**
     * Get subscription details for a customer
     * @param {string} customerId - Stripe customer ID
     * @returns {Promise<Object|null>} Stripe subscription object or null
     */
    async getCustomerSubscription(customerId) {
        try {
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                limit: 1
            });

            if (subscriptions.data.length === 0) {
                return null;
            }

            const subscription = subscriptions.data[0];
            
            // Update database with current status
            const db = getDatabase();
            const billingCollection = db.collection('admin_billing');
            
            await billingCollection.updateOne(
                { stripe_customer_id: customerId },
                {
                    $set: {
                        subscription_id: subscription.id,
                        subscription_status: subscription.status,
                        updated_at: new Date()
                    }
                }
            );

            return subscription;

        } catch (error) {
            console.error('Error getting subscription:', error);
            throw new Error(`Failed to get subscription: ${error.message}`);
        }
    }

    /**
     * Cancel a subscription
     * @param {string} subscriptionId - Stripe subscription ID
     * @param {boolean} immediately - Cancel immediately or at period end
     * @returns {Promise<Object>} Updated subscription object
     */
    async cancelSubscription(subscriptionId, immediately = false) {
        try {
            let subscription;
            
            if (immediately) {
                subscription = await stripe.subscriptions.cancel(subscriptionId);
            } else {
                subscription = await stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true
                });
            }

            // Update database
            const db = getDatabase();
            const billingCollection = db.collection('admin_billing');
            
            await billingCollection.updateOne(
                { subscription_id: subscriptionId },
                {
                    $set: {
                        subscription_status: subscription.status,
                        updated_at: new Date()
                    }
                }
            );

            console.log('Cancelled subscription:', subscriptionId);
            return subscription;

        } catch (error) {
            console.error('Error cancelling subscription:', error);
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
    }

    /**
     * Create a payment intent for one-time payments
     * @param {string} customerId - Stripe customer ID
     * @param {number} amount - Amount in cents
     * @param {string} currency - Currency code (default: 'usd')
     * @returns {Promise<Object>} Stripe payment intent object
     */
    async createPaymentIntent(customerId, amount, currency = 'usd', paymentMethodId = null) {
        try {
            const paymentIntentData = {
                amount: amount,
                currency: currency,
                customer: customerId,
                description: 'Stellar Tree Management - Website Service Payment',
                statement_descriptor_suffix: 'STELLAR TREE', // Max 22 characters, shown at end of statement
                metadata: {
                    customer_id: customerId,
                    payment_type: 'one_time',
                    service: 'website_service'
                }
            };
            
            // If payment method is provided, attach it
            if (paymentMethodId) {
                // First, ensure payment method is attached to customer
                try {
                    await stripe.paymentMethods.attach(paymentMethodId, {
                        customer: customerId
                    });
                } catch (attachError) {
                    // Payment method might already be attached, ignore that error
                    if (!attachError.message.includes('already been attached')) {
                        console.warn('Error attaching payment method:', attachError.message);
                    }
                }
                
                paymentIntentData.payment_method = paymentMethodId;
                paymentIntentData.confirmation_method = 'automatic'; // Use automatic for client-side confirmation
                paymentIntentData.confirm = false; // Don't confirm on server, let client confirm
            } else {
                paymentIntentData.automatic_payment_methods = {
                    enabled: true,
                };
            }
            
            const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

            console.log('Created payment intent:', paymentIntent.id, 'for customer:', customerId);
            return paymentIntent;

        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }
    }

    /**
     * Get payment history for a customer
     * @param {string} customerId - Stripe customer ID
     * @param {number} limit - Number of payments to retrieve (default: 10)
     * @returns {Promise<Array>} Array of payment objects
     */
    async getPaymentHistory(customerId, limit = 10) {
        try {
            // Get charges (for one-time payments)
            const charges = await stripe.charges.list({
                customer: customerId,
                limit: limit
            });

            // Get invoices (for subscriptions)
            const invoices = await stripe.invoices.list({
                customer: customerId,
                limit: limit
            });

            // Combine and format payments
            const payments = [];

            // Add charges
            charges.data.forEach(charge => {
                payments.push({
                    id: charge.id,
                    type: 'charge',
                    amount: charge.amount,
                    currency: charge.currency,
                    status: charge.status,
                    created: charge.created,
                    description: charge.description || 'One-time payment',
                    receipt_url: charge.receipt_url
                });
            });

            // Add invoices
            invoices.data.forEach(invoice => {
                if (invoice.status === 'paid') {
                    payments.push({
                        id: invoice.id,
                        type: 'invoice',
                        amount: invoice.amount_paid,
                        currency: invoice.currency,
                        status: 'succeeded',
                        created: invoice.created,
                        description: invoice.description || 'Subscription payment',
                        receipt_url: invoice.hosted_invoice_url
                    });
                }
            });

            // Sort by creation date (newest first)
            payments.sort((a, b) => b.created - a.created);

            return payments.slice(0, limit);

        } catch (error) {
            console.error('Error getting payment history:', error);
            throw new Error(`Failed to get payment history: ${error.message}`);
        }
    }

    /**
     * Get billing configuration for frontend
     * @returns {Object} Billing configuration object
     */
    /**
     * Get or initialize remaining balance for admin
     * @param {string} adminEmail - Admin's email address
     * @returns {Promise<number>} Remaining balance in cents
     */
    async getRemainingBalance(adminEmail) {
        try {
            const db = getDatabase();
            const billingCollection = db.collection('admin_billing');
            
            const billingRecord = await billingCollection.findOne({ admin_email: adminEmail });
            
            if (billingRecord && billingRecord.remaining_balance !== undefined) {
                return billingRecord.remaining_balance;
            }
            
            // Initialize with initial balance if not set
            await billingCollection.updateOne(
                { admin_email: adminEmail },
                {
                    $set: {
                        remaining_balance: this.initialBalance
                    }
                },
                { upsert: true }
            );
            
            return this.initialBalance;
        } catch (error) {
            console.error('Error getting remaining balance:', error);
            return this.initialBalance;
        }
    }

    /**
     * Update remaining balance after payment
     * @param {string} adminEmail - Admin's email address
     * @param {number} paymentAmount - Payment amount in cents
     * @returns {Promise<number>} New remaining balance
     */
    async updateRemainingBalance(adminEmail, paymentAmount) {
        try {
            const db = getDatabase();
            const billingCollection = db.collection('admin_billing');
            
            const currentBalance = await this.getRemainingBalance(adminEmail);
            const newBalance = Math.max(0, currentBalance - paymentAmount);
            
            await billingCollection.updateOne(
                { admin_email: adminEmail },
                {
                    $set: {
                        remaining_balance: newBalance,
                        updated_at: new Date()
                    }
                },
                { upsert: true }
            );
            
            return newBalance;
        } catch (error) {
            console.error('Error updating remaining balance:', error);
            throw new Error(`Failed to update balance: ${error.message}`);
        }
    }

    getBillingConfig() {
        return {
            paymentMode: this.paymentMode,
            subscriptionAmount: this.subscriptionAmount,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            customPriceId: this.customPriceId,
            initialBalance: this.initialBalance
        };
    }

    /**
     * Validate webhook signature (for future webhook implementation)
     * @param {string} payload - Raw request body
     * @param {string} signature - Stripe signature header
     * @param {string} endpointSecret - Webhook endpoint secret
     * @returns {Object} Stripe event object
     */
    validateWebhookSignature(payload, signature, endpointSecret) {
        try {
            return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
        } catch (error) {
            console.error('Webhook signature verification failed:', error);
            throw new Error('Invalid webhook signature');
        }
    }
}

module.exports = new BillingService();
/**
 * Admin Billing Component
 * Handles Stripe payment integration for admin billing
 */

class AdminBilling {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        this.customerId = null;
        this.paymentMode = null;
        this.remainingBalance = null;
        this.customPriceId = null;
        this.isInitialized = false;
        this.currency = 'USD'; // Default currency (USD)
        this.usdToCadRate = 1.35; // USD to CAD conversion rate (approximately)
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('Initializing Admin Billing...');
        
        try {
            await this.loadStripe();
            await this.fetchBillingConfig();
            await this.fetchCustomerData();
            this.renderBillingUI();
            this.isInitialized = true;
            console.log('Admin Billing initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Admin Billing:', error);
            this.showError('Failed to load billing information');
        }
    }

    async loadStripe() {
        // Stripe.js is loaded via script tag in HTML
        if (typeof Stripe === 'undefined') {
            throw new Error('Stripe.js not loaded');
        }
        
        // Get publishable key from server
        const response = await fetch('/api/billing/config', {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load billing configuration');
        }
        
        const config = await response.json();
        this.stripe = Stripe(config.publishableKey);
        this.elements = this.stripe.elements();
    }

    async fetchBillingConfig() {
        const response = await fetch('/api/billing/config', {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch billing configuration');
        }
        
        const config = await response.json();
        this.paymentMode = config.paymentMode;
        this.subscriptionAmount = config.subscriptionAmount;
        this.customPriceId = config.customPriceId;
        
        // Fetch remaining balance
        await this.fetchRemainingBalance();
    }
    
    async fetchRemainingBalance() {
        try {
            const response = await fetch('/api/billing/balance', {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.remainingBalance = data.remainingBalance;
            }
        } catch (error) {
            console.error('Error fetching remaining balance:', error);
        }
    }

    async fetchCustomerData() {
        const response = await fetch('/api/billing/customer', {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch customer data');
        }
        
        const customerData = await response.json();
        this.customerId = customerData.id;
        this.paymentMethods = customerData.paymentMethods || [];
        this.subscription = customerData.subscription || null;
    }

    renderBillingUI() {
        const billingView = document.getElementById('billingView');
        if (!billingView) {
            console.error('Billing view element not found');
            return;
        }

        billingView.innerHTML = this.getBillingHTML();
        this.attachEventListeners();
        this.setupPaymentAmountListener();
        this.setupDualCurrencyListeners();
        // Note: We no longer use Stripe Elements card element - using manual card inputs instead
    }
    
    setupPaymentAmountListener() {
        const paymentAmountInput = document.getElementById('paymentAmount');
        if (paymentAmountInput) {
            paymentAmountInput.addEventListener('input', () => {
                this.updateOrderSummary();
            });
        }
    }
    
    setupDualCurrencyListeners() {
        // Setup USD input listener
        const usdInput = document.getElementById('paymentAmountUSD');
        if (usdInput) {
            usdInput.addEventListener('input', () => {
                this.updateCADFromUSD();
            });
        }
        
        // Setup CAD input listener
        const cadInput = document.getElementById('paymentAmountCAD');
        if (cadInput) {
            cadInput.addEventListener('input', () => {
                this.updateUSDFromCAD();
            });
        }
    }
    
    updateOrderSummary() {
        // Get payment amount from appropriate input
        const dualInputVisible = document.getElementById('dualCurrencyInput')?.style.display !== 'none';
        let paymentAmount = 0;
        let displayAmount = 0;
        
        if (dualInputVisible) {
            const usdInput = document.getElementById('paymentAmountUSD');
            const cadInput = document.getElementById('paymentAmountCAD');
            
            if (usdInput && !usdInput.readOnly) {
                paymentAmount = parseFloat(usdInput.value) || 0;
                displayAmount = paymentAmount;
            } else if (cadInput && !cadInput.readOnly) {
                const cadValue = parseFloat(cadInput.value) || 0;
                paymentAmount = cadValue / this.usdToCadRate;
                displayAmount = cadValue;
            }
        } else {
            const paymentAmountInput = document.getElementById('paymentAmount');
            if (paymentAmountInput) {
                paymentAmount = parseFloat(paymentAmountInput.value) || 0;
                displayAmount = paymentAmount;
            }
        }
        
        // Convert to cents for calculation (always USD)
        const paymentAmountCents = Math.round(paymentAmount * 100);
        
        // Update payment amount display
        const paymentAmountDisplay = document.getElementById('paymentAmountDisplay');
        if (paymentAmountDisplay) {
            if (dualInputVisible) {
                // Show both currencies in order summary
                const usdValue = paymentAmount;
                const cadValue = paymentAmount * this.usdToCadRate;
                paymentAmountDisplay.textContent = `$${usdValue.toFixed(2)} / C$${cadValue.toFixed(2)}`;
            } else {
                paymentAmountDisplay.textContent = displayAmount > 0 ? `$${displayAmount.toFixed(2)}` : '$0.00';
            }
        }
        
        // Update total
        const totalDisplay = document.getElementById('total');
        if (totalDisplay) {
            if (dualInputVisible) {
                const usdValue = paymentAmount;
                const cadValue = paymentAmount * this.usdToCadRate;
                totalDisplay.textContent = `$${usdValue.toFixed(2)} / C$${cadValue.toFixed(2)}`;
            } else {
                totalDisplay.textContent = displayAmount > 0 ? `$${displayAmount.toFixed(2)}` : '$0.00';
            }
        }
        
        // Update new balance if remaining balance exists
        if (this.remainingBalance !== null && this.remainingBalance > 0) {
            const newBalance = Math.max(0, this.remainingBalance - paymentAmountCents);
            const newBalanceDisplay = document.getElementById('newBalance');
            if (newBalanceDisplay) {
                newBalanceDisplay.textContent = this.formatCurrency(newBalance / 100);
            }
        }
    }
    
    toggleCurrency() {
        const toggle = document.getElementById('currencyToggle');
        if (!toggle) return;
        
        const singleInput = document.getElementById('singleCurrencyInput');
        const dualInput = document.getElementById('dualCurrencyInput');
        
        if (toggle.checked) {
            // Show dual currency input
            if (singleInput) singleInput.style.display = 'none';
            if (dualInput) {
                dualInput.style.display = 'block';
                // Sync current value to USD input
                const currentAmount = document.getElementById('paymentAmount')?.value || '';
                const usdInput = document.getElementById('paymentAmountUSD');
                if (usdInput && currentAmount) {
                    usdInput.value = currentAmount;
                    this.updateCADFromUSD();
                }
            }
        } else {
            // Show single currency input
            if (dualInput) dualInput.style.display = 'none';
            if (singleInput) {
                singleInput.style.display = 'block';
                // Sync USD value back to single input
                const usdInput = document.getElementById('paymentAmountUSD');
                const singleAmountInput = document.getElementById('paymentAmount');
                if (usdInput && singleAmountInput && usdInput.value) {
                    singleAmountInput.value = usdInput.value;
                }
            }
            this.currency = 'USD';
        }
        
        this.updateAllCurrencyDisplays();
    }
    
    updateCADFromUSD() {
        const usdInput = document.getElementById('paymentAmountUSD');
        const cadInput = document.getElementById('paymentAmountCAD');
        
        if (!usdInput || !cadInput || usdInput.readOnly) return;
        
        const usdValue = parseFloat(usdInput.value) || 0;
        const cadValue = usdValue * this.usdToCadRate;
        cadInput.value = cadValue > 0 ? cadValue.toFixed(2) : '';
        
        // Update order summary
        this.updateOrderSummary();
    }
    
    updateUSDFromCAD() {
        const usdInput = document.getElementById('paymentAmountUSD');
        const cadInput = document.getElementById('paymentAmountCAD');
        
        if (!usdInput || !cadInput || cadInput.readOnly) return;
        
        const cadValue = parseFloat(cadInput.value) || 0;
        const usdValue = cadValue / this.usdToCadRate;
        usdInput.value = usdValue > 0 ? usdValue.toFixed(2) : '';
        
        // Update order summary
        this.updateOrderSummary();
    }
    
    switchCurrencyFocus() {
        const usdInput = document.getElementById('paymentAmountUSD');
        const cadInput = document.getElementById('paymentAmountCAD');
        const usdLabel = document.getElementById('usdLabel');
        const cadLabel = document.getElementById('cadLabel');
        const currencyRow = document.getElementById('currencyInputRow');
        
        if (!usdInput || !cadInput || !currencyRow) return;
        
        // Get current values
        const currentUsdValue = parseFloat(usdInput.value) || 0;
        const currentCadValue = parseFloat(cadInput.value) || 0;
        
        // Determine which is currently editable
        const isUsdEditable = !usdInput.readOnly;
        
        if (isUsdEditable) {
            // Currently USD → CAD, switching to CAD → USD
            // Example: 123 USD (editable) = 166.05 CAD (readonly)
            // After swap: 123 CAD (editable) = 91.11 USD (readonly)
            
            // Take the editable USD value directly (e.g., 123)
            const editableValue = currentUsdValue;
            
            // Make CAD editable with that same number value
            cadInput.value = editableValue > 0 ? editableValue.toFixed(2) : '';
            
            // Calculate the readonly USD value from that CAD amount
            const usdCalculated = editableValue > 0 ? (editableValue / this.usdToCadRate).toFixed(2) : '';
            usdInput.value = usdCalculated;
            
            // Swap readonly status
            cadInput.readOnly = false;
            usdInput.readOnly = true;
            
            // Reverse the order (CAD on left, USD on right) to show CAD → USD
            currencyRow.style.flexDirection = 'row-reverse';
            
            // Focus CAD input
            cadInput.focus();
        } else {
            // Currently CAD → USD, switching to USD → CAD
            // Example: 123 CAD (editable) = 91.11 USD (readonly)
            // After swap: 123 USD (editable) = 166.05 CAD (readonly)
            
            // Take the editable CAD value directly (e.g., 123)
            const editableValue = currentCadValue;
            
            // Make USD editable with that same number value
            usdInput.value = editableValue > 0 ? editableValue.toFixed(2) : '';
            
            // Calculate the readonly CAD value from that USD amount
            const cadCalculated = editableValue > 0 ? (editableValue * this.usdToCadRate).toFixed(2) : '';
            cadInput.value = cadCalculated;
            
            // Swap readonly status
            usdInput.readOnly = false;
            cadInput.readOnly = true;
            
            // Normal order (USD on left, CAD on right) to show USD → CAD
            currencyRow.style.flexDirection = 'row';
            
            // Focus USD input
            usdInput.focus();
        }
        
        // Update order summary
        this.updateOrderSummary();
    }
    
    formatCurrency(amount) {
        // Amount is always stored in USD, convert if CAD is selected
        const displayAmount = this.currency === 'CAD' ? amount * this.usdToCadRate : amount;
        const symbol = this.currency === 'CAD' ? 'C$' : '$';
        return `${symbol}${displayAmount.toFixed(2)}`;
    }
    
    updateAllCurrencyDisplays() {
        // Update remaining balance display
        const remainingBalanceDisplay = document.getElementById('remainingBalanceDisplay');
        if (remainingBalanceDisplay && this.remainingBalance !== null) {
            remainingBalanceDisplay.textContent = this.formatCurrency((this.remainingBalance || 0) / 100);
        }
        
        const remainingBalanceSummary = document.getElementById('remainingBalanceSummary');
        if (remainingBalanceSummary && this.remainingBalance !== null) {
            remainingBalanceSummary.textContent = this.formatCurrency((this.remainingBalance || 0) / 100);
        }
        
        // Update payment amount input placeholder and label
        const paymentAmountInput = document.getElementById('paymentAmount');
        if (paymentAmountInput) {
            const currentValue = parseFloat(paymentAmountInput.value) || 0;
            if (currentValue > 0) {
                // Convert the displayed value
                const usdValue = this.currency === 'CAD' ? currentValue / this.usdToCadRate : currentValue;
                const cadValue = this.currency === 'CAD' ? currentValue : currentValue * this.usdToCadRate;
                paymentAmountInput.value = this.currency === 'CAD' ? cadValue.toFixed(2) : usdValue.toFixed(2);
            }
        }
        
        // Update order summary
        this.updateOrderSummary();
        
        // Update new balance
        if (this.remainingBalance !== null && this.remainingBalance > 0) {
            const paymentAmountInput = document.getElementById('paymentAmount');
            if (paymentAmountInput) {
                const paymentAmount = parseFloat(paymentAmountInput.value) || 0;
                const paymentAmountCents = this.currency === 'CAD' 
                    ? Math.round((paymentAmount / this.usdToCadRate) * 100)
                    : Math.round(paymentAmount * 100);
                const newBalance = Math.max(0, this.remainingBalance - paymentAmountCents);
                const newBalanceDisplay = document.getElementById('newBalance');
                if (newBalanceDisplay) {
                    newBalanceDisplay.textContent = this.formatCurrency(newBalance / 100);
                }
            }
        }
    }

    getBillingHTML() {
        return `
            <div class="billing-container">
                <!-- Header -->
                <div class="billing-header">
                    <button class="back-btn" onclick="window.adminBilling.navigateBack()">
                        <i class="fas fa-arrow-left"></i> Back to Admin
                    </button>
                    <h1><i class="fas fa-credit-card"></i> Billing</h1>
                </div>
                
                <!-- Two-Column Checkout Layout -->
                <div class="checkout-layout">
                    <!-- Left Column: Form -->
                    <div class="checkout-form-column">
                        <!-- Billing Information -->
                        <div class="form-section">
                            <h2 class="form-section-title">Billing Information</h2>
                            <div class="form-group">
                                <label for="fullName">Full Name</label>
                                <input type="text" id="fullName" name="fullName" placeholder="Enter your full name" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email Address</label>
                                <input type="email" id="email" name="email" placeholder="your.email@example.com" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label for="address">Street Address</label>
                                <input type="text" id="address" name="address" placeholder="123 Main Street" class="form-input" required>
                            </div>
                            <div class="form-row-three">
                                <div class="form-group">
                                    <label for="city">City</label>
                                    <input type="text" id="city" name="city" placeholder="City" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label for="state">State</label>
                                    <input type="text" id="state" name="state" placeholder="State" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label for="zip">ZIP Code</label>
                                    <input type="text" id="zip" name="zip" placeholder="ZIP" class="form-input" required>
                                </div>
                            </div>
                </div>
                
                        <!-- Payment Method -->
                        <div class="form-section">
                            <div class="form-section-title-container">
                                <h2 class="form-section-title">Payment Method</h2>
                                <div class="currency-toggle-container">
                                    <label class="currency-toggle">
                                        <span class="currency-label">USD</span>
                                        <input type="checkbox" id="currencyToggle" onchange="window.adminBilling.toggleCurrency()">
                                        <span class="currency-slider"></span>
                                        <span class="currency-label">CAD</span>
                                    </label>
                                </div>
                            </div>
                            ${this.remainingBalance !== null && this.remainingBalance > 0 ? `
                            <div class="form-group">
                                <label for="paymentAmount">Payment Amount</label>
                                <div id="singleCurrencyInput" class="single-currency-input">
                                    <div style="position: relative;">
                                        <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; font-weight: 600;" id="currencySymbol">$</span>
                                        <input type="number" id="paymentAmount" name="paymentAmount" 
                                               placeholder="e.g., 100.00" 
                                               class="form-input" 
                                               style="padding-left: 30px;"
                                               min="0.01" 
                                               step="0.01"
                                               max="${((this.remainingBalance || 0) / 100).toFixed(2)}"
                                               required>
                                    </div>
                                </div>
                                <div id="dualCurrencyInput" class="dual-currency-input" style="display: none;">
                                    <div class="currency-input-row">
                                        <div class="currency-input-column">
                                            <label style="font-size: 0.85rem; color: #6c757d; margin-bottom: 6px; display: block;">USD</label>
                                            <div style="position: relative;">
                                                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; font-weight: 600;">$</span>
                                                <input type="number" id="paymentAmountUSD" name="paymentAmountUSD" 
                                                       placeholder="0.00" 
                                                       class="form-input" 
                                                       style="padding-left: 30px;"
                                                       min="0.01" 
                                                       step="0.01"
                                                       required>
                                            </div>
                                        </div>
                                        <button type="button" class="currency-switch-btn" onclick="window.adminBilling.switchCurrencyFocus()" title="Switch between USD and CAD">
                                            <i class="fas fa-exchange-alt"></i>
                    </button>
                                        <div class="currency-input-column">
                                            <label style="font-size: 0.85rem; color: #6c757d; margin-bottom: 6px; display: block;">CAD</label>
                                            <div style="position: relative;">
                                                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; font-weight: 600;">C$</span>
                                                <input type="number" id="paymentAmountCAD" name="paymentAmountCAD" 
                                                       placeholder="0.00" 
                                                       class="form-input" 
                                                       style="padding-left: 30px;"
                                                       min="0.01" 
                                                       step="0.01"
                                                       readonly>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #6c757d;">
                                    Total remaining balance: <strong style="color: #dc3545; font-size: 1rem;" id="remainingBalanceDisplay">${this.formatCurrency((this.remainingBalance || 0) / 100)}</strong>
                                </p>
                            </div>
                            ` : `
                            <div class="form-group">
                                <label for="paymentAmount">Payment Amount</label>
                                <div id="singleCurrencyInput" class="single-currency-input">
                                    <div style="position: relative;">
                                        <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; font-weight: 600;" id="currencySymbol">$</span>
                                        <input type="number" id="paymentAmount" name="paymentAmount" 
                                               placeholder="e.g., 100.00" 
                                               class="form-input" 
                                               style="padding-left: 30px;"
                                               min="0.01" 
                                               step="0.01"
                                               required>
                                    </div>
                                </div>
                                <div id="dualCurrencyInput" class="dual-currency-input" style="display: none;">
                                    <div class="currency-input-row" id="currencyInputRow">
                                        <div class="currency-input-column" id="usdColumn">
                                            <label id="usdLabel" style="font-size: 0.85rem; color: #6c757d; margin-bottom: 6px; display: block;">USD</label>
                                            <div style="position: relative;">
                                                <span id="usdSymbol" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; font-weight: 600;">$</span>
                                                <input type="number" id="paymentAmountUSD" name="paymentAmountUSD" 
                                                       placeholder="0.00" 
                                                       class="form-input" 
                                                       style="padding-left: 30px;"
                                                       min="0.01" 
                                                       step="0.01"
                                                       required>
                                            </div>
                                        </div>
                                        <button type="button" class="currency-switch-btn" onclick="window.adminBilling.switchCurrencyFocus()" title="Switch between USD and CAD">
                                            <i class="fas fa-exchange-alt"></i>
                                        </button>
                                        <div class="currency-input-column" id="cadColumn">
                                            <label id="cadLabel" style="font-size: 0.85rem; color: #6c757d; margin-bottom: 6px; display: block;">CAD</label>
                                            <div style="position: relative;">
                                                <span id="cadSymbol" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; font-weight: 600;">C$</span>
                                                <input type="number" id="paymentAmountCAD" name="paymentAmountCAD" 
                                                       placeholder="0.00" 
                                                       class="form-input" 
                                                       style="padding-left: 30px;"
                                                       min="0.01" 
                                                       step="0.01"
                                                       readonly>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `}
                            <div class="form-group">
                                <label for="card-element">Card Number</label>
                                <div id="card-element" class="stripe-card-element">
                                    <!-- Stripe Elements will create form elements here -->
                                </div>
                                <div id="card-errors" class="error-message" style="display: none;"></div>
                            </div>
                            <div class="form-group">
                                <label for="cardName">Cardholder Name</label>
                                <input type="text" id="cardName" name="cardName" placeholder="Name on card" class="form-input">
                            </div>
                </div>
                
                        <!-- Payment Button -->
                        <div class="payment-action">
                            <button class="checkout-btn" onclick="window.adminBilling.processPayment()" id="checkoutBtn">
                                <i class="fas fa-lock"></i>
                                Complete Payment
                    </button>
                        </div>
                </div>
                
                    <!-- Right Column: Order Summary -->
                    <div class="order-summary-column">
                        <div class="order-summary-card">
                            <h2 class="order-summary-title">Order Summary</h2>
                            <div class="order-item">
                                <div class="product-thumbnail">
                                    <img src="images/logo.png" alt="Service" onerror="this.style.display='none'">
                                </div>
                                <div class="product-info">
                                    <div class="product-name">One-Time Payment</div>
                                    <div class="product-subtext">Single payment toward your balance</div>
                                </div>
                            </div>
                            <div class="order-details">
                                ${this.remainingBalance !== null && this.remainingBalance > 0 ? `
                                <div class="order-line" style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #E5E7EB;">
                                    <span style="font-size: 1.1rem; font-weight: 600;">Total Remaining Balance</span>
                                    <span id="remainingBalanceSummary" style="font-size: 1.3rem; color: #dc3545; font-weight: 700;">${this.formatCurrency((this.remainingBalance || 0) / 100)}</span>
                                </div>
                                ` : ''}
                                <div class="order-line">
                                    <span>Payment Amount</span>
                                    <span id="paymentAmountDisplay">${this.formatCurrency(0)}</span>
                                </div>
                                <div class="order-line">
                                    <span>Tax</span>
                                    <span id="tax">${this.formatCurrency(0)}</span>
                                </div>
                                <div class="order-line total">
                                    <span>Total</span>
                                    <span id="total">${this.formatCurrency(0)}</span>
                                </div>
                                ${this.remainingBalance !== null && this.remainingBalance > 0 ? `
                                <div class="order-line" style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #E5E7EB;">
                                    <span style="font-weight: 600; font-size: 1.05rem;">New Balance After Payment</span>
                                    <span id="newBalance" style="font-weight: 700; font-size: 1.15rem; color: #28a745;">${this.formatCurrency((this.remainingBalance || 0) / 100)}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Add Payment Method Modal -->
            <div id="addPaymentModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Payment Method</h3>
                        <button class="close-btn" onclick="window.adminBilling.closeAddPaymentModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="modal-card-element" class="stripe-element">
                            <!-- Stripe Elements will create form elements here -->
                        </div>
                        <div id="modal-card-errors" class="error-message" style="display: none;"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="cancel-btn" onclick="window.adminBilling.closeAddPaymentModal()">Cancel</button>
                        <button class="save-btn" onclick="window.adminBilling.savePaymentMethod()" id="savePaymentBtn">
                            <i class="fas fa-save"></i> Save Payment Method
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Setup Stripe Elements card element
        if (this.elements) {
            this.setupCardElement();
        }
    }
    
    setupCardElement() {
        if (!this.elements) return;

        // Destroy existing card element if it exists
        if (this.cardElement) {
            try {
                this.cardElement.destroy();
            } catch (e) {
                // Ignore errors if element was already destroyed
            }
        }

        // Create card element with minimal styling to prevent auto-expansion
        const cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                        color: '#9CA3AF',
                    },
                },
            },
            // Disable auto-expansion to keep it as a single input
            hidePostalCode: false,
        });

        // Check if the container exists before mounting
        const container = document.querySelector('#card-element');
        if (container) {
            cardElement.mount('#card-element');
            this.cardElement = cardElement;

            cardElement.on('change', (event) => {
                const errorElement = document.getElementById('card-errors');
                if (errorElement) {
                    if (event.error) {
                        errorElement.textContent = event.error.message;
                        errorElement.style.display = 'block';
                    } else {
                        errorElement.style.display = 'none';
                    }
                }
            });
        }
    }
    
    
    async processPayment() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (!checkoutBtn) return;
        
        const originalText = checkoutBtn.innerHTML;
        
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        checkoutBtn.disabled = true;
        
        try {
            await this.processCardPayment();
        } catch (error) {
            console.error('Payment processing error:', error);
            this.showError(error.message || 'Payment failed');
        } finally {
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }
    }
    
    getBillingInfo() {
        return {
            fullName: document.getElementById('fullName')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            address: document.getElementById('address')?.value.trim() || '',
            city: document.getElementById('city')?.value.trim() || '',
            state: document.getElementById('state')?.value.trim() || '',
            zip: document.getElementById('zip')?.value.trim() || ''
        };
    }
    
    validateBillingInfo() {
        const billingInfo = this.getBillingInfo();
        const required = ['fullName', 'email', 'address', 'city', 'state', 'zip'];
        
        for (const field of required) {
            if (!billingInfo[field]) {
                throw new Error(`Please fill in all billing information fields. Missing: ${field}`);
            }
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(billingInfo.email)) {
            throw new Error('Please enter a valid email address');
        }
        
        return billingInfo;
    }
    
    async processCardPayment() {
        // Validate billing information
        const billingInfo = this.validateBillingInfo();
        
        // Check if dual currency inputs are visible
        const dualInputVisible = document.getElementById('dualCurrencyInput')?.style.display !== 'none';
        let paymentAmount = null;
        
        if (dualInputVisible) {
            // Get amount from dual currency inputs
            const usdInput = document.getElementById('paymentAmountUSD');
            const cadInput = document.getElementById('paymentAmountCAD');
            
            if (usdInput && !usdInput.readOnly && usdInput.value) {
                // USD is editable
                paymentAmount = parseFloat(usdInput.value);
            } else if (cadInput && !cadInput.readOnly && cadInput.value) {
                // CAD is editable, convert to USD
                const cadValue = parseFloat(cadInput.value);
                paymentAmount = cadValue / this.usdToCadRate;
            }
        } else {
            // Get amount from single currency input
            const paymentAmountInput = document.getElementById('paymentAmount');
            paymentAmount = paymentAmountInput ? parseFloat(paymentAmountInput.value) : null;
        }
        
        if (!paymentAmount || paymentAmount <= 0) {
            throw new Error('Please enter a valid payment amount');
        }
        
        // Convert to cents (always in USD)
        const paymentAmountCents = Math.round(paymentAmount * 100);
        
        // Validate payment amount doesn't exceed remaining balance if balance exists
        if (this.remainingBalance !== null && this.remainingBalance > 0 && paymentAmountCents > this.remainingBalance) {
            throw new Error(`Payment amount cannot exceed remaining balance of $${((this.remainingBalance) / 100).toFixed(2)}`);
        }
        
        // Validate card element is initialized
        if (!this.cardElement) {
            throw new Error('Card element not initialized. Please refresh the page.');
        }
        
        // For one-time payments, we use Stripe Elements to create payment method securely
        // Always process as one-time payment (non-recurring)
        await this.makeOneTimePayment(billingInfo, paymentAmountCents);
    }

    renderPaymentMethods() {
        const container = document.getElementById('paymentMethodsList');
        if (!container) return;

        if (this.paymentMethods.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <p>No payment methods added yet</p>
                    <p class="text-muted">Add a payment method to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.paymentMethods.map(pm => `
            <div class="payment-method-item" data-pm-id="${pm.id}">
                <div class="payment-method-info">
                    <i class="fab fa-cc-${pm.card.brand}"></i>
                    <span class="card-info">•••• •••• •••• ${pm.card.last4}</span>
                    <span class="card-expiry">${pm.card.exp_month}/${pm.card.exp_year}</span>
                    ${pm.is_default ? '<span class="default-badge">Default</span>' : ''}
                </div>
                <button class="remove-btn" onclick="window.adminBilling.removePaymentMethod('${pm.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    renderPaymentStatus() {
        const container = document.getElementById('paymentStatus');
        if (!container) return;

        if (this.paymentMode === 'subscription') {
            this.renderSubscriptionStatus(container);
        } else {
            this.renderOneTimePaymentStatus(container);
        }
    }

    renderSubscriptionStatus(container) {
        if (!this.subscription) {
            container.innerHTML = `
                <div class="status-inactive">
                    <i class="fas fa-times-circle"></i>
                    <h3>No Active Subscription</h3>
                    <p>Start your subscription to access the service</p>
                    <button class="start-subscription-btn" onclick="window.adminBilling.startSubscription()">
                        Start Subscription - $${(this.subscriptionAmount / 100).toFixed(2)}/month
                    </button>
                </div>
            `;
        } else {
            const nextBilling = new Date(this.subscription.current_period_end * 1000);
            container.innerHTML = `
                <div class="status-active">
                    <i class="fas fa-check-circle"></i>
                    <h3>Subscription Active</h3>
                    <p>Next billing: ${nextBilling.toLocaleDateString()}</p>
                    <p>Amount: $${(this.subscription.plan.amount / 100).toFixed(2)}/${this.subscription.plan.interval}</p>
                    <button class="manage-subscription-btn" onclick="window.adminBilling.manageSubscription()">
                        Manage Subscription
                    </button>
                </div>
            `;
        }
    }

    renderOneTimePaymentStatus(container) {
        container.innerHTML = `
            <div class="one-time-payment">
                <i class="fas fa-dollar-sign"></i>
                <h3>One-Time Payment</h3>
                <p>Amount: $${(this.subscriptionAmount / 100).toFixed(2)}</p>
                <button class="make-payment-btn" onclick="window.adminBilling.makeOneTimePayment()">
                    Make Payment
                </button>
            </div>
        `;
    }

    async loadPaymentHistory() {
        const container = document.getElementById('paymentHistoryTable');
        if (!container) return;

        try {
            const response = await fetch('/api/billing/payment-history', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load payment history');
            }

            const payments = await response.json();
            this.renderPaymentHistory(payments);
        } catch (error) {
            console.error('Error loading payment history:', error);
            container.innerHTML = '<div class="error">Failed to load payment history</div>';
        }
    }

    renderPaymentHistory(payments) {
        const container = document.getElementById('paymentHistoryTable');
        if (!container) return;

        if (payments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No payment history yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="payment-history-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Description</th>
                        <th>Receipt</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.map(payment => `
                        <tr>
                            <td>${new Date(payment.created * 1000).toLocaleDateString()}</td>
                            <td>$${(payment.amount / 100).toFixed(2)}</td>
                            <td><span class="status-${payment.status}">${payment.status}</span></td>
                            <td>${payment.description || 'Payment'}</td>
                            <td>
                                ${payment.receipt_url ? 
                                    `<a href="${payment.receipt_url}" target="_blank" class="receipt-link">
                                        <i class="fas fa-receipt"></i> View
                                    </a>` : 
                                    '-'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Navigation methods
    navigateBack() {
        if (window.adminViewManager) {
            window.adminViewManager.showView('admin');
        }
    }

    // Payment method management
    showAddPaymentModal() {
        const modal = document.getElementById('addPaymentModal');
        if (modal) {
            modal.classList.add('show');
            this.setupCardElement('#modal-card-element', 'modal-card-errors');
        }
    }

    closeAddPaymentModal() {
        const modal = document.getElementById('addPaymentModal');
        if (modal) {
            modal.classList.remove('show');
            if (this.cardElement) {
                this.cardElement.destroy();
                this.cardElement = null;
            }
        }
    }

    setupCardElement(containerId = '#card-element', errorId = 'card-errors') {
        if (!this.elements) return;

        // Destroy existing card element if it exists
        if (this.cardElement) {
            try {
                this.cardElement.destroy();
            } catch (e) {
                // Ignore errors if element was already destroyed
            }
        }

        const cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#9CA3AF',
                    },
                },
            },
        });

        // Check if the container exists before mounting
        const container = document.querySelector(containerId);
        if (container) {
            cardElement.mount(containerId);
        this.cardElement = cardElement;

        cardElement.on('change', (event) => {
                const errorElement = document.getElementById(errorId);
                if (errorElement) {
            if (event.error) {
                errorElement.textContent = event.error.message;
                errorElement.style.display = 'block';
            } else {
                errorElement.style.display = 'none';
                    }
            }
        });
        }
    }

    async savePaymentMethod() {
        // This method is for the modal, so we need to use the modal card element
        // Create a temporary card element for the modal if needed
        if (!this.cardElement) {
            // Try to get the modal card element
            const modalCardContainer = document.querySelector('#modal-card-element');
            if (!modalCardContainer || !this.elements) {
                this.showError('Card element not initialized');
                return;
            }
        }

        const saveBtn = document.getElementById('savePaymentBtn');
        if (!saveBtn) return;
        
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        try {
            const { error, paymentMethod } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.cardElement,
            });

            if (error) {
                throw error;
            }

            // Save to customer
            const response = await fetch('/api/billing/payment-methods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    paymentMethodId: paymentMethod.id
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save payment method');
            }

            // Refresh payment methods
            await this.fetchCustomerData();
            this.closeAddPaymentModal();
            this.showSuccess('Payment method added successfully');

        } catch (error) {
            console.error('Error saving payment method:', error);
            this.showError(error.message || 'Failed to save payment method');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    async removePaymentMethod(paymentMethodId) {
        if (!confirm('Are you sure you want to remove this payment method?')) {
            return;
        }

        try {
            const response = await fetch(`/api/billing/payment-methods/${paymentMethodId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to remove payment method');
            }

            // Refresh payment methods
            await this.fetchCustomerData();
            this.renderPaymentMethods();
            this.showSuccess('Payment method removed successfully');

        } catch (error) {
            console.error('Error removing payment method:', error);
            this.showError('Failed to remove payment method');
        }
    }

    // Subscription management
    async startSubscription(billingInfo, paymentAmountCents = null) {
        if (this.paymentMethods.length === 0) {
            this.showError('Please add a payment method first');
            return;
        }

        try {
            // For subscriptions, use custom price ID if provided and amount is specified
            // Otherwise, use default subscription price ID
            const requestBody = {
                billingInfo: billingInfo
            };
            
            // If custom amount is provided and custom price ID exists, include it
            if (paymentAmountCents && this.customPriceId) {
                requestBody.amount = paymentAmountCents;
                requestBody.priceId = this.customPriceId;
            }

            const response = await fetch('/api/billing/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to start subscription');
            }

            // Update balance if payment was made
            if (paymentAmountCents) {
                try {
                    const balanceResponse = await fetch('/api/billing/update-balance', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...this.getAuthHeaders()
                        },
                        body: JSON.stringify({
                            paymentAmount: paymentAmountCents
                        })
                    });
                    
                    if (balanceResponse.ok) {
                        const balanceData = await balanceResponse.json();
                        this.remainingBalance = balanceData.newBalance;
                    }
                } catch (balanceError) {
                    console.error('Error updating balance:', balanceError);
                }
            }

            // Refresh data
            await this.fetchCustomerData();
            this.renderPaymentStatus();
            this.renderBillingUI(); // Refresh to show updated balance
            this.showSuccess('Subscription started successfully! A receipt has been sent to your email.');

        } catch (error) {
            console.error('Error starting subscription:', error);
            this.showError('Failed to start subscription');
        }
    }

    async makeOneTimePayment(billingInfo, paymentAmountCents) {
        // For one-time payments, we use Stripe Elements to create payment method securely
        try {
            if (!this.cardElement) {
                throw new Error('Card element not initialized');
            }
            
            // Create payment method from Stripe Elements card element
            const { error: pmError, paymentMethod } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.cardElement,
                billing_details: {
                    name: billingInfo.fullName || billingInfo.cardName || '',
                    email: billingInfo.email || '',
                    address: {
                        line1: billingInfo.address || '',
                        city: billingInfo.city || '',
                        state: billingInfo.state || '',
                        postal_code: billingInfo.zip || '',
                    }
                }
            });
            
            if (pmError) {
                // Show error in card-errors element
                const errorElement = document.getElementById('card-errors');
                if (errorElement) {
                    errorElement.textContent = pmError.message;
                    errorElement.style.display = 'block';
                }
                throw pmError;
            }
            
            // Attach payment method to customer first
            try {
                const attachResponse = await fetch('/api/billing/payment-methods', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeaders()
                    },
                    body: JSON.stringify({
                        paymentMethodId: paymentMethod.id
                    })
                });
                
                if (!attachResponse.ok) {
                    console.warn('Failed to attach payment method, but continuing with payment');
                }
            } catch (attachError) {
                console.warn('Error attaching payment method:', attachError);
                // Continue anyway - payment method might already be attached
            }
            
            const response = await fetch('/api/billing/payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    amount: paymentAmountCents,
                    billingInfo: billingInfo,
                    paymentMethodId: paymentMethod.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error || 'Failed to create payment';
                console.error('Payment intent creation failed:', errorData);
                throw new Error(errorMessage);
            }

            const { clientSecret } = await response.json();

            // Confirm payment with payment method
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethod.id
            });

            if (error) {
                throw error;
            }

            // Update remaining balance on backend
            try {
                const balanceResponse = await fetch('/api/billing/update-balance', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeaders()
                    },
                    body: JSON.stringify({
                        paymentAmount: paymentAmountCents
                    })
                });
                
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    this.remainingBalance = balanceData.newBalance;
                }
            } catch (balanceError) {
                console.error('Error updating balance:', balanceError);
                // Don't fail the payment if balance update fails
            }

            // Send receipt email
            try {
                const receiptResponse = await fetch('/api/billing/send-receipt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeaders()
                    },
                    body: JSON.stringify({
                        billingInfo: billingInfo,
                        paymentData: {
                            amount: paymentIntent.amount,
                            id: paymentIntent.id,
                            status: paymentIntent.status,
                            statement_descriptor: paymentIntent.statement_descriptor || paymentIntent.statement_descriptor_suffix || 'STELLAR TREE'
                        },
                        paymentType: 'one-time'
                    })
                });
                
                if (!receiptResponse.ok) {
                    console.warn('Failed to send receipt email, but payment succeeded');
                }
            } catch (emailError) {
                console.error('Error sending receipt email:', emailError);
                // Don't fail the payment if email fails
            }

            // Refresh UI to show updated balance
            this.renderBillingUI();

            // Payment successful
            this.showSuccess('Payment completed successfully! A receipt has been sent to your email.');
            this.loadPaymentHistory();

        } catch (error) {
            console.error('Error processing payment:', error);
            this.showError('Payment failed: ' + error.message);
        }
    }

    // Utility methods
    getAuthHeaders() {
        if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
            return window.simpleGoogleAuth.getAuthHeaders();
        }
        return {};
    }

    showSuccess(message) {
        if (typeof showNotification === 'function') {
            showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }
}

// Initialize global instance
window.adminBilling = new AdminBilling();
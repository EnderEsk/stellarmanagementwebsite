// Quick Billing JavaScript Functions

// Global variables for temporary photo storage
let tempPhotos = [];

// Modal functions
function openModal(id) { 
    console.log('openModal called with id:', id);
    const element = document.getElementById(id);
    console.log('Element found:', !!element);
    if (element) {
        // Reset any inline styles that might be hiding the modal
        element.style.display = '';
        element.style.visibility = '';
        element.style.opacity = '';
        element.style.zIndex = '';
        
        element.classList.add('show');
        document.body.classList.add('modal-open');
        console.log('Added show class to element and reset inline styles');
        console.log('Element classes after:', element.className);
    } else {
        console.error('Element not found for id:', id);
    }
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('show');
        
        // Force the modal to be hidden with inline styles to override any !important rules
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        modal.style.zIndex = '-1';
        
        document.body.classList.remove('modal-open');
        console.log('Modal closed:', id);
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Quick Quote Functions
function showQuickQuoteModal() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quickQuoteDate').value = today;
    
    // Clear form fields
    document.getElementById('quickQuoteClientName').value = '';
    document.getElementById('quickQuoteClientPhone').value = '';
    document.getElementById('quickQuoteClientAddress').value = '';
    document.getElementById('quickQuoteClientEmail').value = '';
    
    // Reset service items
    resetQuickQuoteServiceItems();
    
    // Reset tax toggle
    document.getElementById('quickQuoteTaxToggle').checked = false;
    
    // Update totals
    updateQuickQuoteTotals();
    
    // Show modal
    openModal('quickQuoteModal');
}

function showQuickInvoiceModal() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quickInvoiceDate').value = today;
    
    // Clear form fields
    document.getElementById('quickInvoiceClientName').value = '';
    document.getElementById('quickInvoiceClientPhone').value = '';
    document.getElementById('quickInvoiceClientAddress').value = '';
    document.getElementById('quickInvoiceClientEmail').value = '';
    
    // Reset service items
    resetQuickInvoiceServiceItems();
    
    // Reset tax toggle
    document.getElementById('quickInvoiceTaxToggle').checked = false;
    
    // Update totals
    updateQuickInvoiceTotals();
    
    // Show modal
    openModal('quickInvoiceModal');
}

function resetQuickQuoteServiceItems() {
    const container = document.getElementById('quickQuoteServiceItems');
    container.innerHTML = `
        <div class="service-item" data-item-id="1">
            <div class="item-row">
                <div class="item-description">
                    <input type="text" class="item-desc-input" placeholder="Service or item description" value="">
                </div>
                <div class="item-controls">
                    <div class="item-quantity">
                        <input type="number" class="item-qty-input" value="1" min="1" placeholder="Qty">
                    </div>
                    <div class="item-price">
                        <input type="number" class="item-price-input" value="" min="0" step="0.01" placeholder="Price">
                    </div>
                </div>
                <div class="item-footer">
                    <div class="item-total">
                        <span class="item-total-amount">$0.00</span>
                    </div>
                    <div class="item-actions">
                        <button type="button" class="remove-item-btn" onclick="removeQuickQuoteServiceItem(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="item-photos-section">
                <div class="photo-upload-area" onclick="triggerQuickQuotePhotoUpload(this)">
                    <div class="photo-upload-content">
                        <i class="fas fa-file-image"></i>
                        <span class="photo-upload-text">Photos: Add Photo</span>
                    </div>
                </div>
                <div class="photos-container">
                    <!-- Photos will be displayed here -->
                </div>
                <input type="file" class="photo-upload-input" accept="image/*" multiple style="display: none;" onchange="handleQuickQuotePhotoUpload(this)">
            </div>
        </div>
    `;
    
    setupQuickQuoteServiceItemListeners();
}

function resetQuickInvoiceServiceItems() {
    const container = document.getElementById('quickInvoiceServiceItems');
    container.innerHTML = `
        <div class="service-item" data-item-id="1">
            <div class="item-row">
                <div class="item-description">
                    <input type="text" class="item-desc-input" placeholder="Service or item description" value="">
                </div>
                <div class="item-controls">
                    <div class="item-quantity">
                        <input type="number" class="item-qty-input" value="1" min="1" placeholder="Qty">
                    </div>
                    <div class="item-price">
                        <input type="number" class="item-price-input" value="" min="0" step="0.01" placeholder="Price">
                    </div>
                </div>
                <div class="item-footer">
                    <div class="item-total">
                        <span class="item-total-amount">$0.00</span>
                    </div>
                    <div class="item-actions">
                        <button type="button" class="remove-item-btn" onclick="removeQuickInvoiceServiceItem(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="item-photos-section">
                <div class="photo-upload-area" onclick="triggerQuickInvoicePhotoUpload(this)">
                    <div class="photo-upload-content">
                        <i class="fas fa-file-image"></i>
                        <span class="photo-upload-text">Photos: Add Photo</span>
                    </div>
                </div>
                <div class="photos-container">
                    <!-- Photos will be displayed here -->
                </div>
                <input type="file" class="photo-upload-input" accept="image/*" multiple style="display: none;" onchange="handleQuickInvoicePhotoUpload(this)">
            </div>
        </div>
    `;
    
    setupQuickInvoiceServiceItemListeners();
}

function addQuickQuoteServiceItem() {
    const container = document.getElementById('quickQuoteServiceItems');
    const itemCount = container.children.length + 1;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'service-item';
    itemElement.dataset.itemId = itemCount;
    
    itemElement.innerHTML = `
        <div class="item-row">
            <div class="item-description">
                <input type="text" class="item-desc-input" placeholder="Service or item description" value="">
            </div>
            <div class="item-controls">
                <div class="item-quantity">
                    <input type="number" class="item-qty-input" value="1" min="1" placeholder="Qty">
                </div>
                <div class="item-price">
                    <input type="number" class="item-price-input" value="" min="0" step="0.01" placeholder="Price">
                </div>
            </div>
            <div class="item-footer">
                <div class="item-total">
                    <span class="item-total-amount">$0.00</span>
                </div>
                <div class="item-actions">
                    <button type="button" class="remove-item-btn" onclick="removeQuickQuoteServiceItem(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="item-photos-section">
            <div class="photo-upload-area" onclick="triggerQuickQuotePhotoUpload(this)">
                <div class="photo-upload-content">
                    <i class="fas fa-file-image"></i>
                    <span class="photo-upload-text">Photos: Add Photo</span>
                </div>
            </div>
            <div class="photos-container">
                <!-- Photos will be displayed here -->
            </div>
            <input type="file" class="photo-upload-input" accept="image/*" multiple style="display: none;" onchange="handleQuickQuotePhotoUpload(this)">
        </div>
    `;
    
    container.appendChild(itemElement);
    setupQuickQuoteServiceItemListeners();
}

function addQuickInvoiceServiceItem() {
    const container = document.getElementById('quickInvoiceServiceItems');
    const itemCount = container.children.length + 1;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'service-item';
    itemElement.dataset.itemId = itemCount;
    
    itemElement.innerHTML = `
        <div class="item-row">
            <div class="item-description">
                <input type="text" class="item-desc-input" placeholder="Service or item description" value="">
            </div>
            <div class="item-controls">
                <div class="item-quantity">
                    <input type="number" class="item-qty-input" value="1" min="1" placeholder="Qty">
                </div>
                <div class="item-price">
                    <input type="number" class="item-price-input" value="" min="0" step="0.01" placeholder="Price">
                </div>
            </div>
            <div class="item-footer">
                <div class="item-total">
                    <span class="item-total-amount">$0.00</span>
                </div>
                <div class="item-actions">
                    <button type="button" class="remove-item-btn" onclick="removeQuickInvoiceServiceItem(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="item-photos-section">
            <div class="photo-upload-area" onclick="triggerQuickInvoicePhotoUpload(this)">
                <div class="photo-upload-content">
                    <i class="fas fa-file-image"></i>
                    <span class="photo-upload-text">Photos: Add Photo</span>
                </div>
            </div>
            <div class="photos-container">
                <!-- Photos will be displayed here -->
            </div>
            <input type="file" class="photo-upload-input" accept="image/*" multiple style="display: none;" onchange="handleQuickInvoicePhotoUpload(this)">
        </div>
    `;
    
    container.appendChild(itemElement);
    setupQuickInvoiceServiceItemListeners();
}

function removeQuickQuoteServiceItem(button) {
    const serviceItem = button.closest('.service-item');
    if (serviceItem) {
        serviceItem.remove();
        updateQuickQuoteTotals();
    }
}

function removeQuickInvoiceServiceItem(button) {
    const serviceItem = button.closest('.service-item');
    if (serviceItem) {
        serviceItem.remove();
        updateQuickInvoiceTotals();
    }
}

function setupQuickQuoteServiceItemListeners() {
    const container = document.getElementById('quickQuoteServiceItems');
    const inputs = container.querySelectorAll('.item-desc-input, .item-qty-input, .item-price-input');
    
    inputs.forEach(input => {
        input.addEventListener('input', updateQuickQuoteTotals);
    });
}

function setupQuickInvoiceServiceItemListeners() {
    const container = document.getElementById('quickInvoiceServiceItems');
    const inputs = container.querySelectorAll('.item-desc-input, .item-qty-input, .item-price-input');
    
    inputs.forEach(input => {
        input.addEventListener('input', updateQuickInvoiceTotals);
    });
}

function toggleQuickQuoteTax() {
    updateQuickQuoteTotals();
}

function toggleQuickInvoiceTax() {
    updateQuickInvoiceTotals();
}

function updateQuickQuoteTotals() {
    const container = document.getElementById('quickQuoteServiceItems');
    const serviceItems = [];
    
    container.querySelectorAll('.service-item').forEach((item, index) => {
        const description = item.querySelector('.item-desc-input').value;
        const quantity = parseFloat(item.querySelector('.item-qty-input').value) || 0;
        const price = parseFloat(item.querySelector('.item-price-input').value) || 0;
        const total = quantity * price;

        serviceItems.push({ description, quantity, price, total });
        
        // Update individual item total
        const totalElement = item.querySelector('.item-total-amount');
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    });
    
    // Calculate totals
    const subtotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
    const taxToggle = document.getElementById('quickQuoteTaxToggle');
    const taxEnabled = taxToggle && taxToggle.checked;
    const taxAmount = taxEnabled ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + taxAmount;
    
    // Update total displays
    document.getElementById('quickQuoteSubtotalAmount').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('quickQuoteTaxAmount').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('quickQuoteGrandTotalAmount').textContent = `$${grandTotal.toFixed(2)}`;

    // Show/hide tax row
    const taxRow = document.getElementById('quickQuoteTaxRow');
    if (taxRow) {
    taxRow.style.display = taxEnabled ? 'flex' : 'none';
    }
}

function updateQuickInvoiceTotals() {
    const container = document.getElementById('quickInvoiceServiceItems');
    const serviceItems = [];
    
    container.querySelectorAll('.service-item').forEach((item, index) => {
        const description = item.querySelector('.item-desc-input').value;
        const quantity = parseFloat(item.querySelector('.item-qty-input').value) || 0;
        const price = parseFloat(item.querySelector('.item-price-input').value) || 0;
        const total = quantity * price;

        serviceItems.push({ description, quantity, price, total });
        
        // Update individual item total
        const totalElement = item.querySelector('.item-total-amount');
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    });
    
    // Calculate totals
    const subtotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
    const taxToggle = document.getElementById('quickInvoiceTaxToggle');
    const taxEnabled = taxToggle && taxToggle.checked;
    const taxAmount = taxEnabled ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + taxAmount;
    
    // Update total displays
    document.getElementById('quickInvoiceSubtotalAmount').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('quickInvoiceTaxAmount').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('quickInvoiceGrandTotalAmount').textContent = `$${grandTotal.toFixed(2)}`;

    // Show/hide tax row
    const taxRow = document.getElementById('quickInvoiceTaxRow');
    if (taxRow) {
    taxRow.style.display = taxEnabled ? 'flex' : 'none';
}
}

function generateQuickQuote() {
    // Validate required fields
    const clientName = document.getElementById('quickQuoteClientName').value.trim();
    if (!clientName) {
        showNotification('Please enter client name', 'error');
        return;
    }

    // Get service items
    const container = document.getElementById('quickQuoteServiceItems');
    const serviceItems = [];
    
    container.querySelectorAll('.service-item').forEach(item => {
        const description = item.querySelector('.item-desc-input').value.trim();
        const quantity = parseFloat(item.querySelector('.item-qty-input').value) || 0;
        const price = parseFloat(item.querySelector('.item-price-input').value) || 0;
        
        if (description && quantity > 0 && price > 0) {
            serviceItems.push({
                description,
                quantity,
                price,
                total: quantity * price
            });
        }
    });

    if (serviceItems.length === 0) {
        showNotification('Please add at least one service item with description, quantity, and price', 'error');
        return;
    }

    // Generate preview
    generateQuickQuotePreview(serviceItems);
}

function generateQuickInvoice() {
    // Validate required fields
    const clientName = document.getElementById('quickInvoiceClientName').value.trim();
    if (!clientName) {
        showNotification('Please enter client name', 'error');
        return;
    }

    // Get service items
    const container = document.getElementById('quickInvoiceServiceItems');
    const serviceItems = [];
    
    container.querySelectorAll('.service-item').forEach(item => {
        const description = item.querySelector('.item-desc-input').value.trim();
        const quantity = parseFloat(item.querySelector('.item-qty-input').value) || 0;
        const price = parseFloat(item.querySelector('.item-price-input').value) || 0;
        
        if (description && quantity > 0 && price > 0) {
            serviceItems.push({
                description,
                quantity,
                price,
                total: quantity * price
            });
        }
    });

    if (serviceItems.length === 0) {
        showNotification('Please add at least one service item with description, quantity, and price', 'error');
        return;
    }

    // Generate preview
    generateQuickInvoicePreview(serviceItems);
}

function generateQuickQuotePreview(serviceItems) {
    console.log('🎯 generateQuickQuotePreview called with:', { serviceItems });
    const clientName = document.getElementById('quickQuoteClientName').value;
    const clientPhone = document.getElementById('quickQuoteClientPhone').value || 'N/A';
    const clientAddress = document.getElementById('quickQuoteClientAddress').value || 'N/A';
    const clientEmail = document.getElementById('quickQuoteClientEmail').value || 'N/A';
    const quoteDate = document.getElementById('quickQuoteDate').value;

    // Calculate totals
    const subtotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
    const taxToggle = document.getElementById('quickQuoteTaxToggle');
    const taxEnabled = taxToggle && taxToggle.checked;
    const taxAmount = taxEnabled ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + taxAmount;

    const quoteHTML = `
        <div class="quote-preview">
            <div class="quote-header">
                <h1>QUOTE</h1>
                <div class="quote-info">
                    <p><strong>Date:</strong> ${quoteDate}</p>
                    <p><strong>Quote #:</strong> QB-${Date.now()}</p>
                </div>
            </div>

            <div class="client-section">
                <h3>Bill To:</h3>
                <p><strong>${clientName}</strong></p>
                <p>${clientAddress}</p>
                <p>Phone: ${clientPhone}</p>
                <p>Email: ${clientEmail}</p>
            </div>

            <div class="services-section">
                <h3>Services & Items</h3>
                <table class="services-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${serviceItems.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                                <td>$${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="totals-section">
                    <div class="total-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    ${taxEnabled ? `
                        <div class="total-row">
                        <span>Tax (5%):</span>
                        <span>$${taxAmount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="total-row grand-total">
                    <span>Total:</span>
                    <span>$${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div class="terms-section">
                <h3 class="section-heading">Terms & Conditions</h3>
                <div class="terms-content">
                    <p>All estimates are valid for 60 days after the estimate has been delivered. Payment is due upon completion of work unless otherwise agreed upon. We accept check, and e-transfer.</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('quotePreviewContent').innerHTML = quoteHTML;
    closeModal('quickQuoteModal');
    // Add a small delay to ensure the close operation completes
    setTimeout(() => {
        console.log('🎯 Attempting to open quick quote preview modal...');
        openModal('quotePreviewModal');
    }, 200);
}

function generateQuickInvoicePreview(serviceItems) {
    console.log('🎯 generateQuickInvoicePreview called with:', { serviceItems });
    const clientName = document.getElementById('quickInvoiceClientName').value;
    const clientPhone = document.getElementById('quickInvoiceClientPhone').value || 'N/A';
    const clientAddress = document.getElementById('quickInvoiceClientAddress').value || 'N/A';
    const clientEmail = document.getElementById('quickInvoiceClientEmail').value || 'N/A';
    const invoiceDate = document.getElementById('quickInvoiceDate').value;

    // Calculate totals
    const subtotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
    const taxToggle = document.getElementById('quickInvoiceTaxToggle');
    const taxEnabled = taxToggle && taxToggle.checked;
    const taxAmount = taxEnabled ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + taxAmount;

    const invoiceHTML = `
        <div class="invoice-preview">
            <div class="invoice-header">
                <h1>INVOICE</h1>
                <div class="invoice-info">
                    <p><strong>Date:</strong> ${invoiceDate}</p>
                    <p><strong>Invoice #:</strong> INV-${Date.now()}</p>
                </div>
            </div>

            <div class="client-section">
                <h3>Bill To:</h3>
                <p><strong>${clientName}</strong></p>
                <p>${clientAddress}</p>
                <p>Phone: ${clientPhone}</p>
                <p>Email: ${clientEmail}</p>
            </div>

            <div class="services-section">
                <h3>Services & Items</h3>
                <table class="services-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${serviceItems.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                                <td>$${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="totals-section">
                    <div class="total-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    ${taxEnabled ? `
                        <div class="total-row">
                        <span>Tax (5%):</span>
                        <span>$${taxAmount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="total-row grand-total">
                    <span>Total:</span>
                    <span>$${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div class="terms-section">
                <h3 class="section-heading">Payment Terms</h3>
                <div class="terms-content">
                    <p>Payment is due upon receipt of this invoice. We accept check, and e-transfer. Please include the invoice number with your payment.</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('invoicePreviewContent').innerHTML = invoiceHTML;
    closeModal('quickInvoiceModal');
    // Add a small delay to ensure the close operation completes
    setTimeout(() => {
        console.log('🎯 Attempting to open quick invoice preview modal...');
        openModal('invoicePreviewModal');
    }, 200);
}

// Photo upload functions
function triggerQuickQuotePhotoUpload(uploadArea) {
    const serviceItem = uploadArea.closest('.service-item');
    const fileInput = serviceItem.querySelector('.photo-upload-input');
    fileInput.click();
}

function triggerQuickInvoicePhotoUpload(uploadArea) {
    const serviceItem = uploadArea.closest('.service-item');
    const fileInput = serviceItem.querySelector('.photo-upload-input');
    fileInput.click();
}

function handleQuickQuotePhotoUpload(fileInput) {
    const serviceItem = fileInput.closest('.service-item');
    const files = fileInput.files;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                tempPhotos.push({
                    data: e.target.result,
                    name: file.name,
                    type: file.type
                });
                displayTempPhotos(serviceItem);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Clear the file input
    fileInput.value = '';
    
    showNotification(`${tempPhotos.length} photos added to quick quote`, 'info');
}

function handleQuickInvoicePhotoUpload(fileInput) {
    const serviceItem = fileInput.closest('.service-item');
    const files = fileInput.files;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                tempPhotos.push({
                    data: e.target.result,
                    name: file.name,
                    type: file.type
                });
                displayTempPhotos(serviceItem);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Clear the file input
    fileInput.value = '';
    
    showNotification(`${tempPhotos.length} photos added to quick invoice`, 'info');
}

function displayTempPhotos(serviceItem) {
    const photosContainer = serviceItem.querySelector('.photos-container');
    photosContainer.innerHTML = '';
    
    tempPhotos.forEach((photo, index) => {
        const photoPreview = document.createElement('div');
        photoPreview.className = 'photo-preview';
        photoPreview.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="photo-remove" onclick="removeTempPhoto(${index})">×</button>
        `;
        photosContainer.appendChild(photoPreview);
    });
}

function removeTempPhoto(index) {
    tempPhotos.splice(index, 1);
    // Refresh all photo displays
    document.querySelectorAll('.service-item').forEach(item => {
        displayTempPhotos(item);
    });
}

// Print functions
function printQuote() {
    window.print();
}

function printInvoice() {
    window.print();
}

// Initialize the quick billing functionality when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Quick Billing module loaded');
    
    // Set up initial service item listeners
    setupQuickQuoteServiceItemListeners();
    setupQuickInvoiceServiceItemListeners();
    
    // Initialize totals
    updateQuickQuoteTotals();
    updateQuickInvoiceTotals();
});
// Booking System JavaScript
class BookingSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3; // Reduced from 4 to 3 since time selection is now part of step 2
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedService = null;
        this.bookingData = {};
        this.availabilityData = {};
        this.isSubmitting = false; // Flag to prevent duplicate submissions
        this.listenersSetup = false; // Flag to prevent duplicate event listeners
        
        // Business configuration
        this.businessHours = {
            maxBookingsPerTimeSlot: 1, // Only 1 booking per time slot
            workingDays: [1, 2, 3, 4, 5], // Monday to Friday (0 = Sunday, 6 = Saturday)
            timeSlots: ['5:30 PM', '6:30 PM', '7:30 PM'], // Available time slots for quotes
            jobTimeSlots: ['5:30 PM'] // Only 5:30 PM available for job scheduling
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.initializeCalendar();
        this.setupAddressAutocomplete();
        await this.loadExistingBookings();
        await this.loadAvailabilityData();
        this.renderCalendar(); // Re-render calendar with loaded data
        this.updateStepDisplay(); // Ensure initial step is displayed
    }
    
    setupEventListeners() {
        // Prevent duplicate event listener setup
        if (this.listenersSetup) {
            return;
        }
        
        // Step navigation
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });
        
        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });
        
        // Monitor step changes to refresh calendar data when needed
        this.setupStepChangeMonitoring();
        
        // Service selection - auto-advance to next step
        document.querySelectorAll('input[name="service"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // Auto-advance to next step after a short delay for better UX
                setTimeout(() => {
                    if (this.validateServiceSelection()) {
                        this.nextStep();
                    }
                }, 300); // 300ms delay for smooth transition
            });
        });
        
        // Calendar navigation
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        
        // Remove existing listeners to prevent duplicates
        prevMonthBtn.removeEventListener('click', this.prevMonthHandler);
        nextMonthBtn.removeEventListener('click', this.nextMonthHandler);
        
        // Create bound handlers
        this.prevMonthHandler = () => this.changeMonth(-1);
        this.nextMonthHandler = () => this.changeMonth(1);
        
        // Add new listeners
        prevMonthBtn.addEventListener('click', this.prevMonthHandler);
        nextMonthBtn.addEventListener('click', this.nextMonthHandler);
        
        // Form submission
        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.showBookingSummary();
        });
        
        // Modal events
        document.getElementById('confirmBooking').addEventListener('click', () => this.submitBooking());
        document.getElementById('cancelBooking').addEventListener('click', () => this.closeModal('bookingModal'));
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            });
        });
        
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (mobileMenuToggle && navLinks) {
            mobileMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
        
        this.listenersSetup = true; // Mark listeners as setup
        
        // Setup phone number formatting
        this.setupPhoneFormatting();
        
        // Setup image upload functionality
        this.setupImageUpload();
        
        // Make debug method available globally
        window.debugFullDayJobs = () => this.debugFullDayJobs();
    }
    
    /**
     * Monitor step changes to refresh calendar data when the calendar step is shown
     */
    setupStepChangeMonitoring() {
        // Create a MutationObserver to watch for step changes
        const stepObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'step2' && target.classList.contains('active')) {
                        // Calendar step is now active, refresh data if needed
                        console.log('📅 Calendar step activated, ensuring data consistency...');
                        this.ensureCalendarDataConsistency().then(() => {
                            // Re-render calendar with fresh data
                            this.renderCalendar();
                        });
                    }
                }
            });
        });
        
        // Start observing the step elements
        const stepElements = document.querySelectorAll('.booking-step');
        stepElements.forEach(step => {
            stepObserver.observe(step, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
        
        console.log('📅 Step change monitoring setup completed');
    }
    
    /**
     * Debug method to test full-day job detection
     * Call this from the console to see what's happening
     */
    debugFullDayJobs() {
        console.log('🔍 Debugging full-day job detection...');
        console.log('📅 Current month:', this.currentMonth);
        console.log('📅 Existing bookings:', this.existingBookings);
        console.log('📅 Blocked dates:', this.blockedDates);
        console.log('📅 Availability data:', this.availabilityData);
        
        // Check for full-day job blocks
        if (this.blockedDates) {
            const fullDayJobBlocks = this.blockedDates.filter(bd => bd.reason === 'full_day_job');
            console.log('📅 Full-day job blocks found:', fullDayJobBlocks);
            
            fullDayJobBlocks.forEach(block => {
                const jobBooking = this.findJobBookingForDate(block.date);
                console.log(`📅 Job block for ${block.date}:`, {
                    block: block,
                    jobBooking: jobBooking
                });
            });
        }
        
        // Check for job bookings in existing bookings
        if (this.existingBookings) {
            const jobBookings = this.existingBookings.filter(b => 
                ['pending-booking', 'invoice-ready', 'invoice-sent', 'completed'].includes(b.status)
            );
            console.log('📅 Job bookings found:', jobBookings);
        }
    }
    
    setupPhoneFormatting() {
        const phoneInput = document.getElementById('phone');
        if (!phoneInput) return;
        
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = `(${value}`;
                } else if (value.length <= 6) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                } else {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
            }
            
            e.target.value = value;
        });
    }
    
    setupImageUpload() {
        const imageInput = document.getElementById('images');
        const uploadArea = document.getElementById('imageUploadArea');
        const previewContainer = document.getElementById('imagePreviewContainer');
        
        if (!imageInput || !uploadArea || !previewContainer) return;
        
        // Store selected files
        this.selectedImages = [];
        
        // Click to upload
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });
        
        // File selection
        imageInput.addEventListener('change', (e) => {
            this.handleImageSelection(e.target.files);
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleImageSelection(e.dataTransfer.files);
        });
    }
    
    handleImageSelection(files) {
        const maxFiles = 5;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        // Check if adding these files would exceed the limit
        if (this.selectedImages.length + files.length > maxFiles) {
            this.showNotification(`You can only upload up to ${maxFiles} images.`, 'error');
            return;
        }
        
        Array.from(files).forEach(file => {
            // Check file type
            if (!file.type.startsWith('image/')) {
                this.showNotification(`${file.name} is not an image file.`, 'error');
                return;
            }
            
            // Check file size
            if (file.size > maxSize) {
                this.showNotification(`${file.name} is too large. Maximum size is 5MB.`, 'error');
                return;
            }
            
            // Check if file is already selected
            if (this.selectedImages.some(img => img.name === file.name && img.size === file.size)) {
                this.showNotification(`${file.name} is already selected.`, 'error');
                return;
            }
            
            // Add to selected images
            this.selectedImages.push(file);
            this.createImagePreview(file);
        });
        
        // Update file input
        this.updateFileInput();
    }
    
    createImagePreview(file) {
        const previewContainer = document.getElementById('imagePreviewContainer');
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.dataset.filename = file.name;
            
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <button type="button" class="remove-image" title="Remove image">
                    <i class="fas fa-times"></i>
                </button>
                <div class="file-name">${file.name}</div>
            `;
            
            // Remove image functionality
            previewItem.querySelector('.remove-image').addEventListener('click', () => {
                this.removeImage(file.name);
                previewItem.remove();
            });
            
            previewContainer.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    }
    
    removeImage(filename) {
        this.selectedImages = this.selectedImages.filter(img => img.name !== filename);
        this.updateFileInput();
    }
    
    updateFileInput() {
        const imageInput = document.getElementById('images');
        
        // Create a new FileList-like object
        const dt = new DataTransfer();
        this.selectedImages.forEach(file => dt.items.add(file));
        imageInput.files = dt.files;
    }
    
    setupAddressAutocomplete() {
        const addressInput = document.getElementById('address');
        const suggestionsContainer = document.getElementById('address-suggestions');
        
        if (!addressInput || !suggestionsContainer) return;
        
        // Check if Geoapify API key is available
        if (!window.GEOAPIFY_API_KEY) {
            console.warn('Geoapify API key not found. Address autocomplete will not work.');
            this.setupSimpleAddressInput(addressInput);
            return;
        }
        
        // Disable browser autocomplete
        addressInput.setAttribute('autocomplete', 'off');
        addressInput.setAttribute('autocorrect', 'off');
        addressInput.setAttribute('autocapitalize', 'off');
        addressInput.setAttribute('spellcheck', 'false');
        
        let searchTimeout;
        let isSelectionMade = false;
        
        addressInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Reset selection flag when user starts typing
            isSelectionMade = false;
            
            // Hide suggestions if query is too short
            if (query.length < 3) {
                suggestionsContainer.style.display = 'none';
                addressInput.classList.remove('loading');
                return;
            }
            
            // Add loading indicator
            addressInput.classList.add('loading');
            
            // Debounce the search
            searchTimeout = setTimeout(() => {
                this.fetchAddressSuggestions(query, suggestionsContainer, addressInput);
            }, 300);
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!addressInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
        
        // Handle keyboard navigation
        addressInput.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('.address-suggestion-item');
            const activeSuggestion = suggestionsContainer.querySelector('.address-suggestion-item.active');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!activeSuggestion) {
                    suggestions[0]?.classList.add('active');
                } else {
                    const currentIndex = Array.from(suggestions).indexOf(activeSuggestion);
                    const nextIndex = (currentIndex + 1) % suggestions.length;
                    activeSuggestion.classList.remove('active');
                    suggestions[nextIndex]?.classList.add('active');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (activeSuggestion) {
                    const currentIndex = Array.from(suggestions).indexOf(activeSuggestion);
                    const prevIndex = currentIndex === 0 ? suggestions.length - 1 : currentIndex - 1;
                    activeSuggestion.classList.remove('active');
                    suggestions[prevIndex]?.classList.add('active');
                }
            } else if (e.key === 'Enter' && activeSuggestion) {
                e.preventDefault();
                activeSuggestion.click();
            } else if (e.key === 'Escape') {
                suggestionsContainer.style.display = 'none';
                addressInput.blur();
            } else if (e.key === 'Tab') {
                // Hide suggestions on tab
                suggestionsContainer.style.display = 'none';
            }
        });
        
        // Prevent form submission on Enter if suggestions are visible
        addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && suggestionsContainer.style.display === 'block') {
                e.preventDefault();
            }
        });
        
        // Store the original click handler for suggestions
        this.addressSuggestionClickHandler = (suggestionItem, input, container) => {
            return () => {
                // Use the formatted address from Geoapify
                const formattedAddress = suggestionItem.dataset.formatted || suggestionItem.textContent;
                input.value = formattedAddress;
                container.style.display = 'none';
                input.classList.remove('loading');
                isSelectionMade = true;
                
                // Trigger a blur event to validate the field
                setTimeout(() => {
                    input.blur();
                }, 100);
            };
        };
    }
    
    async fetchAddressSuggestions(query, container, input) {
        try {
            const apiKey = window.GEOAPIFY_API_KEY;
            const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&apiKey=${apiKey}&limit=5&country=ca&format=json`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            input.classList.remove('loading');
            
            if (result.results && result.results.length > 0) {
                this.displayAddressSuggestions(result.results, container, input);
            } else {
                container.style.display = 'none';
            }
        } catch (error) {
            console.error('Address autocomplete error:', error);
            input.classList.remove('loading');
            container.style.display = 'none';
        }
    }
    
    displayAddressSuggestions(results, container, input) {
        container.innerHTML = '';
        
        if (!results || results.length === 0) {
            container.style.display = 'none';
            input.classList.remove('loading');
            return;
        }
        
        results.forEach((result, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'address-suggestion-item';
            
            // Extract address information from Geoapify search response
            const mainText = result.address_line1 || result.street || result.housenumber + ' ' + result.street || '';
            const secondaryText = result.address_line2 || [
                result.city,
                result.state,
                result.postcode
            ].filter(Boolean).join(', ');
            
            // Store the formatted address as data attribute
            const formattedAddress = result.formatted || `${mainText}, ${secondaryText}`;
            suggestionItem.dataset.formatted = formattedAddress;
            
            suggestionItem.innerHTML = `
                <div class="main-text">${mainText}</div>
                <div class="secondary-text">${secondaryText}</div>
            `;
            
            // Use the stored click handler
            suggestionItem.addEventListener('click', this.addressSuggestionClickHandler(suggestionItem, input, container));
            
            container.appendChild(suggestionItem);
        });
        
        container.style.display = 'block';
        input.classList.remove('loading');
    }
    
    setupSimpleAddressInput(addressInput) {
        // Fallback for when Geoapify API is not available
        console.log('Setting up simple address input without autocomplete');
        
        // Add a helpful placeholder
        addressInput.placeholder = 'Enter your full Canadian address (e.g., 123 Main St, Toronto, ON M5V 3A8)';
        
        // Add some basic validation
        addressInput.addEventListener('blur', () => {
            const value = addressInput.value.trim();
            if (value && value.length < 10) {
                this.showNotification('Please enter a complete address', 'warning');
            }
        });
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStepDisplay();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            
            // If we're going back to the calendar step, refresh the data
            if (this.currentStep === 2) {
                console.log('📅 Returning to calendar step, refreshing data...');
                setTimeout(async () => {
                    await this.ensureCalendarDataConsistency();
                    this.renderCalendar();
                }, 100);
            }
        }
    }
    
    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        currentStepElement.classList.add('active');
        
        // Update button text
        const submitBtn = document.querySelector('#step3 .btn-primary');
        if (submitBtn) {
            submitBtn.textContent = this.currentStep === this.totalSteps ? 'Book Appointment' : 'Continue';
        }
        
        // If we're on step 2 (date and time selection), ensure calendar shows selected date
        if (this.currentStep === 2) {
            // Ensure calendar data is consistent and up-to-date
            console.log('📅 Calendar step activated, ensuring data consistency...');
            
            setTimeout(async () => {
                // Check and refresh data if needed
                await this.ensureCalendarDataConsistency();
                
                // Re-render calendar with fresh data
                this.renderCalendar();
                
                if (this.selectedDate) {
                    this.updateSelectedDateDisplay();
                    // Show time selection if date is selected
                    const timeSelectionContainer = document.getElementById('timeSelectionContainer');
                    if (timeSelectionContainer) {
                        timeSelectionContainer.style.display = 'block';
                    }
                }
            }, 0);
        }
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateServiceSelection();
            case 2:
                return this.validateDateAndTimeSelection();
            case 3:
                return this.validateContactInfo();
            default:
                return true;
        }
    }
    
    validateServiceSelection() {
        const selectedService = document.querySelector('input[name="service"]:checked');
        if (!selectedService) {
            this.showNotification('Please select a service', 'error');
            return false;
        }
        
        // Validate service type against allowed values
        const validServices = ['Tree Removal', 'Trimming & Pruning', 'Stump Grinding', 'Emergency Service'];
        if (!validServices.includes(selectedService.value)) {
            this.showNotification('Invalid service selected', 'error');
            return false;
        }
        
        this.selectedService = selectedService.value;
        return true;
    }
    
    validateDateAndTimeSelection() {
        if (!this.selectedDate) {
            this.showNotification('Please select a date', 'error');
            return false;
        }
        if (!this.selectedTime) {
            this.showNotification('Please select a time', 'error');
            return false;
        }
        
        // Validate date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateOnly = new Date(this.selectedDate);
        selectedDateOnly.setHours(0, 0, 0, 0);
        
        if (selectedDateOnly < today) {
            this.showNotification('Cannot select past dates. Please choose a future date.', 'error');
            return false;
        }
        
        // Validate time slot
        const validTimes = ['5:30 PM', '6:30 PM', '7:30 PM'];
        if (!validTimes.includes(this.selectedTime)) {
            this.showNotification('Invalid time slot selected', 'error');
            return false;
        }
        
        // Check if selected date is too far in the future (e.g., more than 1 year)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        
        if (selectedDateOnly > oneYearFromNow) {
            this.showNotification('Cannot book more than one year in advance', 'error');
            return false;
        }
        
        return true;
    }
    
    validateContactInfo() {
        const requiredFields = ['name', 'email', 'phone', 'address'];
        for (const field of requiredFields) {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                this.showNotification(`Please fill in ${field}`, 'error');
                input.focus();
                return false;
            }
        }
        
        // Get and validate all inputs
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        // Name validation (2-50 characters, letters, spaces, common punctuation)
        if (name.length < 2 || name.length > 50) {
            this.showNotification('Name must be between 2 and 50 characters', 'error');
            document.getElementById('name').focus();
            return false;
        }
        
        if (!/^[a-zA-Z\s\-\.\']+$/.test(name)) {
            this.showNotification('Name can only contain letters, spaces, hyphens, periods, and apostrophes', 'error');
            document.getElementById('name').focus();
            return false;
        }
        
        // Email validation (enhanced)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(email) || email.length > 254) {
            this.showNotification('Please enter a valid email address', 'error');
            document.getElementById('email').focus();
            return false;
        }
        
        // Phone validation (enhanced)
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
            this.showNotification('Please enter a valid phone number (10-15 digits)', 'error');
            document.getElementById('phone').focus();
            return false;
        }
        
        // Address validation (enhanced)
        if (address.length < 10 || address.length > 200) {
            this.showNotification('Address must be between 10 and 200 characters', 'error');
            document.getElementById('address').focus();
            return false;
        }
        
        // Notes validation (optional, but limited)
        if (notes.length > 500) {
            this.showNotification('Notes cannot exceed 500 characters', 'error');
            document.getElementById('notes').focus();
            return false;
        }
        
        // Security validation - check for potentially harmful content
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /vbscript:/i,
            /data:/i
        ];
        
        const fieldsToCheck = [name, email, address, notes];
        const fieldNames = ['name', 'email', 'address', 'notes'];
        
        for (let i = 0; i < fieldsToCheck.length; i++) {
            const field = fieldsToCheck[i];
            for (const pattern of dangerousPatterns) {
                if (pattern.test(field)) {
                    this.showNotification(`Invalid characters detected in ${fieldNames[i]} field`, 'error');
                    document.getElementById(fieldNames[i]).focus();
                    return false;
                }
            }
        }
        
        // Check for excessive repetition (potential spam)
        const hasExcessiveRepetition = (str) => {
            const repeated = str.match(/(.{3,})\1{2,}/g);
            return repeated && repeated.some(match => match.length > 20);
        };
        
        if (hasExcessiveRepetition(name) || hasExcessiveRepetition(address) || hasExcessiveRepetition(notes)) {
            this.showNotification('Please enter valid information without excessive repetition', 'error');
            return false;
        }
        
        return true;
    }
    
    initializeCalendar() {
        // Use current date and set to first day of current month
        const now = new Date();
        this.currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Don't render calendar here - it will be rendered after loading data
    }
    
    renderCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        console.log(`📅 Rendering calendar for month: ${month} (${monthNames[month]}) ${year}`);
        console.log(`📅 Available data: ${this.existingBookings?.length || 0} existing bookings, ${Object.keys(this.availabilityData).length} availability entries`);
        console.log(`📅 Blocked dates: ${this.blockedDates?.length || 0} blocked dates`);
        
        // Debug: Log some sample data
        if (this.availabilityData && Object.keys(this.availabilityData).length > 0) {
            console.log('📅 Sample availability data:', Object.entries(this.availabilityData).slice(0, 3));
        }
        if (this.blockedDates && this.blockedDates.length > 0) {
            console.log('📅 Sample blocked dates:', this.blockedDates.slice(0, 3));
        }
        

        
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
        
        // Get first day and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        // Generate calendar days
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDate.getDate();
            
            // Add data-date attribute for easy lookup
            const dateString = this.formatDateForServer(currentDate);
            dayElement.setAttribute('data-date', dateString);
            
            // Check if it's current month
            if (currentDate.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            // Check if it's today
            const today = new Date();
            if (this.isSameDay(currentDate, today)) {
                dayElement.classList.add('today');
            }
            
            // Check if it's the selected date
            if (this.selectedDate && this.isSameDay(currentDate, this.selectedDate)) {
                dayElement.classList.add('selected');
            }
            
            // Check if date is in the past
            if (currentDate < today) {
                dayElement.classList.add('disabled');
            } else {
                // Check if date has bookings
                const dateString = this.formatDateForServer(currentDate);
                const dayBookings = this.availabilityData[dateString] || {};
                
                // Debug logging for availability data (only for dates with bookings)
                if (dayBookings && Object.keys(dayBookings).length > 0) {
                    console.log(`Date ${dateString} has bookings:`, dayBookings);
                }
                
                // Check if it's weekend (automatically blocked)
                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                
                // Check if date is blocked (from availability data or blocked dates)
                // Only block a date if it's explicitly blocked, not if other dates are blocked
                const isBlocked = (this.availabilityData[dateString] && this.availabilityData[dateString].blocked === true) || 
                                 (this.blockedDates && this.blockedDates.some(blockedDate => 
                                     blockedDate.date === dateString && blockedDate.reason !== 'unblocked_weekend'
                                 ));
                
                // Check if date is blocked due to a full-day job (jobs block entire days)
                // Check both availability data and blocked dates
                const isFullDayJobBlocked = (this.availabilityData[dateString] && 
                                          this.availabilityData[dateString].full_day_job === true) ||
                                          (this.blockedDates && this.blockedDates.some(blockedDate => 
                                              blockedDate.date === dateString && blockedDate.reason === 'full_day_job'
                                          ));
                
                // Debug logging for full-day job detection
                if (isFullDayJobBlocked) {
                    console.log(`📅 Full-day job detected for ${dateString}:`, {
                        availabilityData: this.availabilityData[dateString],
                        blockedDates: this.blockedDates?.filter(bd => bd.date === dateString)
                    });
                }
                

                
                // Check if weekend is explicitly unblocked
                const isUnblockedWeekend = this.blockedDates && this.blockedDates.some(blockedDate => 
                    blockedDate.date === dateString && blockedDate.reason === 'unblocked_weekend'
                );
                
                if (isFullDayJobBlocked) {
                    // Full day blocked due to job scheduling - show as completely unavailable
                    dayElement.classList.add('blocked');
                    dayElement.classList.add('job-blocked'); // Add specific class for styling
                    dayElement.title = 'Full day blocked - Job scheduled at 5:30 PM';
                    
                    // Find the specific job booking details
                    const jobBooking = this.findJobBookingForDate(dateString);
                    
                    // Add job blocking indicator with more details
                    const blockingInfo = document.createElement('div');
                    blockingInfo.className = 'blocking-info job-blocked';
                    
                    if (jobBooking) {
                        const customerName = jobBooking.name || 'Unknown Customer';
                        const service = jobBooking.service || 'Tree Service';
                        blockingInfo.innerHTML = `
                            <div class="blocking-text">Job</div>
                        `;
                        dayElement.title = `Full day blocked - Job for ${customerName} (${service}) at 5:30 PM`;
                    } else {
                        blockingInfo.innerHTML = `
                            <div class="blocking-text">Job</div>
                        `;
                    }
                    
                    dayElement.appendChild(blockingInfo);
                } else if (isBlocked) {
                    dayElement.classList.add('blocked');
                    dayElement.title = 'This day is blocked';
                    
                    // Add blocking indicator
                    const blockingInfo = document.createElement('div');
                    blockingInfo.className = 'blocking-info blocked';
                    blockingInfo.innerHTML = `
                        <div class="blocking-text">Blocked</div>
                    `;
                    dayElement.appendChild(blockingInfo);
                } else if (isWeekend && !isUnblockedWeekend) {
                    // Weekends are blocked by default unless explicitly unblocked
                    dayElement.classList.add('blocked');
                    dayElement.classList.add('weekend');
                    dayElement.title = 'Weekend - blocked by default';
                    
                    // Add weekend blocking indicator
                    const blockingInfo = document.createElement('div');
                    blockingInfo.className = 'blocking-info weekend-blocked';
                    blockingInfo.innerHTML = `
                        <div class="blocking-text">Weekend</div>
                    `;
                    dayElement.appendChild(blockingInfo);
                } else {
                    // Check booking status for this day
                    const timeSlots = this.businessHours.timeSlots;
                    let totalBookings = 0;
                    let bookedTimeSlots = [];
                    
                    // Count bookings for each time slot
                    timeSlots.forEach(time => {
                        const bookingCount = dayBookings[time] || 0;
                        totalBookings += bookingCount;
                        if (bookingCount >= this.businessHours.maxBookingsPerTimeSlot) {
                            bookedTimeSlots.push(time);
                        }
                    });
                    
                    // Debug logging for dates with bookings
                    if (totalBookings > 0) {
                        console.log(`Date ${dateString}: Total bookings: ${totalBookings}, Booked time slots: ${bookedTimeSlots.length}/${timeSlots.length}`);
                    }
                    
                    // Determine day status
                    if (bookedTimeSlots.length === timeSlots.length) {
                        // All time slots are booked
                        dayElement.classList.add('booked');
                        dayElement.classList.add('fully-booked');
                        dayElement.title = 'All time slots are booked';
                        
                        // Add booking count indicator
                        const bookingInfo = document.createElement('div');
                        bookingInfo.className = 'booking-info fully-booked';
                        bookingInfo.innerHTML = `
                            <div class="booking-count">${totalBookings}</div>
                            <div class="booking-preview">Full</div>
                        `;
                        dayElement.appendChild(bookingInfo);
                    } else if (bookedTimeSlots.length > 0) {
                        // Some time slots are booked
                        dayElement.classList.add('partially-booked');
                        dayElement.title = `Some time slots booked: ${bookedTimeSlots.join(', ')}`;
                        
                        // Add booking count indicator
                        const bookingInfo = document.createElement('div');
                        bookingInfo.className = 'booking-info partially-booked';
                        bookingInfo.innerHTML = `
                            <div class="booking-count">${totalBookings}</div>
                            <div class="booking-preview">Partial</div>
                        `;
                        dayElement.appendChild(bookingInfo);
                    } else if (totalBookings > 0) {
                        // Has some bookings but not fully booked
                        dayElement.classList.add('partially-booked');
                        dayElement.title = `Has ${totalBookings} booking(s)`;
                        
                        // Add booking count indicator
                        const bookingInfo = document.createElement('div');
                        bookingInfo.className = 'booking-info has-bookings';
                        bookingInfo.innerHTML = `
                            <div class="booking-count">${totalBookings}</div>
                            <div class="booking-preview">Booked</div>
                        `;
                        dayElement.appendChild(bookingInfo);
                    } else {
                        // Available for booking
                        dayElement.classList.add('available');
                        dayElement.title = 'Available for booking';
                        
                        // Add availability indicator
                        const availabilityInfo = document.createElement('div');
                        availabilityInfo.className = 'availability-info';
                        availabilityInfo.innerHTML = `
                            <div class="availability-text">Open</div>
                        `;
                        dayElement.appendChild(availabilityInfo);
                    }
                }
                
                // Add click event listener for selectable dates
                dayElement.addEventListener('click', () => this.selectDate(currentDate));
            }
            
            calendarDays.appendChild(dayElement);
        }
        
        // Enhance calendar display with existing booking details
        this.enhanceCalendarWithExistingBookings();
    }
    
    /**
     * Enhance calendar display with detailed information from existing bookings
     * This provides better visibility of what's already booked
     */
    enhanceCalendarWithExistingBookings() {
        if (!this.existingBookings || this.existingBookings.length === 0) {
            return;
        }
        
        console.log('📅 Enhancing calendar with existing booking details...');
        
        // Group bookings by date for easier lookup
        const bookingsByDate = {};
        this.existingBookings.forEach(booking => {
            const dateKey = booking.date;
            if (!bookingsByDate[dateKey]) {
                bookingsByDate[dateKey] = [];
            }
            bookingsByDate[dateKey].push(booking);
        });
        
        // Enhance each calendar day with existing booking information
        Object.keys(bookingsByDate).forEach(dateString => {
            const dayElement = document.querySelector(`[data-date="${dateString}"]`);
            if (dayElement) {
                const dateBookings = bookingsByDate[dateString];
                
                // Add detailed booking information
                const existingBookingsInfo = document.createElement('div');
                existingBookingsInfo.className = 'existing-bookings-info';
                
                const bookingDetails = dateBookings.map(booking => {
                    const status = booking.status || 'unknown';
                    const time = booking.time || booking.job_time || 'TBD';
                    const customer = booking.name || 'Unknown';
                    
                    return `${status}: ${time} (${customer})`;
                }).join(', ');
                
                existingBookingsInfo.innerHTML = `
                    <div class="existing-bookings-title">Bookings:</div>
                    <div class="existing-bookings-details">${bookingDetails}</div>
                `;
                
                // Remove any existing info to avoid duplicates
                const existingInfo = dayElement.querySelector('.existing-bookings-info');
                if (existingInfo) {
                    existingInfo.remove();
                }
                
                dayElement.appendChild(existingBookingsInfo);
                
                console.log(`📅 Enhanced day ${dateString} with ${dateBookings.length} existing bookings`);
            }
        });
    }
    
    selectDate(date) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add selection to clicked day
        const dayElements = document.querySelectorAll('.calendar-day');
        const dayIndex = this.getDayIndex(date);
        if (dayElements[dayIndex]) {
            dayElements[dayIndex].classList.add('selected');
        }
        
        this.selectedDate = date;
        this.updateSelectedDateDisplay();
        this.loadTimeSlots();
        
        // Show time selection container
        const timeSelectionContainer = document.getElementById('timeSelectionContainer');
        if (timeSelectionContainer) {
            timeSelectionContainer.style.display = 'block';
        }
    }
    
    getDayIndex(date) {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        return Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
    }
    
    updateSelectedDateDisplay() {
        if (this.selectedDate) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const dateString = this.selectedDate.toLocaleDateString('en-US', options);
            document.getElementById('selectedDateDisplay').textContent = dateString;
        }
    }
    
    /**
     * Load available time slots for the selected date
     * 
     * IMPORTANT: This function handles QUOTE scheduling only.
     * - Quotes can be scheduled at 5:30 PM, 6:30 PM, or 7:30 PM on weekdays
     * - Jobs (when customer accepts quote) can ONLY be scheduled at 5:30 PM on weekdays
     * - When a job is scheduled, the entire day is blocked for all other bookings
     */
    loadTimeSlots() {
        if (!this.selectedDate) return;
        
        const timeSlotsContainer = document.getElementById('timeSlots');
        timeSlotsContainer.innerHTML = '';
        
        const dateString = this.formatDateForServer(this.selectedDate);
        const dayBookings = this.availabilityData[dateString] || {};
        
        // Check if it's weekend (automatically blocked)
        const isWeekend = this.selectedDate.getDay() === 0 || this.selectedDate.getDay() === 6;
        
        // Check if date is blocked (from availability data or blocked dates)
        // Only block a date if it's explicitly blocked, not if other dates are blocked
        const isBlocked = (this.availabilityData[dateString] && this.availabilityData[dateString].blocked === true) || 
                         (this.blockedDates && this.blockedDates.some(blockedDate => 
                             blockedDate.date === dateString && blockedDate.reason !== 'unblocked_weekend'
                         ));
        
        // Check if date is blocked due to a full-day job (jobs block entire days)
        const isFullDayJobBlocked = this.availabilityData[dateString] && 
                                   this.availabilityData[dateString].full_day_job === true;
        
        // Check if weekend is explicitly unblocked
        const isUnblockedWeekend = this.blockedDates && this.blockedDates.some(blockedDate => 
            blockedDate.date === dateString && blockedDate.reason === 'unblocked_weekend'
        );
        
        if (isFullDayJobBlocked) {
            // Full day blocked due to job scheduling
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot disabled job-blocked';
            timeSlot.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">🚫</div>
                    <div style="font-weight: 600; color: #dc3545;">Full Day Blocked</div>
                </div>
            `;
            timeSlot.title = 'This day is completely blocked due to a scheduled job. No quotes can be booked.';
            timeSlotsContainer.appendChild(timeSlot);
        } else if (isBlocked) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot disabled';
            timeSlot.textContent = 'This day is blocked';
            timeSlot.title = 'This day is blocked and unavailable for booking';
            timeSlotsContainer.appendChild(timeSlot);
        } else if (isWeekend && !isUnblockedWeekend) {
            // Weekends are blocked by default unless explicitly unblocked
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot disabled';
            timeSlot.textContent = 'Weekend - unavailable';
            timeSlot.title = 'Weekends are blocked by default';
            timeSlotsContainer.appendChild(timeSlot);
        } else {
            // Show available time slots
            this.businessHours.timeSlots.forEach(time => {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                
                const bookingsForTimeSlot = dayBookings[time] || 0;
                const isAvailable = bookingsForTimeSlot < this.businessHours.maxBookingsPerTimeSlot;
                
                if (isAvailable) {
                    timeSlot.textContent = time;
                    timeSlot.title = `Click to select ${time}`;
                    timeSlot.addEventListener('click', () => this.selectTimeSlot(timeSlot, time));
                } else {
                    timeSlot.classList.add('disabled');
                    timeSlot.textContent = `${time} - Booked`;
                    timeSlot.title = `${time} is already booked`;
                }
                
                timeSlotsContainer.appendChild(timeSlot);
            });
        }
    }
    
    selectTimeSlot(element, time) {
        // Remove previous selection
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Add selection
        element.classList.add('selected');
        this.selectedTime = time;
        
        // Auto-advance to next step after a short delay for better UX
        setTimeout(() => {
            if (this.validateDateAndTimeSelection()) {
                this.nextStep();
            }
        }, 300); // 300ms delay for smooth transition
    }
    
    isWorkingDay(date) {
        // Check if it's a weekday
        const isWeekday = this.businessHours.workingDays.includes(date.getDay());
        
        // If it's a weekday, it's always a working day
        if (isWeekday) {
            return true;
        }
        
        // If it's a weekend, check if it's been unblocked
        const dateString = this.formatDateForServer(date);
        const isUnblockedWeekend = this.blockedDates && this.blockedDates.some(blockedDate => 
            blockedDate.date === dateString && blockedDate.reason === 'unblocked_weekend'
        );
        
        return isUnblockedWeekend;
    }
    
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }
    
    async changeMonth(direction) {
        // Prevent rapid clicking
        if (this.isChangingMonth) {
            console.log('Month change already in progress, ignoring click');
            return;
        }
        
        this.isChangingMonth = true;
        
        const oldMonth = this.currentMonth.getMonth();
        const oldYear = this.currentMonth.getFullYear();
        
        console.log(`Before change: ${oldMonth}/${oldYear} (${this.currentMonth})`);
        
        // Calculate the target month and year
        let targetMonth = oldMonth + direction;
        let targetYear = oldYear;
        
        // Handle year transitions
        if (targetMonth > 11) {
            targetMonth = 0;
            targetYear++;
        } else if (targetMonth < 0) {
            targetMonth = 11;
            targetYear--;
        }
        
        // Create a new date object for the first day of the target month
        this.currentMonth = new Date(targetYear, targetMonth, 1);
        
        const newMonth = this.currentMonth.getMonth();
        const newYear = this.currentMonth.getFullYear();
        
        console.log(`After change: ${newMonth}/${newYear} (${this.currentMonth})`);
        console.log(`Direction: ${direction}, Target: ${targetMonth}/${targetYear}`);
        
                try {
            // Load availability data for the new month
            await this.loadAvailabilityData();
            
            // Ensure data consistency across month navigation
            await this.ensureCalendarDataConsistency();
            
            // Render calendar with all available data
            this.renderCalendar();
            
            console.log(`📅 Calendar rendered for ${newMonth}/${newYear} with ${this.existingBookings?.length || 0} existing bookings`);
        } finally {
            this.isChangingMonth = false;
        }
    }
    
    /**
     * Ensure calendar data consistency across month navigation
     * This method checks if we have all necessary data and reloads if needed
     */
    async ensureCalendarDataConsistency() {
        console.log('📅 Checking calendar data consistency...');
        
        // Check if we have existing bookings
        if (!this.existingBookings || this.existingBookings.length === 0) {
            console.log('📅 No existing bookings found, reloading...');
            await this.loadExistingBookings();
        }
        
        // Check if we have availability data for the current month
        const currentMonthKey = `${this.currentMonth.getFullYear()}-${String(this.currentMonth.getMonth() + 1).padStart(2, '0')}`;
        const hasCurrentMonthData = Object.keys(this.availabilityData).some(date => date.startsWith(currentMonthKey));
        
        if (!hasCurrentMonthData) {
            console.log('📅 No availability data for current month, reloading...');
            await this.loadAvailabilityData();
        }
        
        // Check if we have blocked dates
        if (!this.blockedDates || this.blockedDates.length === 0) {
            console.log('📅 No blocked dates found, reloading...');
            const blockedResponse = await fetch('/api/blocked-dates');
            if (blockedResponse.ok) {
                this.blockedDates = await blockedResponse.json();
            }
        }
        
        console.log('📅 Calendar data consistency check completed');
    }
    
    /**
     * Find job booking for a specific date
     * This helps display job details in the calendar
     */
    findJobBookingForDate(dateString) {
        if (!this.existingBookings) return null;
        
        return this.existingBookings.find(booking => 
            booking.job_date === dateString && 
            (booking.status === 'pending-booking' || 
             booking.status === 'invoice-ready' || 
             booking.status === 'invoice-sent' ||
             booking.status === 'completed')
        );
    }
    
    async refreshCalendar() {
        console.log('📅 Refreshing calendar data...');
        
        // Reload all data to ensure consistency
        await Promise.all([
            this.loadExistingBookings(),
            this.loadAvailabilityData()
        ]);
        
        // Re-render calendar with fresh data
        this.renderCalendar();
        
        console.log('📅 Calendar refresh completed');
    }
    
    async loadExistingBookings() {
        try {
            console.log('📅 Loading all existing bookings...');
            const response = await fetch('/api/bookings');
            if (response.ok) {
                this.existingBookings = await response.json();
                console.log(`📅 Loaded ${this.existingBookings.length} existing bookings`);
                
                // Log some sample bookings for debugging
                if (this.existingBookings.length > 0) {
                    const sampleBookings = this.existingBookings.slice(0, 3);
                    console.log('📅 Sample bookings:', sampleBookings.map(b => ({
                        id: b.booking_id,
                        date: b.date,
                        time: b.time,
                        status: b.status
                    })));
                    
                    // Log job bookings specifically
                    const jobBookings = this.existingBookings.filter(b => 
                        ['pending-booking', 'invoice-ready', 'invoice-sent', 'completed'].includes(b.status)
                    );
                    if (jobBookings.length > 0) {
                        console.log('📅 Found job bookings:', jobBookings.map(b => ({
                            id: b.booking_id,
                            date: b.date,
                            job_date: b.job_date,
                            time: b.time,
                            job_time: b.job_time,
                            status: b.status,
                            customer: b.name
                        })));
                    } else {
                        console.log('📅 No job bookings found');
                    }
                }
            } else {
                this.existingBookings = [];
                console.log('📅 Failed to load existing bookings');
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            this.existingBookings = [];
        }
    }
    
    async loadAvailabilityData() {
        try {
            console.log('📅 Starting to load availability data...');
            
            // First, run automatic cleanup to fix any inconsistencies
            try {
                console.log('🤖 Running automatic cleanup before loading availability data...');
                const cleanupResponse = await fetch('/api/blocked-dates/auto-cleanup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (cleanupResponse.ok) {
                    const cleanupResult = await cleanupResponse.json();
                    if (cleanupResult.totalActions > 0) {
                        console.log(`🤖 Auto-cleanup completed: ${cleanupResult.totalActions} actions taken`);
                        console.log('Details:', cleanupResult.details);
                    } else {
                        console.log('🤖 Auto-cleanup completed: No actions needed');
                    }
                } else {
                    console.warn('🤖 Auto-cleanup failed:', cleanupResponse.status, cleanupResponse.statusText);
                }
            } catch (cleanupError) {
                console.warn('Auto-cleanup failed (non-critical):', cleanupError);
            }
            
            // Get date range for current month PLUS surrounding dates to cover the full calendar grid
            // The calendar shows 6 weeks (42 days), so we need to ensure we cover all visible dates
            const currentMonthStart = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
            const currentMonthEnd = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
            
            // Calculate the first visible date (start of the week containing the first day of the month)
            const firstVisibleDate = new Date(currentMonthStart);
            firstVisibleDate.setDate(currentMonthStart.getDate() - currentMonthStart.getDay());
            
            // Calculate the last visible date (end of the week containing the last day of the month)
            const lastVisibleDate = new Date(currentMonthEnd);
            lastVisibleDate.setDate(currentMonthEnd.getDate() + (6 - currentMonthEnd.getDay()));
            
            const startDateStr = this.formatDateForServer(firstVisibleDate);
            const endDateStr = this.formatDateForServer(lastVisibleDate);
            
            console.log(`📅 Loading availability data for full calendar grid: ${startDateStr} to ${endDateStr}`);
            console.log(`📅 This covers the visible calendar dates including partial weeks from previous/next months`);
            console.log(`📅 Current month: ${this.currentMonth.getMonth() + 1}/${this.currentMonth.getFullYear()}`);
            console.log(`📅 First visible date: ${firstVisibleDate.toDateString()}`);
            console.log(`📅 Last visible date: ${lastVisibleDate.toDateString()}`);
            
            const response = await fetch(`/api/availability?start_date=${startDateStr}&end_date=${endDateStr}`);
            if (response.ok) {
                this.availabilityData = await response.json();
                console.log('📅 Successfully loaded availability data:', this.availabilityData);
                console.log(`📅 Availability data covers ${Object.keys(this.availabilityData).length} dates`);
            } else {
                console.error('❌ Failed to load availability data:', response.status, response.statusText);
                this.availabilityData = {};
            }

            // Load blocked dates
            console.log('📅 Loading blocked dates...');
            const blockedResponse = await fetch('/api/blocked-dates');
            if (blockedResponse.ok) {
                this.blockedDates = await blockedResponse.json();
                console.log('📅 Successfully loaded blocked dates:', this.blockedDates);
                console.log(`📅 Total blocked dates: ${this.blockedDates.length}`);
                
                // Log full-day job blocks specifically
                const fullDayJobBlocks = this.blockedDates.filter(bd => bd.reason === 'full_day_job');
                if (fullDayJobBlocks.length > 0) {
                    console.log('📅 Found full-day job blocks:', fullDayJobBlocks);
                } else {
                    console.log('📅 No full-day job blocks found in blocked dates');
                }
                
                // Log other types of blocked dates
                const otherBlockedDates = this.blockedDates.filter(bd => bd.reason !== 'full_day_job');
                if (otherBlockedDates.length > 0) {
                    console.log('📅 Other blocked dates:', otherBlockedDates);
                }
            } else {
                console.error('❌ Failed to load blocked dates:', blockedResponse.status, blockedResponse.statusText);
                this.blockedDates = [];
            }
            
            console.log('📅 Availability data loading completed successfully');
        } catch (error) {
            console.error('❌ Error loading availability data:', error);
            this.availabilityData = {};
            this.blockedDates = [];
        }
    }
    
    isTimeSlotAvailable(date) {
        if (!this.existingBookings) return true;
        
        const dateString = this.formatDateForServer(date);
        const dayBookings = this.availabilityData[dateString] || {};
        
        // Check if any time slot is available
        const timeSlots = this.businessHours.timeSlots;
        const availableTimeSlots = timeSlots.filter(time => 
            (dayBookings[time] || 0) < this.businessHours.maxBookingsPerTimeSlot
        );
        
        return availableTimeSlots.length > 0;
    }
    
    showBookingSummary() {
        // Populate summary
        document.getElementById('summaryService').textContent = this.selectedService;
        document.getElementById('summaryDate').textContent = this.selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('summaryTime').textContent = this.selectedTime;
        document.getElementById('summaryName').textContent = document.getElementById('name').value;
        document.getElementById('summaryEmail').textContent = document.getElementById('email').value;
        document.getElementById('summaryPhone').textContent = document.getElementById('phone').value;
        document.getElementById('summaryAddress').textContent = document.getElementById('address').value;
        
        this.showModal('bookingModal');
    }
    
    async submitBooking() {
        // Prevent duplicate submissions
        if (this.isSubmitting) {
            return;
        }
        
        this.isSubmitting = true;
        this.showLoading(true);
        
        const bookingData = {
            booking_id: this.generateBookingId(),
            service: this.selectedService,
            date: this.formatDateForServer(this.selectedDate),
            time: this.selectedTime,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            notes: document.getElementById('notes').value
        };
        
        try {
            // Create FormData for file upload
            const formData = new FormData();
            
            // Add booking data
            Object.keys(bookingData).forEach(key => {
                formData.append(key, bookingData[key]);
            });
            
            // Add images if any
            if (this.selectedImages && this.selectedImages.length > 0) {
                this.selectedImages.forEach(image => {
                    formData.append('images', image);
                });
            }
            
            const response = await fetch('/api/bookings', {
                method: 'POST',
                body: formData // Don't set Content-Type header, let browser set it with boundary
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showSuccessModal(result.bookingId);
                await this.resetForm();
            } else {
                const error = await response.json();
                
                // Handle different error types with specific messages
                let userMessage = error.error || error.message || 'Booking failed. Please try again.';
                
                if (error.type === 'time_slot_conflict') {
                    userMessage = 'This time slot is already booked by another customer. Please select a different time.';
                } else if (error.type === 'date_blocked') {
                    userMessage = `This date is not available for booking. ${error.reason ? `Reason: ${error.reason}` : 'Please select a different date.'}`;
                } else if (error.type === 'weekend_blocked') {
                    userMessage = 'Weekend dates are not available for booking. Please select a weekday.';
                } else if (error.type === 'past_date') {
                    userMessage = 'Cannot book appointments for past dates. Please select a future date.';
                } else if (error.type === 'same_date_booking_exists') {
                    userMessage = `You already have a booking on ${error.existingBooking.date}. Only one booking per customer per day is allowed.`;
                } else if (error.type === 'max_active_bookings') {
                    userMessage = 'You have reached the maximum number of active bookings (3). Please complete or cancel an existing booking first.';
                } else if (error.type === 'active_booking_exists') {
                    userMessage = `You already have an active booking for ${error.existingBooking.date} at ${error.existingBooking.time}. Please complete or cancel your existing booking before making a new one.`;
                }
                
                this.showNotification(userMessage, 'error');
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
            this.closeModal('bookingModal');
            this.isSubmitting = false; // Reset the flag
        }
    }
    
    generateBookingId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `ST-${timestamp}-${random}`.toUpperCase();
    }
    
    formatDateForServer(date) {
        // Format date as YYYY-MM-DD using the date as selected by user
        // No timezone conversion needed since user selects the date they want
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    showSuccessModal(bookingId) {
        document.getElementById('bookingId').textContent = bookingId;
        this.showModal('successModal');
    }
    
    async resetForm() {
        this.currentStep = 1;
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedService = null;
        this.isSubmitting = false; // Reset submission flag
        
        // Clear selected images
        this.selectedImages = [];
        const previewContainer = document.getElementById('imagePreviewContainer');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
        
        document.getElementById('bookingForm').reset();
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById('step1').classList.add('active');
        
        // Hide time selection container
        const timeSelectionContainer = document.getElementById('timeSelectionContainer');
        if (timeSelectionContainer) {
            timeSelectionContainer.style.display = 'none';
        }
        
        // Reload data and re-render calendar
        await this.loadExistingBookings();
        await this.loadAvailabilityData();
        this.renderCalendar();
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }
    
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.add('show');
        } else {
            spinner.classList.remove('show');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize booking system when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const bookingSystem = new BookingSystem();
    await bookingSystem.init();
});

// Add notification styles if not already present
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: var(--text-color);
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border-left: 4px solid var(--accent-color);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 400px;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.error {
            border-left-color: #ff4444;
            background: #fff5f5;
            color: #d32f2f;
        }
        
        .notification i {
            color: var(--accent-color);
        }
        
        .notification.error i {
            color: #ff4444;
        }
        
        @media (max-width: 768px) {
            .notification {
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(style);
} 
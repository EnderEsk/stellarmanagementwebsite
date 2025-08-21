// Admin Calendar JavaScript
// Extracted from admin.html for better organization

// Wrap everything in an IIFE to avoid global variable conflicts
(function() {
    // Calendar state variables
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let blockedDates = [];
    let selectedDate = null;
    let moveCalendarMonth = new Date();
    let selectedMoveDate = null;
    let moveBookingData = null;

    // Calendar functions
    function renderCalendar(bookings = []) {
        const grid = document.getElementById('calendarGrid');
        const monthDisplay = document.getElementById('calendarMonth');
        
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Clear grid
        grid.innerHTML = '';
        
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Mobile-friendly calendar with weeks
            renderMobileCalendar(grid, bookings);
        } else {
            // Desktop calendar (original grid layout)
            renderDesktopCalendar(grid, bookings);
        }
    }

    function renderMobileCalendar(grid, bookings = []) {
        // Create vertical timeline container
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        
        // Create vertical line
        const timelineLine = document.createElement('div');
        timelineLine.className = 'timeline-line';
        timelineContainer.appendChild(timelineLine);
        
        // Get all days in the current month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const today = new Date();
        
        // Generate timeline for each day in the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(currentYear, currentMonth, day);
            const dateString = currentDate.toISOString().split('T')[0];
            
            // Create timeline item
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.dataset.date = dateString;
            
            // Create timeline dot
            const timelineDot = document.createElement('div');
            timelineDot.className = 'timeline-dot';
            
            // Check if it's today
            if (currentDate.toDateString() === today.toDateString()) {
                timelineDot.classList.add('today');
            }
            
            // Check if it's weekend
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            
            // Check if it's blocked
            const isBlocked = blockedDates.some(blockedDate => 
                blockedDate.date === dateString && blockedDate.reason !== 'unblocked_weekend'
            );
            const isUnblockedWeekend = blockedDates.some(blockedDate => 
                blockedDate.date === dateString && blockedDate.reason === 'unblocked_weekend'
            );
            
            // Set dot color based on status
            if (isBlocked) {
                timelineDot.classList.add('blocked');
            } else if (isWeekend && !isUnblockedWeekend) {
                timelineDot.classList.add('weekend');
            } else if (isUnblockedWeekend) {
                timelineDot.classList.add('available');
            }
            
            // Create date column
            const dateColumn = document.createElement('div');
            dateColumn.className = 'date-column';
            
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = currentDate.getDate();
            
            dateColumn.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-number">${dayNumber}</div>
            `;
            
            // Create events column
            const eventsColumn = document.createElement('div');
            eventsColumn.className = 'events-column';
            
            // Check for bookings - look for both regular bookings and job bookings
            const regularBookings = bookings.filter(booking => 
                booking.date === dateString && 
                (booking.status === 'confirmed' || booking.status === 'pending' || 
                 booking.status === 'quote-ready' || 
                 booking.status === 'pending-booking')
            );
            
            const jobBookings = bookings.filter(booking => 
                booking.job_date === dateString && 
                (booking.status === 'pending-booking' || booking.status === 'confirmed' || 
                 booking.status === 'invoice-ready' || booking.status === 'invoice-sent' ||
                 booking.status === 'completed')
            );
            
            const allDayBookings = [...regularBookings, ...jobBookings];
            
            if (allDayBookings.length > 0) {
                // Check if any of the bookings are weekend job bookings
                const hasWeekendJob = jobBookings.some(booking => 
                    booking.job_time === 'Full-day (Weekend)' || 
                    (booking.job_time && booking.job_time.includes('Full-day'))
                );
                
                if (hasWeekendJob) {
                    timelineDot.classList.add('weekend-job');
                } else {
                    timelineDot.classList.add('booked');
                }
                
                // Create booking events
                allDayBookings.forEach(booking => {
                    const eventBlock = document.createElement('div');
                    let eventClass = `event-block ${booking.status}`;
                    
                    // Add weekend-job class for weekend job bookings
                    if (booking.job_date && (booking.job_time === 'Full-day (Weekend)' || 
                        (booking.job_time && booking.job_time.includes('Full-day')))) {
                        eventClass += ' weekend-job';
                    }
                    
                    eventBlock.className = eventClass;
                    eventBlock.dataset.bookingId = booking.id || booking.booking_id;
                    
                    // Handle weekend job bookings vs regular time-slot bookings
                    let timeSlot, customerName;
                    
                    if (booking.job_date && (booking.job_time === 'Full-day (Weekend)' || 
                        (booking.job_time && booking.job_time.includes('Full-day')))) {
                        // Weekend job booking
                        timeSlot = 'Full Day Job';
                        customerName = booking.name || 'Unknown';
                    } else {
                        // Regular booking
                        timeSlot = booking.time || booking.job_time || 'TBD';
                        customerName = booking.name || 'Unknown';
                    }
                    
                    eventBlock.innerHTML = `
                        <div class="event-time">${timeSlot}</div>
                        <div class="event-customer">${customerName}</div>
                        <div class="event-status">${booking.status}</div>
                    `;
                    
                    // Add click handler for booking details
                    eventBlock.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showBookingDetails(booking);
                    });
                    
                    eventsColumn.appendChild(eventBlock);
                });
            } else {
                // Show availability status
                let statusText = 'Available';
                let statusClass = 'available';
                
                if (isBlocked) {
                    statusText = 'Blocked';
                    statusClass = 'blocked';
                } else if (isWeekend && !isUnblockedWeekend) {
                    statusText = 'Weekend';
                    statusClass = 'weekend';
                }
                
                const statusBlock = document.createElement('div');
                statusBlock.className = `status-block ${statusClass}`;
                statusBlock.textContent = statusText;
                eventsColumn.appendChild(statusBlock);
            }
            
            // Add click handler for day management
            timelineItem.addEventListener('click', () => handleDayClick(currentDate, allDayBookings));
            
            // Add drag and drop handlers
            timelineItem.addEventListener('dragover', handleCalendarDragOver);
            timelineItem.addEventListener('drop', handleCalendarDrop);
            timelineItem.addEventListener('dragenter', handleCalendarDragEnter);
            timelineItem.addEventListener('dragleave', handleCalendarDragLeave);
            
            // Assemble timeline item
            timelineItem.appendChild(timelineDot);
            timelineItem.appendChild(dateColumn);
            timelineItem.appendChild(eventsColumn);
            
            timelineContainer.appendChild(timelineItem);
        }
        
        grid.appendChild(timelineContainer);
    }

    function renderDesktopCalendar(grid, bookings = []) {
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = day;
            header.style.fontWeight = 'bold';
            header.style.color = 'var(--admin-primary)';
            grid.appendChild(header);
        });
        
                    // Get first day of month and number of days
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            // Generate calendar days
            for (let i = 0; i < 42; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                const dateString = currentDate.toISOString().split('T')[0];
            
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = currentDate.getDate();
            dayElement.dataset.date = dateString;
            
            // Check if it's current month
            if (currentDate.getMonth() !== currentMonth) {
                dayElement.style.opacity = '0.3';
            }
            
            // Check if it's today
            const today = new Date();
            if (currentDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Check if it's weekend (automatically blocked)
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            
            // Check if it's blocked
            const isBlocked = blockedDates.some(blockedDate => 
                blockedDate.date === dateString && blockedDate.reason !== 'unblocked_weekend'
            );
            const isUnblockedWeekend = blockedDates.some(blockedDate => 
                blockedDate.date === dateString && blockedDate.reason === 'unblocked_weekend'
            );
            
            if (isBlocked) {
                dayElement.classList.add('blocked');
            } else if (isWeekend && !isUnblockedWeekend) {
                // Weekends are blocked by default unless explicitly unblocked
                dayElement.classList.add('weekend');
            } else if (isUnblockedWeekend) {
                // Unblocked weekends show as available
                dayElement.classList.add('available');
            }
            
            // Check if it's booked - look for both regular bookings and job bookings
            const regularBookings = bookings.filter(booking => 
                booking.date === dateString && 
                (booking.status === 'confirmed' || booking.status === 'pending' || 
                 booking.status === 'quote-ready' || 
                 booking.status === 'pending-booking')
            );
            
            const jobBookings = bookings.filter(booking => 
                booking.job_date === dateString && 
                (booking.status === 'pending-booking' || booking.status === 'confirmed' || 
                 booking.status === 'invoice-ready' || booking.status === 'invoice-sent' ||
                 booking.status === 'completed')
            );
            
            const allDayBookings = [...regularBookings, ...jobBookings];
            
            if (allDayBookings.length > 0) {
                dayElement.classList.add('booked');
                // Add booking info to the day
                const bookingInfo = document.createElement('div');
                bookingInfo.className = 'booking-info';
                
                // Check if any of the bookings are weekend job bookings
                const hasWeekendJob = jobBookings.some(booking => 
                    booking.job_time === 'Full-day (Weekend)' || 
                    (booking.job_time && booking.job_time.includes('Full-day'))
                );
                
                // Debug: Log weekend job detection for August 23rd
                if (dateString === '2025-08-23') {
                    console.log(`🔍 Admin Calendar: August 23rd - Weekend job detection:`, {
                        jobBookings,
                        hasWeekendJob,
                        jobTimes: jobBookings.map(b => b.job_time),
                        weekendJobCheck: jobBookings.map(booking => ({
                            job_time: booking.job_time,
                            isFullDay: booking.job_time === 'Full-day (Weekend)' || 
                                       (booking.job_time && booking.job_time.includes('Full-day'))
                        }))
                    });
                }
                
                if (hasWeekendJob) {
                    // Weekend job booking - show as full-day
                    bookingInfo.innerHTML = `
                        <div class="booking-count">${allDayBookings.length}</div>
                        <div class="booking-preview">Full Day Job</div>
                    `;
                    dayElement.classList.add('weekend-job');
                } else {
                    // Regular time-slot bookings
                    const timeSlots = ['5:30 PM', '6:30 PM', '7:30 PM'];
                    const bookedTimeSlots = timeSlots.filter(time =>
                        allDayBookings.some(booking => 
                            (booking.time === time) || (booking.job_time === time)
                        )
                    );
                    
                    bookingInfo.innerHTML = `
                        <div class="booking-count">${allDayBookings.length}</div>
                        <div class="booking-preview">${bookedTimeSlots.join(', ')}</div>
                    `;
                }
                dayElement.appendChild(bookingInfo);
            }
            
            // Debug: Log final state for August 23rd
            if (dateString === '2025-08-23') {
                console.log(`🔍 Admin Calendar: August 23rd - Final state:`, {
                    dateString,
                    allDayBookings: allDayBookings.length,
                    hasWeekendJob: jobBookings ? jobBookings.some(booking => 
                        booking.job_time === 'Full-day (Weekend)' || 
                        (booking.job_time && booking.job_time.includes('Full-day'))
                    ) : false,
                    dayElementClasses: dayElement.className,
                    dayElementHTML: dayElement.innerHTML
                });
            }
            
            // Add click handler
            dayElement.addEventListener('click', () => handleDayClick(currentDate, allDayBookings));
            
            // Add drag and drop handlers for calendar days
            dayElement.addEventListener('dragover', handleCalendarDragOver);
            dayElement.addEventListener('drop', handleCalendarDrop);
            dayElement.addEventListener('dragenter', handleCalendarDragEnter);
            dayElement.addEventListener('dragleave', handleCalendarDragLeave);
            
            grid.appendChild(dayElement);
        }
    }

    function handleDayClick(date, bookings) {
        const dateString = date.toISOString().split('T')[0];
        const isBlocked = blockedDates.some(blockedDate => 
            blockedDate.date === dateString && blockedDate.reason !== 'unblocked_weekend'
        );
        const isUnblockedWeekend = blockedDates.some(blockedDate => 
            blockedDate.date === dateString && blockedDate.reason === 'unblocked_weekend'
        );
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        if (bookings && bookings.length > 0) {
            // Show booking details
            showBookingDetails(date, bookings);
        } else if (isBlocked) {
            // Show unblock option for manually blocked dates
            showBlockingModal(date, true);
        } else if (isWeekend && isUnblockedWeekend) {
            // Show re-block option for unblocked weekends
            showBlockingModal(date, 'weekend');
        } else if (isWeekend) {
            // Show make available option for blocked weekends
            showBlockingModal(date, 'weekend');
        } else {
            // Show blocking management for available dates
            showBlockingModal(date, false);
        }
    }

    function showCalendarPopup(date, bookings) {
        const modal = document.getElementById('bookingDetailsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        const dateString = date.toISOString().split('T')[0];
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const isBlocked = blockedDates.some(d => d.date === dateString);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        // Clear existing modal structure and create clean content
        modalContent.innerHTML = '';
        
        let popupContent = `
            <div class="calendar-popup-compact">
                <div class="calendar-popup-header">
                    <div class="calendar-popup-date">${formattedDate}</div>
                    <button class="calendar-popup-btn" onclick="closeModal('bookingDetailsModal')">&times;</button>
                </div>
                <div class="calendar-popup-content">
        `;
        
        if (bookings.length > 0) {
            bookings.forEach(booking => {
                popupContent += `
                    <div class="calendar-booking-preview" onclick="showBookingDetailsPopup('${booking.booking_id}')">
                        <h4>${booking.service}</h4>
                        <p>${booking.time} • ${booking.name}</p>
                    </div>
                `;
            });
        } else {
            popupContent += `
                <div class="calendar-booking-preview" style="border-left-color: #6c757d;">
                    <h4>No Bookings</h4>
                    <p>This date is available</p>
                </div>
            `;
        }
        
        popupContent += `
                </div>
                <div class="calendar-popup-actions">
        `;
        
        if (isWeekend) {
            if (isBlocked) {
                popupContent += `<button class="calendar-popup-btn primary" onclick="unblockWeekend('${dateString}')">Make Available</button>`;
            } else {
                popupContent += `<button class="calendar-popup-btn secondary" onclick="reblockWeekend('${dateString}')">Block Weekend</button>`;
            }
        } else {
            if (isBlocked) {
                popupContent += `<button class="calendar-popup-btn primary" onclick="unblockDate('${dateString}')">Unblock Date</button>`;
            } else {
                popupContent += `<button class="calendar-popup-btn secondary" onclick="toggleDateBlock('${dateString}')">Block Date</button>`;
            }
        }
        
        popupContent += `
                </div>
            </div>
        `;
        
        modalContent.innerHTML = popupContent;
        openModal('bookingDetailsModal');
    }

    function showBookingDetails(date, bookings) {
        showCalendarPopup(date, bookings);
    }

    function showBlockingModal(date, isBlocked) {
        const modal = document.getElementById('dateBlockingModal');
        const dateDisplay = document.getElementById('selectedDateDisplay');
        const statusDisplay = document.getElementById('dateStatusDisplay');
        const toggleBtn = document.getElementById('toggleBlockBtn');
        const unblockBtn = document.getElementById('unblockBtn');
        
        selectedDate = date;
        const dateString = date.toISOString().split('T')[0];
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        dateDisplay.textContent = formattedDate;
        
        if (isBlocked === 'weekend') {
            statusDisplay.textContent = 'Weekend (Blocked)';
            toggleBtn.innerHTML = '<i class="fas fa-unlock"></i> Make Available';
            toggleBtn.onclick = () => unblockWeekend(dateString);
            toggleBtn.style.display = 'inline-block';
            unblockBtn.style.display = 'none';
        } else if (isBlocked === 'unblocked_weekend') {
            statusDisplay.textContent = 'Weekend (Available)';
            toggleBtn.innerHTML = '<i class="fas fa-lock"></i> Block Weekend';
            toggleBtn.onclick = () => reblockWeekend(dateString);
            toggleBtn.style.display = 'inline-block';
            unblockBtn.style.display = 'none';
        } else if (isBlocked === true) {
            statusDisplay.textContent = 'Manually Blocked';
            toggleBtn.style.display = 'none';
            unblockBtn.style.display = 'inline-block';
        } else {
            statusDisplay.textContent = 'Available';
            toggleBtn.innerHTML = '<i class="fas fa-lock"></i> Block Date';
            toggleBtn.onclick = () => toggleDateBlock();
            toggleBtn.style.display = 'inline-block';
            unblockBtn.style.display = 'none';
        }
        
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }

    function closeBlockingModal() {
        const modal = document.getElementById('dateBlockingModal');
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        selectedDate = null;
    }

    function showMoveBookingModal(bookingId, currentDate) {
        const booking = allBookings.find(b => b.booking_id === bookingId);
        if (!booking) return;

        moveBookingData = booking;
        moveCalendarMonth = new Date();
        selectedMoveDate = null;

        // Populate booking info
        document.getElementById('moveBookingId').textContent = booking.booking_id;
        document.getElementById('moveCurrentDate').textContent = (() => {
            const [year, month, day] = booking.date.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        })();
        document.getElementById('moveCustomerName').textContent = booking.name;
        document.getElementById('moveCustomerPhone').textContent = booking.phone || 'Not provided';
        document.getElementById('moveCustomerAddress').textContent = booking.address || 'Not provided';
        document.getElementById('moveService').textContent = booking.service;

        // Reset UI
        document.getElementById('selectedDateDisplay').style.display = 'none';
        document.getElementById('moveConfirmBtn').disabled = true;

        // Render move calendar
        renderMoveCalendar();

        // Open modal (assuming openModal function exists)
        const modal = document.getElementById('moveBookingModal');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }

    function closeMoveBookingModal() {
        const modal = document.getElementById('moveBookingModal');
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        moveBookingData = null;
        selectedMoveDate = null;
    }

    function renderMoveCalendar() {
        const year = moveCalendarMonth.getFullYear();
        const month = moveCalendarMonth.getMonth();
        
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('moveCalendarMonth').textContent = `${monthNames[month]} ${year}`;
        
        // Get first day and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const grid = document.getElementById('moveCalendarGrid');
        grid.innerHTML = '';
        
        // Add day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Generate calendar days
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = currentDate.getDate();
            
            // Check if it's current month
            if (currentDate.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            // Check if it's today
            const today = new Date();
            if (currentDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Check if it's in the past
            if (currentDate < today) {
                dayElement.classList.add('disabled');
            } else {
                const dateString = currentDate.toISOString().split('T')[0];
                
                // Check if it's the current booking date
                if (moveBookingData && dateString === moveBookingData.date) {
                    dayElement.classList.add('disabled');
                    dayElement.title = 'Current booking date';
                } else {
                    // Check if it's booked
                    const dayBookings = allBookings.filter(booking => 
                        booking.date === dateString && 
                        (booking.status === 'confirmed' || booking.status === 'pending' || 
                         booking.status === 'quote-ready' || 
                         booking.status === 'pending-booking')
                    );
                    
                    if (dayBookings.length > 0) {
                        dayElement.classList.add('booked');
                        dayElement.title = 'Already booked';
                    } else {
                        // Check if it's blocked
                        const isBlocked = blockedDates.some(blockedDate => 
                            blockedDate.date === dateString && blockedDate.reason !== 'unblocked_weekend'
                        );
                        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                        const isUnblockedWeekend = blockedDates.some(blockedDate => 
                            blockedDate.date === dateString && blockedDate.reason === 'unblocked_weekend'
                        );
                        
                        if (isBlocked || (isWeekend && !isUnblockedWeekend)) {
                            dayElement.classList.add('blocked');
                            dayElement.title = 'Date blocked';
                        } else {
                            dayElement.classList.add('available');
                            dayElement.addEventListener('click', () => selectMoveDate(currentDate, dateString));
                        }
                    }
                }
            }
            
            grid.appendChild(dayElement);
        }
    }

    function changeMoveMonth(direction) {
        moveCalendarMonth.setMonth(moveCalendarMonth.getMonth() + direction);
        renderMoveCalendar();
    }

    function selectMoveDate(date, dateString) {
        // Remove previous selection
        document.querySelectorAll('.move-calendar-grid .day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add selection to clicked day
        const dayElements = document.querySelectorAll('.move-calendar-grid .day');
        const dayIndex = Array.from(dayElements).findIndex(day => 
            day.textContent == date.getDate() && 
            !day.classList.contains('other-month')
        );
        
        if (dayIndex !== -1) {
            dayElements[dayIndex].classList.add('selected');
        }
        
        selectedMoveDate = dateString;
        
        // Update selected date display
        const selectedDateText = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('selectedDateText').textContent = selectedDateText;
        document.getElementById('selectedDateDisplay').style.display = 'flex';
        document.getElementById('moveConfirmBtn').disabled = false;
    }

    async function moveBooking() {
        if (!selectedMoveDate || !moveBookingData) {
            showNotification('Please select a new date', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${moveBookingData.booking_id}/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newDate: selectedMoveDate })
            });

            if (response.ok) {
                showNotification('Booking moved successfully', 'success');
                closeMoveBookingModal();
                loadBookings(); // Reload to update the display
            } else {
                const error = await response.json();
                showNotification(error.message || 'Failed to move booking', 'error');
            }
        } catch (error) {
            console.error('Error moving booking:', error);
            showNotification('Network error moving booking', 'error');
        }
    }

    async function toggleDateBlock() {
        if (!selectedDate) return;
        
        const dateString = selectedDate.toISOString().split('T')[0];
        
        try {
            const response = await fetch('/api/blocked-dates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date: dateString })
            });
            
            if (response.ok) {
                showNotification('Date blocked successfully', 'success');
                closeBlockingModal();
                // Reload blocked dates and re-render calendar
                await loadBlockedDates();
                renderCalendar();
            } else {
                showNotification('Failed to block date', 'error');
            }
        } catch (error) {
            console.error('Error blocking date:', error);
            showNotification('Network error blocking date', 'error');
        }
    }

    async function unblockWeekend(dateString) {
        try {
            // Add the weekend to blocked dates with a special flag to indicate it's unblocked
            const response = await fetch('/api/blocked-dates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    date: dateString,
                    unblockWeekend: true 
                })
            });

            if (response.ok) {
                showNotification('Weekend made available for booking', 'success');
                closeBlockingModal();
                // Reload blocked dates and re-render calendar
                await loadBlockedDates();
                renderCalendar();
            } else {
                const error = await response.json();
                showNotification(error.message || 'Failed to make weekend available', 'error');
            }
        } catch (error) {
            console.error('Error making weekend available:', error);
            showNotification('Network error making weekend available', 'error');
        }
    }

    async function reblockWeekend(dateString) {
        try {
            // Remove the weekend from blocked dates to re-block it
            const response = await fetch(`/api/blocked-dates/${dateString}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Weekend blocked successfully', 'success');
                closeBlockingModal();
                // Reload blocked dates and re-render calendar
                await loadBlockedDates();
                renderCalendar();
            } else {
                const error = await response.json();
                showNotification(error.message || 'Failed to block weekend', 'error');
            }
        } catch (error) {
            console.error('Error blocking weekend:', error);
            showNotification('Network error blocking weekend', 'error');
        }
    }

    async function unblockDate() {
        if (!selectedDate) return;
        
        const dateString = selectedDate.toISOString().split('T')[0];
        
        try {
            const response = await fetch(`/api/blocked-dates/${dateString}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Date unblocked successfully', 'success');
                closeBlockingModal();
                // Reload blocked dates and re-render calendar
                await loadBlockedDates();
                renderCalendar();
            } else {
                showNotification('Failed to unblock date', 'error');
            }
        } catch (error) {
            console.error('Error unblocking date:', error);
            showNotification('Network error unblocking date', 'error');
        }
    }

    function previousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    }

    function nextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    }

    // Calendar Drag and Drop functionality
    function setupCalendarDragAndDrop() {
        const bookedDays = document.querySelectorAll('.calendar-grid .day.booked');
        
        bookedDays.forEach(day => {
            day.draggable = true;
            day.addEventListener('dragstart', handleCalendarDragStart);
            day.addEventListener('dragend', handleCalendarDragEnd);
        });
    }

    function handleCalendarDragStart(e) {
        e.target.classList.add('dragging');
        const dateString = e.target.dataset.date;
        e.dataTransfer.setData('text/plain', dateString);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleCalendarDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.day.drag-over').forEach(day => {
            day.classList.remove('drag-over');
        });
    }

    function handleCalendarDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleCalendarDragEnter(e) {
        e.preventDefault();
        const day = e.target.closest('.day');
        if (day && !day.classList.contains('booked') && !day.classList.contains('blocked')) {
            day.classList.add('drag-over');
        }
    }

    function handleCalendarDragLeave(e) {
        const day = e.target.closest('.day');
        if (day) {
            day.classList.remove('drag-over');
        }
    }

    async function handleCalendarDrop(e) {
        e.preventDefault();
        const day = e.target.closest('.day');
        if (!day) return;

        const sourceDate = e.dataTransfer.getData('text/plain');
        const targetDate = day.dataset.date;

        if (!sourceDate || !targetDate || sourceDate === targetDate) return;

        // Check if the target date is available
        if (day.classList.contains('booked') || day.classList.contains('blocked')) {
            showNotification('Cannot move booking to unavailable date', 'error');
            return;
        }

        // Get bookings for the source date
        const sourceBookings = (window.allBookings || []).filter(booking => 
            booking.date === sourceDate && 
            (booking.status === 'confirmed' || booking.status === 'pending' || 
             booking.status === 'quote-ready' || 
             booking.status === 'pending-booking')
        );

        if (sourceBookings.length === 0) {
            showNotification('No bookings found for source date', 'error');
            return;
        }

        // Move all bookings from source to target date
        try {
            for (const booking of sourceBookings) {
                const response = await fetch(`/api/bookings/${booking.booking_id}/move`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ newDate: targetDate })
                });

                if (!response.ok) {
                    const error = await response.json();
                    showNotification(error.message || 'Failed to move booking', 'error');
                    return;
                }
            }

            showNotification(`Moved ${sourceBookings.length} booking(s) successfully`, 'success');
            loadBookings(); // Reload to update the display
            
            // Explicitly refresh calendar if it's currently visible
            if (currentFilter === 'calendar') {
                renderCalendar();
            }
        } catch (error) {
            console.error('Error moving bookings:', error);
            showNotification('Network error moving bookings', 'error');
        }
    }

    // Load blocked dates
    async function loadBlockedDates() {
        try {
            const response = await fetch('/api/blocked-dates');
            if (response.ok) {
                blockedDates = await response.json();
            } else {
                blockedDates = [];
            }
        } catch (error) {
            console.error('Error loading blocked dates:', error);
            blockedDates = [];
        }
    }

    // Export functions for use in other files
    window.adminCalendar = {
        renderCalendar,
        renderMobileCalendar,
        renderDesktopCalendar,
        handleDayClick,
        showCalendarPopup,
        showBookingDetails,
        showBlockingModal,
        closeBlockingModal,
        showMoveBookingModal,
        closeMoveBookingModal,
        renderMoveCalendar,
        changeMoveMonth,
        selectMoveDate,
        moveBooking,
        toggleDateBlock,
        unblockWeekend,
        reblockWeekend,
        unblockDate,
        previousMonth,
        nextMonth,
        setupCalendarDragAndDrop,
        handleCalendarDragStart,
        handleCalendarDragEnd,
        handleCalendarDragOver,
        handleCalendarDragEnter,
        handleCalendarDragLeave,
        handleCalendarDrop,
        loadBlockedDates,
        // Getter for blockedDates
        get blockedDates() { return blockedDates; }
    };
})();

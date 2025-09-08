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

    // Functions to persist selected date
    function saveSelectedDate(date) {
        if (date) {
            localStorage.setItem('adminCalendarSelectedDate', date.toISOString());
        }
    }

    function loadSelectedDate() {
        const savedDate = localStorage.getItem('adminCalendarSelectedDate');
        if (savedDate) {
            try {
                return new Date(savedDate);
            } catch (e) {
                console.warn('Invalid saved date, using today');
                return new Date();
            }
        }
        return new Date(); // Default to today
    }



    // Calendar functions
    async function renderCalendar(bookings = []) {
        // Wait for calendar events to be loaded before rendering
        if (window.adminCalendarEvents && typeof window.adminCalendarEvents.loadEvents === 'function') {
            await window.adminCalendarEvents.loadEvents();
        }
        
        // Load blocked dates before rendering
        await loadBlockedDates();
        
        const grid = document.getElementById('calendarGrid');
        const monthDisplay = document.getElementById('calendarMonth');
        
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Clear grid
        grid.innerHTML = '';
        
        // Check if we're on mobile (or force mobile for testing)
        const isMobile = window.innerWidth <= 768 || window.location.search.includes('mobile=true');
        
        if (isMobile) {
            // Hide the original month display and controls on mobile
            if (monthDisplay) {
                monthDisplay.style.display = 'none';
            }
            // Hide original calendar controls
            const calendarControls = document.querySelector('.calendar-controls');
            if (calendarControls) {
                calendarControls.style.display = 'none';
            }
            // Clear the grid completely for mobile
            grid.innerHTML = '';
            // Mobile-friendly calendar with weeks
            renderMobileCalendar(grid, bookings);
        } else {
            // Show the original month display and controls on desktop
            if (monthDisplay) {
                monthDisplay.style.display = 'block';
            }
            // Show original calendar controls
            const calendarControls = document.querySelector('.calendar-controls');
            if (calendarControls) {
                calendarControls.style.display = 'flex';
            }
            // Desktop calendar (original grid layout)
            renderDesktopCalendar(grid, bookings);
        }
    }

    function renderMobileCalendar(grid, bookings = []) {
        
        // Create mobile calendar container
        const mobileCalendarContainer = document.createElement('div');
        mobileCalendarContainer.className = 'mobile-calendar-container';
        
        // Create top section with date picker and navigation
        const topSection = createMobileCalendarTopSection();
        mobileCalendarContainer.appendChild(topSection);
        
        // Create horizontal weekly scroller for the current month
        const weeklyScroller = createMonthlyWeeklyScroller(bookings);
        mobileCalendarContainer.appendChild(weeklyScroller);
        
        // Create todo summary section
        const todoSummarySection = createTodoSummarySection(bookings);
        mobileCalendarContainer.appendChild(todoSummarySection);
        
        // Create time-based events section
        const timeEventsSection = createTimeEventsSection(bookings);
        mobileCalendarContainer.appendChild(timeEventsSection);
        
        grid.appendChild(mobileCalendarContainer);
        
        
    }

    function createMobileCalendarTopSection() {
        const topSection = document.createElement('div');
        topSection.className = 'mobile-calendar-top-section';
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        topSection.innerHTML = `
            <div class="month-year-display">
                <button class="month-nav-btn" onclick="window.adminCalendar.previousMonth()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="month-year-text">${monthNames[currentMonth]} ${currentYear}</div>
                <button class="month-nav-btn" onclick="window.adminCalendar.nextMonth()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        return topSection;
    }

    function createMonthlyWeeklyScroller(bookings) {
        const weeklyScroller = document.createElement('div');
        weeklyScroller.className = 'monthly-weekly-scroller';
        
        // Create week display container
        const weekDisplay = document.createElement('div');
        weekDisplay.className = 'week-display';
        weekDisplay.id = 'weekDisplay';
        
        // Create week container (no need for separate weekday headers since they're in each button)
        const weekContainer = document.createElement('div');
        weekContainer.className = 'week-container';
        weekContainer.id = 'weekContainer';
        
        weekDisplay.appendChild(weekContainer);
        weeklyScroller.appendChild(weekDisplay);
        
        // Initialize with all weeks of current month for horizontal scrolling
        // Use setTimeout to ensure the DOM is updated before rendering
        setTimeout(() => {
        renderAllMonthWeeks(bookings);
        }, 0);
        
        return weeklyScroller;
    }

    function createTodoSummarySection(bookings) {
        const todoSummarySection = document.createElement('div');
        todoSummarySection.className = 'todo-summary-section';
        todoSummarySection.id = 'todoSummarySection';
        
        // Set default selected date to saved date or today if none is selected
        if (!selectedDate) {
            selectedDate = loadSelectedDate();
        }
        
        updateTodoSummarySection(selectedDate, bookings);
        
        return todoSummarySection;
    }

    function updateTodoSummarySection(selectedDate, bookings) {
        const todoSummarySection = document.getElementById('todoSummarySection');
        if (!todoSummarySection) return;
        
        const dateString = selectedDate.toISOString().split('T')[0];
        
        // Get events and bookings for the selected date
        const dayEvents = window.adminCalendarEvents ? window.adminCalendarEvents.getEventsForDate(dateString) : [];
        const dayBookings = bookings.filter(booking => 
            (booking.date === dateString || booking.job_date === dateString) &&
            (booking.status === 'confirmed' || booking.status === 'pending' || 
             booking.status === 'quote-ready' || booking.status === 'pending-booking' ||
             booking.status === 'invoice-ready' || booking.status === 'invoice-sent' ||
             booking.status === 'completed')
        );
        
        const eventsCount = dayEvents.length;
        const bookingsCount = dayBookings.length;
        
        todoSummarySection.innerHTML = `
            <div class="todo-summary-header">
                <i class="fas fa-tasks todo-summary-icon"></i>
                <h3 class="todo-summary-title">Today's to-do list</h3>
            </div>
            <div class="todo-summary-counters">
                <div class="todo-counter events">
                    <div class="todo-counter-number">${eventsCount}</div>
                    <div class="todo-counter-label">Events</div>
                </div>
                <div class="todo-counter bookings">
                    <div class="todo-counter-number">${bookingsCount}</div>
                    <div class="todo-counter-label">Bookings</div>
                </div>
            </div>
        `;
    }

    function renderMonthWeek(weekIndex, bookings) {
        const weekContainer = document.getElementById('weekContainer');
        if (!weekContainer) {
            return;
        }
        
        weekContainer.innerHTML = '';
        
        // Get the specific week dates for the given week index
        const weekDates = getMonthWeekDates(weekIndex);
        
        if (weekDates.length === 0) {
            return;
        }
        
        // Create date buttons for this specific week
        weekDates.forEach(dateInfo => {
            const dateButton = createMonthWeekDateButton(dateInfo, bookings);
            weekContainer.appendChild(dateButton);
        });
    }

    function renderAllMonthWeeks(bookings) {
        const weekContainer = document.getElementById('weekContainer');
        if (!weekContainer) {
            return;
        }
        
        
        weekContainer.innerHTML = '';
        
        // Get all weeks for the current month
        const allWeeks = getAllMonthWeeks();
        
        // Create date buttons for all weeks
        allWeeks.forEach((weekDates, weekIndex) => {
            weekDates.forEach(dateInfo => {
                const dateButton = createMonthWeekDateButton(dateInfo, bookings);
                weekContainer.appendChild(dateButton);
            });
        });
        
        
        // Auto-scroll and select the appropriate date
        setTimeout(() => {
            // Load saved selected date or default to today
            const savedDate = loadSelectedDate();
            const targetDateString = savedDate.toISOString().split('T')[0];
            
            // Find the button for the target date
            const targetButton = weekContainer.querySelector(`[data-date="${targetDateString}"]`);
            
            if (targetButton) {
                // TEMPORARILY DISABLED: targetButton.scrollIntoView({ 
                //     behavior: 'smooth', 
                //     block: 'nearest', 
                //     inline: 'center' 
                // });
                
                // Select the target date
                document.querySelectorAll('.month-week-date-button').forEach(btn => btn.classList.remove('selected'));
                targetButton.classList.add('selected');
                selectedDate = savedDate;
                // Update timeline and todo summary
                updateTimeEventsSection(selectedDate, bookings);
                updateTodoSummarySection(selectedDate, bookings);
            } else {
                // Fallback to today if saved date not found
                const todayButton = weekContainer.querySelector('.month-week-date-button.today');
                if (todayButton) {
                    // TEMPORARILY DISABLED: todayButton.scrollIntoView({ 
                    //     behavior: 'smooth', 
                    //     block: 'nearest', 
                    //     inline: 'center' 
                    // });
                    
                    document.querySelectorAll('.month-week-date-button').forEach(btn => btn.classList.remove('selected'));
                    todayButton.classList.add('selected');
                    selectedDate = new Date();
                    saveSelectedDate(selectedDate);
                    updateTimeEventsSection(selectedDate, bookings);
                    updateTodoSummarySection(selectedDate, bookings);
                }
            }
        }, 100);

        // CSS should handle scrolling now - no JavaScript needed
        
    }

    function getMonthWeekDates(weekIndex) {
        
        // Get first day of current month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        // Calculate how many days are in the current month
        const daysInMonth = lastDayOfMonth.getDate();
        
        // Calculate start date for the week (only show current month dates)
        const startDate = (weekIndex * 7) + 1; // Start from day 1, then 8, 15, 22, 29, etc.
        
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const dayNumber = startDate + i;
            
            // Only show dates that exist in the current month
            if (dayNumber > daysInMonth) {
                break; // Stop if we've exceeded the month's days
            }
            
            const date = new Date(currentYear, currentMonth, dayNumber);
            
            const dateInfo = {
                date: date,
                dateString: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: date.getDate(),
                isToday: date.toDateString() === new Date().toDateString(),
                isCurrentMonth: true, // Always true since we only show current month
                isSelected: selectedDate && selectedDate.toDateString() === date.toDateString()
            };
            
            weekDates.push(dateInfo);
        }
        
        return weekDates;
    }

    function getAllMonthWeeks() {
        
        // Get first day of current month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        
        // Calculate how many weeks we need to display (only current month days)
        const daysInMonth = lastDayOfMonth.getDate();
        const weeksNeeded = Math.ceil(daysInMonth / 7); // Simple calculation: days divided by 7
        
        
        const allWeeks = [];
        
        for (let weekIndex = 0; weekIndex < weeksNeeded; weekIndex++) {
            const weekDates = getMonthWeekDates(weekIndex);
            if (weekDates.length > 0) { // Only add weeks that have dates
            allWeeks.push(weekDates);
            }
        }
        
        return allWeeks;
    }

    function createMonthWeekDateButton(dateInfo, bookings) {
        
        const dateButton = document.createElement('div');
        dateButton.className = 'month-week-date-button';
        dateButton.dataset.date = dateInfo.dateString;
        
        // Add appropriate classes
        if (dateInfo.isToday) {
            dateButton.classList.add('today');
        }
        if (dateInfo.isSelected) {
            dateButton.classList.add('selected');
        }
        if (!dateInfo.isCurrentMonth) {
            dateButton.classList.add('other-month');
        }
        
        // Check if date is blocked or unblocked and add appropriate styling
        const isWeekend = dateInfo.date.getDay() === 0 || dateInfo.date.getDay() === 6;
        const isBlocked = blockedDates.some(blockedDate => 
            blockedDate.date === dateInfo.dateString && blockedDate.reason !== 'unblocked_weekend'
        );
        const isUnblockedWeekend = blockedDates.some(blockedDate => 
            blockedDate.date === dateInfo.dateString && blockedDate.reason === 'unblocked_weekend'
        );
        const isFullDayJob = blockedDates.some(blockedDate => 
            blockedDate.date === dateInfo.dateString && blockedDate.reason === 'full_day_job'
        );
        
        if (isFullDayJob) {
            dateButton.classList.add('full-day-job');
        } else if (isBlocked) {
            dateButton.classList.add('blocked-date');
        } else if (isWeekend && !isUnblockedWeekend) {
            // Weekends are blocked by default unless explicitly unblocked
            dateButton.classList.add('blocked-date');
        } else if (isUnblockedWeekend) {
            // Weekend that has been explicitly unblocked
            dateButton.classList.add('unblocked-date');
        } else {
            // Regular weekday (available)
            dateButton.classList.add('available-date');
        }
        
        // Add past/future styling
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const buttonDate = new Date(dateInfo.date);
        buttonDate.setHours(0, 0, 0, 0);
        
        if (buttonDate < today) {
            dateButton.classList.add('past');
        } else if (buttonDate > today) {
            dateButton.classList.add('future');
        }
        
        // Check for events on this date
        const dayEvents = window.adminCalendarEvents ? window.adminCalendarEvents.getEventsForDate(dateInfo.dateString) : [];
        const dayBookings = bookings.filter(booking => 
            (booking.date === dateInfo.dateString || booking.job_date === dateInfo.dateString) &&
            (booking.status === 'confirmed' || booking.status === 'pending' || 
             booking.status === 'quote-ready' || booking.status === 'pending-booking' ||
                 booking.status === 'invoice-ready' || booking.status === 'invoice-sent' ||
                 booking.status === 'completed')
            );
            
            
        const hasEvents = dayEvents.length > 0 || dayBookings.length > 0;
        const totalItems = dayEvents.length + dayBookings.length;
        
        // Create event indicator with count if more than 1 event
        let eventIndicator = '';
        if (hasEvents) {
            if (totalItems > 1) {
                eventIndicator = `<div class="month-week-event-indicator multiple" title="${totalItems} events">${totalItems}</div>`;
            } else {
                eventIndicator = '<div class="month-week-event-indicator" title="1 event"></div>';
            }
        }
        
        // Create event dot based on events
        let eventDot = '';
        if (hasEvents) {
            // Use different colors for different types of events
            const eventColors = ['blue', 'yellow', 'green', 'red', 'purple'];
            const colorIndex = totalItems % eventColors.length;
            eventDot = `<div class="month-week-event-dot ${eventColors[colorIndex]}"></div>`;
        }

        dateButton.innerHTML = `
            <div class="month-week-date-number">${dateInfo.dayNumber}</div>
            <div class="month-week-weekday">${dateInfo.dayName}</div>
            ${eventDot}
        `;
        
        // Add click handler
        dateButton.addEventListener('click', () => {
            // Remove selected class from all buttons
            document.querySelectorAll('.month-week-date-button').forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            dateButton.classList.add('selected');
            // Update selected date
            selectedDate = dateInfo.date;
            // Save selected date to localStorage
            saveSelectedDate(selectedDate);
            // Update time events section and todo summary
            updateTimeEventsSection(dateInfo.date, window.allBookings || []);
            // Update todo summary section
            updateTodoSummarySection(dateInfo.date, window.allBookings || []);
        });
        
        
        return dateButton;
    }

    // Track current week within the month
    let currentMonthWeekIndex = 0;

    // Fallback function to create date buttons if the main function fails
    function createFallbackDateButtons(weekContainer, bookings) {
        
        // Create a simple week of dates for the current month
        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfWeek = currentDate.getDay();
        
        // Start from the first day of the week that contains the first day of the month
        const startDate = new Date(currentDate);
        startDate.setDate(1 - firstDayOfWeek);
        
        // Create 35 days (5 weeks) of date buttons
        for (let i = 0; i < 35; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dateButton = document.createElement('div');
            dateButton.className = 'month-week-date-button';
            dateButton.dataset.date = date.toISOString().split('T')[0];
            
            // Add appropriate classes
            if (date.toDateString() === today.toDateString()) {
                dateButton.classList.add('today');
            }
            if (date.getMonth() !== today.getMonth()) {
                dateButton.classList.add('other-month');
            }
            
            // Check for events
            const dayEvents = window.adminCalendarEvents ? window.adminCalendarEvents.getEventsForDate(date.toISOString().split('T')[0]) : [];
            const dayBookings = bookings.filter(booking => 
                booking.date === date.toISOString().split('T')[0] &&
                (booking.status === 'confirmed' || booking.status === 'pending')
            );
            
            const hasEvents = dayEvents.length > 0 || dayBookings.length > 0;
            const totalItems = dayEvents.length + dayBookings.length;
            
            let eventIndicator = '';
            if (hasEvents) {
                if (totalItems > 1) {
                    eventIndicator = `<div class="month-week-event-indicator multiple" title="${totalItems} events">${totalItems}</div>`;
                } else {
                    eventIndicator = '<div class="month-week-event-indicator" title="1 event"></div>';
                }
            }
            
            // Create event dot based on events
            let eventDot = '';
            if (hasEvents) {
                // Use different colors for different types of events
                const eventColors = ['blue', 'yellow', 'green', 'red', 'purple'];
                const colorIndex = totalItems % eventColors.length;
                eventDot = `<div class="month-week-event-dot ${eventColors[colorIndex]}"></div>`;
            }

            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            dateButton.innerHTML = `
                <div class="month-week-date-number">${date.getDate()}</div>
                <div class="month-week-weekday">${dayName}</div>
                ${eventDot}
            `;
            
            dateButton.addEventListener('click', () => {
                document.querySelectorAll('.month-week-date-button').forEach(btn => btn.classList.remove('selected'));
                dateButton.classList.add('selected');
                // Update selected date
                selectedDate = date;
                // Save selected date to localStorage
                saveSelectedDate(selectedDate);
                // Update time events section and todo summary
                updateTimeEventsSection(date, bookings);
                // Update todo summary section
                updateTodoSummarySection(date, bookings);
            });
            
            weekContainer.appendChild(dateButton);
        }
        
    }

    // Enhanced touch scrolling support
    function addTouchScrollingSupport(container) {
        if (!container) return;
        
        let startX = 0;
        let scrollLeft = 0;
        let isScrolling = false;
        let velocity = 0;
        let lastX = 0;
        let lastTime = 0;
        
        container.addEventListener('touchstart', function(e) {
            startX = e.touches[0].pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            isScrolling = true;
            velocity = 0;
            lastX = e.touches[0].pageX;
            lastTime = Date.now();
        });
        
        container.addEventListener('touchmove', function(e) {
            if (!isScrolling) return;
            e.preventDefault();
            
            const currentX = e.touches[0].pageX;
            const currentTime = Date.now();
            const deltaX = currentX - lastX;
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime > 0) {
                velocity = deltaX / deltaTime;
            }
            
            const x = currentX - container.offsetLeft;
            const walk = (x - startX) * 1.5; // Increased sensitivity
            container.scrollLeft = scrollLeft - walk;
            
            lastX = currentX;
            lastTime = currentTime;
        });
        
        container.addEventListener('touchend', function() {
            isScrolling = false;
            
            // Add momentum scrolling
            if (Math.abs(velocity) > 0.5) {
                const momentum = velocity * 200;
                const targetScroll = container.scrollLeft - momentum;
                
                // Smooth scroll to target position
                const startScroll = container.scrollLeft;
                const distance = targetScroll - startScroll;
                const duration = 300;
                const startTime = Date.now();
                
                function animateScroll() {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    
                    container.scrollLeft = startScroll + (distance * easeOut);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateScroll);
                    }
                }
                
                requestAnimationFrame(animateScroll);
            }
        });
        
        // Add keyboard navigation support
        container.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                container.scrollLeft -= 100;
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                container.scrollLeft += 100;
                e.preventDefault();
            }
        });
        
        // Make container focusable for keyboard navigation
        container.setAttribute('tabindex', '0');
    }

    function navigateMonthWeek(direction) {
        currentMonthWeekIndex += direction;
        
        // Ensure we stay within reasonable bounds
        if (currentMonthWeekIndex < 0) currentMonthWeekIndex = 0;
        if (currentMonthWeekIndex > 5) currentMonthWeekIndex = 5; // Max 6 weeks per month
        
        renderMonthWeek(currentMonthWeekIndex, window.allBookings || []);
    }





    function createTimeEventsSection(bookings) {
        const timeEventsSection = document.createElement('div');
        timeEventsSection.className = 'time-events-section';
        timeEventsSection.id = 'timeEventsSection';
        
        // Set default selected date to saved date or today if none is selected
        if (!selectedDate) {
            selectedDate = loadSelectedDate();
        }
        
        // Show the section and populate with events for the selected date
        timeEventsSection.style.display = 'block';
        updateTimeEventsSection(selectedDate, bookings);
        
        return timeEventsSection;
    }

    function updateTimeEventsSection(selectedDate, bookings) {
        const timeEventsSection = document.getElementById('timeEventsSection');
        if (!timeEventsSection) return;
        
        const dateString = selectedDate.toISOString().split('T')[0];
        
        // Show the section
        timeEventsSection.style.display = 'block';
        
        // Clear existing content
        timeEventsSection.innerHTML = '';
        
        // Create timeline header
        const timelineHeader = document.createElement('div');
        timelineHeader.className = 'timeline-header';
        timelineHeader.innerHTML = `
            <i class="fas fa-clock timeline-icon"></i>
            <h3 class="timeline-title">Agenda Timeline</h3>
        `;
        timeEventsSection.appendChild(timelineHeader);
        
        // Create time labels and events
        const timeSlots = generateTimeSlots();
        const dayEvents = window.adminCalendarEvents ? window.adminCalendarEvents.getEventsForDate(dateString) : [];
        const dayBookings = bookings.filter(booking => 
            (booking.date === dateString || booking.job_date === dateString) &&
            (booking.status === 'confirmed' || booking.status === 'pending' || 
             booking.status === 'quote-ready' || booking.status === 'pending-booking' ||
             booking.status === 'invoice-ready' || booking.status === 'invoice-sent' ||
             booking.status === 'completed')
        );
        
        // Update todo summary section
        updateTodoSummarySection(selectedDate, bookings);
        
        // Group consecutive empty time slots into ranges
        const timeSlotGroups = [];
        let currentGroup = [];
        let currentGroupHasEvents = false;
        
        timeSlots.forEach((timeSlot, index) => {
            // Check if this time slot has events
            const hasEvents = checkTimeSlotHasEvents(timeSlot, dayEvents, dayBookings);
            
            
            if (hasEvents) {
                // If current group has events, add to it
                if (currentGroupHasEvents) {
                    currentGroup.push(timeSlot);
                } else {
                    // Finish the empty group if it exists
                    if (currentGroup.length > 0) {
                        timeSlotGroups.push({
                            type: 'empty',
                            slots: [...currentGroup]
                        });
                    }
                    // Start new group with events
                    currentGroup = [timeSlot];
                    currentGroupHasEvents = true;
                }
            } else {
                // This time slot is empty
                if (!currentGroupHasEvents) {
                    // Add to current empty group
                    currentGroup.push(timeSlot);
                } else {
                    // Finish the events group
                    if (currentGroup.length > 0) {
                        timeSlotGroups.push({
                            type: 'events',
                            slots: [...currentGroup]
                        });
                    }
                    // Start new empty group
                    currentGroup = [timeSlot];
                    currentGroupHasEvents = false;
                }
            }
        });
        
        // Add the last group
        if (currentGroup.length > 0) {
            timeSlotGroups.push({
                type: currentGroupHasEvents ? 'events' : 'empty',
                slots: [...currentGroup]
            });
        }
        
        // Render the grouped timeline
        timeSlotGroups.forEach(group => {
            const timeRow = document.createElement('div');
            timeRow.className = 'time-row';
            
            // Create time label based on group type
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            
            if (group.type === 'empty') {
                // Show range for empty slots (e.g., "12:00 AM - 4:00 PM")
                if (group.slots.length === 1) {
                    timeLabel.textContent = group.slots[0];
                } else {
                    timeLabel.textContent = `${group.slots[0]} - ${group.slots[group.slots.length - 1]}`;
                }
                timeLabel.style.cssText = `
                    color: #9ca3af;
                    font-size: 0.75rem;
                    font-weight: 400;
                    min-width: 120px;
                    text-align: left;
                    padding-right: 1rem;
                    font-style: italic;
                `;
                timeRow.classList.add('empty-time-range');
            } else {
                // Show individual time for slots with events
                timeLabel.textContent = group.slots[0]; // Show first time slot
            timeLabel.style.cssText = `
                color: #6b7280;
                font-size: 0.8rem;
                font-weight: 500;
                min-width: 80px;
                text-align: left;
                padding-right: 1rem;
            `;
            }
            
            // Create divider line (thin horizontal line)
            const dividerLine = document.createElement('div');
            dividerLine.className = 'divider-line';
            dividerLine.style.cssText = `
                width: 1px;
                background: #e5e7eb;
                margin: 0 1rem;
                min-height: 40px;
            `;
            
            // Create events container
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events-container';
            eventsContainer.style.cssText = `
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            `;
            
            if (group.type === 'empty') {
                // For empty time ranges, show a subtle indicator
                const emptyIndicator = document.createElement('div');
                emptyIndicator.textContent = 'No events';
                emptyIndicator.style.cssText = `
                    color: #d1d5db;
                    font-size: 0.75rem;
                    font-style: italic;
                    opacity: 0.6;
                `;
                eventsContainer.appendChild(emptyIndicator);
                timeRow.classList.add('empty-time-range');
            } else {
                // For time slots with events, show all events in the group
                group.slots.forEach(timeSlot => {
            const slotEvents = dayEvents.filter(event => {
                if (!event.startTime) return false;
                        
                const eventHour = parseInt(event.startTime.split(':')[0]);
                        
                        // Parse time slot (12-hour format like "5:00 PM")
                        let slotHour;
                        if (timeSlot.includes('AM')) {
                            slotHour = parseInt(timeSlot.split(':')[0]);
                            if (slotHour === 12) slotHour = 0; // 12 AM = 0
                        } else if (timeSlot.includes('PM')) {
                            slotHour = parseInt(timeSlot.split(':')[0]);
                            if (slotHour !== 12) slotHour += 12; // Convert to 24-hour format
                        } else {
                            slotHour = parseInt(timeSlot.split(':')[0]);
                        }
                        
                return eventHour === slotHour;
            });
            
            const slotBookings = dayBookings.filter(booking => {
                if (!booking.time && !booking.job_time) return false;
                const bookingTime = booking.time || booking.job_time;
                if (bookingTime === 'Full-day (Weekend)' || bookingTime.includes('Full-day')) return false;
                
                // Handle different time formats (HH:MM, H:MM, HH:MM AM/PM)
                let bookingHour;
                if (bookingTime.includes(':')) {
                    const timeParts = bookingTime.split(':');
                    bookingHour = parseInt(timeParts[0]);
                    
                    // Handle AM/PM format
                    if (timeParts[1].toLowerCase().includes('pm') && bookingHour !== 12) {
                        bookingHour += 12;
                    } else if (timeParts[1].toLowerCase().includes('am') && bookingHour === 12) {
                        bookingHour = 0;
                    }
                } else {
                    // Try to parse as just hour
                    bookingHour = parseInt(bookingTime);
                }
                
                if (isNaN(bookingHour)) return false;
                
                        // Parse time slot (12-hour format like "5:00 PM")
                        let slotHour;
                        if (timeSlot.includes('AM')) {
                            slotHour = parseInt(timeSlot.split(':')[0]);
                            if (slotHour === 12) slotHour = 0; // 12 AM = 0
                        } else if (timeSlot.includes('PM')) {
                            slotHour = parseInt(timeSlot.split(':')[0]);
                            if (slotHour !== 12) slotHour += 12; // Convert to 24-hour format
                        } else {
                            slotHour = parseInt(timeSlot.split(':')[0]);
                        }
                        
                return bookingHour === slotHour;
            });
            
            // Add events to container
            const allSlotItems = [...slotEvents, ...slotBookings];
            if (allSlotItems.length > 0) {
                allSlotItems.forEach(item => {
                    const eventCard = createEventCard(item);
                    eventsContainer.appendChild(eventCard);
                });
                    }
                });
            }
            
            // Assemble time row
            timeRow.appendChild(timeLabel);
            timeRow.appendChild(dividerLine);
            timeRow.appendChild(eventsContainer);
            
            // Apply styling based on group type
            if (group.type === 'empty') {
                timeRow.style.cssText = `
                    margin-bottom: 0.5rem;
                    min-height: 40px;
                    padding: 0.5rem 0;
                `;
            }
            
            timeEventsSection.appendChild(timeRow);
        });
        
        // Add action buttons below the timeline
        const actionButtonsContainer = document.createElement('div');
        actionButtonsContainer.className = 'timeline-action-buttons';
        actionButtonsContainer.style.cssText = `
            display: flex;
            gap: 1rem;
            padding: 1rem;
            border-top: 1px solid #e5e7eb;
            margin-top: 1rem;
        `;
        
        // Add Event Button
        const addEventBtn = document.createElement('button');
        addEventBtn.className = 'action-btn primary';
        addEventBtn.innerHTML = '<i class="fas fa-plus"></i> Add Event';
        addEventBtn.style.cssText = `
            flex: 1;
            padding: 0.75rem 1rem;
            background: var(--admin-primary);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        addEventBtn.addEventListener('click', () => {
            if (window.adminCalendarEvents && typeof window.adminCalendarEvents.showModal === 'function') {
                window.adminCalendarEvents.showModal(dateString);
            }
        });
        
        // Dynamic Block/Unblock Date Button based on current state
        const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
        const isBlocked = blockedDates.some(blockedDate => 
            blockedDate.date === dateString && blockedDate.reason !== 'unblocked_weekend'
        );
        const isUnblockedWeekend = blockedDates.some(blockedDate => 
            blockedDate.date === dateString && blockedDate.reason === 'unblocked_weekend'
        );
        const isFullDayJob = blockedDates.some(blockedDate => 
            blockedDate.date === dateString && blockedDate.reason === 'full_day_job'
        );
        
        const blockDateBtn = document.createElement('button');
        blockDateBtn.className = 'action-btn secondary';
        
        // Set button text and action based on current state
        if (isFullDayJob) {
            blockDateBtn.innerHTML = '<i class="fas fa-info-circle"></i> Full Day Job';
            blockDateBtn.style.cssText = `
                flex: 1;
                padding: 0.75rem 1rem;
                background: #fef3c7;
                color: #d97706;
                border: 1px solid #fbbf24;
                border-radius: 8px;
                font-weight: 500;
                cursor: not-allowed;
                transition: all 0.2s ease;
            `;
            blockDateBtn.disabled = true;
        } else if (isWeekend) {
            if (isUnblockedWeekend) {
                blockDateBtn.innerHTML = '<i class="fas fa-lock"></i> Block Weekend';
                blockDateBtn.addEventListener('click', () => {
                    if (window.adminCalendar && typeof window.adminCalendar.reblockWeekendFromString === 'function') {
                        window.adminCalendar.reblockWeekendFromString(dateString);
                    }
                });
            } else {
                blockDateBtn.innerHTML = '<i class="fas fa-unlock"></i> Make Available';
                blockDateBtn.addEventListener('click', () => {
                    if (window.adminCalendar && typeof window.adminCalendar.unblockWeekendFromString === 'function') {
                        window.adminCalendar.unblockWeekendFromString(dateString);
                    }
                });
            }
        blockDateBtn.style.cssText = `
            flex: 1;
            padding: 0.75rem 1rem;
            background: #f3f4f6;
            color: var(--admin-primary);
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        } else {
            if (isBlocked) {
                blockDateBtn.innerHTML = '<i class="fas fa-unlock"></i> Unblock Date';
                blockDateBtn.addEventListener('click', () => {
                    if (window.adminCalendar && typeof window.adminCalendar.unblockDateFromString === 'function') {
                        window.adminCalendar.unblockDateFromString(dateString);
                    }
                });
            } else {
                blockDateBtn.innerHTML = '<i class="fas fa-lock"></i> Block Date';
        blockDateBtn.addEventListener('click', () => {
            if (window.adminCalendar && typeof window.adminCalendar.blockDate === 'function') {
                window.adminCalendar.blockDate(dateString);
            }
        });
            }
            blockDateBtn.style.cssText = `
                flex: 1;
                padding: 0.75rem 1rem;
                background: #f3f4f6;
                color: var(--admin-primary);
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
        }
        
        // Add hover effects
        addEventBtn.addEventListener('mouseenter', () => {
            addEventBtn.style.background = '#1a1a1a';
        });
        addEventBtn.addEventListener('mouseleave', () => {
            addEventBtn.style.background = 'var(--admin-primary)';
        });
        
        blockDateBtn.addEventListener('mouseenter', () => {
            blockDateBtn.style.background = '#e5e7eb';
        });
        blockDateBtn.addEventListener('mouseleave', () => {
            blockDateBtn.style.background = '#f3f4f6';
        });
        
        actionButtonsContainer.appendChild(addEventBtn);
        actionButtonsContainer.appendChild(blockDateBtn);
        timeEventsSection.appendChild(actionButtonsContainer);
    }

    function generateTimeSlots() {
        const timeSlots = [];
        for (let hour = 0; hour <= 23; hour++) {
            let timeString;
            if (hour === 0) {
                timeString = '12:00 AM';
            } else if (hour < 12) {
                timeString = `${hour}:00 AM`;
            } else if (hour === 12) {
                timeString = '12:00 PM';
            } else {
                timeString = `${hour - 12}:00 PM`;
            }
            timeSlots.push(timeString);
        }
        return timeSlots;
    }
    
    function checkTimeSlotHasEvents(timeSlot, dayEvents, dayBookings) {
        // Check if any events match this time slot
        const hasEvents = dayEvents.some(event => {
            if (!event.startTime) return false;
            
            const eventHour = parseInt(event.startTime.split(':')[0]);
            
            // Parse time slot (12-hour format like "5:00 PM")
            let slotHour;
            if (timeSlot.includes('AM')) {
                slotHour = parseInt(timeSlot.split(':')[0]);
                if (slotHour === 12) slotHour = 0; // 12 AM = 0
            } else if (timeSlot.includes('PM')) {
                slotHour = parseInt(timeSlot.split(':')[0]);
                if (slotHour !== 12) slotHour += 12; // Convert to 24-hour format
            } else {
                slotHour = parseInt(timeSlot.split(':')[0]);
            }
            
            return eventHour === slotHour;
        });
        
        if (hasEvents) return true;
        
        // Check if any bookings match this time slot
        const hasBookings = dayBookings.some(booking => {
            if (!booking.time && !booking.job_time) return false;
            
            const bookingTime = booking.time || booking.job_time;
            if (bookingTime === 'Full-day (Weekend)' || bookingTime.includes('Full-day')) return false;
            
            // Handle different time formats (HH:MM, H:MM, HH:MM AM/PM)
            let bookingHour;
            if (bookingTime.includes(':')) {
                const timeParts = bookingTime.split(':');
                bookingHour = parseInt(timeParts[0]);
                
                // Handle AM/PM format
                if (timeParts[1].toLowerCase().includes('pm') && bookingHour !== 12) {
                    bookingHour += 12;
                } else if (timeParts[1].toLowerCase().includes('am') && bookingHour === 12) {
                    bookingHour = 0;
                }
            } else {
                // Try to parse as just hour
                bookingHour = parseInt(bookingTime);
            }
            
            if (isNaN(bookingHour)) return false;
            
            // Parse time slot (12-hour format like "5:00 PM")
            let slotHour;
            if (timeSlot.includes('AM')) {
                slotHour = parseInt(timeSlot.split(':')[0]);
                if (slotHour === 12) slotHour = 0; // 12 AM = 0
            } else if (timeSlot.includes('PM')) {
                slotHour = parseInt(timeSlot.split(':')[0]);
                if (slotHour !== 12) slotHour += 12; // Convert to 24-hour format
            } else {
                slotHour = parseInt(timeSlot.split(':')[0]);
            }
            
            
            return bookingHour === slotHour;
        });
        
        return hasBookings;
    }

    function createEventCard(item) {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        
        // Apply rounded white card styling with subtle shadow
        eventCard.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        // Determine if it's a calendar event or booking
        const isCalendarEvent = item.hasOwnProperty('title');
        
        if (isCalendarEvent) {
            // Calendar event
            eventCard.style.borderLeft = `4px solid ${item.color || '#007bff'}`;
            eventCard.innerHTML = `
                <div class="event-title" style="font-weight: 600; color: var(--admin-primary); margin-bottom: 0.25rem; font-size: 0.9rem;">${item.title}</div>
                <div class="event-time" style="color: #6b7280; font-size: 0.8rem; margin-bottom: 0.25rem;">${item.startTime} - ${item.endTime}</div>
                <div class="event-type" style="color: #9ca3af; font-size: 0.75rem; text-transform: uppercase;">${item.type}</div>
            `;
            
            // Add click handler for event details
            eventCard.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.adminCalendarEvents && typeof window.adminCalendarEvents.showEventDetails === 'function') {
                    window.adminCalendarEvents.showEventDetails(item);
                }
            });
        } else {
            // Booking
            eventCard.style.borderLeft = '4px solid #17a2b8';
            const timeSlot = item.time || item.job_time || 'TBD';
            eventCard.innerHTML = `
                <div class="event-title" style="font-weight: 600; color: var(--admin-primary); margin-bottom: 0.25rem; font-size: 0.9rem;">${item.service || 'Service'}</div>
                <div class="event-time" style="color: #6b7280; font-size: 0.8rem; margin-bottom: 0.25rem;">${timeSlot}</div>
                <div class="event-customer" style="color: #9ca3af; font-size: 0.75rem;">${item.name || 'Customer'}</div>
            `;
            
            // Add click handler for booking details
            eventCard.addEventListener('click', (e) => {
                e.stopPropagation();
                showBookingDetailsPopup(item.booking_id || item.id);
            });
        }
        
        // Add hover effect
        eventCard.addEventListener('mouseenter', () => {
            eventCard.style.transform = 'translateY(-2px)';
            eventCard.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        eventCard.addEventListener('mouseleave', () => {
            eventCard.style.transform = 'translateY(0)';
            eventCard.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
        
        return eventCard;
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
            dayElement.dataset.date = dateString;
            
            // Create day number element positioned in top left
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = currentDate.getDate();
            dayElement.appendChild(dayNumber);
            
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
            const isFullDayJob = blockedDates.some(blockedDate => 
                blockedDate.date === dateString && blockedDate.reason === 'full_day_job'
            );
            
            if (isFullDayJob) {
                // Full day blocked due to job scheduling
                dayElement.classList.add('weekend-job');
            } else if (isBlocked) {
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
                
                // Check if any of the bookings are weekend job bookings
                const hasWeekendJob = jobBookings.some(booking => 
                    booking.job_time === 'Full-day (Weekend)' || 
                    (booking.job_time && booking.job_time.includes('Full-day'))
                );
                
                if (hasWeekendJob) {
                    dayElement.classList.add('weekend-job');
                }
                
                // Create unified calendar items container
                const calendarItemsContainer = document.createElement('div');
                calendarItemsContainer.className = 'calendar-events-container';
                calendarItemsContainer.style.cssText = `
                    position: absolute;
                    top: 32px;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    padding: 4px;
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    pointer-events: none;
                    z-index: 15;
                `;
                
                // Create booking cards (limit to 3 to avoid clutter)
                allDayBookings.forEach((booking, index) => {
                    if (index < 3) {
                        const bookingCard = createBookingCard(booking, hasWeekendJob);
                        calendarItemsContainer.appendChild(bookingCard);
                    }
                });
                
                // Add more indicator if there are more bookings
                if (allDayBookings.length > 3) {
                    const moreIndicator = document.createElement('div');
                    moreIndicator.className = 'more-events-indicator';
                    moreIndicator.style.cssText = `
                        background: rgba(108, 117, 125, 0.9);
                        color: white;
                        font-size: 7px;
                        padding: 1px 4px;
                        border-radius: 4px;
                        text-align: center;
                        font-weight: 600;
                        backdrop-filter: blur(4px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    `;
                    moreIndicator.textContent = `+${allDayBookings.length - 3}`;
                    moreIndicator.title = `${allDayBookings.length - 3} more bookings`;
                    calendarItemsContainer.appendChild(moreIndicator);
                }
                
                // Store the container reference for events to use
                dayElement.dataset.calendarItemsContainer = 'true';
                dayElement.appendChild(calendarItemsContainer);
            }
            
            // Add event indicators if available - they will use the existing container if available
            if (window.adminCalendarEvents && typeof window.adminCalendarEvents.renderEventIndicators === 'function') {
                window.adminCalendarEvents.renderEventIndicators(dayElement, dateString);
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
        const isFullDayJob = blockedDates.some(blockedDate => 
            blockedDate.date === dateString && blockedDate.reason === 'full_day_job'
        );
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        // Show day management modal with Add Event button
        showDayManagementModal(date, dateString, bookings, isBlocked, isUnblockedWeekend, isFullDayJob, isWeekend);
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
                popupContent += `<button class="calendar-popup-btn primary" onclick="window.adminCalendar.unblockWeekendFromString('${dateString}')">Make Available</button>`;
            } else {
                popupContent += `<button class="calendar-popup-btn secondary" onclick="window.adminCalendar.reblockWeekendFromString('${dateString}')">Block Weekend</button>`;
            }
        } else {
            if (isBlocked) {
                popupContent += `<button class="calendar-popup-btn primary" onclick="window.adminCalendar.unblockDateFromString('${dateString}')">Unblock Date</button>`;
            } else {
                popupContent += `<button class="calendar-popup-btn secondary" onclick="window.adminCalendar.blockDate('${dateString}')">Block Date</button>`;
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

    function showBookingDetailsPopup(bookingId) {
        // Find the booking by ID
        const booking = (window.allBookings || []).find(b => b.booking_id === bookingId || b.id === bookingId);
        if (!booking) {
            console.error('Booking not found:', bookingId);
            return;
        }

        // Call the proper booking details popup from admin.html
        if (typeof window.showDetailedBookingDetailsPopup === 'function') {
            window.showDetailedBookingDetailsPopup(bookingId);
        } else if (typeof window.showBookingDetailsPopup === 'function') {
            window.showBookingDetailsPopup(bookingId);
        } else {
            // Fallback to showing basic booking info
            const modal = document.getElementById('bookingDetailsModal');
            const modalContent = modal.querySelector('.modal-content');
            
            const dateTime = new Date(booking.date + 'T' + booking.time).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            const statusClass = `status-${booking.status}`;
            let statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);

            const popupContent = `
                <div class="calendar-popup-compact">
                    <div class="calendar-popup-header">
                        <div class="calendar-popup-date">${dateTime}</div>
                        <button class="calendar-popup-btn" onclick="closeModal('bookingDetailsPopupModal')">&times;</button>
                    </div>
                    <div class="calendar-popup-content">
                        <div class="calendar-booking-preview">
                            <h4>${booking.service || 'Tree Service'}</h4>
                            <p>${booking.time || 'Time TBD'} • ${booking.name}</p>
                            <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
                            <p><strong>Customer:</strong> ${booking.name}</p>
                            <p><strong>Email:</strong> ${booking.email}</p>
                            <p><strong>Phone:</strong> ${booking.phone || 'Not provided'}</p>
                            <p><strong>Address:</strong> ${booking.address || 'Not provided'}</p>
                            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            modalContent.innerHTML = popupContent;
            openModal('bookingDetailsPopupModal');
        }
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
            toggleBtn.onclick = () => window.adminCalendar.unblockWeekendFromString(dateString);
            toggleBtn.style.display = 'inline-block';
            unblockBtn.style.display = 'none';
        } else if (isBlocked === 'unblocked_weekend') {
            statusDisplay.textContent = 'Weekend (Available)';
            toggleBtn.innerHTML = '<i class="fas fa-lock"></i> Block Weekend';
            toggleBtn.onclick = () => window.adminCalendar.reblockWeekendFromString(dateString);
            toggleBtn.style.display = 'inline-block';
            unblockBtn.style.display = 'none';
        } else if (isBlocked === true) {
            statusDisplay.textContent = 'Manually Blocked';
            toggleBtn.style.display = 'none';
            unblockBtn.style.display = 'inline-block';
        } else {
            statusDisplay.textContent = 'Available';
            toggleBtn.innerHTML = '<i class="fas fa-lock"></i> Block Date';
            toggleBtn.onclick = () => window.adminCalendar.toggleDateBlock();
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

    function showDayManagementModal(date, dateString, bookings, isBlocked, isUnblockedWeekend, isFullDayJob, isWeekend) {
        // Store the modal parameters for later refresh
        window.currentDayManagementParams = { date, dateString, bookings, isBlocked, isUnblockedWeekend, isFullDayJob, isWeekend };
        
        refreshDayManagementModal();
        
        // Show modal
        const modal = document.getElementById('dateBlockingModal');
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    function refreshDayManagementModal() {
        if (!window.currentDayManagementParams) {
            return;
        }
        
        const { date, dateString, bookings, isBlocked, isUnblockedWeekend, isFullDayJob, isWeekend } = window.currentDayManagementParams;
        
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Get events for this date
        const dayEvents = window.adminCalendarEvents ? window.adminCalendarEvents.getEventsForDate(dateString) : [];
        
        // Create modal content
        let modalContent = `
            <div class="day-management-modal">
                <div class="day-management-header">
                    <h3><i class="fas fa-calendar-day"></i> ${formattedDate}</h3>
                </div>
                <div class="day-management-content">
                    <!-- Add Event Button -->
                    <div class="add-event-section">
                        <button class="action-btn primary" onclick="window.adminCalendarEvents.showModal('${dateString}')">
                            <i class="fas fa-plus"></i> Add Event
                        </button>
                    </div>

                    <!-- Bookings Section -->
                    <div class="day-section">
                        <h4><i class="fas fa-calendar-check"></i> Bookings</h4>
                        ${bookings && bookings.length > 0 ? 
                            bookings.map(booking => `
                                <div class="day-booking-item" onclick="showBookingDetailsPopup('${booking.booking_id}')">
                                    <div class="booking-time">${booking.time}</div>
                                    <div class="booking-details">
                                        <div class="booking-service">${booking.service}</div>
                                        <div class="booking-customer">${booking.name}</div>
                                    </div>
                                </div>
                            `).join('') : 
                            '<div class="no-bookings">No bookings scheduled</div>'
                        }
                    </div>

                    <!-- Events Section -->
                    <div class="day-section">
                        <h4><i class="fas fa-calendar-alt"></i> Events</h4>
                        ${dayEvents.length > 0 ? 
                            dayEvents.map(event => `
                                <div class="day-event-item" style="border-left-color: ${event.color || '#007bff'}">
                                    <div class="event-time">${event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : (event.time || 'Time TBD')}</div>
                                    <div class="event-details">
                                        <div class="event-title">${event.title}</div>
                                        <div class="event-type">${event.type}</div>
                                        ${event.location ? `<div class="event-location">📍 ${event.location}</div>` : ''}
                                        ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                                    </div>
                                    <button class="delete-event-btn" onclick="window.adminCalendarEvents.deleteEvent('${event._id || event.id}')" title="Delete Event">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('') : 
                            '<div class="no-events">No events scheduled</div>'
                        }
                    </div>

                    <!-- Date Management Section -->
                    <div class="day-section">
                        <h4><i class="fas fa-cog"></i> Date Management</h4>
                        ${isFullDayJob ? 
                            '<div class="full-day-job-info">This date has a full-day job scheduled (5:30 PM)</div>' :
                            isBlocked ? 
                                '<button class="action-btn secondary" onclick="window.adminCalendar.unblockDateFromString(\'' + dateString + '\')">Unblock Date</button>' :
                                '<button class="action-btn secondary" onclick="window.adminCalendar.blockDate(\'' + dateString + '\')">Block Date</button>'
                        }
                        ${isWeekend ? 
                            (isUnblockedWeekend ? 
                                '<button class="action-btn warning" onclick="window.adminCalendar.reblockWeekendFromString(\'' + dateString + '\')">Block Weekend</button>' :
                                '<button class="action-btn primary" onclick="window.adminCalendar.unblockWeekendFromString(\'' + dateString + '\')">Make Weekend Available</button>'
                            ) : ''
                        }
                    </div>
                </div>
            </div>
        `;

        // Update the existing modal content
        const modal = document.getElementById('dateBlockingModal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = modalContent;
            }

            // Update modal title
            const modalTitle = modal.querySelector('#blockingModalTitle');
            if (modalTitle) {
                modalTitle.textContent = `Manage ${formattedDate}`;
            }
        }
    }

    function closeDayManagementModal() {
        const modal = document.getElementById('dateBlockingModal');
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
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
                await renderCalendar(window.allBookings || []);
                // Refresh mobile calendar action buttons
                refreshMobileCalendarActionButtons();
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
                await renderCalendar(window.allBookings || []);
                // Refresh mobile calendar action buttons
                refreshMobileCalendarActionButtons();
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
                await renderCalendar(window.allBookings || []);
                // Refresh mobile calendar action buttons
                refreshMobileCalendarActionButtons();
            } else {
                const error = await response.json();
                showNotification(error.message || 'Failed to block weekend', 'error');
            }
        } catch (error) {
            console.error('Error blocking weekend', error);
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
                await renderCalendar(window.allBookings || []);
                // Refresh mobile calendar action buttons
                refreshMobileCalendarActionButtons();
            } else {
                showNotification('Failed to unblock date', 'error');
            }
        } catch (error) {
            console.error('Error unblocking date:', error);
            showNotification('Network error unblocking date', 'error');
        }
    }

    async function previousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        
        // Reset week index when changing months
        currentMonthWeekIndex = 0;
        await renderCalendar(window.allBookings || []);
        // Update mobile calendar month display
        updateMobileCalendarMonthDisplay();
    }

    async function nextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        
        // Reset week index when changing months
        currentMonthWeekIndex = 0;
        await renderCalendar(window.allBookings || []);
        // Update mobile calendar month display
        updateMobileCalendarMonthDisplay();
    }

    function updateMobileCalendarMonthDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const monthYearText = document.querySelector('.month-year-text');
        if (monthYearText) {
            monthYearText.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        }
    }

    function changeMonthFromDropdown(monthIndex) {
        currentMonth = parseInt(monthIndex);
        // Reset week index when changing months
        currentMonthWeekIndex = 0;
        renderCalendar(window.allBookings || []);
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
            const calendarView = document.getElementById('calendarView');
            if (calendarView && calendarView.style.display !== 'none') {
                await renderCalendar(window.allBookings || []);
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

    // Show full-day job blocking info
    function showFullDayJobInfo(date, dateString) {
        const blockedDate = blockedDates.find(blocked => 
            blocked.date === dateString && blocked.reason === 'full_day_job'
        );
        
        if (!blockedDate) return;
        
        // Find the job booking details
        const jobBooking = (window.allBookings || []).find(booking => 
            booking.booking_id === blockedDate.job_booking_id
        );
        
        const customerName = jobBooking ? jobBooking.name : 'Unknown Customer';
        const service = jobBooking ? jobBooking.service : 'Tree Service';
        
        // Show blocking modal with full-day job info
        const modal = document.getElementById('dateBlockingModal');
        const title = document.getElementById('blockingModalTitle');
        const dateDisplay = document.getElementById('selectedDateDisplay');
        const statusDisplay = document.getElementById('dateStatusDisplay');
        const toggleBtn = document.getElementById('toggleBlockBtn');
        const unblockBtn = document.getElementById('unblockBtn');
        
        if (modal && title && dateDisplay && statusDisplay && toggleBtn && unblockBtn) {
            title.textContent = 'Full-Day Job Scheduled';
            dateDisplay.textContent = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            statusDisplay.textContent = `Blocked - ${customerName} (${service})`;
            
            // Hide toggle button, show unblock button
            toggleBtn.style.display = 'none';
            unblockBtn.style.display = 'block';
            
            // Update unblock button text and action
            unblockBtn.textContent = 'Unblock Date (Cancel Job)';
            unblockBtn.onclick = () => unblockFullDayJob(dateString, blockedDate.job_booking_id);
            
            modal.classList.add('show');
        }
    }

    // Unblock full-day job (cancel the job)
    async function unblockFullDayJob(dateString, jobBookingId) {
        if (!confirm('Are you sure you want to cancel this job and unblock the date? This will revert the booking status.')) {
            return;
        }
        
        try {
            // First, revert the job booking status to 'quote-sent'
            const response = await fetch(`/api/bookings/${jobBookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'quote-sent' })
            });
            
            if (!response.ok) {
                const error = await response.json();
                showNotification(error.error || 'Failed to revert job status', 'error');
                return;
            }
            
            // Remove the full-day job block
            const unblockResponse = await fetch(`/api/blocked-dates/${dateString}`, {
                method: 'DELETE'
            });
            
            if (unblockResponse.ok) {
                showNotification('Job cancelled and date unblocked successfully', 'success');
                
                // Reload data and refresh calendar
                if (window.loadBookings) {
                    window.loadBookings();
                }
                await renderCalendar(window.allBookings || []);
            } else {
                showNotification('Failed to unblock date', 'error');
            }
        } catch (error) {
            console.error('Error unblocking full-day job:', error);
            showNotification('Network error unblocking date', 'error');
        }
    }

    // Wrapper functions for HTML onclick handlers
    function blockDate(dateString) {
        try {
            // Set the selectedDate for the toggleDateBlock function
            selectedDate = new Date(dateString);
            toggleDateBlock();
        } catch (error) {
            console.error('Error in blockDate wrapper:', error);
            showNotification('Error blocking date', 'error');
        }
    }

    function unblockDateFromString(dateString) {
        try {
            // Set the selectedDate for the unblockDate function
            selectedDate = new Date(dateString);
            unblockDate();
        } catch (error) {
            console.error('Error in unblockDateFromString wrapper:', error);
            showNotification('Error unblocking date', 'error');
        }
    }

    function unblockWeekendFromString(dateString) {
        try {
            unblockWeekend(dateString);
        } catch (error) {
            console.error('Error in unblockWeekendFromString wrapper:', error);
            showNotification('Error unblocking weekend', 'error');
        }
    }

    function reblockWeekendFromString(dateString) {
        try {
            reblockWeekend(dateString);
        } catch (error) {
            console.error('Error in reblockWeekendFromString wrapper:', error);
            showNotification('Error blocking weekend', 'error');
        }
    }

    // Helper function to create booking cards similar to event cards
    function createBookingCard(booking, hasWeekendJob) {
        const bookingCard = document.createElement('div');
        bookingCard.className = 'calendar-event-card booking-card';
        bookingCard.dataset.bookingId = booking.id || booking.booking_id;
        bookingCard.title = `${booking.name} - ${booking.service}`;
        
        // Use consistent styling for all booking cards (same as regular events)
        // Colors and styling are now handled by CSS for consistency
        
        // Create booking content
        const bookingContent = document.createElement('div');
        bookingContent.className = 'event-content';
        
        // Booking title with icon and name
        const bookingTitle = document.createElement('div');
        bookingTitle.className = 'event-title';
        
        // Use different icon for booking cards to distinguish them from regular events
        let icon = 'fa-calendar-check';
        
        // Show customer name prominently
        bookingTitle.innerHTML = `
            <i class="fas ${icon} event-icon"></i>
            <span>${booking.name}</span>
        `;
        
        // Assemble booking card - only title, no time
        bookingContent.appendChild(bookingTitle);
        bookingCard.appendChild(bookingContent);
        
        // Add enhanced tooltip with service and time info
        let tooltipText = `${booking.name} - ${booking.service}`;
        if (hasWeekendJob || (booking.job_time && booking.job_time.includes('Full-day'))) {
            tooltipText += ' (Full Day Job)';
        } else if (booking.time || booking.job_time) {
            tooltipText += ` - ${booking.time || booking.job_time}`;
        }
        bookingCard.title = tooltipText;
        
        // Add click handler for booking details
        bookingCard.addEventListener('click', (e) => {
            e.stopPropagation();
            showBookingDetailsPopup(booking.booking_id || booking.id);
        });
        
        // Enable pointer events for the card
        bookingCard.style.pointerEvents = 'auto';
        
        return bookingCard;
    }
    


    // Function to refresh mobile calendar when events are updated
    function refreshMobileCalendar() {
        const calendarView = document.getElementById('calendarView');
        if (calendarView && calendarView.style.display !== 'none') {
            // Re-render the mobile calendar with updated events
            const grid = document.getElementById('calendarGrid');
            if (grid) {
                renderMobileCalendar(grid, window.allBookings || []);
            }
        }
    }

    // Function to refresh mobile calendar action buttons
    function refreshMobileCalendarActionButtons() {
        if (selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            // Re-render the time events section to update action buttons
            updateTimeEventsSection(selectedDate, window.allBookings || []);
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
        showBookingDetailsPopup,
        showBlockingModal,
        closeBlockingModal,
        showMoveBookingModal,
        refreshMobileCalendar,
        refreshMobileCalendarActionButtons,
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
        updateMobileCalendarMonthDisplay,
        changeMonthFromDropdown,
        createTodoSummarySection,
        updateTodoSummarySection,
        setupCalendarDragAndDrop,
        handleCalendarDragStart,
        handleCalendarDragEnd,
        handleCalendarDragOver,
        handleCalendarDragEnter,
        handleCalendarDragLeave,
        handleCalendarDrop,
        loadBlockedDates,
        showFullDayJobInfo,
        unblockFullDayJob,
        showDayManagementModal,
        refreshDayManagementModal,
        closeDayManagementModal,
        renderAllMonthWeeks,
        // Wrapper functions for HTML onclick handlers
        blockDate,
        unblockDateFromString,
        unblockWeekendFromString,
        reblockWeekendFromString,
        // Getter for blockedDates
        get blockedDates() { return blockedDates; }
    };

    // Make showBookingDetailsPopup globally accessible for HTML onclick handlers
    window.showBookingDetailsPopup = showBookingDetailsPopup;
})();


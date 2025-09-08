// Mobile Calendar Demo Script
// This script demonstrates the enhanced mobile calendar functionality

console.log('🎉 Mobile Calendar Demo - Enhanced Features');

// Demo function to test calendar functionality
function demoMobileCalendar() {
    console.log('📱 Testing Mobile Calendar Features:');
    
    // Test 1: Check if calendar elements are created
    const weekContainer = document.getElementById('weekContainer');
    const dateButtons = document.querySelectorAll('.month-week-date-button');
    const weekdayHeaders = document.querySelectorAll('.weekday-header');
    
    console.log('✅ Week container found:', !!weekContainer);
    console.log('✅ Date buttons created:', dateButtons.length);
    console.log('✅ Weekday headers created:', weekdayHeaders.length);
    
    // Test 2: Check event indicators
    const eventIndicators = document.querySelectorAll('.month-week-event-indicator');
    const multipleEventIndicators = document.querySelectorAll('.month-week-event-indicator.multiple');
    
    console.log('✅ Event indicators found:', eventIndicators.length);
    console.log('✅ Multiple event indicators found:', multipleEventIndicators.length);
    
    // Test 3: Check touch scrolling support
    if (weekContainer) {
        const hasTouchSupport = weekContainer.hasAttribute('tabindex');
        console.log('✅ Touch scrolling support:', hasTouchSupport);
    }
    
    // Test 4: Check responsive design
    const mobileContainer = document.querySelector('.mobile-calendar-container');
    const isResponsive = mobileContainer && window.getComputedStyle(mobileContainer).display !== 'none';
    console.log('✅ Responsive design active:', isResponsive);
    
    // Test 5: Check month navigation
    const monthDropdown = document.querySelector('.month-dropdown');
    const navButtons = document.querySelectorAll('.month-nav-btn');
    console.log('✅ Month dropdown found:', !!monthDropdown);
    console.log('✅ Navigation buttons found:', navButtons.length);
    
    console.log('🎯 Mobile Calendar Demo Complete!');
}

// Auto-run demo when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(demoMobileCalendar, 2000); // Wait for calendar to render
});

// Export for manual testing
window.demoMobileCalendar = demoMobileCalendar;

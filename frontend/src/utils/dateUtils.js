/**
 * Date utility functions for JST (Japan Standard Time, UTC+9)
 */

/**
 * Get current date/time in JST
 * @returns {Date} Date object representing current time
 */
export function getJSTDate() {
    return new Date();
}

/**
 * Get date components in JST
 * @param {Date|string|null} date - Date to get components from (if null, uses current time)
 * @returns {Object} Object with year, month (1-12), day, hour, minute, second in JST
 */
export function getJSTDateComponents(date) {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    
    // Format date in JST timezone and extract components
    const jstString = dateObj.toLocaleString('en-US', { 
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Parse the formatted string: "MM/DD/YYYY, HH:MM:SS"
    const parts = jstString.split(', ');
    const datePart = parts[0].split('/');
    const timePart = parts[1].split(':');
    
    return {
        year: parseInt(datePart[2]),
        month: parseInt(datePart[0]), // Already 1-12
        day: parseInt(datePart[1]),
        hour: parseInt(timePart[0]),
        minute: parseInt(timePart[1]),
        second: parseInt(timePart[2])
    };
}

/**
 * Format date as YYYY-MM-DD in JST
 * @param {Date|string|null} date - Date to format (if null, uses current time)
 * @returns {string} String in format YYYY-MM-DD
 */
export function formatJSTDate(date) {
    const components = getJSTDateComponents(date);
    return `${components.year}-${String(components.month).padStart(2, '0')}-${String(components.day).padStart(2, '0')}`;
}

/**
 * Compare two dates by date components (year, month, day) in JST
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} true if dates are on the same day in JST
 */
export function isSameJSTDate(date1, date2) {
    const comp1 = getJSTDateComponents(date1);
    const comp2 = getJSTDateComponents(date2);
    return comp1.year === comp2.year &&
           comp1.month === comp2.month &&
           comp1.day === comp2.day;
}

/**
 * Create a Date object from YYYY-MM-DD string in JST
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object set to midnight JST of that date
 */
export function parseJSTDate(dateString) {
    const parts = dateString.split('-');
    if (parts.length !== 3) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    const day = parseInt(parts[2]);
    
    // Create date string in JST format and parse it
    // We create a date string that represents midnight in JST
    const jstDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+09:00`;
    return new Date(jstDateString);
}

/**
 * Format date for display in JST locale
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatJSTLocale(date, options = {}) {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    const defaultOptions = {
        timeZone: 'Asia/Tokyo',
        ...options
    };
    return dateObj.toLocaleString('ja-JP', defaultOptions);
}


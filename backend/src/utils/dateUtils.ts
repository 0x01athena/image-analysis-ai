/**
 * Date utility functions for JST (Japan Standard Time, UTC+9)
 */

/**
 * Get current date/time in JST
 * @returns Date object representing current time in JST (as UTC with JST offset)
 */
export function getJSTDate(): Date {
    const now = new Date();
    // Get current time in JST by formatting as JST and parsing back
    // JST is UTC+9
    const jstString = now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
    return new Date(jstString);
}

/**
 * Get date components in JST
 * @param date - Date to get components from (if null, uses current time)
 * @returns Object with year, month (1-12), day, hour, minute, second in JST
 */
export function getJSTDateComponents(date?: Date | string | null): {
    year: number;
    month: number; // 1-12
    day: number;
    hour: number;
    minute: number;
    second: number;
} {
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
 * @param date - Date to format (if null, uses current time)
 * @returns String in format YYYY-MM-DD
 */
export function formatJSTDate(date?: Date | string | null): string {
    const components = getJSTDateComponents(date);
    return `${components.year}-${String(components.month).padStart(2, '0')}-${String(components.day).padStart(2, '0')}`;
}

/**
 * Compare two dates by date components (year, month, day) in JST
 * @param date1 - First date (can be Date, string, or YYYY-MM-DD string)
 * @param date2 - Second date (can be Date, string, or YYYY-MM-DD string)
 * @returns true if dates are on the same day in JST
 */
export function isSameJSTDate(date1: Date | string, date2: Date | string): boolean {
    // If date2 is already in YYYY-MM-DD format, use it directly
    if (typeof date2 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date2)) {
        const comp1 = getJSTDateComponents(date1);
        const parts = date2.split('-');
        return comp1.year === parseInt(parts[0]) &&
               comp1.month === parseInt(parts[1]) &&
               comp1.day === parseInt(parts[2]);
    }
    
    // Otherwise, compare both as dates
    const comp1 = getJSTDateComponents(date1);
    const comp2 = getJSTDateComponents(date2);
    return comp1.year === comp2.year &&
           comp1.month === comp2.month &&
           comp1.day === comp2.day;
}

/**
 * Create a Date object from YYYY-MM-DD string in JST
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object set to midnight JST of that date
 */
export function parseJSTDate(dateString: string): Date {
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


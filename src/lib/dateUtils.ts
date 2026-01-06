/**
 * Date utility functions to handle timezone-safe date parsing.
 * 
 * When a date string like "2026-01-11" is passed to `new Date()`, 
 * JavaScript interprets it as UTC midnight. When displayed in local time,
 * this can cause a one-day offset for users in western timezones.
 * 
 * These utilities ensure dates are parsed as local dates, not UTC.
 */

/**
 * Parse a date string (YYYY-MM-DD) as a local date, avoiding UTC offset issues.
 * 
 * @param dateString - A date string in YYYY-MM-DD format
 * @returns A Date object representing the local date at midnight
 */
export function parseLocalDate(dateString: string): Date {
  // Split the date string and create a date with local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object to YYYY-MM-DD string using local date parts.
 * 
 * @param date - A Date object
 * @returns A string in YYYY-MM-DD format
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string (YYYY-MM-DD) for display in pt-BR locale.
 * 
 * @param dateString - A date string in YYYY-MM-DD format
 * @returns A formatted string like "11/01/2026"
 */
export function formatDateForDisplay(dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString('pt-BR');
}

/**
 * Parsing utilities for dates, prices, and text normalization
 */

/**
 * Parse a date string to ISO 8601 format (YYYY-MM-DD)
 * Handles various common date formats
 */
export function parseDate(dateString: string): string | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  try {
    // Clean the string
    const cleaned = dateString.trim();

    // Try to parse as Date
    const date = new Date(cleaned);

    // Check if valid date
    if (isNaN(date.getTime())) {
      return null;
    }

    // Return ISO format (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
}

/**
 * Extract price range from text
 * Matches patterns like: $20, $20-$65, $20+, $20 - $65
 */
export function extractPriceRange(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Pattern 1: $20-$65 or $20 - $65
  const rangePattern = /\$(\d+)\s*[-–]\s*\$?(\d+)/;
  const rangeMatch = text.match(rangePattern);
  if (rangeMatch) {
    return `$${rangeMatch[1]}-$${rangeMatch[2]}`;
  }

  // Pattern 2: $20+ or $20 and up
  const plusPattern = /\$(\d+)\+/;
  const plusMatch = text.match(plusPattern);
  if (plusMatch) {
    return `$${plusMatch[1]}+`;
  }

  // Pattern 3: Single price $20
  const singlePattern = /\$(\d+)/;
  const singleMatch = text.match(singlePattern);
  if (singleMatch) {
    return `$${singleMatch[1]}`;
  }

  return null;
}

/**
 * Normalize whitespace in text
 * Collapses multiple spaces, removes leading/trailing whitespace
 */
export function normalizeWhitespace(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\n\s*\n/g, '\n') // Collapse multiple newlines
    .trim();
}

/**
 * Clean HTML text content
 * Removes extra whitespace and normalizes text
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }

  return normalizeWhitespace(text)
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .replace(/\u200B/g, '') // Remove zero-width spaces
    .trim();
}

/**
 * Extract time from text
 * Matches patterns like: 8:00 PM, 8PM, 20:00
 */
export function extractTime(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Pattern: 8:00 PM or 8 PM
  const time12Pattern = /(\d{1,2}):?(\d{2})?\s*(AM|PM)/i;
  const time12Match = text.match(time12Pattern);
  if (time12Match) {
    const hours = time12Match[1];
    const minutes = time12Match[2] || '00';
    const period = time12Match[3].toUpperCase();
    return `${hours}:${minutes} ${period}`;
  }

  // Pattern: 20:00 (24-hour)
  const time24Pattern = /(\d{2}):(\d{2})/;
  const time24Match = text.match(time24Pattern);
  if (time24Match) {
    return time24Match[0];
  }

  return null;
}

/**
 * Extract JavaScript array from HTML text
 * Handles bracket matching, string delimiters, and escape sequences
 * Similar to Python version but adapted for TypeScript
 */
export function extractJsArray(text: string, startPattern: string): any[] | null {
  if (!text || !startPattern) {
    return null;
  }

  try {
    // Find the start pattern
    const startIndex = text.indexOf(startPattern);
    if (startIndex === -1) {
      return null;
    }

    // Find the opening bracket after the start pattern
    const searchStart = startIndex + startPattern.length;
    const openBracketIndex = text.indexOf('[', searchStart);
    if (openBracketIndex === -1) {
      return null;
    }

    // Track bracket depth and string delimiters
    let depth = 0;
    let inString = false;
    let stringDelimiter: string | null = null;
    let escaped = false;
    let closeBracketIndex = -1;

    // Safety limit to prevent runaway parsing
    const maxLength = Math.min(text.length, openBracketIndex + 500000); // 500KB limit

    for (let i = openBracketIndex; i < maxLength; i++) {
      const char = text[i];

      // Handle escape sequences
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      // Handle string delimiters
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringDelimiter = char;
        continue;
      }

      if (inString && char === stringDelimiter) {
        inString = false;
        stringDelimiter = null;
        continue;
      }

      // Only count brackets outside of strings
      if (!inString) {
        if (char === '[') {
          depth++;
        } else if (char === ']') {
          depth--;
          if (depth === 0) {
            closeBracketIndex = i;
            break;
          }
        }
      }
    }

    if (closeBracketIndex === -1) {
      console.error('Could not find closing bracket for array');
      return null;
    }

    // Extract the array string
    let arrayString = text.substring(openBracketIndex, closeBracketIndex + 1);

    // Clean JavaScript syntax to make it valid JSON
    arrayString = arrayString
      .replace(/\\'/g, "'") // Fix escaped single quotes
      .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

    // Parse as JSON
    return JSON.parse(arrayString);
  } catch (error: any) {
    console.error(`Failed to extract JS array: ${error.message}`);
    return null;
  }
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Parse a date range from text
 * Returns [startDate, endDate] or [null, null] if parsing fails
 */
export function parseDateRange(text: string): [string | null, string | null] {
  if (!text || typeof text !== 'string') {
    return [null, null];
  }

  try {
    // Look for date range patterns like "Jan 1-15" or "Jan 1 - Feb 15"
    const rangePattern = /(\w+\s+\d+)\s*[-–]\s*(\w+\s+\d+|\d+)/;
    const match = text.match(rangePattern);

    if (match) {
      const startDateStr = match[1];
      let endDateStr = match[2];

      // If end date doesn't have month, use start month
      if (!/\w+\s+\d+/.test(endDateStr)) {
        const startMonth = startDateStr.split(' ')[0];
        endDateStr = `${startMonth} ${endDateStr}`;
      }

      const startDate = parseDate(startDateStr);
      const endDate = parseDate(endDateStr);

      return [startDate, endDate];
    }

    // Try to parse as single date
    const singleDate = parseDate(text);
    return [singleDate, null];
  } catch (error) {
    return [null, null];
  }
}

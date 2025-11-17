"""
Utility functions for parsing dates, times, and other common data.
"""

import re
from datetime import datetime
from typing import Optional, Tuple
from dateutil import parser as dateutil_parser


def parse_date(date_string: str) -> Optional[str]:
    """
    Parse a date string into ISO 8601 format (YYYY-MM-DD).

    Args:
        date_string: Date string in various formats

    Returns:
        ISO 8601 formatted date string or None if parsing fails
    """
    if not date_string:
        return None

    try:
        # Use dateutil parser for flexible date parsing
        parsed_date = dateutil_parser.parse(date_string, fuzzy=True)
        return parsed_date.date().isoformat()
    except (ValueError, TypeError):
        return None


def parse_date_range(date_range_string: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Parse a date range string into start and end dates.

    Examples:
        "Nov 14-15, 2025" -> ("2025-11-14", "2025-11-15")
        "November 14 & 15, 2025" -> ("2025-11-14", "2025-11-15")
        "Feb 21 - Mar 29" -> ("2025-02-21", "2025-03-29")

    Args:
        date_range_string: String containing a date range

    Returns:
        Tuple of (start_date, end_date) in ISO format, or (None, None)
    """
    if not date_range_string:
        return None, None

    # Common separators for date ranges
    separators = [' to ', ' - ', ' – ', ' through ', '–', '-']

    for sep in separators:
        if sep in date_range_string:
            parts = date_range_string.split(sep, 1)
            if len(parts) == 2:
                start = parse_date(parts[0].strip())
                end = parse_date(parts[1].strip())
                return start, end

    # Single date
    single_date = parse_date(date_range_string)
    if single_date:
        return single_date, single_date

    return None, None


def extract_price_range(text: str) -> Optional[str]:
    """
    Extract price range from text.

    Examples:
        "Tickets $20-$65" -> "$20-$65"
        "Starting at $5" -> "$5+"
        "Price: $35" -> "$35"

    Args:
        text: Text potentially containing price information

    Returns:
        Normalized price range string or None
    """
    if not text:
        return None

    # Pattern for price ranges like "$20-$65" or "$20 - $65"
    range_pattern = r'\$\s*(\d+(?:\.\d{2})?)\s*[-–]\s*\$?\s*(\d+(?:\.\d{2})?)'
    range_match = re.search(range_pattern, text)
    if range_match:
        return f"${range_match.group(1)}-${range_match.group(2)}"

    # Pattern for "starting at" or minimum prices
    starting_pattern = r'(?:starting\s+at|from)\s*\$\s*(\d+(?:\.\d{2})?)'
    starting_match = re.search(starting_pattern, text, re.IGNORECASE)
    if starting_match:
        return f"${starting_match.group(1)}+"

    # Pattern for single price
    single_pattern = r'\$\s*(\d+(?:\.\d{2})?)'
    single_match = re.search(single_pattern, text)
    if single_match:
        return f"${single_match.group(1)}"

    return None


def clean_text(text: str) -> str:
    """
    Clean and normalize text content.

    Args:
        text: Raw text to clean

    Returns:
        Cleaned text
    """
    if not text:
        return ""

    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)

    # Remove leading/trailing whitespace
    text = text.strip()

    # Remove HTML entities
    text = text.replace('&amp;', '&')
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&quot;', '"')
    text = text.replace('&#8217;', "'")
    text = text.replace('&#8220;', '"')
    text = text.replace('&#8221;', '"')

    return text


def extract_runtime(text: str) -> Optional[str]:
    """
    Extract runtime/duration from text.

    Examples:
        "90 minutes" -> "90 minutes"
        "2 hours" -> "2 hours"
        "1hr 30min" -> "1 hour 30 minutes"

    Args:
        text: Text potentially containing runtime information

    Returns:
        Normalized runtime string or None
    """
    if not text:
        return None

    # Pattern for "X hours Y minutes"
    hours_minutes = r'(\d+)\s*(?:hr|hour)s?\s*(?:(\d+)\s*(?:min|minute)s?)?'
    match = re.search(hours_minutes, text, re.IGNORECASE)
    if match:
        hours = int(match.group(1))
        minutes = int(match.group(2)) if match.group(2) else 0
        if minutes:
            return f"{hours} hour{'s' if hours != 1 else ''} {minutes} minutes"
        return f"{hours} hour{'s' if hours != 1 else ''}"

    # Pattern for just minutes
    minutes_pattern = r'(\d+)\s*(?:min|minute)s?'
    match = re.search(minutes_pattern, text, re.IGNORECASE)
    if match:
        return f"{match.group(1)} minutes"

    return None


def normalize_url(url: str, base_url: str) -> str:
    """
    Normalize a URL to be absolute.

    Args:
        url: URL to normalize (may be relative)
        base_url: Base URL for resolving relative URLs

    Returns:
        Absolute URL
    """
    if not url:
        return ""

    # Already absolute
    if url.startswith('http://') or url.startswith('https://'):
        return url

    # Protocol-relative
    if url.startswith('//'):
        return f"https:{url}"

    # Relative to base
    base = base_url.rstrip('/')
    path = url.lstrip('/')
    return f"{base}/{path}"

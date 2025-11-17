"""
Data schema definitions for theater show information.
All scrapers should normalize data to these models.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List
from enum import Enum


class ShowStatus(Enum):
    """Status of a show"""
    UPCOMING = "upcoming"
    RUNNING = "running"
    CLOSED = "closed"
    CANCELED = "canceled"
    POSTPONED = "postponed"


@dataclass
class ShowDates:
    """Date information for a show"""
    start: Optional[str] = None  # ISO 8601 format: YYYY-MM-DD
    end: Optional[str] = None    # ISO 8601 format: YYYY-MM-DD
    schedule: Optional[str] = None  # Human-readable schedule (e.g., "Tues-Sat 7pm")

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class Show:
    """Complete show information"""
    # Required fields
    theater_name: str
    theater_url: str
    show_title: str

    # Optional core fields
    playwright: Optional[str] = None
    director: Optional[str] = None
    dates: Optional[ShowDates] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    ticket_url: Optional[str] = None

    # Additional details
    price_range: Optional[str] = None
    genres: List[str] = field(default_factory=list)
    cast: List[str] = field(default_factory=list)
    runtime: Optional[str] = None
    image_url: Optional[str] = None
    status: ShowStatus = ShowStatus.UPCOMING

    # Metadata
    scraped_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    scraper_version: str = "1.0"
    scraper_type: Optional[str] = None  # e.g., "wordpress", "squarespace", "custom"

    def to_dict(self):
        """Convert to dictionary, excluding None values"""
        result = {}
        for key, value in asdict(self).items():
            if value is None:
                continue
            if key == 'dates' and isinstance(value, dict):
                result[key] = value
            elif key == 'status':
                result[key] = value.value if hasattr(value, 'value') else value
            elif isinstance(value, list) and len(value) == 0:
                continue
            else:
                result[key] = value
        return result

    def __post_init__(self):
        """Validate and normalize data after initialization"""
        # Ensure title is not empty
        if not self.show_title or not self.show_title.strip():
            raise ValueError("show_title cannot be empty")

        # Ensure theater name is not empty
        if not self.theater_name or not self.theater_name.strip():
            raise ValueError("theater_name cannot be empty")

        # Convert dates dict to ShowDates if needed
        if isinstance(self.dates, dict):
            self.dates = ShowDates(**self.dates)


@dataclass
class ScraperResult:
    """Result of a scraping operation"""
    theater_name: str
    success: bool
    shows: List[Show] = field(default_factory=list)
    error: Optional[str] = None
    warnings: List[str] = field(default_factory=list)
    scraped_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'theater_name': self.theater_name,
            'success': self.success,
            'shows': [show.to_dict() for show in self.shows],
            'show_count': len(self.shows),
            'error': self.error,
            'warnings': self.warnings,
            'scraped_at': self.scraped_at
        }

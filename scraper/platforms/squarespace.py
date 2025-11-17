"""
Squarespace Platform Scraper

Squarespace is a website builder used by many theaters.
Events are typically displayed using their built-in calendar/events collection system.

This scraper parses the HTML structure of Squarespace event pages.
"""

from typing import List, Optional
from bs4 import BeautifulSoup
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base import BaseScraper, Show, ShowDates, ScraperResult
from utils import parse_date, clean_text, normalize_url


class SquarespaceScraper(BaseScraper):
    """Scraper for Squarespace-based theater websites"""

    def __init__(
        self,
        theater_name: str,
        base_url: str,
        calendar_path: str = "/calendar",
        **kwargs
    ):
        """
        Initialize Squarespace scraper.

        Args:
            theater_name: Name of the theater
            base_url: Base URL of the Squarespace site
            calendar_path: Path to calendar page (default: "/calendar")
        """
        super().__init__(theater_name, base_url, **kwargs)
        self.calendar_path = calendar_path
        self.calendar_url = f"{base_url}{calendar_path}"

    def _parse_event_item(self, event_div) -> Optional[Show]:
        """
        Parse a Squarespace event item div into a Show.

        Args:
            event_div: BeautifulSoup element for the event

        Returns:
            Show object or None if parsing fails
        """
        try:
            # Extract title and link
            title_elem = event_div.find('h1', class_='eventlist-title') or event_div.find('h2', class_='eventlist-title')
            if not title_elem:
                return None

            title_link = title_elem.find('a', class_='eventlist-title-link')
            if not title_link:
                return None

            title = clean_text(title_link.get_text())
            if not title:
                return None

            detail_url = title_link.get('href', '')
            if detail_url:
                detail_url = normalize_url(detail_url, self.base_url)

            # Extract date and time
            start_date = None
            end_date = None
            time_str = None

            # Look for date in meta items
            date_elem = event_div.find('time', class_='event-date')
            if date_elem:
                datetime_attr = date_elem.get('datetime')
                if datetime_attr:
                    start_date = parse_date(datetime_attr)

            # Look for time
            time_12hr = event_div.find('time', class_='event-time-12hr')
            if time_12hr:
                time_str = clean_text(time_12hr.get_text())

            # Look for end date if it exists
            end_date_elem = event_div.find('time', class_='event-date-end')
            if end_date_elem:
                end_datetime_attr = end_date_elem.get('datetime')
                if end_datetime_attr:
                    end_date = parse_date(end_datetime_attr)

            # Extract venue/location
            venue = None
            location_elem = event_div.find('li', class_='eventlist-meta-address') or event_div.find('div', class_='event-location')
            if location_elem:
                venue = clean_text(location_elem.get_text())

            # Extract excerpt/description
            description = None
            excerpt_elem = event_div.find('div', class_='eventlist-excerpt') or event_div.find('p', class_='event-excerpt')
            if excerpt_elem:
                description = clean_text(excerpt_elem.get_text())
                if description and len(description) > 500:
                    description = description[:497] + "..."

            # Build schedule string
            schedule = None
            if time_str:
                if end_date and start_date != end_date:
                    schedule = f"{time_str} ({start_date} to {end_date})"
                else:
                    schedule = time_str

            # Create Show object
            show = Show(
                theater_name=self.theater_name,
                theater_url=self.base_url,
                show_title=title,
                dates=ShowDates(
                    start=start_date,
                    end=end_date,
                    schedule=schedule
                ) if start_date else None,
                venue=venue,
                description=description,
                ticket_url=detail_url,
                scraper_type="squarespace"
            )

            return show

        except Exception as e:
            self.logger.warning(f"Error parsing event item: {str(e)}")
            return None

    def _scrape_events_from_html(self, html_content: str) -> List[Show]:
        """
        Extract events from Squarespace HTML.

        Args:
            html_content: HTML content of the calendar page

        Returns:
            List of Show objects
        """
        shows = []
        soup = BeautifulSoup(html_content, 'html.parser')

        # Try different Squarespace event container patterns
        # Pattern 1: eventlist-column-info (most common)
        event_containers = soup.find_all('div', class_='eventlist-column-info')

        if not event_containers:
            # Pattern 2: event-item
            event_containers = soup.find_all('article', class_=lambda c: c and 'event-item' in c)

        if not event_containers:
            # Pattern 3: calendar-event
            event_containers = soup.find_all('div', class_=lambda c: c and 'calendar-event' in c)

        self.logger.info(f"Found {len(event_containers)} potential event containers")

        for event_div in event_containers:
            show = self._parse_event_item(event_div)
            if show:
                shows.append(show)
                self.logger.debug(f"Parsed: {show.show_title}")

        return shows

    def scrape(self) -> ScraperResult:
        """
        Scrape shows from Squarespace calendar page.

        Returns:
            ScraperResult with shows and metadata
        """
        try:
            # Fetch the calendar page
            self.logger.info(f"Fetching calendar: {self.calendar_url}")
            response = self.fetch_page(self.calendar_url)

            if not response:
                return ScraperResult(
                    theater_name=self.theater_name,
                    success=False,
                    error=f"Failed to fetch calendar page: {self.calendar_url}"
                )

            # Parse events from HTML
            shows = self._scrape_events_from_html(response.text)

            if shows:
                return ScraperResult(
                    theater_name=self.theater_name,
                    success=True,
                    shows=shows
                )
            else:
                return ScraperResult(
                    theater_name=self.theater_name,
                    success=False,
                    error="No events found on calendar page",
                    warnings=["Calendar page loaded but no events were parsed"]
                )

        except Exception as e:
            self.logger.exception(f"Error scraping {self.theater_name}")
            return ScraperResult(
                theater_name=self.theater_name,
                success=False,
                error=str(e)
            )


def main():
    """Test the Squarespace scraper with The Tank"""
    import logging

    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test with The Tank
    scraper = SquarespaceScraper(
        theater_name="The Tank",
        base_url="https://thetanknyc.org",
        calendar_path="/calendar-1"
    )

    print(f"Scraping {scraper.theater_name}...")
    result = scraper.run()

    print(f"\nResults:")
    print(f"Success: {result.success}")
    print(f"Shows found: {len(result.shows)}")
    print(f"Warnings: {len(result.warnings)}")

    if result.error:
        print(f"Error: {result.error}")

    if result.shows:
        print(f"\nFirst 10 shows:")
        for i, show in enumerate(result.shows[:10], 1):
            print(f"\n{i}. {show.show_title}")
            if show.dates and show.dates.start:
                schedule_info = f" at {show.dates.schedule}" if show.dates.schedule else ""
                print(f"   Date: {show.dates.start}{schedule_info}")
            if show.venue:
                print(f"   Venue: {show.venue}")
            if show.description:
                desc = show.description[:80] + "..." if len(show.description) > 80 else show.description
                print(f"   Description: {desc}")
            if show.ticket_url:
                print(f"   Details: {show.ticket_url}")

    if result.warnings:
        print(f"\nWarnings:")
        for warning in result.warnings:
            print(f"  - {warning}")

    # Print JSON output for first show
    if result.shows:
        print(f"\n{'='*60}")
        print("JSON Output (first show):")
        print(f"{'='*60}")
        import json
        print(json.dumps(result.shows[0].to_dict(), indent=2))


if __name__ == "__main__":
    main()

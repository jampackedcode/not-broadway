"""
WordPress + Spektrix Platform Scraper

Spektrix is a ticketing system that integrates with WordPress.
Theaters using this typically expose a REST API at:
/wp-json/spektrix/v1/events or similar

This scraper works for WordPress sites with Spektrix integration.
"""

import json
from typing import List, Optional, Dict, Any
from bs4 import BeautifulSoup

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base import BaseScraper, Show, ShowDates, ScraperResult, ShowStatus
from utils import parse_date, parse_date_range, clean_text, normalize_url, extract_price_range


class WordPressSpektrixScraper(BaseScraper):
    """Scraper for WordPress sites with Spektrix ticketing integration"""

    def __init__(
        self,
        theater_name: str,
        base_url: str,
        api_endpoint: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize WordPress + Spektrix scraper.

        Args:
            theater_name: Name of the theater
            base_url: Base URL of the WordPress site
            api_endpoint: Optional Spektrix API endpoint (auto-detected if not provided)
        """
        super().__init__(theater_name, base_url, **kwargs)
        self.api_endpoint = api_endpoint or f"{base_url}/wp-json/spektrix/v1"

    def _parse_spektrix_event(self, event_data: Dict[str, Any]) -> Optional[Show]:
        """
        Parse a Spektrix event object into a Show.

        Args:
            event_data: Event data from Spektrix API or embedded JSON

        Returns:
            Show object or None if parsing fails
        """
        try:
            # Extract title
            title = event_data.get('title', event_data.get('name', ''))
            if not title:
                return None

            title = clean_text(title)

            # Extract dates
            start_date = None
            end_date = None
            schedule = None

            # Try different date field formats
            if 'start' in event_data:
                start_date = parse_date(event_data['start'])
            elif 'start_date' in event_data:
                start_date = parse_date(event_data['start_date'])
            elif 'firstPerformance' in event_data:
                start_date = parse_date(event_data['firstPerformance'])

            if 'end' in event_data:
                end_date = parse_date(event_data['end'])
            elif 'end_date' in event_data:
                end_date = parse_date(event_data['end_date'])
            elif 'lastPerformance' in event_data:
                end_date = parse_date(event_data['lastPerformance'])

            # Extract description
            description = event_data.get('description', event_data.get('synopsis', ''))
            if description:
                description = clean_text(description)
                # Limit description length
                if len(description) > 500:
                    description = description[:497] + "..."

            # Extract URL
            ticket_url = event_data.get('url', event_data.get('link', ''))
            if ticket_url:
                ticket_url = normalize_url(ticket_url, self.base_url)

            # Extract instance ID for ticket URL construction
            instance_id = event_data.get('instance_id', event_data.get('instanceId', ''))
            if instance_id and not ticket_url:
                ticket_url = f"{self.base_url}/performances/?instanceId={instance_id}"

            # Extract venue
            venue = event_data.get('venue', event_data.get('location', ''))
            if venue:
                venue = clean_text(venue)

            # Extract image
            image_url = event_data.get('image', event_data.get('imageUrl', ''))
            if image_url:
                image_url = normalize_url(image_url, self.base_url)

            # Extract playwright/director
            playwright = event_data.get('playwright', event_data.get('writer', ''))
            if playwright:
                playwright = clean_text(playwright)

            director = event_data.get('director', '')
            if director:
                director = clean_text(director)

            # Extract price
            price_range = None
            if 'price' in event_data:
                price_range = extract_price_range(str(event_data['price']))
            elif 'pricing' in event_data:
                price_range = extract_price_range(str(event_data['pricing']))

            # Determine status
            status = ShowStatus.UPCOMING
            if 'status' in event_data:
                status_str = event_data['status'].lower()
                if 'cancel' in status_str:
                    status = ShowStatus.CANCELED
                elif 'closed' in status_str or 'past' in status_str:
                    status = ShowStatus.CLOSED

            # Check className for status
            if 'className' in event_data:
                class_name = event_data['className'].lower()
                if 'main-stage' in class_name or 'perfs' in class_name:
                    status = ShowStatus.RUNNING

            # Create Show object
            show = Show(
                theater_name=self.theater_name,
                theater_url=self.base_url,
                show_title=title,
                playwright=playwright or None,
                director=director or None,
                dates=ShowDates(
                    start=start_date,
                    end=end_date,
                    schedule=schedule
                ) if start_date or end_date else None,
                venue=venue or None,
                description=description or None,
                ticket_url=ticket_url or None,
                price_range=price_range,
                image_url=image_url or None,
                status=status,
                scraper_type="wordpress_spektrix"
            )

            return show

        except Exception as e:
            self.logger.warning(f"Error parsing Spektrix event: {str(e)}")
            return None

    def _scrape_from_api(self) -> List[Show]:
        """
        Scrape events from Spektrix REST API.

        Returns:
            List of Show objects
        """
        shows = []

        # Try different API endpoints
        endpoints = [
            f"{self.api_endpoint}/events",
            f"{self.api_endpoint}/performances",
            f"{self.api_endpoint}/calendar"
        ]

        for endpoint in endpoints:
            try:
                self.logger.info(f"Trying API endpoint: {endpoint}")
                response = self.fetch_page(endpoint)

                if response and response.status_code == 200:
                    try:
                        data = response.json()

                        # Handle different response formats
                        if isinstance(data, list):
                            events = data
                        elif isinstance(data, dict):
                            # Try different keys
                            events = (
                                data.get('events', []) or
                                data.get('performances', []) or
                                data.get('data', []) or
                                []
                            )
                        else:
                            events = []

                        self.logger.info(f"Found {len(events)} events from API")

                        for event_data in events:
                            show = self._parse_spektrix_event(event_data)
                            if show:
                                shows.append(show)

                        # If we found shows, we're done
                        if shows:
                            return shows

                    except json.JSONDecodeError:
                        self.logger.warning(f"Invalid JSON from {endpoint}")
                        continue

            except Exception as e:
                self.logger.debug(f"Error with endpoint {endpoint}: {str(e)}")
                continue

        return shows

    def _scrape_from_page(self) -> List[Show]:
        """
        Scrape events from embedded JavaScript data in the HTML page.

        Returns:
            List of Show objects
        """
        shows = []

        try:
            response = self.fetch_page(self.base_url)
            if not response:
                return shows

            soup = BeautifulSoup(response.content, 'html.parser')

            # Look for embedded event data in script tags
            # NYTW uses: var events = [...]
            import re

            # Search in the entire HTML text for better multiline matching
            html_text = response.text

            # Function to extract JavaScript array by bracket matching
            def extract_js_array(text, start_pattern):
                """Extract a JavaScript array by finding opening [ and matching ], handling strings properly"""
                match = re.search(start_pattern, text)
                if not match:
                    return None

                start_pos = match.end()
                # Find the opening bracket
                bracket_pos = text.find('[', start_pos - 10, start_pos + 10)
                if bracket_pos == -1:
                    return None

                # Count brackets to find the closing one, handling strings properly
                depth = 0
                i = bracket_pos
                in_string = False
                string_char = None
                escape_next = False

                while i < len(text):
                    char = text[i]

                    # Handle escape sequences
                    if escape_next:
                        escape_next = False
                        i += 1
                        continue

                    if char == '\\':
                        escape_next = True
                        i += 1
                        continue

                    # Handle strings
                    if char in ('"', "'") and not in_string:
                        in_string = True
                        string_char = char
                    elif char == string_char and in_string:
                        in_string = False
                        string_char = None
                    elif not in_string:
                        # Only count brackets outside of strings
                        if char == '[':
                            depth += 1
                        elif char == ']':
                            depth -= 1
                            if depth == 0:
                                # Found the matching bracket
                                return text[bracket_pos:i+1]

                    i += 1

                    # Safety check - if we've gone 500KB, something is wrong
                    if i - bracket_pos > 500000:
                        break

                return None

            # Try to extract events array
            for var_keyword in ['var events', 'const events', 'let events']:
                events_json = extract_js_array(html_text, re.escape(var_keyword) + r'\s*=\s*')
                if events_json:
                    try:
                        # Clean up JavaScript syntax that isn't valid JSON
                        cleaned_json = events_json
                        # Replace \' with ' (JSON doesn't need to escape single quotes)
                        cleaned_json = cleaned_json.replace("\\'", "'")
                        # Remove trailing commas before ] or }
                        cleaned_json = re.sub(r',(\s*[}\]])', r'\1', cleaned_json)

                        # Parse JSON
                        events_data = json.loads(cleaned_json)

                        self.logger.info(f"Found {len(events_data)} events in page using '{var_keyword}'")

                        for event_data in events_data:
                            show = self._parse_spektrix_event(event_data)
                            if show:
                                shows.append(show)

                        if shows:
                            return shows

                    except json.JSONDecodeError as e:
                        self.logger.debug(f"Could not parse embedded JSON: {str(e)[:100]}")
                        continue
                    except Exception as e:
                        self.logger.debug(f"Error extracting with '{var_keyword}': {str(e)}")
                        continue

        except Exception as e:
            self.logger.warning(f"Error scraping from page: {str(e)}")

        return shows

    def scrape(self) -> ScraperResult:
        """
        Scrape shows from WordPress + Spektrix site.

        Returns:
            ScraperResult with shows and metadata
        """
        shows = []

        # Try API first (more reliable)
        self.logger.info("Attempting to scrape from API...")
        shows = self._scrape_from_api()

        # Fall back to page scraping if API doesn't work
        if not shows:
            self.logger.info("API scraping failed, trying page scraping...")
            shows = self._scrape_from_page()

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
                error="No shows found via API or page scraping",
                warnings=["Could not find any event data"]
            )


def main():
    """Test the WordPress + Spektrix scraper with NYTW"""
    import logging

    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test with New York Theatre Workshop
    scraper = WordPressSpektrixScraper(
        theater_name="New York Theatre Workshop",
        base_url="https://www.nytw.org",
        api_endpoint="https://www.nytw.org/wp-json/spektrix/v1"
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
        print(f"\nShows:")
        for i, show in enumerate(result.shows, 1):
            print(f"\n{i}. {show.show_title}")
            if show.dates and show.dates.start:
                print(f"   Dates: {show.dates.start} to {show.dates.end or 'TBD'}")
            if show.venue:
                print(f"   Venue: {show.venue}")
            if show.description:
                desc = show.description[:100] + "..." if len(show.description) > 100 else show.description
                print(f"   Description: {desc}")
            if show.ticket_url:
                print(f"   Tickets: {show.ticket_url}")

    if result.warnings:
        print(f"\nWarnings:")
        for warning in result.warnings:
            print(f"  - {warning}")

    # Print JSON output
    print(f"\n{'='*60}")
    print("JSON Output (first show only):")
    print(f"{'='*60}")
    import json
    if result.shows:
        print(json.dumps(result.shows[0].to_dict(), indent=2))


if __name__ == "__main__":
    main()

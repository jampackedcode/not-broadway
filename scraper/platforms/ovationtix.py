"""
OvationTix Platform Scraper

OvationTix is a ticketing platform used by multiple theaters.
URL pattern: web.ovationtix.com/trs/store/{store_id}
Calendar: web.ovationtix.com/trs/cal/{store_id}

This scraper uses Playwright for JavaScript rendering since the calendar
loads content dynamically.
"""

import asyncio
import re
from typing import List, Optional
from datetime import datetime
from playwright.async_api import async_playwright, Page, TimeoutError as PlaywrightTimeout

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base import BaseScraper, Show, ShowDates, ScraperResult
from utils import parse_date, parse_date_range, clean_text, normalize_url


class OvationTixScraper(BaseScraper):
    """Scraper for OvationTix-based theater websites"""

    def __init__(
        self,
        theater_name: str,
        base_url: str,
        store_id: str,
        **kwargs
    ):
        """
        Initialize OvationTix scraper.

        Args:
            theater_name: Name of the theater
            base_url: Base URL (e.g., "https://web.ovationtix.com/trs/store/14")
            store_id: OvationTix store ID
        """
        super().__init__(theater_name, base_url, **kwargs)
        self.store_id = store_id
        self.calendar_url = f"https://web.ovationtix.com/trs/cal/{store_id}"

    async def _extract_event_from_row(self, row, page: Page) -> Optional[Show]:
        """
        Extract show information from a table row.

        Args:
            row: Playwright element locator for the table row
            page: Playwright page object

        Returns:
            Show object or None if extraction fails
        """
        try:
            # Extract data from table columns
            cells = await row.locator('td').all()
            if len(cells) < 5:
                return None

            # Column order: Date(s), Supertitle, Title, Subtitle, Venue
            dates_text = await cells[0].inner_text()
            supertitle_text = await cells[1].inner_text()
            title_text = await cells[2].inner_text()
            subtitle_text = await cells[3].inner_text()
            venue_text = await cells[4].inner_text()

            # Clean text
            dates_text = clean_text(dates_text.strip())
            supertitle = clean_text(supertitle_text.strip()) if supertitle_text.strip() else None
            title = clean_text(title_text.strip())
            subtitle = clean_text(subtitle_text.strip()) if subtitle_text.strip() else None
            venue = clean_text(venue_text.strip()) if venue_text.strip() else None

            # Combine supertitle, title, and subtitle for full show title
            title_parts = [p for p in [supertitle, title, subtitle] if p]
            full_title = " - ".join(title_parts) if len(title_parts) > 1 else title

            if not full_title:
                return None

            # Parse dates
            start_date, end_date = parse_date_range(dates_text)

            # Try to get link to event page
            ticket_url = None
            try:
                link = await cells[2].locator('a').first.get_attribute('href')
                if link:
                    ticket_url = normalize_url(link, "https://web.ovationtix.com")
            except:
                pass

            # Check for sold out or canceled status
            status_text = await row.inner_text()
            is_sold_out = 'sold out' in status_text.lower()
            is_canceled = 'canceled' in status_text.lower()

            # Create Show object
            show = Show(
                theater_name=self.theater_name,
                theater_url=self.base_url,
                show_title=full_title,
                dates=ShowDates(
                    start=start_date,
                    end=end_date,
                    schedule=dates_text
                ),
                venue=venue,
                ticket_url=ticket_url,
                scraper_type="ovationtix"
            )

            # Set status if sold out or canceled
            if is_canceled:
                from base.data_schema import ShowStatus
                show.status = ShowStatus.CANCELED
            elif is_sold_out:
                # Still mark as running/upcoming, just note it's sold out
                pass

            return show

        except Exception as e:
            self.logger.warning(f"Error extracting event from row: {str(e)}")
            return None

    async def _scrape_calendar_async(self) -> List[Show]:
        """
        Scrape the OvationTix calendar using Playwright.

        Returns:
            List of Show objects
        """
        shows = []

        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)

            try:
                page = await browser.new_page()

                # Set user agent
                await page.set_extra_http_headers({
                    'User-Agent': self._get_default_headers()['User-Agent']
                })

                self.logger.info(f"Loading calendar: {self.calendar_url}")

                # Navigate to calendar
                await page.goto(self.calendar_url, wait_until='networkidle', timeout=30000)

                # Wait for the table to load
                try:
                    await page.wait_for_selector('table tbody tr', timeout=10000)
                except PlaywrightTimeout:
                    self.logger.warning("Calendar table not found - might be empty or structure changed")
                    return shows

                # Get all event rows (skip header row)
                rows = await page.locator('table tbody tr').all()

                self.logger.info(f"Found {len(rows)} potential events")

                # Extract shows from each row
                for row in rows:
                    show = await self._extract_event_from_row(row, page)
                    if show:
                        shows.append(show)
                        self.logger.debug(f"Extracted: {show.show_title}")

            finally:
                await browser.close()

        return shows

    def scrape(self) -> ScraperResult:
        """
        Scrape shows from OvationTix calendar.

        Returns:
            ScraperResult with shows and metadata
        """
        try:
            # Run async scraper
            shows = asyncio.run(self._scrape_calendar_async())

            return ScraperResult(
                theater_name=self.theater_name,
                success=True,
                shows=shows
            )

        except Exception as e:
            self.logger.exception(f"Error scraping {self.theater_name}")
            return ScraperResult(
                theater_name=self.theater_name,
                success=False,
                error=str(e)
            )


def main():
    """Test the OvationTix scraper with The Flea Theater"""
    import logging

    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test with The Flea Theater
    scraper = OvationTixScraper(
        theater_name="The Flea Theater",
        base_url="https://web.ovationtix.com/trs/store/14",
        store_id="14"
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
            if show.ticket_url:
                print(f"   Tickets: {show.ticket_url}")

    if result.warnings:
        print(f"\nWarnings:")
        for warning in result.warnings:
            print(f"  - {warning}")

    # Print JSON output
    print(f"\n{'='*60}")
    print("JSON Output:")
    print(f"{'='*60}")
    import json
    print(json.dumps(result.to_dict(), indent=2))


if __name__ == "__main__":
    main()

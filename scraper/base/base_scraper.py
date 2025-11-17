"""
Base scraper class that all theater scrapers inherit from.
Provides common functionality for HTTP requests, error handling, and data validation.
"""

import requests
import logging
import time
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from .data_schema import Show, ScraperResult


class BaseScraper(ABC):
    """Abstract base class for all theater scrapers"""

    def __init__(
        self,
        theater_name: str,
        base_url: str,
        timeout: int = 30,
        retry_count: int = 3,
        retry_delay: int = 2
    ):
        """
        Initialize the base scraper.

        Args:
            theater_name: Name of the theater
            base_url: Base URL of the theater website
            timeout: Request timeout in seconds
            retry_count: Number of retries for failed requests
            retry_delay: Delay between retries in seconds
        """
        self.theater_name = theater_name
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.retry_count = retry_count
        self.retry_delay = retry_delay

        # Set up logging
        self.logger = logging.getLogger(f"{__name__}.{theater_name}")

        # Session for connection pooling
        self.session = requests.Session()
        self.session.headers.update(self._get_default_headers())

    def _get_default_headers(self) -> Dict[str, str]:
        """Get default headers for requests"""
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def fetch_page(self, url: str, method: str = 'GET', **kwargs) -> Optional[requests.Response]:
        """
        Fetch a page with retry logic and error handling.

        Args:
            url: URL to fetch
            method: HTTP method (GET, POST, etc.)
            **kwargs: Additional arguments to pass to requests

        Returns:
            Response object or None if all retries failed
        """
        full_url = url if url.startswith('http') else f"{self.base_url}/{url.lstrip('/')}"

        for attempt in range(self.retry_count):
            try:
                self.logger.debug(f"Fetching {full_url} (attempt {attempt + 1}/{self.retry_count})")

                response = self.session.request(
                    method=method,
                    url=full_url,
                    timeout=self.timeout,
                    **kwargs
                )
                response.raise_for_status()

                # Rate limiting - be respectful
                time.sleep(1)

                return response

            except requests.exceptions.SSLError as e:
                self.logger.warning(f"SSL error on attempt {attempt + 1}: {str(e)}")
                if attempt < self.retry_count - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                else:
                    self.logger.error(f"SSL error after {self.retry_count} attempts: {str(e)}")

            except requests.exceptions.HTTPError as e:
                self.logger.error(f"HTTP error: {e.response.status_code} - {str(e)}")
                if e.response.status_code in [403, 404]:
                    # Don't retry on client errors
                    break
                if attempt < self.retry_count - 1:
                    time.sleep(self.retry_delay * (attempt + 1))

            except requests.exceptions.Timeout as e:
                self.logger.warning(f"Timeout on attempt {attempt + 1}: {str(e)}")
                if attempt < self.retry_count - 1:
                    time.sleep(self.retry_delay * (attempt + 1))

            except requests.exceptions.RequestException as e:
                self.logger.error(f"Request error: {str(e)}")
                if attempt < self.retry_count - 1:
                    time.sleep(self.retry_delay * (attempt + 1))

        return None

    def validate_show(self, show: Show) -> List[str]:
        """
        Validate a Show object and return list of warnings.

        Args:
            show: Show object to validate

        Returns:
            List of warning messages
        """
        warnings = []

        if not show.show_title or len(show.show_title.strip()) < 2:
            warnings.append(f"Suspiciously short show title: '{show.show_title}'")

        if show.ticket_url and not show.ticket_url.startswith('http'):
            warnings.append(f"Invalid ticket URL: {show.ticket_url}")

        if show.dates:
            if show.dates.start:
                try:
                    datetime.fromisoformat(show.dates.start)
                except ValueError:
                    warnings.append(f"Invalid start date format: {show.dates.start}")

            if show.dates.end:
                try:
                    datetime.fromisoformat(show.dates.end)
                except ValueError:
                    warnings.append(f"Invalid end date format: {show.dates.end}")

        return warnings

    @abstractmethod
    def scrape(self) -> ScraperResult:
        """
        Main scraping method to be implemented by subclasses.

        Returns:
            ScraperResult with shows and metadata
        """
        pass

    def run(self) -> ScraperResult:
        """
        Run the scraper with error handling.

        Returns:
            ScraperResult with shows and metadata
        """
        try:
            self.logger.info(f"Starting scrape for {self.theater_name}")
            result = self.scrape()

            # Validate all shows
            for show in result.shows:
                warnings = self.validate_show(show)
                result.warnings.extend(warnings)

            self.logger.info(
                f"Scrape complete for {self.theater_name}: "
                f"{len(result.shows)} shows, "
                f"{len(result.warnings)} warnings"
            )

            return result

        except Exception as e:
            self.logger.exception(f"Unexpected error scraping {self.theater_name}")
            return ScraperResult(
                theater_name=self.theater_name,
                success=False,
                error=str(e)
            )

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - close session"""
        self.session.close()

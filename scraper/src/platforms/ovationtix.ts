/**
 * OvationTix Platform Scraper
 *
 * OvationTix is a ticketing platform used by multiple theaters.
 * URL pattern: web.ovationtix.com/trs/store/{store_id}
 * Calendar: web.ovationtix.com/trs/cal/{store_id}
 *
 * This scraper uses Playwright for JavaScript rendering since the calendar
 * loads content dynamically.
 */

import { chromium, Page } from 'playwright';
import { BaseScraper } from '../base/base-scraper';
import { Show, ShowDates, ShowStatus } from '../base/data-schema';
import { parseDateRange, cleanText } from '../utils/parsing';

export interface OvationTixConfig {
  theaterName: string;
  baseUrl: string;
  storeId: string;
  timeout?: number;
  retryCount?: number;
}

export class OvationTixScraper extends BaseScraper {
  private storeId: string;
  private calendarUrl: string;

  constructor(config: OvationTixConfig) {
    super({
      theaterName: config.theaterName,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retryCount: config.retryCount,
    });

    this.storeId = config.storeId;
    this.calendarUrl = `https://web.ovationtix.com/trs/cal/${this.storeId}`;
  }

  /**
   * Extract show information from a table row
   */
  private async extractEventFromRow(row: any, page: Page): Promise<Show | null> {
    try {
      // Extract data from table columns
      const cells = await row.locator('td').all();
      if (cells.length < 5) {
        return null;
      }

      // Column order: Date(s), Supertitle, Title, Subtitle, Venue
      const datesText = await cells[0].innerText();
      const supertitleText = await cells[1].innerText();
      const titleText = await cells[2].innerText();
      const subtitleText = await cells[3].innerText();
      const venueText = await cells[4].innerText();

      // Clean text
      const dates = cleanText(datesText.trim());
      const supertitle = cleanText(supertitleText.trim()) || null;
      const title = cleanText(titleText.trim());
      const subtitle = cleanText(subtitleText.trim()) || null;
      const venue = cleanText(venueText.trim()) || null;

      // Combine supertitle, title, and subtitle for full show title
      const titleParts = [supertitle, title, subtitle].filter(
        (p) => p !== null && p !== ''
      );
      const fullTitle = titleParts.length > 1 ? titleParts.join(' - ') : title;

      if (!fullTitle) {
        return null;
      }

      // Parse dates
      const [startDate, endDate] = parseDateRange(dates);

      // Try to get link to event page
      let ticketUrl: string | undefined = undefined;
      try {
        const link = await cells[2].locator('a').first().getAttribute('href');
        if (link) {
          ticketUrl = this.normalizeUrl(link);
        }
      } catch {
        // No link found
      }

      // Check for sold out or canceled status
      const statusText = await row.innerText();
      const isCanceled = statusText.toLowerCase().includes('canceled');

      // Create Show object
      const show: Show = {
        theaterName: this.theaterName,
        theaterUrl: this.baseUrl,
        showTitle: fullTitle,
        dates: {
          start: startDate || undefined,
          end: endDate || undefined,
          schedule: dates,
        },
        venue: venue || undefined,
        ticketUrl,
        status: isCanceled ? ShowStatus.CANCELED : undefined,
        scraperType: 'ovationtix',
        scrapedAt: new Date(),
      };

      return show;
    } catch (error: any) {
      console.warn(`Error extracting event from row: ${error.message}`);
      return null;
    }
  }

  /**
   * Scrape the OvationTix calendar using Playwright
   */
  private async scrapeCalendarAsync(): Promise<Show[]> {
    const shows: Show[] = [];

    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();

      // Set user agent
      await page.setExtraHTTPHeaders({
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      console.log(`Loading calendar: ${this.calendarUrl}`);

      // Navigate to calendar
      await page.goto(this.calendarUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for the table to load
      try {
        await page.waitForSelector('table tbody tr', { timeout: 10000 });
      } catch (error) {
        console.warn('Calendar table not found - might be empty or structure changed');
        return shows;
      }

      // Get all event rows (skip header row)
      const rows = await page.locator('table tbody tr').all();

      console.log(`Found ${rows.length} potential events`);

      // Extract shows from each row
      for (const row of rows) {
        const show = await this.extractEventFromRow(row, page);
        if (show) {
          shows.push(show);
          console.log(`Extracted: ${show.showTitle}`);
        }
      }
    } finally {
      await browser.close();
    }

    return shows;
  }

  /**
   * Scrape shows from OvationTix calendar
   */
  protected async scrape(): Promise<Show[]> {
    const shows = await this.scrapeCalendarAsync();
    return shows;
  }
}

/**
 * Test the OvationTix scraper with The Flea Theater
 */
async function main() {
  const scraper = new OvationTixScraper({
    theaterName: 'The Flea Theater',
    baseUrl: 'https://web.ovationtix.com/trs/store/14',
    storeId: '14',
  });

  console.log(`Scraping ${scraper['theaterName']}...`);
  const result = await scraper.run();

  console.log('\nResults:');
  console.log(`Success: ${result.success}`);
  console.log(`Shows found: ${result.shows.length}`);

  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.length}`);
    result.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (result.shows.length > 0) {
    console.log('\nShows:');
    result.shows.forEach((show, i) => {
      console.log(`\n${i + 1}. ${show.showTitle}`);
      if (show.dates?.start) {
        console.log(`   Dates: ${show.dates.start} to ${show.dates.end || 'TBD'}`);
      }
      if (show.venue) {
        console.log(`   Venue: ${show.venue}`);
      }
      if (show.ticketUrl) {
        console.log(`   Tickets: ${show.ticketUrl}`);
      }
    });

    // Print JSON output
    console.log('\n' + '='.repeat(60));
    console.log('JSON Output:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error running scraper:', error);
    process.exit(1);
  });
}

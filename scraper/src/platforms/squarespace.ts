/**
 * Squarespace Platform Scraper
 *
 * Squarespace is a website builder used by many theaters.
 * Events are typically displayed using their built-in calendar/events collection system.
 *
 * This scraper parses the HTML structure of Squarespace event pages.
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from '../base/base-scraper';
import { Show, ShowDates } from '../base/data-schema';
import { parseDate, cleanText } from '../utils/parsing';

export interface SquarespaceConfig {
  theaterName: string;
  baseUrl: string;
  calendarPath?: string;
  timeout?: number;
  retryCount?: number;
}

export class SquarespaceScraper extends BaseScraper {
  private calendarPath: string;
  private calendarUrl: string;

  constructor(config: SquarespaceConfig) {
    super({
      theaterName: config.theaterName,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retryCount: config.retryCount,
    });

    this.calendarPath = config.calendarPath || '/calendar';
    this.calendarUrl = `${this.baseUrl}${this.calendarPath}`;
  }

  /**
   * Parse a Squarespace event item element into a Show
   */
  private parseEventItem($: cheerio.CheerioAPI, eventElem: cheerio.Element): Show | null {
    try {
      const $event = $(eventElem);

      // Extract title and link
      const titleElem = $event.find('h1.eventlist-title, h2.eventlist-title').first();
      if (titleElem.length === 0) {
        return null;
      }

      const titleLink = titleElem.find('a.eventlist-title-link');
      if (titleLink.length === 0) {
        return null;
      }

      const title = cleanText(titleLink.text());
      if (!title) {
        return null;
      }

      let detailUrl = titleLink.attr('href') || '';
      if (detailUrl) {
        detailUrl = this.normalizeUrl(detailUrl);
      }

      // Extract date and time
      let startDate: string | null = null;
      let endDate: string | null = null;
      let timeStr: string | null = null;

      // Look for date in time elements
      const dateElem = $event.find('time.event-date').first();
      if (dateElem.length > 0) {
        const datetimeAttr = dateElem.attr('datetime');
        if (datetimeAttr) {
          startDate = parseDate(datetimeAttr);
        }
      }

      // Look for time
      const time12hr = $event.find('time.event-time-12hr').first();
      if (time12hr.length > 0) {
        timeStr = cleanText(time12hr.text());
      }

      // Look for end date if it exists
      const endDateElem = $event.find('time.event-date-end').first();
      if (endDateElem.length > 0) {
        const endDatetimeAttr = endDateElem.attr('datetime');
        if (endDatetimeAttr) {
          endDate = parseDate(endDatetimeAttr);
        }
      }

      // Extract venue/location
      let venue: string | null = null;
      const locationElem = $event
        .find('li.eventlist-meta-address, div.event-location')
        .first();
      if (locationElem.length > 0) {
        venue = cleanText(locationElem.text());
      }

      // Extract excerpt/description
      let description: string | null = null;
      const excerptElem = $event.find('div.eventlist-excerpt, p.event-excerpt').first();
      if (excerptElem.length > 0) {
        description = cleanText(excerptElem.text());
        if (description && description.length > 500) {
          description = description.substring(0, 497) + '...';
        }
      }

      // Build schedule string
      let schedule: string | null = null;
      if (timeStr) {
        if (endDate && startDate !== endDate) {
          schedule = `${timeStr} (${startDate} to ${endDate})`;
        } else {
          schedule = timeStr;
        }
      }

      // Create Show object
      const show: Show = {
        theaterName: this.theaterName,
        theaterUrl: this.baseUrl,
        showTitle: title,
        dates: startDate
          ? {
              start: startDate,
              end: endDate || undefined,
              schedule: schedule || undefined,
            }
          : undefined,
        venue: venue || undefined,
        description: description || undefined,
        ticketUrl: detailUrl || undefined,
        scraperType: 'squarespace',
        scrapedAt: new Date(),
      };

      return show;
    } catch (error: any) {
      console.warn(`Error parsing event item: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract events from Squarespace HTML
   */
  private scrapeEventsFromHtml(htmlContent: string): Show[] {
    const shows: Show[] = [];
    const $ = cheerio.load(htmlContent);

    // Try different Squarespace event container patterns
    let eventContainers = $('div.eventlist-column-info');

    if (eventContainers.length === 0) {
      // Pattern 2: event-item
      eventContainers = $('article[class*="event-item"]');
    }

    if (eventContainers.length === 0) {
      // Pattern 3: calendar-event
      eventContainers = $('div[class*="calendar-event"]');
    }

    console.log(`Found ${eventContainers.length} potential event containers`);

    eventContainers.each((_, elem) => {
      const show = this.parseEventItem($, elem);
      if (show) {
        shows.push(show);
        console.log(`Parsed: ${show.showTitle}`);
      }
    });

    return shows;
  }

  /**
   * Scrape shows from Squarespace calendar page
   */
  protected async scrape(): Promise<Show[]> {
    console.log(`Fetching calendar: ${this.calendarUrl}`);
    const response = await this.fetchPage(this.calendarUrl);

    if (!response || !response.data) {
      throw new Error(`Failed to fetch calendar page: ${this.calendarUrl}`);
    }

    // Parse events from HTML
    const shows = this.scrapeEventsFromHtml(response.data);

    if (shows.length === 0) {
      console.warn('Calendar page loaded but no events were parsed');
    }

    return shows;
  }
}

/**
 * Test the Squarespace scraper with The Tank
 */
async function main() {
  const scraper = new SquarespaceScraper({
    theaterName: 'The Tank',
    baseUrl: 'https://thetanknyc.org',
    calendarPath: '/calendar-1',
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
    console.log('\nFirst 10 shows:');
    result.shows.slice(0, 10).forEach((show, i) => {
      console.log(`\n${i + 1}. ${show.showTitle}`);
      if (show.dates?.start) {
        const scheduleInfo = show.dates.schedule ? ` at ${show.dates.schedule}` : '';
        console.log(`   Date: ${show.dates.start}${scheduleInfo}`);
      }
      if (show.venue) {
        console.log(`   Venue: ${show.venue}`);
      }
      if (show.description) {
        const desc =
          show.description.length > 80
            ? show.description.substring(0, 80) + '...'
            : show.description;
        console.log(`   Description: ${desc}`);
      }
      if (show.ticketUrl) {
        console.log(`   Details: ${show.ticketUrl}`);
      }
    });

    // Print JSON output for first show
    console.log('\n' + '='.repeat(60));
    console.log('JSON Output (first show):');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result.shows[0], null, 2));
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error running scraper:', error);
    process.exit(1);
  });
}

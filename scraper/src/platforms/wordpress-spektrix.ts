/**
 * WordPress + Spektrix Platform Scraper
 *
 * Spektrix is a ticketing system that integrates with WordPress.
 * Theaters using this typically expose a REST API at:
 * /wp-json/spektrix/v1/events or similar
 *
 * This scraper works for WordPress sites with Spektrix integration.
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from '../base/base-scraper';
import { Show, ShowDates, ShowStatus } from '../base/data-schema';
import { parseDate, cleanText, extractPriceRange, extractJsArray } from '../utils/parsing';

export interface WordPressSpektrixConfig {
  theaterName: string;
  baseUrl: string;
  apiEndpoint?: string;
  timeout?: number;
  retryCount?: number;
}

interface SpektrixEvent {
  title?: string;
  name?: string;
  start?: string;
  start_date?: string;
  firstPerformance?: string;
  end?: string;
  end_date?: string;
  lastPerformance?: string;
  description?: string;
  synopsis?: string;
  url?: string;
  link?: string;
  instance_id?: string;
  instanceId?: string;
  venue?: string;
  location?: string;
  image?: string;
  imageUrl?: string;
  playwright?: string;
  writer?: string;
  director?: string;
  price?: string | number;
  pricing?: string | number;
  status?: string;
  className?: string;
}

export class WordPressSpektrixScraper extends BaseScraper {
  private apiEndpoint: string;

  constructor(config: WordPressSpektrixConfig) {
    super({
      theaterName: config.theaterName,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retryCount: config.retryCount,
    });

    this.apiEndpoint = config.apiEndpoint || `${this.baseUrl}/wp-json/spektrix/v1`;
  }

  /**
   * Parse a Spektrix event object into a Show
   */
  private parseSpektrixEvent(eventData: SpektrixEvent): Show | null {
    try {
      // Extract title
      const title = eventData.title || eventData.name || '';
      if (!title) {
        return null;
      }

      const cleanedTitle = cleanText(title);

      // Extract dates
      let startDate: string | null = null;
      let endDate: string | null = null;

      // Try different date field formats
      if (eventData.start) {
        startDate = parseDate(eventData.start);
      } else if (eventData.start_date) {
        startDate = parseDate(eventData.start_date);
      } else if (eventData.firstPerformance) {
        startDate = parseDate(eventData.firstPerformance);
      }

      if (eventData.end) {
        endDate = parseDate(eventData.end);
      } else if (eventData.end_date) {
        endDate = parseDate(eventData.end_date);
      } else if (eventData.lastPerformance) {
        endDate = parseDate(eventData.lastPerformance);
      }

      // Extract description
      let description = eventData.description || eventData.synopsis || '';
      if (description) {
        description = cleanText(description);
        // Limit description length
        if (description.length > 500) {
          description = description.substring(0, 497) + '...';
        }
      }

      // Extract URL
      let ticketUrl = eventData.url || eventData.link || '';
      if (ticketUrl) {
        ticketUrl = this.normalizeUrl(ticketUrl);
      }

      // Extract instance ID for ticket URL construction
      const instanceId = eventData.instance_id || eventData.instanceId || '';
      if (instanceId && !ticketUrl) {
        ticketUrl = `${this.baseUrl}/performances/?instanceId=${instanceId}`;
      }

      // Extract venue
      let venue = eventData.venue || eventData.location || '';
      if (venue) {
        venue = cleanText(venue);
      }

      // Extract image
      let imageUrl = eventData.image || eventData.imageUrl || '';
      if (imageUrl) {
        imageUrl = this.normalizeUrl(imageUrl);
      }

      // Extract playwright/director
      let playwright = eventData.playwright || eventData.writer || '';
      if (playwright) {
        playwright = cleanText(playwright);
      }

      let director = eventData.director || '';
      if (director) {
        director = cleanText(director);
      }

      // Extract price
      let priceRange: string | null = null;
      if (eventData.price) {
        priceRange = extractPriceRange(String(eventData.price));
      } else if (eventData.pricing) {
        priceRange = extractPriceRange(String(eventData.pricing));
      }

      // Determine status
      let status = ShowStatus.UPCOMING;
      if (eventData.status) {
        const statusStr = eventData.status.toLowerCase();
        if (statusStr.includes('cancel')) {
          status = ShowStatus.CANCELED;
        } else if (statusStr.includes('closed') || statusStr.includes('past')) {
          status = ShowStatus.CLOSED;
        }
      }

      // Check className for status
      if (eventData.className) {
        const className = eventData.className.toLowerCase();
        if (className.includes('main-stage') || className.includes('perfs')) {
          status = ShowStatus.RUNNING;
        }
      }

      // Create Show object
      const show: Show = {
        theaterName: this.theaterName,
        theaterUrl: this.baseUrl,
        showTitle: cleanedTitle,
        playwright: playwright || undefined,
        director: director || undefined,
        dates:
          startDate || endDate
            ? {
                start: startDate || undefined,
                end: endDate || undefined,
              }
            : undefined,
        venue: venue || undefined,
        description: description || undefined,
        ticketUrl: ticketUrl || undefined,
        priceRange: priceRange || undefined,
        imageUrl: imageUrl || undefined,
        status,
        scraperType: 'wordpress_spektrix',
        scrapedAt: new Date(),
      };

      return show;
    } catch (error: any) {
      console.warn(`Error parsing Spektrix event: ${error.message}`);
      return null;
    }
  }

  /**
   * Scrape events from Spektrix REST API
   */
  private async scrapeFromApi(): Promise<Show[]> {
    const shows: Show[] = [];

    // Try different API endpoints
    const endpoints = [
      `${this.apiEndpoint}/events`,
      `${this.apiEndpoint}/performances`,
      `${this.apiEndpoint}/calendar`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying API endpoint: ${endpoint}`);
        const response = await this.fetchPage(endpoint);

        if (response && response.status === 200) {
          try {
            const data = response.data;

            // Handle different response formats
            let events: SpektrixEvent[] = [];
            if (Array.isArray(data)) {
              events = data;
            } else if (typeof data === 'object' && data !== null) {
              // Try different keys
              events =
                data.events || data.performances || data.data || [];
            }

            console.log(`Found ${events.length} events from API`);

            for (const eventData of events) {
              const show = this.parseSpektrixEvent(eventData);
              if (show) {
                shows.push(show);
              }
            }

            // If we found shows, we're done
            if (shows.length > 0) {
              return shows;
            }
          } catch (error: any) {
            console.warn(`Invalid JSON from ${endpoint}: ${error.message}`);
            continue;
          }
        }
      } catch (error: any) {
        console.debug(`Error with endpoint ${endpoint}: ${error.message}`);
        continue;
      }
    }

    return shows;
  }

  /**
   * Scrape events from embedded JavaScript data in the HTML page
   */
  private async scrapeFromPage(): Promise<Show[]> {
    const shows: Show[] = [];

    try {
      const response = await this.fetchPage(this.baseUrl);
      if (!response) {
        return shows;
      }

      const htmlText = response.data;

      // Try to extract events array using different variable keywords
      const varKeywords = ['var events', 'const events', 'let events'];

      for (const varKeyword of varKeywords) {
        const eventsArray = extractJsArray(htmlText, varKeyword);

        if (eventsArray && Array.isArray(eventsArray)) {
          console.log(
            `Found ${eventsArray.length} events in page using '${varKeyword}'`
          );

          for (const eventData of eventsArray) {
            const show = this.parseSpektrixEvent(eventData);
            if (show) {
              shows.push(show);
            }
          }

          if (shows.length > 0) {
            return shows;
          }
        }
      }
    } catch (error: any) {
      console.warn(`Error scraping from page: ${error.message}`);
    }

    return shows;
  }

  /**
   * Scrape shows from WordPress + Spektrix site
   */
  protected async scrape(): Promise<Show[]> {
    let shows: Show[] = [];

    // Try API first (more reliable)
    console.log('Attempting to scrape from API...');
    shows = await this.scrapeFromApi();

    // Fall back to page scraping if API doesn't work
    if (shows.length === 0) {
      console.log('API scraping failed, trying page scraping...');
      shows = await this.scrapeFromPage();
    }

    if (shows.length === 0) {
      throw new Error('No shows found via API or page scraping');
    }

    return shows;
  }
}

/**
 * Test the WordPress + Spektrix scraper with NYTW
 */
async function main() {
  const scraper = new WordPressSpektrixScraper({
    theaterName: 'New York Theatre Workshop',
    baseUrl: 'https://www.nytw.org',
    apiEndpoint: 'https://www.nytw.org/wp-json/spektrix/v1',
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
      if (show.description) {
        const desc =
          show.description.length > 100
            ? show.description.substring(0, 100) + '...'
            : show.description;
        console.log(`   Description: ${desc}`);
      }
      if (show.ticketUrl) {
        console.log(`   Tickets: ${show.ticketUrl}`);
      }
    });

    // Print JSON output
    console.log('\n' + '='.repeat(60));
    console.log('JSON Output (first show only):');
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

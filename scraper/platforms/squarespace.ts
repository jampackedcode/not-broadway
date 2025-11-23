import { BasePlatformScraper, PlatformConfig } from './base';
import { ScraperResult, ShowScraperResult, Show, ShowStatus } from '../../types/scraper';

export interface SquarespaceConfig extends PlatformConfig {
    calendarPath?: string;
}

export class SquarespaceScraper extends BasePlatformScraper {
    readonly config: SquarespaceConfig;

    constructor(config: SquarespaceConfig) {
        super();
        this.config = config;
    }

    async scrapeShows(theaterId: string, theaterUrl?: string): Promise<ScraperResult<ShowScraperResult>> {
        const calendarPath = this.config.calendarPath || '/calendar';
        const baseUrl = theaterUrl?.replace(/\/$/, '') || '';
        const calendarUrl = `${baseUrl}${calendarPath}`;
        const shows: Show[] = [];
        const warnings: string[] = [];

        try {
            console.log(`[Squarespace] Fetching calendar: ${calendarUrl}`);
            const $ = await this.fetchHtml(calendarUrl);

            // Try different Squarespace event container patterns
            let eventContainers = $('.eventlist-column-info');
            if (eventContainers.length === 0) {
                eventContainers = $('article.event-item');
            }
            if (eventContainers.length === 0) {
                eventContainers = $('.calendar-event');
            }

            console.log(`[Squarespace] Found ${eventContainers.length} potential event containers`);

            eventContainers.each((_, element) => {
                const container = $(element);

                // Extract title
                let title = container.find('.eventlist-title .eventlist-title-link').text().trim();
                if (!title) {
                    title = container.find('.event-title').text().trim();
                }

                // Extract link
                let link = container.find('.eventlist-title .eventlist-title-link').attr('href');
                if (!link) {
                    link = container.find('a.event-title-link').attr('href');
                }

                if (link && !link.startsWith('http')) {
                    link = `${baseUrl}${link}`;
                }

                if (!title) return;

                // Extract dates
                let start: string | undefined;
                let end: string | undefined;

                const dateElem = container.find('time.event-date');
                const datetimeAttr = dateElem.attr('datetime');
                if (datetimeAttr) {
                    start = new Date(datetimeAttr).toISOString();
                }

                const endDateElem = container.find('time.event-date-end');
                const endDatetimeAttr = endDateElem.attr('datetime');
                if (endDatetimeAttr) {
                    end = new Date(endDatetimeAttr).toISOString();
                }

                // Fallback if no end date
                if (start && !end) {
                    end = start;
                }

                // Extract description
                let description = container.find('.eventlist-excerpt').text().trim();
                if (!description) {
                    description = container.find('.event-excerpt').text().trim();
                }

                // Extract venue
                let venue = container.find('.eventlist-meta-address').text().trim();
                if (!venue) {
                    venue = container.find('.event-location').text().trim();
                }

                shows.push({
                    id: `${this.config.name.replace(/\s+/g, '-').toLowerCase()}-${title.replace(/\s+/g, '-').toLowerCase()}`,
                    title,
                    theaterId,
                    theaterName: this.config.name,
                    description,
                    startDate: start || new Date().toISOString(),
                    endDate: end || new Date().toISOString(),
                    genre: 'other',
                    website: link || calendarUrl,
                    status: ShowStatus.UPCOMING,
                });
            });

            return {
                success: true,
                data: { shows, totalFound: shows.length },
                source: this.config.platformName,
                scrapedAt: new Date(),
                log: [`Found ${shows.length} shows`],
                warnings
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                source: this.config.platformName,
                scrapedAt: new Date(),
                log: ['Error scraping Squarespace'],
            };
        }
    }
}

import { BasePlatformScraper, PlatformConfig } from './base';
import { ScraperResult, ShowScraperResult, Show, ShowStatus } from '../../types/scraper';
import * as cheerio from 'cheerio';

export interface WordPressConfig extends PlatformConfig {
    apiEndpoint?: string;
}

export class WordPressScraper extends BasePlatformScraper {
    readonly config: WordPressConfig;

    constructor(config: WordPressConfig) {
        super();
        this.config = config;
    }

    async scrapeShows(theaterId: string, theaterUrl?: string): Promise<ScraperResult<ShowScraperResult>> {
        const baseUrl = theaterUrl?.replace(/\/$/, '') || '';
        const apiEndpoint = this.config.apiEndpoint || `${baseUrl}/wp-json/spektrix/v1`;
        let shows: Show[] = [];
        const warnings: string[] = [];

        try {
            // Try API first
            console.log(`[WordPress] Attempting API scrape: ${apiEndpoint}`);
            try {
                const events = await this.fetchJson<any[]>(`${apiEndpoint}/events`);
                if (Array.isArray(events) && events.length > 0) {
                    console.log(`[WordPress] Found ${events.length} events via API`);
                    shows = events.map(event => this.parseSpektrixEvent(event, theaterId, baseUrl)).filter((s): s is Show => s !== null);
                }
            } catch (e) {
                console.log(`[WordPress] API scrape failed, trying HTML fallback: ${e}`);
            }

            // Fallback to HTML scraping if API failed or returned no events
            if (shows.length === 0) {
                console.log(`[WordPress] Attempting HTML scrape: ${baseUrl}`);
                const $ = await this.fetchHtml(baseUrl);

                // Look for embedded JSON in script tags (common in WP sites)
                $('script').each((_, script) => {
                    const content = $(script).html() || '';
                    // Look for "var events = [...]" or similar
                    const match = content.match(/(?:var|const|let)\s+events\s*=\s*(\[[\s\S]*?\]);/);
                    if (match) {
                        try {
                            const jsonStr = match[1].replace(/'/g, '"'); // Simple cleanup, might need more robust parsing
                            const events = JSON.parse(jsonStr);
                            if (Array.isArray(events)) {
                                console.log(`[WordPress] Found ${events.length} events via embedded JSON`);
                                const newShows = events.map(event => this.parseSpektrixEvent(event, theaterId, baseUrl)).filter((s): s is Show => s !== null);
                                shows.push(...newShows);
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                });
            }

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
                log: ['Error scraping WordPress'],
            };
        }
    }

    private parseSpektrixEvent(event: any, theaterId: string, baseUrl: string): Show | null {
        try {
            const title = event.title || event.name;
            if (!title) return null;

            let start = event.start || event.start_date || event.firstPerformance;
            let end = event.end || event.end_date || event.lastPerformance;

            // Ensure dates are ISO strings
            if (start) start = new Date(start).toISOString();
            if (end) end = new Date(end).toISOString();
            if (start && !end) end = start;

            let ticketUrl = event.url || event.link;
            if (ticketUrl && !ticketUrl.startsWith('http')) {
                ticketUrl = `${baseUrl}${ticketUrl}`;
            }

            // If no URL but instance ID, construct it
            if (!ticketUrl && (event.instance_id || event.instanceId)) {
                ticketUrl = `${baseUrl}/performances/?instanceId=${event.instance_id || event.instanceId}`;
            }

            const description = event.description || event.synopsis || '';
            const venue = event.venue || event.location || '';
            const image = event.image || event.imageUrl;

            let status = ShowStatus.UPCOMING;
            const statusStr = (event.status || '').toLowerCase();
            if (statusStr.includes('cancel')) status = ShowStatus.CANCELED;
            else if (statusStr.includes('closed') || statusStr.includes('past')) status = ShowStatus.CLOSED;

            return {
                id: `${this.config.name.replace(/\s+/g, '-').toLowerCase()}-${title.replace(/\s+/g, '-').toLowerCase()}`,
                title,
                theaterId,
                theaterName: this.config.name,
                description,
                startDate: start || new Date().toISOString(),
                endDate: end || new Date().toISOString(),
                genre: 'other',
                website: ticketUrl || baseUrl,
                imageUrl: image,
                status,
                venue
            };
        } catch (e) {
            return null;
        }
    }
}

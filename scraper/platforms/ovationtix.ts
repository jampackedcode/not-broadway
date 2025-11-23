import { chromium } from 'playwright';
import { BasePlatformScraper, PlatformConfig } from './base';
import { ScraperResult, ShowScraperResult, Show, ShowStatus } from '../../types/scraper';
import * as cheerio from 'cheerio';

export interface OvationTixConfig extends PlatformConfig {
    storeId: string;
}

export class OvationTixScraper extends BasePlatformScraper {
    readonly config: OvationTixConfig;

    constructor(config: OvationTixConfig) {
        super();
        this.config = config;
    }

    async scrapeShows(theaterId: string, theaterUrl?: string): Promise<ScraperResult<ShowScraperResult>> {
        const calendarUrl = `https://web.ovationtix.com/trs/cal/${this.config.storeId}`;
        const shows: Show[] = [];
        const warnings: string[] = [];

        try {
            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();

            // Set user agent
            await page.setExtraHTTPHeaders({
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });

            console.log(`[OvationTix] Loading calendar: ${calendarUrl}`);
            await page.goto(calendarUrl, { waitUntil: 'networkidle', timeout: 30000 });

            // Wait for table
            try {
                await page.waitForSelector('table tbody tr', { timeout: 10000 });
            } catch (e) {
                console.warn(`[OvationTix] Calendar table not found for ${this.config.name}`);
                await browser.close();
                return {
                    success: true,
                    data: { shows: [], totalFound: 0 },
                    source: this.config.platformName,
                    scrapedAt: new Date(),
                    log: ['Calendar table not found'],
                };
            }

            // Get page content and parse with Cheerio (faster than Playwright for DOM traversal)
            const content = await page.content();
            const $ = cheerio.load(content);
            await browser.close();

            const rows = $('table tbody tr');
            console.log(`[OvationTix] Found ${rows.length} potential events`);

            rows.each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length < 5) return;

                const datesText = $(cells[0]).text().trim();
                const supertitle = $(cells[1]).text().trim();
                const title = $(cells[2]).text().trim();
                const subtitle = $(cells[3]).text().trim();
                const venue = $(cells[4]).text().trim();

                // Construct full title
                const titleParts = [supertitle, title, subtitle].filter(p => p);
                const fullTitle = titleParts.length > 1 ? titleParts.join(' - ') : title;

                if (!fullTitle) return;

                // Extract ticket URL
                let ticketUrl = $(cells[2]).find('a').first().attr('href');
                if (ticketUrl && !ticketUrl.startsWith('http')) {
                    ticketUrl = `https://web.ovationtix.com${ticketUrl}`;
                }

                // Check status
                const statusText = $(row).text().toLowerCase();
                let status = ShowStatus.UPCOMING;
                if (statusText.includes('canceled')) {
                    status = ShowStatus.CANCELED;
                } else if (statusText.includes('sold out')) {
                    // Keep as upcoming but maybe note it?
                }

                // Parse dates (simple implementation for now)
                // In a real implementation, we'd need a robust date parser like the Python one
                // For now, we'll store the raw string in schedule and try to parse start/end if possible
                const { start, end } = this.parseDateRange(datesText);

                shows.push({
                    id: `${this.config.storeId}-${fullTitle.replace(/\s+/g, '-').toLowerCase()}`, // Generate a temporary ID
                    title: fullTitle,
                    theaterId: theaterId,
                    theaterName: this.config.name,
                    description: '', // Description is usually on the detail page
                    startDate: start || new Date().toISOString(), // Fallback
                    endDate: end || new Date().toISOString(), // Fallback
                    genre: 'other', // Default
                    ticketPriceRange: undefined,
                    website: ticketUrl || theaterUrl,
                    status: status,
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
                log: ['Error scraping OvationTix'],
            };
        }
    }

    private parseDateRange(dateStr: string): { start?: string, end?: string } {
        // Basic date parsing - can be improved
        // Example: "Nov 22, 2025" or "Nov 22 - Dec 10, 2025"
        try {
            const parts = dateStr.split('-');
            if (parts.length === 1) {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return { start: date.toISOString(), end: date.toISOString() };
                }
            } else if (parts.length === 2) {
                const start = new Date(parts[0]);
                const end = new Date(parts[1]);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    return { start: start.toISOString(), end: end.toISOString() };
                }
            }
        } catch (e) {
            // Ignore parsing errors
        }
        return {};
    }
}

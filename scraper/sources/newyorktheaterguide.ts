import * as cheerio from 'cheerio';
import {
    ScraperResult,
    TheaterScraperResult,
    ShowScraperResult,
    ScraperConfig,
    Theater,
    Show,
    ShowStatus,
} from '../../types/scraper';
import { BaseScraper } from './base';

export class NewYorkTheatreGuideScraper extends BaseScraper {
    readonly config: ScraperConfig = {
        name: 'New York Theatre Guide',
        enabled: true,
        rateLimit: {
            requestsPerMinute: 60,
            delayBetweenRequests: 1000,
        },
        retryAttempts: 3,
    };

    private readonly BASE_URL = 'https://www.newyorktheatreguide.com';
    private readonly OVERVIEW_URL = `${this.BASE_URL}/info/broadway-overview`;

    async discoverTheaters(): Promise<ScraperResult<TheaterScraperResult>> {
        try {
            await this.applyRateLimit();
            console.log(`Fetching ${this.OVERVIEW_URL}...`);

            // In a real implementation, we would use a fetch wrapper that handles headers/cookies if needed
            // For now, using standard fetch
            const response = await fetch(this.OVERVIEW_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.OVERVIEW_URL}: ${response.statusText}`);
            }

            const html = await response.text();
            const $ = cheerio.load(html);
            const theaters: Theater[] = [];

            // Find the section "Which theatres are Broadway theatres?"
            // Based on inspection: a.t-link-color
            // We need to be careful to only get the theaters, so let's look for the specific header if possible,
            // or just grab all t-link-color links that look like theater links if they are grouped.
            // The inspection showed they are in a paragraph or list after the header.

            // Helper to extract theaters from a section
            const extractTheaters = (headerText: string, type: 'broadway' | 'off-broadway') => {
                // Use contains to find the header, handling potential &nbsp; or whitespace
                const header = $(`h3:contains("${headerText}")`);
                if (header.length > 0) {
                    console.log(`Found header: "${headerText}"`);

                    // Look at the next few siblings to find the list of links
                    // It might be immediate next, or next+1
                    let current = header.next();
                    let foundLinks = false;

                    // Check up to 3 siblings
                    for (let i = 0; i < 3; i++) {
                        const links = current.find('a.t-link-color');
                        if (links.length > 0) {
                            console.log(`Found ${links.length} ${type} theaters in sibling ${i + 1}`);
                            foundLinks = true;

                            links.each((_, element) => {
                                const link = $(element);
                                const name = link.text().trim();
                                const href = link.attr('href');

                                if (name && href) {
                                    const url = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
                                    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                                    // Avoid duplicates
                                    if (!theaters.find(t => t.id === id)) {
                                        theaters.push({
                                            id,
                                            name,
                                            address: 'New York, NY', // Placeholder
                                            neighborhood: '', // Placeholder
                                            type,
                                            website: url,
                                        });
                                    }
                                }
                            });
                            break; // Stop after finding the list
                        }
                        current = current.next();
                    }

                    if (!foundLinks) {
                        console.warn(`Found header "${headerText}" but no links in following siblings`);
                    }
                } else {
                    console.warn(`Could not find header "${headerText}"`);
                }
            };

            extractTheaters('Which theatres are Broadway theatres?', 'broadway');
            extractTheaters('Which theatres are Off-Broadway theatres?', 'off-broadway');

            return {
                success: true,
                source: this.config.name,
                scrapedAt: new Date(),
                data: {
                    theaters,
                    totalFound: theaters.length,
                },
            };
        } catch (error) {
            return {
                success: false,
                source: this.config.name,
                scrapedAt: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    async scrapeShows(
        theaterId: string,
        theaterUrl?: string
    ): Promise<ScraperResult<ShowScraperResult>> {
        if (!theaterUrl) {
            return {
                success: false,
                source: this.config.name,
                scrapedAt: new Date(),
                error: 'Theater URL is required for New York Theatre Guide',
            };
        }

        try {
            await this.applyRateLimit();
            const response = await fetch(theaterUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${theaterUrl}: ${response.statusText}`);
            }

            const html = await response.text();
            const $ = cheerio.load(html);
            const shows: Show[] = [];

            // Based on inspection: a[href^='/show/']
            // We want the main show link.
            // There might be multiple links to the same show.

            const showLinks = $('a[href^="/show/"]');
            const processedUrls = new Set<string>();

            showLinks.each((_, element) => {
                const link = $(element);
                const href = link.attr('href');

                if (href && !processedUrls.has(href)) {
                    processedUrls.add(href);

                    // Try to find title
                    let title = link.find('p').first().text().trim();
                    if (!title) {
                        // Try looking for title in a nested div or just the text if it's a direct link
                        // The inspection showed: a[href^='/show/'] > div > div > a > p
                        // But also a.jss965

                        // Let's look for the specific structure or fallback to text
                        title = link.text().trim();
                    }

                    // Clean up title (remove "Tickets" etc if present)
                    if (title) {
                        const url = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
                        const showId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                        // Extract dates if available (very basic parsing)
                        // The inspection showed dates might be in a sibling div
                        // For now, we'll use current date as start and a future date as end or placeholders

                        shows.push({
                            id: showId,
                            title,
                            theaterId,
                            description: '',
                            startDate: new Date().toISOString(), // Placeholder
                            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Placeholder +90 days
                            genre: 'musical', // Most Broadway shows are musicals, but this is a guess
                            status: ShowStatus.RUNNING,
                            website: url,
                        });
                    }
                }
            });

            return {
                success: true,
                source: this.config.name,
                scrapedAt: new Date(),
                data: {
                    shows,
                    totalFound: shows.length,
                },
            };
        } catch (error) {
            return {
                success: false,
                source: this.config.name,
                scrapedAt: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}

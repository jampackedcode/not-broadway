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


            // Use fetchWithCache
            const html = await this.fetchWithCache(this.OVERVIEW_URL);
            const $ = cheerio.load(html);
            const theaters: Theater[] = [];

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
                                            address: 'New York, NY', // Placeholder, will be updated
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

            // Now visit each theater page to get metadata
            console.log(`Enriching metadata for ${theaters.length} theaters...`);
            for (const theater of theaters) {
                if (theater.website) {
                    try {
                        const theaterHtml = await this.fetchWithCache(theater.website);
                        const $t = cheerio.load(theaterHtml);

                        // Try to extract from __NEXT_DATA__
                        let metadataFound = false;
                        try {
                            const nextDataScript = $t('#__NEXT_DATA__');
                            if (nextDataScript.length > 0) {
                                const json = JSON.parse(nextDataScript.html() || '{}');
                                const venue = json?.props?.pageProps?.venue;

                                if (venue) {
                                    if (venue.streetAddress1) {
                                        theater.address = `${venue.streetAddress1}, ${venue.city}, ${venue.state} ${venue.postalCode}`;
                                    }

                                    if (venue.capacity) {
                                        theater.seatingCapacity = parseInt(venue.capacity, 10);
                                    }

                                    metadataFound = true;
                                }
                            }
                        } catch (e) {
                            console.warn(`Failed to parse __NEXT_DATA__ for ${theater.name}: ${e}`);
                        }

                        if (!metadataFound) {
                            // Fallback to regex

                            // Address - Use data-test-id if available
                            const addressElement = $t('[data-test-id="venue-address"]');
                            if (addressElement.length > 0) {
                                theater.address = addressElement.text().trim();
                            } else {
                                const bodyText = $t('body').text();
                                const addressMatch = bodyText.match(/Located at ([^,.]+)/);
                                if (addressMatch && addressMatch[1]) {
                                    theater.address = `${addressMatch[1].trim()}, New York, NY`;
                                }
                            }

                            // Capacity
                            const bodyText = $t('body').text();
                            const capacityMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s+capacity/i);
                            if (capacityMatch && capacityMatch[1]) {
                                theater.seatingCapacity = parseInt(capacityMatch[1].replace(/,/g, ''), 10);
                            }
                        }

                        // Neighborhood (simple inference)
                        if (theater.address) {
                            const addr = theater.address.toLowerCase();
                            if (addr.includes('42nd') || addr.includes('43rd') || addr.includes('44th') || addr.includes('45th') || addr.includes('46th') || addr.includes('47th') || addr.includes('48th') || addr.includes('49th') || addr.includes('50th') || addr.includes('51st') || addr.includes('52nd') || addr.includes('53rd') || addr.includes('54th')) {
                                theater.neighborhood = 'Theater District';
                            } else if (addr.includes('lincoln center') || addr.includes('65th')) {
                                theater.neighborhood = 'Lincoln Square';
                            } else if (addr.includes('broadway') && !addr.includes('theater district')) {
                                // Generic fallback
                                theater.neighborhood = 'Midtown';
                            }
                        }

                    } catch (error) {
                        console.warn(`Failed to enrich metadata for ${theater.name}: ${error}`);
                    }
                }
            }

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
            // Use fetchWithCache
            const html = await this.fetchWithCache(theaterUrl);
            const $ = cheerio.load(html);
            const shows: Show[] = [];

            const showLinks = $('a[href^="/show/"]');
            const processedUrls = new Set<string>();

            showLinks.each((_, element) => {
                const link = $(element);
                const href = link.attr('href');

                if (href && !processedUrls.has(href)) {
                    processedUrls.add(href);

                    let title = link.find('p').first().text().trim();
                    if (!title) {
                        title = link.text().trim();
                    }

                    if (title) {
                        const url = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
                        const showId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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

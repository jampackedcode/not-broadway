import * as cheerio from 'cheerio';
import { IScraper, BaseScraper } from '../sources/base';
import {
    ScraperResult,
    ShowScraperResult,
    TheaterScraperResult,
    ScraperConfig,
    Theater,
} from '../../types/scraper';

export interface PlatformConfig extends ScraperConfig {
    platformName: string;
}

/**
 * Abstract base class for platform-specific scrapers (e.g. OvationTix, Squarespace)
 * These scrapers operate on a specific theater's website structure
 */
export abstract class BasePlatformScraper extends BaseScraper {
    abstract readonly config: PlatformConfig;

    /**
     * Platform scrapers usually don't discover theaters, they are assigned a theater
     * so this default implementation returns empty
     */
    async discoverTheaters(): Promise<ScraperResult<TheaterScraperResult>> {
        return {
            success: true,
            data: { theaters: [], totalFound: 0 },
            source: this.config.platformName,
            scrapedAt: new Date(),
            log: ['Platform scrapers do not discover theaters'],
        };
    }

    /**
     * Fetch a page and return a Cheerio handle
     */
    protected async fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
        await this.applyRateLimit();

        const response = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        return cheerio.load(html);
    }

    /**
     * Fetch JSON from an API endpoint
     */
    protected async fetchJson<T>(url: string): Promise<T> {
        await this.applyRateLimit();

        const response = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<T>;
    }
}

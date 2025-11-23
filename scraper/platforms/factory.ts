import { IScraper } from '../sources/base';
import { OvationTixScraper, OvationTixConfig } from './ovationtix';
import { SquarespaceScraper, SquarespaceConfig } from './squarespace';
import { WordPressScraper, WordPressConfig } from './wordpress';
import { ScraperConfig } from '../../types/scraper';

export interface TheaterConfig {
    name: string;
    url: string;
    platform: string;
    active: boolean;
    [key: string]: any;
}

export class PlatformScraperFactory {
    static createScraper(config: TheaterConfig): IScraper | null {
        if (!config.active) return null;

        const baseConfig: ScraperConfig = {
            name: config.name,
            enabled: config.active,
            platformName: config.platform,
        };

        switch (config.platform) {
            case 'ovationtix':
                return new OvationTixScraper({
                    ...baseConfig,
                    storeId: config.store_id,
                } as OvationTixConfig);

            case 'squarespace':
            case 'squarespace_salesforce': // Treat as Squarespace for now
                return new SquarespaceScraper({
                    ...baseConfig,
                    calendarPath: config.calendar_path,
                } as SquarespaceConfig);

            case 'wordpress':
            case 'wordpress_spektrix':
            case 'wordpress_salesforce':
            case 'wordpress_getcuebox':
                return new WordPressScraper({
                    ...baseConfig,
                    apiEndpoint: config.api_endpoint,
                } as WordPressConfig);

            default:
                console.warn(`Unknown platform: ${config.platform} for ${config.name}`);
                return null;
        }
    }
}

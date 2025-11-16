export type { IScraper } from './base';
export { BaseScraper } from './base';
export { NewYorkTheaterScraper } from './newyorktheater';
export { FreshGroundPepperScraper } from './freshgroundpepper';
export { ArtNewYorkScraper } from './artnewyork';

import { IScraper } from './base';
import { NewYorkTheaterScraper } from './newyorktheater';
import { FreshGroundPepperScraper } from './freshgroundpepper';
import { ArtNewYorkScraper } from './artnewyork';

/**
 * Registry of all available scrapers
 */
export const SCRAPERS: IScraper[] = [
  new NewYorkTheaterScraper(),
  new FreshGroundPepperScraper(),
  new ArtNewYorkScraper(),
];

/**
 * Get enabled scrapers
 */
export function getEnabledScrapers(): IScraper[] {
  return SCRAPERS.filter((scraper) => scraper.config.enabled);
}

/**
 * Get a scraper by name
 */
export function getScraperByName(name: string): IScraper | undefined {
  return SCRAPERS.find(
    (scraper) => scraper.config.name.toLowerCase() === name.toLowerCase()
  );
}

export { IScraper, BaseScraper } from './base';
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

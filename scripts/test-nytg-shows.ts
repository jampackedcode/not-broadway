
import { NewYorkTheatreGuideScraper } from '../scraper/sources/newyorktheaterguide';

async function main() {
    const scraper = new NewYorkTheatreGuideScraper();

    // Al Hirschfeld Theatre
    const theaterId = 'al-hirschfeld-th';
    const theaterUrl = 'https://www.newyorktheatreguide.com/theatres/al-hirschfeld-theatre';

    console.log(`Testing scrapeShows for ${theaterId} (${theaterUrl})...`);

    try {
        const result = await scraper.scrapeShows(theaterId, theaterUrl);

        if (result.success) {
            console.log('Success!');
            console.log(`Found ${result.data?.totalFound} shows.`);
            if (result.data?.shows) {
                result.data.shows.forEach(show => {
                    console.log('---');
                    console.log(`Title: ${show.title}`);
                    console.log(`ID: ${show.id}`);
                    console.log(`URL: ${show.website}`);
                    console.log(`Dates: ${show.startDate} - ${show.endDate}`);
                });
            }
        } else {
            console.error('Failed:', result.error);
        }
    } catch (error) {
        console.error('Error running test:', error);
    }
}

main();

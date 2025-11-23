import { getDatabase } from './scraper/db/client';

const db = getDatabase();
const run = db.get('SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 1');
console.log('Latest Scraper Run:');
console.log(JSON.stringify(run, null, 2));

const theaters = db.get('SELECT count(*) as count FROM theaters WHERE is_active = 1');
console.log('\nActive Theaters:', theaters);

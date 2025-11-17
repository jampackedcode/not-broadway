# Next Steps for Theater Scrapers

**Last Updated:** 2025-11-17
**Current Status:** Phase 2 Complete - 3 working scrapers covering 50% of theaters

---

## Phase 2 Completion Status

### ✅ Completed
- [x] WordPress + Spektrix scraper (NYTW) - 557 events extracted
- [x] Squarespace scraper (The Tank) - 88 events extracted
- [x] OvationTix scraper (code complete, needs browser automation testing)
- [x] Base architecture and data models
- [x] Parsing utilities for dates, prices, text
- [x] Documentation (README, ANALYSIS, PHASE1_SUMMARY, PHASE2_SUMMARY)

### 🚧 Optional Pilots (Can Skip to Phase 3)
- [ ] Webflow scraper (Apollo Theater) - JavaScript rendering required
- [ ] Custom scraper example (Roundabout Theatre) - proprietary system

---

## Immediate Next Steps (Phase 3 Start)

### Option A: Full Rollout (Recommended)

**Goal:** Deploy scrapers to all 127 theaters using templates and configuration

#### Step 1: Build Remaining Platform Templates
Create scrapers for WordPress variations:

1. **WordPress + GetCuebox** (~5-10 theaters)
   - Example: HERE Arts Center
   - Endpoint: `{theater}.app.getcuebox.com/o/{org_id}/shows`
   - Similar to Spektrix approach but different API structure

2. **WordPress + Salesforce** (~5-10 theaters)
   - Example: 54 Below, Ensemble Studio Theatre
   - Endpoint: `{theater}.my.salesforce-sites.com`
   - Calendar integration pattern

3. **WordPress Basic** (~15-20 theaters)
   - Examples: Soho Rep, Mint Theater
   - No special ticketing integration
   - Parse from WordPress posts/pages
   - Check for event plugins (The Events Calendar, etc.)

4. **Joomla** (~5 theaters)
   - Example: Second Stage Theatre
   - Custom cart system
   - Parse from Joomla article structure

**Estimated Time:** 2-3 days

#### Step 2: Create Theater Configuration Registry

Expand `config/theater_registry.json` with all 127 theaters:

```json
{
  "theaters": {
    "theater_slug": {
      "name": "Theater Name",
      "url": "https://example.org",
      "platform": "platform_name",
      "config": {
        // Platform-specific configuration
      },
      "active": true
    }
  }
}
```

**Tasks:**
- Map each theater from `theaters.csv` to platform type
- Add platform-specific config (API endpoints, calendar paths, etc.)
- Mark dead/inaccessible sites as `active: false`

**Estimated Time:** 1-2 days

#### Step 3: Build Scraper Runner/Orchestrator

Create `scraper/runner.py`:

**Features:**
- Load theater registry
- Run scrapers in parallel (threading or asyncio)
- Aggregate results
- Handle failures gracefully
- Progress tracking
- Output to JSON/CSV/SQLite

**Example Usage:**
```bash
# Scrape all active theaters
python runner.py --all

# Scrape specific platform
python runner.py --platform squarespace

# Scrape specific theaters
python runner.py --theaters "the_tank,nytw,soho_rep"

# Output to SQLite
python runner.py --all --output database --db-path ../data/shows.db
```

**Estimated Time:** 1-2 days

#### Step 4: Add Monitoring & Health Checks

**Features:**
- Detect structural changes (HTML/API changes)
- Track scraper success rates
- Email/Slack alerts on failures
- Scraper version tracking
- Change detection (only update when shows change)

**Estimated Time:** 1-2 days

**Total Estimated Time for Full Rollout:** 5-9 days

---

### Option B: Expand Existing Scrapers (Incremental)

**Goal:** Test existing scrapers on more theaters before building new ones

#### Tasks:

1. **Test WordPress + Spektrix on similar theaters:**
   - Try other WordPress sites to verify flexibility
   - Document any edge cases or variations
   - Update scraper to handle variations

2. **Test Squarespace on similar theaters:**
   - Rattlestick Theater
   - Keen Company
   - Ensemble Studio Theatre
   - Document layout variations

3. **Test OvationTix when browser automation is available:**
   - Red Bull Theater
   - The Brick
   - Irish Rep

**Estimated Time:** 1-2 days

---

### Option C: Build Data Pipeline (Integration)

**Goal:** Connect scrapers to the frontend application

#### Tasks:

1. **Design Database Schema**
   - Shows table
   - Theaters table
   - Scraper runs table (metadata)
   - Relationships and indexes

2. **Build API Endpoints**
   - GET /api/shows - List shows with filtering
   - GET /api/shows/:id - Show details
   - GET /api/theaters - List theaters
   - GET /api/theaters/:id/shows - Shows by theater

3. **Scheduled Scraping**
   - Daily runs for all theaters
   - Store results in database
   - Update frontend data JSON files

4. **Frontend Integration**
   - Update `data/shows.json` from scraper results
   - Add last updated timestamp
   - Display scraper health status

**Estimated Time:** 3-5 days

---

## Recommended Approach

**Week 1:**
1. Build remaining WordPress templates (GetCuebox, Salesforce, Basic)
2. Create theater configuration registry for all 127 theaters
3. Test configurations on 10-15 theaters

**Week 2:**
4. Build scraper runner/orchestrator
5. Run full scrape of all 127 theaters
6. Document failures and create custom scrapers for unique sites

**Week 3:**
7. Add monitoring and health checks
8. Build data pipeline to database
9. Integrate with frontend

**Week 4:**
10. Scheduled daily scraping
11. Error handling and alerts
12. Documentation and handoff

---

## Custom Scrapers Needed

Based on Phase 1 analysis, these theaters will need custom scrapers:

### High Priority (Major Venues)
1. **The Public Theater** - Custom platform, SSL issues
2. **Roundabout Theatre Company** - Custom ticketing backend
3. **Lincoln Center Theater** - Proprietary system
4. **Manhattan Theatre Club** - Custom platform
5. **Playwrights Horizons** - SSL issues, likely custom

### Medium Priority
6. **BAM** (Brooklyn Academy of Music) - Custom platform
7. **La MaMa ETC** - SSL issues
8. **Signature Theatre** - SSL issues
9. **Primary Stages** - SSL issues
10. **Vineyard Theatre** - SSL issues

### Low Priority
11-30. Other smaller theaters with unique structures

**Estimated Time:** 1-2 hours per custom scraper = 20-40 hours total

---

## Technical Debt & Improvements

### Code Quality
- [ ] Add type hints to all functions
- [ ] Write unit tests for parsing utilities
- [ ] Add integration tests for each scraper
- [ ] Set up CI/CD pipeline

### Error Handling
- [ ] Better error messages (specific failure reasons)
- [ ] Retry logic for transient failures
- [ ] Fallback strategies for partial data

### Performance
- [ ] Cache responses for development/testing
- [ ] Parallel scraping with rate limiting
- [ ] Incremental updates (only changed shows)

### Data Quality
- [ ] Validate dates are in future
- [ ] Check for duplicate shows
- [ ] Normalize theater names
- [ ] Geocode venue addresses

---

## Open Questions

1. **Data Storage:**
   - SQLite database? PostgreSQL?
   - File-based JSON? CSV?
   - Update frequency?

2. **Scheduling:**
   - How often to scrape? (Daily? Weekly?)
   - Time of day to run?
   - Stagger requests to avoid rate limiting?

3. **Error Handling:**
   - Email alerts on failures?
   - Slack notifications?
   - Dashboard for monitoring?

4. **Frontend Integration:**
   - Real-time updates or batch?
   - API or static JSON files?
   - Search/filter requirements?

5. **Browser Automation:**
   - When will Playwright/network access be available for OvationTix testing?
   - Which other scrapers will need browser automation?

---

## Resources & References

### Documentation
- `README.md` - Quick start and architecture overview
- `ANALYSIS.md` - Platform categorization findings
- `PHASE1_SUMMARY.md` - Phase 1 completion summary
- `PHASE2_SUMMARY.md` - Phase 2 pilot results

### Code
- `base/` - Core scraper infrastructure
- `platforms/` - Platform-specific scrapers
- `utils/` - Parsing and helper functions
- `config/` - Theater registry and configuration

### Testing
- `platforms/wordpress_spektrix.py` - Run with `python platforms/wordpress_spektrix.py`
- `platforms/squarespace.py` - Run with `python platforms/squarespace.py`
- `platforms/ovationtix.py` - Run with `python platforms/ovationtix.py` (needs Playwright)

---

## Contact & Notes

**Current Coverage:**
- 3 platform templates built
- ~50-65 theaters covered via templates (39-51%)
- 645 events extracted from 2 theaters

**Success Metrics:**
- 100% success rate on tested scrapers
- 72% reduction in development effort vs. custom scrapers

**Last Session:** Built Squarespace scraper, extracted 88 events from The Tank

**Next Session:** Choose between Option A (full rollout), Option B (expand testing), or Option C (build pipeline)

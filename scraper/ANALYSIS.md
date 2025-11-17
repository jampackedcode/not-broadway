# Theater Website Platform Analysis
**Phase 1 Findings - Sample of 15 Theaters from 127 Total**

## Platform Categories Identified

### 1. **OvationTix Ticketing Platform** (2+ theaters identified)
**Theaters:**
- The Flea Theater (#113)
- Red Bull Theater (#89)
- The Brick (#111) - listed in CSV
- Irish Rep (#47) - listed in CSV

**Characteristics:**
- URL Pattern: `web.ovationtix.com/trs/store/{store_id}/`
- Calendar: `/trs/cal/{store_id}`
- Standardized ticketing interface
- JavaScript-heavy calendar system

**Scraping Strategy:** Build ONE OvationTix scraper template that works across all theaters using this platform. Configuration file maps theater name → store_id.

---

### 2. **Squarespace** (4 theaters identified)
**Theaters:**
- The Tank (#117)
- Rattlestick Theater (#88)
- Ensemble Studio Theatre (#36) + Salesforce ticketing
- Keen Company (#53)

**Characteristics:**
- Native Squarespace calendar features OR manual page-based content
- Often integrates external ticketing (Salesforce Sites common)
- Structured event collections with `.w-dyn-item` classes
- Static JSON data embedded in pages

**Scraping Strategy:** Parse Squarespace's structured data format. May need to handle external ticketing integrations separately.

---

### 3. **WordPress** (5+ theaters identified)
**Subcategories:**

#### 3a. WordPress + Spektrix Ticketing
- New York Theatre Workshop (#72)
- Uses `/wp-json/spektrix/` API endpoints
- FullCalendar JavaScript library
- Event objects with `instance_id` parameters

#### 3b. WordPress + GetCuebox Ticketing
- HERE Arts Center (#43)
- Calendar: `{theater}.app.getcuebox.com/o/{org_id}/shows`
- Smart Slider plugin for featured shows

#### 3c. WordPress + Salesforce Ticketing
- 54 Below (#1)
- Events routed through `{theater}.my.salesforce-sites.com`
- Month-based calendar navigation

#### 3d. WordPress (Basic/External Ticketing)
- Soho Rep (#97) - WordPress 6.8.3
- Mint Theater (#63) - Links to bfany.org for tickets

**Scraping Strategy:** Check for REST API endpoints first (`/wp-json/`), fall back to HTML parsing. Different scraper modules for each ticketing integration.

---

### 4. **Webflow** (1 theater identified)
**Theaters:**
- Apollo Theater (#9)

**Characteristics:**
- Webflow class conventions (`.w-nav`, `.w-tab-link`, etc.)
- Webflow CMS collections (`.w-dyn-item`)
- Swiper.js carousel for events
- Dynamic content loading via JavaScript

**Scraping Strategy:** JavaScript rendering required. Parse dynamic collections.

---

### 5. **Joomla** (1 theater identified)
**Theaters:**
- Second Stage Theater (#92)

**Characteristics:**
- `#joomlaImage://` references in CSS
- Custom cart system at `cart.2st.com`
- Calendar view: `?view=calendar&startDate=YYYY-MM`

**Scraping Strategy:** Custom scraper for Joomla structure + cart integration.

---

### 6. **Custom/Proprietary Systems** (1+ theater identified)
**Theaters:**
- Roundabout Theatre Company (#91)
- Lincoln Center Theater (#56) - likely custom
- Manhattan Theatre Club (#58) - likely custom

**Characteristics:**
- Custom-built ticketing backends
- Proprietary APIs
- May use frameworks like Vue.js
- Dedicated ticketing subdomains (e.g., `tickets.roundabouttheatre.org`)

**Scraping Strategy:** Individual custom scrapers per theater. Reverse-engineer API endpoints.

---

## Connection Issues & Challenges

### SSL/TLS Handshake Failures (8 sites)
- The Public Theater (#84)
- Playwrights Horizons (#80)
- BAM (#17)
- La MaMa ETC (#54)
- Signature Theatre (#94)
- Ars Nova (#11)
- Vineyard Theatre (#124)
- Primary Stages (#82)
- Classic Stage Company (#25)

**Impact:** These sites may have strict SSL requirements or bot detection. Will need:
- Custom headers (User-Agent rotation)
- Selenium/Playwright for JavaScript rendering
- Potential proxy rotation

### Other Issues
- 403 Forbidden: Atlantic Theater (#15) - Bot detection likely
- 503 Service Unavailable: Noted for some sites

---

## Estimated Distribution (Projected for All 127 Theaters)

Based on the sample:
- **Squarespace:** ~25-30 theaters (20-25%)
- **WordPress (various):** ~40-50 theaters (30-40%)
- **OvationTix:** ~10-15 theaters (8-12%)
- **Custom/Proprietary:** ~20-30 theaters (15-25%)
- **Webflow:** ~5-10 theaters (4-8%)
- **Joomla/Other CMS:** ~5-10 theaters (4-8%)
- **Dead/Inaccessible Sites:** ~10-15 theaters (8-12%)

---

## Next Steps

1. **Architecture Design** - Create base scraper classes for common patterns
2. **Platform Templates** - Build scrapers for each major platform
3. **Pilot Testing** - Test on 5 representative theaters (one from each category)
4. **Full Rollout** - Systematically implement remaining scrapers
5. **Monitoring** - Add health checks for dead sites and structural changes

---

## Data Schema (Preliminary)

All scrapers should extract and normalize to this format:

```json
{
  "theater_name": "Theater Name",
  "theater_url": "https://example.org",
  "show_title": "Show Title",
  "playwright": "Playwright Name",
  "director": "Director Name",
  "dates": {
    "start": "2025-11-17",
    "end": "2025-12-15",
    "schedule": "Tues-Sat 7pm, Sun 2pm"
  },
  "venue": "Main Stage",
  "description": "Show description...",
  "ticket_url": "https://tickets.example.org/show",
  "price_range": "$20-$65",
  "genres": ["Drama", "Comedy"],
  "cast": ["Actor 1", "Actor 2"],
  "runtime": "90 minutes",
  "image_url": "https://example.org/show.jpg",
  "scraped_at": "2025-11-17T12:00:00Z",
  "scraper_version": "1.0"
}
```

---

**Analysis Date:** 2025-11-17
**Sample Size:** 15 of 127 theaters (11.8%)
**Success Rate:** 13/15 accessible (86.7%)

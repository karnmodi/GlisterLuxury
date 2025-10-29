# Analytics Scripts

## Overview

**⚠️ Important Update:** Analytics system now uses **real-time queries** instead of daily aggregation. The `trigger-analytics.js` script has been removed as it's no longer needed.

---

## Available Scripts

### 1. `check-analytics-data.js` - Check Analytics Data

**Purpose:** Verify that analytics data exists in the database and check data quality.

**Usage:**
```bash
cd Backend
npm run analytics:check
```

**What it checks:**
- Total website visits count
- Latest visit timestamp and page
- Analytics summary records (if any - optional with real-time)
- Order counts (total and paid)
- User counts (total and admins)
- Today's activity (visits and orders)

**Example Output:**
```
=== Analytics Data Check ===

✓ WebsiteVisits: 150 records
  Latest visit: 2025-01-15T10:30:00.000Z
  Page: /products

✓ AnalyticsSummary: 5 records (optional - not required for real-time)
  Latest summary: 2025-01-14
  Page views: 1250
  Revenue: £15000

✓ Orders: 45 total (38 paid)
✓ Users: 12 total (2 admins)

=== Today's Activity ===
Page views: 25
Orders: 3

✅ Data check complete!
```

---

### 2. `clear-api-visits.js` - Clear API Route Visits

**Purpose:** Remove incorrectly tracked API route visits from the database.

**Usage:**
```bash
cd Backend
npm run analytics:clear-api
```

**What it does:**
- Deletes all `WebsiteVisit` records where `page` starts with `/api`
- Shows remaining visit count
- Displays sample visits for verification

**When to use:**
- After fixing visit tracking to exclude API routes
- To clean up incorrectly tracked data
- Before starting fresh with proper tracking

**Example Output:**
```
Connecting to database...
Clearing API route visits...
✓ Deleted 50 API route visit records

✓ Remaining visits: 100

Sample visits:
  - /products
  - /cart
  - /products/123

✅ Cleanup complete!

Next steps:
1. Restart your backend server
2. Visit some pages on the frontend (http://localhost:3000)
3. Check analytics dashboard - data appears in real-time!
```

---

## Real-Time Analytics System

### How It Works

**Old System (Removed):**
- ❌ Daily aggregation at 12:05 AM
- ❌ Pre-computed summaries in `AnalyticsSummary` collection
- ❌ Required manual triggering via `trigger-analytics.js`

**New System (Current):**
- ✅ Real-time queries from raw collections
- ✅ 5-minute caching for performance
- ✅ No scheduled jobs needed
- ✅ Instant data updates

### Data Flow

```
User Visits Page → VisitTracker → WebsiteVisit Collection
                                         ↓
Admin Views Analytics → Query (with cache) → Aggregate On-Demand → Return Data
```

### Collections Used

1. **WebsiteVisit** - Raw page visits (90-day TTL)
2. **Order** - Order and revenue data
3. **Cart** - Cart conversion data
4. **User** - User registration and activity
5. **Product** - Product information for lookups
6. **Wishlist** - Wishlist data

### AnalyticsSummary Collection

- **Status:** Optional/Deprecated
- **Purpose:** Historical aggregated data (if you want to keep it)
- **Note:** Real-time system doesn't require it but it won't hurt if it exists

---

## Troubleshooting

### No Data Showing in Analytics

**Check 1: Verify visits are being tracked**
```bash
npm run analytics:check
```

**Check 2: Visit customer-facing pages**
- Open your website in browser
- Navigate to: `/`, `/products`, `/cart`, etc.
- Check that visits are being recorded

**Check 3: Clear cache**
- Real-time analytics cache expires after 5 minutes
- Wait a few minutes or restart backend server

### API Routes Being Tracked

**Problem:** API routes like `/api/products` are showing in analytics.

**Solution:**
```bash
npm run analytics:clear-api
```

Then verify `VisitTracker.tsx` excludes `/api` routes (it should).

### Old Aggregated Data

**If you have old `AnalyticsSummary` data:**
- Real-time system ignores it by default
- It won't interfere with new real-time queries
- You can keep it for historical reference or delete it

---

## Production Considerations

### Performance

- **Caching:** 5-minute TTL reduces database load
- **Indexes:** Ensure indexes exist on:
  - `WebsiteVisit.timestamp`
  - `WebsiteVisit.sessionID`
  - `WebsiteVisit.page`
- **Query Optimization:** Aggregation pipelines use indexes efficiently

### Data Retention

- **WebsiteVisit:** Auto-deleted after 90 days (TTL index)
- **Other Collections:** Keep indefinitely (or as per business needs)

### Monitoring

Check analytics health:
```bash
npm run analytics:check
```

Monitor backend logs for:
- Visit tracking errors
- Query performance
- Cache hits/misses

---

## Migration from Aggregated System

If you're migrating from the old aggregated system:

1. ✅ **Real-time queries are already active** - no migration needed
2. ⚠️ **Old `AnalyticsSummary` data** - can be kept or deleted
3. ✅ **New visits** - automatically tracked and available in real-time
4. ✅ **Historical data** - Still accessible from `WebsiteVisit` (90-day retention)

---

## Support

For issues or questions:
1. Check main documentation: `Analytics_Implementation_Documentation.md`
2. Review backend logs: `npm run dev` output
3. Verify data: `npm run analytics:check`
4. Check MongoDB connection and indexes

---

**Last Updated:** 2025-01-15  
**System:** Real-Time Analytics (No aggregation needed)

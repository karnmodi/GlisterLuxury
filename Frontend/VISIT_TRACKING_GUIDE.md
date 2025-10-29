# Session-Based Visit Tracking - How It Works

## 🔄 **How Session-Based Tracking Works**

### **1. Initial Visit (First Page Load)**

When a user first visits your website:

```
1. User opens http://localhost:3000/
   ↓
2. VisitTracker component mounts
   ↓
3. Checks localStorage for 'glister_session_id'
   ↓
4. No session ID found → Generates new UUID
   ↓
5. Stores UUID in localStorage (persists for 30 days)
   ↓
6. Sends POST request to backend:
   POST /api/analytics/track-visit
   {
     sessionID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
     page: "/",
     referrer: "",
     deviceType: "desktop",
     userAgent: "Mozilla/5.0...",
     timestamp: "2025-01-15T10:30:00.000Z"
   }
   ↓
7. Backend stores visit in WebsiteVisit collection
```

### **2. Subsequent Page Visits (Same Session)**

When user navigates to another page:

```
1. User clicks link → Navigates to /products
   ↓
2. Next.js route changes → VisitTracker detects pathname change
   ↓
3. Retrieves existing sessionID from localStorage
   ↓
4. Sends POST request with SAME sessionID:
   POST /api/analytics/track-visit
   {
     sessionID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", ← SAME ID
     page: "/products",
     referrer: "http://localhost:3000/", ← Previous page
     deviceType: "desktop",
     ...
   }
```

### **3. Unique Visitor Calculation**

The analytics system counts **unique visitors** based on unique `sessionID` values:

```javascript
// Example: 3 visits from same session
{
  sessionID: "abc123",
  page: "/",
  timestamp: "2025-01-15 10:00"
}
{
  sessionID: "abc123",  // Same session
  page: "/products",
  timestamp: "2025-01-15 10:01"
}
{
  sessionID: "abc123",  // Same session
  page: "/cart",
  timestamp: "2025-01-15 10:02"
}

// Result: 
// - Page Views: 3
// - Unique Visitors: 1 (only 1 unique sessionID)
```

### **4. Session Expiry**

- **Session Cookie/LocalStorage**: Persists for 30 days
- **If user clears browser data**: New sessionID generated
- **If user returns after 30 days**: Old sessionID expires, new one created

---

## 🧪 **Testing on Localhost**

### **Step 1: Start Both Servers**

```bash
# Terminal 1 - Backend
cd Backend
npm start
# Server runs on http://localhost:5000

# Terminal 2 - Frontend
cd Frontend
npm run dev
# Server runs on http://localhost:3000
```

### **Step 2: Open Browser DevTools**

1. Open Chrome/Edge DevTools (F12)
2. Go to **Network** tab
3. Filter by **track-visit**

### **Step 3: Browse Pages**

Navigate through your site:
- `http://localhost:3000/` (Home)
- `http://localhost:3000/products` (Products)
- `http://localhost:3000/products/[id]` (Product Detail)
- `http://localhost:3000/cart` (Cart)

### **Step 4: Verify Tracking**

**In Network Tab:**
```
POST http://localhost:5000/api/analytics/track-visit
Status: 200 OK
Request Payload:
{
  "sessionID": "abc-123-def-456",
  "page": "/products",
  "referrer": "http://localhost:3000/",
  "deviceType": "desktop",
  ...
}
```

**In Application/Storage Tab:**
```
Local Storage:
Key: glister_session_id
Value: abc-123-def-456
```

### **Step 5: Check Analytics Dashboard**

1. Login as admin
2. Go to `/admin/analytics`
3. Click **"Website Visits"** tab
4. You should see:
   - **Page Views**: Number of pages visited
   - **Unique Visitors**: Number of unique sessions (usually 1 if testing alone)
   - **Top Pages**: List of pages with view counts
   - **Device Breakdown**: Desktop/Mobile/Tablet distribution

---

## 🔍 **How to Debug**

### **Check if Visits are Being Stored:**

```bash
# Connect to MongoDB
mongosh your-database-name

# Check WebsiteVisit collection
db.websitevisits.find().sort({ timestamp: -1 }).limit(10)

# Check unique sessions
db.websitevisits.distinct("sessionID").length

# Count total visits
db.websitevisits.countDocuments()
```

### **Common Issues:**

#### **1. No visits showing in analytics**
- ✅ Check Network tab - are POST requests to `/track-visit` happening?
- ✅ Check backend logs - any errors storing visits?
- ✅ Clear cache - data might be cached (wait 5 minutes or clear cache)

#### **2. All sessions showing as "unique"**
- ✅ Check localStorage - sessionID should persist across page navigations
- ✅ Verify VisitTracker component is mounted (check React DevTools)

#### **3. Visits not tracked on page refresh**
- ✅ This is expected! VisitTracker uses `usePathname` which only tracks route changes
- ✅ To track page refreshes, we'd need to add `useEffect` that runs on mount

---

## 📊 **Example: Real-World Session Flow**

### **Scenario: User Browsing Products**

```
10:00 AM - User opens homepage
  → Visit tracked: sessionID="ABC123", page="/"
  → Analytics: Page Views=1, Unique Visitors=1

10:01 AM - User clicks "Products"
  → Visit tracked: sessionID="ABC123", page="/products" (SAME session)
  → Analytics: Page Views=2, Unique Visitors=1 (still same session)

10:02 AM - User clicks product #123
  → Visit tracked: sessionID="ABC123", page="/products/123"
  → Analytics: Page Views=3, Unique Visitors=1

10:05 AM - User clicks "Add to Cart"
  → Visit tracked: sessionID="ABC123", page="/cart"
  → Analytics: Page Views=4, Unique Visitors=1

10:10 AM - Same user opens NEW tab, goes to homepage
  → Visit tracked: sessionID="ABC123", page="/" (SAME session - localStorage shared)
  → Analytics: Page Views=5, Unique Visitors=1

10:30 AM - Different user opens homepage (different browser/device)
  → Visit tracked: sessionID="XYZ789", page="/" (NEW session)
  → Analytics: Page Views=6, Unique Visitors=2 (2 unique sessionIDs)
```

---

## 🎯 **Key Points**

1. **SessionID = Unique Visitor**
   - One sessionID = One unique visitor (even if they visit multiple pages)

2. **Session Persists Across Pages**
   - Same sessionID used for all pages in same browser
   - Persists for 30 days via localStorage

3. **Page Views vs Unique Visitors**
   - **Page Views**: Total number of page visits (includes repeat pages)
   - **Unique Visitors**: Number of unique sessionIDs (one per visitor)

4. **Real-Time Tracking**
   - Visits tracked immediately as user navigates
   - No waiting for daily aggregation
   - Data appears in analytics within seconds

5. **Private/Incognito Mode**
   - Each incognito window gets new sessionID
   - Different from normal browsing session

---

## 🔧 **Technical Details**

### **Frontend (VisitTracker.tsx)**
- Uses Next.js `usePathname()` hook to detect route changes
- Stores sessionID in browser localStorage
- Sends visit data to backend API endpoint
- Non-blocking (doesn't slow down page load)

### **Backend (POST /api/analytics/track-visit)**
- Public endpoint (no authentication required)
- Receives visit data from frontend
- Stores asynchronously (non-blocking)
- Returns success immediately

### **Database (WebsiteVisit Collection)**
- Stores each visit with:
  - `sessionID` (indexed for fast queries)
  - `page` (URL path)
  - `timestamp` (indexed for date range queries)
  - `deviceType`, `userAgent`, `referrer`, etc.

### **Analytics Query**
- Groups visits by `sessionID` to count unique visitors
- Groups by `page` to find top pages
- Groups by `deviceType` for device breakdown
- Filters by `timestamp` for date ranges


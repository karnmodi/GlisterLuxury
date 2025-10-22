# ⚡ QUICK FIX - Buffering Timeout Error

## The Problem
You're getting: `"Operation 'products.find()' buffering timed out after 10000ms"`

## The Solution (5 Steps)

### ✅ Step 1: Set MongoDB URI in Vercel (Backend)

1. Go to: https://vercel.com/dashboard
2. Click your **backend** project (glister-london-l2w3)
3. Go to: **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name:** `MONGODB_URI`
   - **Value:** Your MongoDB Atlas connection string
   - **Environments:** Check all boxes
6. Click **Save**

**Your MongoDB connection string should look like:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/glister?retryWrites=true&w=majority
```

### ✅ Step 2: Allow Vercel IPs in MongoDB Atlas

1. Go to: https://cloud.mongodb.com/
2. Select your project and cluster
3. Click **Network Access** (left sidebar)
4. Click **Add IP Address**
5. Click **Allow Access from Anywhere**
6. Click **Confirm**

### ✅ Step 3: Push Code Changes

```bash
cd Backend
git add .
git commit -m "Fix serverless MongoDB connection"
git push
```

### ✅ Step 4: Wait for Deployment

- Vercel will automatically redeploy
- Wait about 1-2 minutes
- Check deployment status at: https://vercel.com/dashboard

### ✅ Step 5: Test

Visit: https://glister-london-l2w3.vercel.app/api/products

**Expected Result:**
- ✅ Array of products (could be empty `[]`)
- ❌ NOT the buffering timeout error

---

## Still Not Working?

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Backend Project
2. Click on latest deployment
3. Click **View Function Logs**
4. Look for errors mentioning "MongoDB" or "connection"

### Verify Environment Variable

1. In Vercel Dashboard → Backend Project
2. **Settings** → **Environment Variables**
3. Confirm `MONGODB_URI` is there
4. Click **Edit** to verify the value is correct

### Common Issues

**Issue:** "MongoServerError: bad auth"
- **Fix:** Check username/password in connection string

**Issue:** "MongoTimeoutError"
- **Fix:** Verify Network Access allows 0.0.0.0/0 in MongoDB Atlas

**Issue:** Still getting buffering timeout
- **Fix:** Make sure you redeployed AFTER setting the environment variable

---

## Frontend Configuration (Optional but Recommended)

### Set API URL in Frontend Vercel Project

1. Go to your **frontend** project in Vercel
2. **Settings** → **Environment Variables**
3. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://glister-london-l2w3.vercel.app/api`
   - **Environments:** All

---

## What Changed in Your Code?

1. **Created `Backend/src/config/database.js`**
   - Handles serverless connections properly
   - Caches connections
   - Disables buffering

2. **Updated `Backend/index.js`**
   - Ensures database connects before handling requests
   - Better error handling

3. **Updated `Backend/vercel.json`**
   - Optimized for serverless environment
   - Set proper timeouts

---

## Checklist

- [ ] `MONGODB_URI` set in Vercel backend project
- [ ] MongoDB Atlas allows 0.0.0.0/0
- [ ] Code pushed to GitHub
- [ ] Vercel redeployed (automatic after push)
- [ ] Tested: https://glister-london-l2w3.vercel.app/api/products

---

**That's it!** Your API should now work. 🎉

For more details, see:
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `ENV_SETUP.md` - Environment variables setup
- `Backend/README.md` - Backend documentation


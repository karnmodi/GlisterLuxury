# 🚀 Glister Deployment Guide

This guide will help you fix the "buffering timed out" error and properly configure your Vercel deployment.

## 🔧 What Was Fixed

The MongoDB connection was not optimized for Vercel's serverless environment. We've implemented:

1. **Serverless-optimized database connection** with connection caching
2. **Proper connection middleware** that ensures DB is connected before handling requests
3. **Disabled buffering** to prevent timeout errors
4. **Environment variable configuration** for both frontend and backend

---

## 📋 Step-by-Step Fix

### **Part 1: Backend Configuration (CRITICAL)**

#### 1. Set Environment Variable in Vercel

This is the **MOST IMPORTANT** step. Your backend needs the MongoDB connection string:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your backend project (glister-london-l2w3)
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `MONGODB_URI`
   - **Value:** Your MongoDB Atlas connection string (see below)
   - **Environment:** Select all (Production, Preview, Development)
5. Click **Save**

#### 2. Get Your MongoDB Atlas Connection String

If you don't have it:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string (looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/glister?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your actual MongoDB credentials
6. Make sure the database name is correct (default is `glister`)

#### 3. Configure MongoDB Atlas Network Access

1. In MongoDB Atlas, go to **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (or add `0.0.0.0/0`)
4. Click **Confirm**

This allows Vercel's servers to connect to your database.

#### 4. Redeploy Your Backend

After setting the environment variable:

```bash
cd Backend
git add .
git commit -m "Fix MongoDB connection for serverless"
git push
```

Or manually trigger a redeploy in Vercel dashboard.

---

### **Part 2: Frontend Configuration**

#### 1. Set Environment Variable in Vercel (Frontend Project)

1. Go to your **Frontend** project in Vercel
2. Go to **Settings** → **Environment Variables**
3. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://glister-london-l2w3.vercel.app/api`
   - **Environment:** Select all

#### 2. Create Local Environment File (Optional)

For local development, create `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://glister-london-l2w3.vercel.app/api
```

Or for local backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### 3. Redeploy Frontend

```bash
cd Frontend
git add .
git commit -m "Configure API URL"
git push
```

---

## ✅ Testing

After deployment, test your endpoints:

### 1. Test Basic API (should already work)
```bash
curl https://glister-london-l2w3.vercel.app/
```
Expected: `{"message":"Glister Backend API is running!"}`

### 2. Test Products API (should now work)
```bash
curl https://glister-london-l2w3.vercel.app/api/products
```
Expected: Array of products (or empty array `[]` if no products exist)

### 3. Test in Browser
Visit: https://glister-london-l2w3.vercel.app/api/products

---

## 🐛 Troubleshooting

### Still getting "buffering timed out"?

**Check 1: Environment Variable**
- Verify `MONGODB_URI` is set in Vercel backend project
- No spaces before/after the value
- Connection string is complete and correct

**Check 2: MongoDB Atlas**
- Network Access allows `0.0.0.0/0`
- Database user exists and has read/write permissions
- Cluster is active (not paused)

**Check 3: Connection String Format**
```
✅ Correct: mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/glister
❌ Wrong:   mongodb+srv://user:<password>@cluster...  (forgot to replace <password>)
❌ Wrong:   mongodb://localhost:27017/glister         (local connection, not Atlas)
```

**Check 4: Vercel Logs**
1. Go to Vercel Dashboard → Your Backend Project
2. Click on a deployment
3. Click **View Function Logs**
4. Look for connection errors

### Frontend can't connect to backend?

**Check 1: CORS**
The backend allows all origins by default. If you restricted it, make sure your frontend domain is allowed.

**Check 2: API URL**
- Open browser console on your frontend
- Check if API calls are going to the right URL
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel

**Check 3: Network Tab**
- Open DevTools → Network
- Filter by "Fetch/XHR"
- See what URL is being called and what error it returns

---

## 📝 Key Changes Made

### Backend Changes

1. **Created `Backend/src/config/database.js`**
   - Implements connection caching for serverless
   - Disables buffering
   - Sets appropriate timeouts
   - Handles connection errors gracefully

2. **Updated `Backend/index.js`**
   - Added database connection middleware
   - Ensures connection before handling requests
   - Better error handling

3. **Created `Backend/.gitignore`**
   - Prevents committing sensitive .env files

### Configuration Files

1. **Created `Backend/.env.example`**
   - Template for environment variables
   - Documentation for developers

2. **Created `Frontend/.env.local`** (if not blocked)
   - Points to production backend URL

3. **Created `Backend/README.md`**
   - Detailed backend documentation
   - Deployment instructions

---

## 🎯 Summary Checklist

Before your app works properly, ensure:

- [ ] `MONGODB_URI` environment variable is set in Vercel (Backend)
- [ ] MongoDB Atlas allows connections from `0.0.0.0/0`
- [ ] Backend is redeployed after setting environment variable
- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel (Frontend)
- [ ] Frontend is redeployed
- [ ] Test https://glister-london-l2w3.vercel.app/api/products

---

## 🔐 Security Notes

1. **Never commit `.env` files** to Git (already in `.gitignore`)
2. **Use environment variables** in Vercel for all secrets
3. **MongoDB Atlas:** Consider restricting IP access to specific regions after testing
4. **CORS:** You may want to restrict allowed origins in production

---

## 📞 Need Help?

If issues persist:
1. Check Vercel function logs for detailed errors
2. Verify MongoDB Atlas connection string format
3. Test MongoDB connection using MongoDB Compass with the same connection string
4. Ensure your MongoDB Atlas cluster is not paused or deleted

---

**Good luck! 🚀**


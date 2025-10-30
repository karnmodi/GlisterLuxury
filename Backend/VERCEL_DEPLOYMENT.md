# Vercel Deployment Guide

## Required Environment Variables

You **MUST** add these environment variables to your Vercel project for the deployment to work:

### 1. Access Vercel Dashboard
Go to: https://vercel.com/karnmodi/glister-london/settings/environment-variables

### 2. Add These Variables

#### **MONGODB_URI** (Required)
- **Value**: Your MongoDB Atlas connection string
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/GlisterLondon`
- **Note**: Make sure your MongoDB Atlas cluster allows connections from anywhere (`0.0.0.0/0`) or add Vercel's IP ranges

#### **JWT_SECRET** (Required)
- **Value**: A secure random string for JWT token signing
- **Example**: `your-super-secret-jwt-key-change-this-in-production`
- **Note**: Generate a strong secret (at least 32 characters)

#### **CLOUDINARY_URL** (Required for image uploads)
- **Value**: Your Cloudinary configuration URL
- **Format**: `cloudinary://api_key:api_secret@cloud_name`
- **Where to find**: Cloudinary Dashboard > Account Details

#### **FRONTEND_URL** (Required for CORS)
- **Value**: Your frontend application URL
- **Example**: `https://your-frontend.vercel.app`
- **Note**: This is required for CORS to work properly

#### **NODE_ENV** (Auto-set by vercel.json)
- **Value**: `production`
- **Note**: Already configured in vercel.json

### 3. Optional Variables (for email features)

#### **EMAIL_SERVICE**
- **Value**: `gmail` (or your email provider)

#### **EMAIL_USERNAME**
- **Value**: Your email address

#### **EMAIL_PASSWORD**
- **Value**: Your app-specific password

#### **EMAIL_FROM**
- **Value**: `noreply@yourdomain.com`

#### **ADMIN_EMAIL**
- **Value**: Admin email for order notifications

## MongoDB Atlas Configuration

### Allow Vercel Connections
1. Go to MongoDB Atlas Dashboard
2. Navigate to: Network Access > IP Access List
3. Click "Add IP Address"
4. Select "Allow Access from Anywhere" (`0.0.0.0/0`)
5. Or add Vercel's IP ranges (check Vercel docs)

## Deployment Steps

### 1. Commit Your Changes
```bash
git add .
git commit -m "Fix: Configure backend for Vercel serverless deployment"
git push origin main
```

### 2. Add Environment Variables
- Go to Vercel Dashboard > Settings > Environment Variables
- Add all required variables listed above
- Save changes

### 3. Redeploy
- Vercel will auto-deploy after pushing to main
- Or manually trigger: Deployments > Click "Redeploy"

## API Routes

After deployment, your API will be accessible at:
- Base URL: `https://glister-london-l2w3.vercel.app/`
- Products: `https://glister-london-l2w3.vercel.app/api/products`
- Auth: `https://glister-london-l2w3.vercel.app/api/auth`
- etc.

**Note**: Routes are now prefixed with `/api` because:
1. Vercel routes all requests through `/api/index.js`
2. Our Express routes don't include `/api` prefix (e.g., `/products`)
3. Combined result: `/api/products` in the URL

## Changes Made

### 1. Route Configuration ([index.js](index.js))
- Removed `/api` prefix from Express route declarations
- Configured production-ready CORS with `FRONTEND_URL`
- Routes now: `/products`, `/auth`, etc. (not `/api/products`)

### 2. Auth Middleware ([src/middleware/auth.js](src/middleware/auth.js))
- Removed hardcoded JWT secret fallback
- Now requires `JWT_SECRET` environment variable

### 3. Vercel Configuration ([vercel.json](vercel.json))
- Routes all traffic through `/api/index.js`
- Configured function settings: 10s timeout, 1024MB memory
- Set region to London (lhr1) for optimal performance
- Auto-sets `NODE_ENV=production`

## Troubleshooting

### 500 Error: FUNCTION_INVOCATION_FAILED
**Cause**: Missing environment variables
**Solution**: Add all required environment variables to Vercel

### CORS Errors
**Cause**: `FRONTEND_URL` not set or incorrect
**Solution**: Set `FRONTEND_URL` to your frontend domain

### Database Connection Errors
**Cause**: MongoDB Atlas not allowing Vercel's IPs
**Solution**: Add `0.0.0.0/0` to MongoDB Atlas IP whitelist

### Check Logs
1. Go to Vercel Dashboard
2. Click on your deployment
3. Go to "Functions" tab
4. Click on the function to see error logs

## Local Development

For local development, the routes still work because:
- Express routes: `/products`, `/auth`, etc.
- Access locally: `http://localhost:5000/api/products`
- Works because requests go through Express middleware

## Need Help?

Check Vercel logs for specific error messages:
- Vercel Dashboard > Deployment > Functions > View Logs

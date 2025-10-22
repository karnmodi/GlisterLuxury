# 🔑 Environment Variables Setup Guide

## Quick Setup

Since `.env` files cannot be auto-created, you need to create them manually:

---

## Backend Environment Variables

### **Create file:** `Backend/.env`

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/glister?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development
```

### **How to get your MongoDB URI:**

1. **MongoDB Atlas (for production):**
   - Go to https://cloud.mongodb.com/
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with actual credentials
   - Replace `<database>` with `glister`

2. **Local MongoDB (for development):**
   ```env
   MONGODB_URI=mongodb://localhost:27017/glister
   ```

---

## Frontend Environment Variables

### **For Production:** Create `Frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=https://glister-london-l2w3.vercel.app/api
```

### **For Local Development:** Create `Frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Note:** You can switch between these URLs depending on whether you're testing with local backend or production backend.

---

## Vercel Environment Variables (MOST IMPORTANT!)

### Backend Project on Vercel

1. Go to https://vercel.com/dashboard
2. Select your **backend** project
3. **Settings** → **Environment Variables**
4. Add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/glister` | Production, Preview, Development |

### Frontend Project on Vercel

1. Select your **frontend** project
2. **Settings** → **Environment Variables**
3. Add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://glister-london-l2w3.vercel.app/api` | Production, Preview, Development |

---

## ⚠️ CRITICAL: After Setting Vercel Environment Variables

**You MUST redeploy** for the variables to take effect:

### Option 1: Redeploy in Vercel Dashboard
1. Go to your project
2. Click "Deployments"
3. Click "..." on the latest deployment
4. Click "Redeploy"

### Option 2: Trigger via Git Push
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## Testing Your Configuration

### Test Backend Locally
```bash
cd Backend
npm install
npm run dev
```

Visit: http://localhost:5000/api/products

### Test Frontend Locally
```bash
cd Frontend
npm install
npm run dev
```

Visit: http://localhost:3000

### Test on Vercel
After deploying and setting environment variables:

**Backend:** https://glister-london-l2w3.vercel.app/api/products

**Frontend:** Your Vercel frontend URL

---

## Common Mistakes

❌ **Forgot to replace `<password>` in connection string**
```
mongodb+srv://user:<password>@cluster... ← WRONG
```

✅ **Correct:**
```
mongodb+srv://user:myActualPassword123@cluster...
```

---

❌ **Environment variable name typo**
```
MONGO_URI=...  ← WRONG
```

✅ **Correct:**
```
MONGODB_URI=...
```

---

❌ **Forgot to redeploy after setting variables**

✅ **Always redeploy after changing environment variables**

---

## Security Checklist

- [ ] `.env` files are listed in `.gitignore`
- [ ] Never commit `.env` files to Git
- [ ] Use strong passwords for MongoDB
- [ ] Don't share environment variables publicly
- [ ] Use different credentials for development and production

---

## Files to Create Manually

1. **`Backend/.env`** - For local backend development
2. **`Frontend/.env.local`** - For frontend configuration

These files should **NOT** be committed to Git (they're in `.gitignore`).

---

## Need the Connection String?

If you don't have a MongoDB Atlas cluster:

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Log in
3. Create a free cluster (M0)
4. Create a database user
5. Add your IP to Network Access (or use 0.0.0.0/0 for all)
6. Get the connection string from "Connect" button

---

**That's it!** Once you've set up these variables, your deployment should work perfectly. 🎉


# Glister Backend

Backend API for Glister - Door Handles & Bathroom Accessories

## Environment Variables Setup

### For Vercel Deployment

You **MUST** add the following environment variable in your Vercel project settings:

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

Replace the placeholders with your MongoDB Atlas connection string.

### For Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual values:
   ```
   MONGODB_URI=mongodb://localhost:27017/glister
   PORT=5000
   NODE_ENV=development
   ```

## Running Locally

```bash
npm install
npm run dev
```

## Deploying to Vercel

1. Make sure you've added the `MONGODB_URI` environment variable in Vercel settings
2. Push your code to GitHub
3. Vercel will automatically deploy

## Important Notes for Serverless

- The database connection is now optimized for serverless environments
- Connections are cached and reused across function invocations
- Buffering is disabled to prevent timeout errors
- Connection timeout is set to 5 seconds for faster error detection

## Troubleshooting

If you get "buffering timed out" errors:
1. Verify your `MONGODB_URI` environment variable is set in Vercel
2. Ensure your MongoDB Atlas cluster allows connections from Vercel IPs (0.0.0.0/0)
3. Check your MongoDB Atlas user has proper permissions
4. Verify the database name in your connection string is correct


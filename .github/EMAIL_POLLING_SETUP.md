# GitHub Actions Email Polling Setup Guide

## Overview

This guide explains how to set up GitHub Actions to trigger email auto-reply processing every minute on your Vercel deployment.

## Prerequisites

- ✅ Repository is public (for unlimited GitHub Actions minutes)
- ✅ Vercel deployment is live
- ✅ Email polling endpoint is deployed: `/api/incoming-email/cron`

## Step 1: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**

### Required Secrets

#### 1. `CRON_SECRET` (Required)
- **Name**: `CRON_SECRET`
- **Value**: A secure random string (same value as `CRON_SECRET` in Vercel environment variables)
- **Purpose**: Authenticates requests to your Vercel cron endpoint

**How to generate:**
```bash
# Generate a secure random string
openssl rand -hex 32
```

#### 2. `VERCEL_URL` (Optional but Recommended)
- **Name**: `VERCEL_URL`
- **Value**: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- **Purpose**: Explicitly specify your Vercel URL (workflow will try to construct it if not provided)

**Example:**
```
https://glister-london-l2w3.vercel.app
```

## Step 2: Set Up Vercel Environment Variables

Make sure your Vercel deployment has the same `CRON_SECRET`:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add or verify:
   - **Name**: `CRON_SECRET`
   - **Value**: Same value as GitHub secret
   - **Environment**: Production, Preview, Development (as needed)

## Step 3: Verify Workflow File

The workflow file is located at:
```
.github/workflows/email-polling.yml
```

It should:
- Run every minute (`* * * * *`)
- Call your Vercel endpoint: `/api/incoming-email/cron`
- Include authentication token
- Handle errors gracefully

## Step 4: Test the Workflow

### Manual Test

1. Go to GitHub repository → **Actions** tab
2. Find "Email Auto-Reply Polling" workflow
3. Click **"Run workflow"** → **"Run workflow"** button
4. Watch the workflow execute
5. Check logs for success/failure

### Verify Email Processing

1. Send a test email to `enquiries@glisterlondon.com`
2. Wait 1-2 minutes
3. Check Vercel logs for:
   - `[Cron] Email polling triggered by cron job`
   - `📧 New email received`
   - `✅ Auto-reply sent`

## Step 5: Monitor Workflow

### GitHub Actions Dashboard

- **Location**: Repository → **Actions** tab
- **View**: See all workflow runs
- **Logs**: Click on any run to see detailed logs
- **Status**: Green checkmark = success, Red X = failure

### What to Look For

✅ **Success Indicators:**
- HTTP Status Code: 200
- Response shows `"success": true`
- `emailsProcessed` count in response

❌ **Failure Indicators:**
- HTTP Status Code: 401 (authentication failed)
- HTTP Status Code: 500 (server error)
- Connection timeout errors

## Troubleshooting

### Issue: Workflow fails with 401 Unauthorized

**Solution:**
1. Verify `CRON_SECRET` in GitHub secrets matches Vercel environment variable
2. Check that the secret is set correctly (no extra spaces)
3. Verify the endpoint accepts the token format

### Issue: Workflow fails with connection timeout

**Solution:**
1. Verify `VERCEL_URL` secret is set correctly
2. Check that your Vercel deployment is live
3. Verify the endpoint path: `/api/incoming-email/cron`

### Issue: No emails being processed

**Solution:**
1. Check Vercel logs for errors
2. Verify email polling configuration in admin settings
3. Test email connection manually via admin panel
4. Check that auto-reply is enabled for the email address

### Issue: Workflow not running

**Solution:**
1. Verify workflow file is in `.github/workflows/` directory
2. Check that the file is committed and pushed to repository
3. Verify cron syntax is correct: `* * * * *`
4. Check GitHub Actions is enabled for the repository

## Workflow Schedule

- **Frequency**: Every minute
- **Runs per day**: 1,440 times
- **Cost**: Free (unlimited for public repositories)
- **Execution time**: ~10-30 seconds per run

## Manual Triggering

You can manually trigger the workflow:

1. Go to **Actions** → **Email Auto-Reply Polling**
2. Click **"Run workflow"**
3. Select branch (usually `main` or `Auto-Reply-Feature`)
4. Click **"Run workflow"**

## Disabling the Workflow

To temporarily disable:

1. Edit `.github/workflows/email-polling.yml`
2. Comment out the `schedule` section:
   ```yaml
   # schedule:
   #   - cron: '* * * * *'
   ```
3. Commit and push

To permanently remove:
- Delete `.github/workflows/email-polling.yml`
- Commit and push

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check Vercel function logs
3. Verify all secrets are set correctly
4. Test the endpoint manually with curl


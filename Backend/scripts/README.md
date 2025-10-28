# Analytics Aggregation Scripts

## Quick Start

### Method 1: Using npm script (Recommended)

```bash
cd Backend

# Set your admin credentials
export ADMIN_EMAIL="admin@glister.com"
export ADMIN_PASSWORD="your-admin-password"

# Trigger aggregation for yesterday (default)
npm run analytics:aggregate

# Trigger aggregation for a specific date
npm run analytics:aggregate 2025-10-27
```

**Windows (PowerShell):**
```powershell
cd Backend

# Set credentials
$env:ADMIN_EMAIL="admin@glister.com"
$env:ADMIN_PASSWORD="your-admin-password"

# Run aggregation
npm run analytics:aggregate
```

**Windows (CMD):**
```cmd
cd Backend

# Set credentials
set ADMIN_EMAIL=admin@glister.com
set ADMIN_PASSWORD=your-admin-password

# Run aggregation
npm run analytics:aggregate
```

---

### Method 2: Using curl

```bash
# Step 1: Login to get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@glister.com","password":"your-password"}' \
  | jq -r '.token')

# Step 2: Trigger aggregation
curl -X POST http://localhost:5000/api/analytics/aggregate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date":"2025-10-27"}'

# Or for yesterday (default)
curl -X POST http://localhost:5000/api/analytics/aggregate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Windows (PowerShell):**
```powershell
# Step 1: Login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@glister.com","password":"your-password"}'

$token = $response.token

# Step 2: Trigger aggregation
Invoke-RestMethod -Uri "http://localhost:5000/api/analytics/aggregate" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"date":"2025-10-27"}'
```

---

### Method 3: Using Postman

1. **Login Request:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@glister.com",
       "password": "your-password"
     }
     ```
   - Copy the `token` from response

2. **Trigger Aggregation:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/analytics/aggregate`
   - Headers:
     - `Authorization: Bearer YOUR_TOKEN_HERE`
     - `Content-Type: application/json`
   - Body (JSON) - Optional:
     ```json
     {
       "date": "2025-10-27"
     }
     ```
     Leave body empty for yesterday's aggregation

---

## Script Details

### trigger-analytics.js

**Purpose:** Automates the process of logging in and triggering analytics aggregation.

**Environment Variables:**
- `ADMIN_EMAIL` - Admin user email (required)
- `ADMIN_PASSWORD` - Admin user password (required)
- `API_URL` - API base URL (optional, defaults to http://localhost:5000/api)

**Command Line Arguments:**
- `[date]` - Optional date in YYYY-MM-DD format. Defaults to yesterday if not provided.

**Examples:**

```bash
# Aggregate yesterday's data
ADMIN_EMAIL=admin@glister.com ADMIN_PASSWORD=pass123 npm run analytics:aggregate

# Aggregate specific date
ADMIN_EMAIL=admin@glister.com ADMIN_PASSWORD=pass123 npm run analytics:aggregate 2025-10-27

# Using custom API URL
API_URL=https://api.glister.com/api ADMIN_EMAIL=admin@glister.com ADMIN_PASSWORD=pass123 npm run analytics:aggregate
```

---

## Troubleshooting

### Error: Missing required environment variables

**Problem:** Script can't find ADMIN_EMAIL or ADMIN_PASSWORD.

**Solution:**
```bash
# Make sure to export variables before running
export ADMIN_EMAIL="admin@glister.com"
export ADMIN_PASSWORD="your-password"
npm run analytics:aggregate
```

### Error: Login failed

**Problem:** Invalid credentials or user doesn't exist.

**Solution:**
1. Verify your admin credentials
2. Create an admin user if needed:
   ```bash
   npm run seed:admin
   ```
3. Check if the API server is running

### Error: Connection refused

**Problem:** API server is not running.

**Solution:**
```bash
# Start the backend server first
npm run dev
# Then in another terminal, run the aggregation
npm run analytics:aggregate
```

### Error: Aggregation failed

**Problem:** Database connection issues or data problems.

**Solution:**
1. Check MongoDB is running
2. Verify database connection in `.env` file
3. Check server logs for detailed error messages

---

## Production Usage

For production environments, consider:

1. **Using environment files:**
   ```bash
   # Create .env.production
   ADMIN_EMAIL=admin@glister.com
   ADMIN_PASSWORD=secure-password
   API_URL=https://api.glister.com/api
   
   # Load and run
   set -a && source .env.production && set +a
   npm run analytics:aggregate
   ```

2. **Scheduled cron jobs:**
   ```bash
   # Add to crontab (Linux/Mac)
   # Run daily at 1 AM
   0 1 * * * cd /path/to/Backend && /usr/bin/npm run analytics:aggregate >> /var/log/analytics-aggregate.log 2>&1
   ```

3. **CI/CD Integration:**
   - Store credentials in CI/CD secrets
   - Run as part of deployment pipeline
   - Monitor execution and alert on failures

---

## Security Notes

⚠️ **Important:**
- Never commit credentials to version control
- Use environment variables or secure secret management
- Rotate admin passwords regularly
- Limit network access to aggregation endpoints
- Monitor aggregation logs for unauthorized access

---

## Support

For issues or questions:
1. Check the main documentation: `Analytics_Implementation_Documentation.md`
2. Review backend logs: `npm run dev` output
3. Verify API endpoints are accessible
4. Check MongoDB connection and data integrity


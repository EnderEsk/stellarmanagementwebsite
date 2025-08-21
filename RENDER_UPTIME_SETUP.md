# How to Keep Your Render Server Awake (Free Tier)

## Overview
Render's free tier puts your server to sleep after 15 minutes of inactivity. This guide shows you how to keep it running 24/7 using UptimeRobot to ping your server every 14 minutes.

## What We've Added

### 1. Health Check Endpoints
Your server now has two endpoints:

- **`/healthz`** - Comprehensive health check that verifies database connectivity
- **`/ping`** - Lightweight ping endpoint for uptime monitoring

### 2. Endpoint Details

#### `/healthz` Endpoint
- **URL**: `https://your-app-name.onrender.com/healthz`
- **Purpose**: Full health check with database verification
- **Response**: JSON with status, timestamp, database status, and uptime
- **Use Case**: Primary health monitoring

#### `/ping` Endpoint  
- **URL**: `https://your-app-name.onrender.com/ping`
- **Purpose**: Simple ping to keep server awake
- **Response**: Lightweight JSON with status and timestamp
- **Use Case**: UptimeRobot monitoring (every 14 minutes)

## Setting Up UptimeRobot

### Step 1: Create UptimeRobot Account
1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Sign up for a free account (50 monitors, 5-minute intervals)

### Step 2: Add Your First Monitor
1. Click "Add New Monitor"
2. Choose **"HTTP(s)"** as monitor type
3. Fill in the details:

```
Monitor Type: HTTP(s)
Name: Render Server Health Check
URL: https://your-app-name.onrender.com/ping
Monitoring Interval: 5 minutes
```

### Step 3: Advanced Settings
1. Click "Advanced Settings"
2. Set **"Alert When Down"** to 1
3. Set **"Alert When Up"** to 1
4. **Important**: Set **"Alert When Down"** to 1 to avoid spam

### Step 4: Save and Test
1. Click "Create Monitor"
2. Test the monitor by visiting your ping URL
3. Verify it shows as "Up"

## Why This Works

### Render's Sleep Policy
- Free tier sleeps after 15 minutes of inactivity
- Any HTTP request wakes the server
- UptimeRobot pings every 5 minutes (well under 15-minute limit)

### Database Health
- `/healthz` endpoint checks MongoDB connection
- Ensures your database is healthy
- Provides detailed status information

### Cost Benefits
- **Free**: UptimeRobot free tier
- **Free**: Render free tier (750 hours/month)
- **Result**: 24/7 uptime at zero cost

## Testing Locally

Run the test script to verify endpoints work:

```bash
node test-health-check.js
```

Make sure your server is running on port 3000 first.

## Monitoring Your Server

### UptimeRobot Dashboard
- Real-time status of your server
- Uptime percentage
- Response time monitoring
- Email alerts if server goes down

### Health Check Response Examples

#### Successful Health Check:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T15:30:00.000Z",
  "database": "connected",
  "uptime": 3600.5
}
```

#### Simple Ping:
```json
{
  "status": "ok",
  "timestamp": "2025-01-31T15:30:00.000Z",
  "uptime": 3600.5
}
```

## Troubleshooting

### Common Issues

1. **Monitor Shows "Down"**
   - Check if your server is running
   - Verify the URL is correct
   - Check server logs for errors

2. **Database Connection Issues**
   - MongoDB connection string correct?
   - Network access from Render to MongoDB?
   - Check `/healthz` endpoint response

3. **Render Still Sleeping**
   - Verify UptimeRobot is pinging every 5 minutes
   - Check monitor status in UptimeRobot dashboard
   - Ensure URL is accessible

### Debug Commands

Test endpoints manually:
```bash
# Test health check
curl https://your-app-name.onrender.com/healthz

# Test ping
curl https://your-app-name.onrender.com/ping
```

## Alternative Solutions

### 1. Cron Job (if you have server access)
```bash
*/14 * * * * curl -s https://your-app-name.onrender.com/ping > /dev/null
```

### 2. GitHub Actions (free tier)
- Create workflow that pings every 14 minutes
- Runs on GitHub's infrastructure

### 3. Other Uptime Services
- Pingdom
- StatusCake
- Freshping

## Best Practices

1. **Use `/ping` for UptimeRobot** - Lighter weight, faster response
2. **Use `/healthz` for monitoring** - Comprehensive health status
3. **Set 5-minute intervals** - Well under 15-minute sleep threshold
4. **Monitor response times** - Catch performance issues early
5. **Set up alerts** - Get notified of downtime immediately

## Cost Breakdown

| Service | Cost | What You Get |
|---------|------|--------------|
| Render Free Tier | $0/month | 750 hours/month, auto-scaling |
| UptimeRobot Free | $0/month | 50 monitors, 5-min intervals |
| **Total** | **$0/month** | **24/7 uptime** |

## Success Metrics

- ✅ Server stays awake 24/7
- ✅ No more 15+ second response times
- ✅ Consistent uptime monitoring
- ✅ Database health verification
- ✅ Zero additional cost

Your server will now stay awake indefinitely on Render's free tier! 🚀

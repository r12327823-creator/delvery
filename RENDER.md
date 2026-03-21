# Deploy to Render - Step by Step

## Prerequisites
- Push your code to a **GitHub repository**
- Free account on [render.com](https://render.com)

---

## Step 1: Provision PostgreSQL on Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Give it a name: `market2home-db`
4. Select **Free** plan
5. Copy the **"Internal Connection String"** (you'll need this in Step 3)

---

## Step 2: Deploy Backend API

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub repo**
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `market2home-api` |
| **Region** | Singapore (closest to India) |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Click **"Create Web Service"**

---

## Step 3: Add Environment Variables

In the Render dashboard → **Environment** tab, add these variables:

```
NODE_ENV = production
PORT = 10000

# Database (from Step 1)
DB_HOST = your-postgres-host
DB_PORT = 5432
DB_NAME = market2home_db
DB_USER = your-postgres-user
DB_PASSWORD = your-postgres-password

# JWT - generate a random secret
JWT_SECRET = your-super-secret-jwt-key-change-this

# Platform Settings
PLATFORM_COMMISSION = 10
DELIVERY_FEE = 40
RIDER_PAY_PER_DELIVERY = 30

# Frontend URL (for CORS - update after deploying frontend)
FRONTEND_URL = https://your-app.vercel.app
```

---

## Step 4: Run Database Schema

1. Go to your PostgreSQL instance in Render
2. Click **"Connect"** → **"PSQL Command"**
3. Or use **pgAdmin / DBeaver** to connect with the connection string
4. Copy and paste the contents of `server/config/schema.sql`

---

## Step 5: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set **Root Directory** to `client`
4. Add environment variable:

```
REACT_APP_API_URL = https://market2home-api.onrender.com
```

5. Deploy

6. After deployment, go back to **Render Dashboard** → Web Service → Environment
7. Update `FRONTEND_URL` with your Vercel URL (e.g., `https://market2home.vercel.app`)

---

## Step 6: Test Everything

Your live URLs will be:
- **Frontend**: `https://your-app.vercel.app`
- **API**: `https://market2home-api.onrender.com`
- **Admin**: `https://your-app.vercel.app/admin` → Login with mobile `9999999999`

---

## Important Notes

### Free Tier Limits (Render)
- Web service sleeps after **15 minutes** of inactivity
- First request after sleep takes ~30 seconds to wake up
- PostgreSQL free tier: **1 database, 1GB storage**
- Good enough for MVP with low traffic

### For Production (when you grow)
- Upgrade to Render **Starter** plan ($7/month) for no sleep
- Or use **Railway** ($5/month credit)

### Database
- Render's free PostgreSQL sleeps after 90 days of inactivity
- Keep the service active by making occasional API calls
- Or switch to **Supabase** (no sleep on free tier)

---

## Troubleshooting

**CORS errors?**
- Make sure `FRONTEND_URL` is set correctly in Render
- Both http:// and https:// variants might be needed

**Database connection failed?**
- Check connection string format: `postgres://user:password@host:5432/dbname`
- Make sure Render's IP allowlist includes your requests

**API returning 500?**
- Check Render logs (click on the web service → Logs tab)
- Most common: missing environment variables

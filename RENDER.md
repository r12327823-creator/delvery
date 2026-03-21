# Deploy to Render - Step by Step

## Prerequisites
- Push your code to a **GitHub repository**
- Free accounts on [render.com](https://render.com) and [vercel.com](https://vercel.com)

---

## Step 1: Create PostgreSQL Database

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Name it: `market2home-db`
4. Select **Free** plan → **Create Database**
5. **Keep this tab open** — you'll need the connection string

---

## Step 2: Deploy Backend on Render

### Option A: Blueprint (Easiest)
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically → Click **"Apply"**
5. Fill in these environment variables:
   - `DB_HOST` — from Step 1 PostgreSQL connection string
   - `DB_NAME` — from Step 1
   - `DB_USER` — from Step 1
   - `DB_PASSWORD` — from Step 1
   - `FRONTEND_URL` — leave empty for now

### Option B: Manual
1. Dashboard → **"New +"** → **"Web Service"**
2. Connect GitHub repo
3. Settings:
   - **Name**: `market2home-api`
   - **Region**: Singapore
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Add same environment variables as above

---

## Step 3: Run Database Schema

1. Go to your PostgreSQL in Render dashboard
2. Click **"Connect"** → **"PSQL Command"**
3. Copy and paste the contents of `server/config/schema.sql`
4. Press **Enter**

---

## Step 4: Deploy Frontend on Vercel

The React app is in `/client`. **You must tell Vercel to use that folder:**

1. Go to [vercel.com](https://vercel.com)
2. **Import** your GitHub repo
3. **Before clicking Deploy**, click **"Edit"** on the root directory
4. Change `/` to `client`
5. Click **Deploy**
6. After deploy → **Settings** → **Environment Variables** → Add:

```
REACT_APP_API_URL = https://market2home-api.onrender.com
```

7. **Redeploy** — Deployments → last deploy → three dots → Redeploy
8. Copy your Vercel URL

---

## Step 5: Update CORS on Render

1. Render Dashboard → your web service → **Environment**
2. Add:

```
FRONTEND_URL = https://your-vercel-app.vercel.app
```

---

## Step 6: Test

| What | URL |
|------|-----|
| Frontend | `https://your-app.vercel.app` |
| Customer Portal | `https://your-app.vercel.app/customer` |
| Admin | `https://your-app.vercel.app/admin` → Login: `9999999999` |

---

## Common Problems

### Deploy stuck on Vercel
- Make sure root directory is set to `client` (not `/`)
- After adding `REACT_APP_API_URL`, you MUST redeploy

### Deploy stuck on Render
- Check the **Logs** tab for errors
- Most common: missing `DB_PASSWORD` or wrong `DB_HOST`
- Make sure PostgreSQL is fully created first

### CORS errors
- `FRONTEND_URL` must be set on Render with exact `https://` URL
- No trailing slash

### Free tier sleeps
- Render free: 15 min sleep → 30s wakeup (normal)
- PostgreSQL 90-day sleep → visit dashboard monthly

---

## Deployment Files

```
render.yaml       ← Auto-configures Render
client/vercel.json ← Vercel build config
server/index.js  ← CORS configured for production
.gitignore       ← Keeps secrets out of GitHub
```

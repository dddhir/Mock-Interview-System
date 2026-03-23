# Deployment Guide: Vercel vs Netlify

## Quick Comparison

| Aspect | Vercel | Netlify |
|--------|--------|---------|
| **Best For** | Full-stack (Node.js + React) | Static sites + Serverless |
| **Backend Support** | ✅ Native (Serverless Functions) | ⚠️ Limited (Serverless only) |
| **Database** | ✅ Easy integration | ✅ Easy integration |
| **Cost** | Free tier + Pro ($20/mo) | Free tier + Pro ($19/mo) |
| **Setup Time** | 15-30 minutes | 20-40 minutes |
| **Recommendation** | **BEST for this app** | Alternative |

---

## Option 1: Deploy with Vercel (RECOMMENDED)

### Why Vercel?
- ✅ Native Node.js backend support
- ✅ Serverless functions for API routes
- ✅ Automatic deployments from Git
- ✅ Built-in environment variables
- ✅ Free tier includes 100GB bandwidth
- ✅ Fastest setup for MERN apps

### Prerequisites
1. GitHub account (with your code pushed)
2. Vercel account (free)
3. MongoDB Atlas account (free tier)
4. Google Cloud credentials

### Step-by-Step Deployment (30 minutes)

#### Step 1: Prepare Your Project (5 minutes)

**1.1 Create `.vercelignore` file:**
```
node_modules
.git
.env.local
.DS_Store
ai-models
logs
uploads
```

**1.2 Create `vercel.json` in root:**
```json
{
  "version": 2,
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "GOOGLE_GENAI_API_KEY": "@google_genai_api_key",
    "JWT_SECRET": "@jwt_secret",
    "PORT": "3001"
  },
  "functions": {
    "server.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server.js"
    }
  ]
}
```

**1.3 Update `server.js` for Vercel:**
```javascript
// At the top of server.js, add:
const PORT = process.env.PORT || 5001;

// Make sure this is at the end:
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;
```

**1.4 Update `client/vite.config.js`:**
```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
}
```

#### Step 2: Push to GitHub (5 minutes)

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### Step 3: Connect to Vercel (10 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Select your repository
5. Configure project:
   - **Framework Preset:** Node.js
   - **Root Directory:** ./
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/dist`
   - **Install Command:** `npm install`

#### Step 4: Add Environment Variables (5 minutes)

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add these variables:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
   GOOGLE_GENAI_API_KEY=your_api_key
   JWT_SECRET=your_secret_key
   NODE_ENV=production
   ```

#### Step 5: Deploy (5 minutes)

1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Get your live URL
4. Test the app

### Vercel Deployment Timeline
- **Setup:** 5 minutes
- **Git push:** 2 minutes
- **Vercel config:** 5 minutes
- **Environment setup:** 5 minutes
- **Build & deploy:** 5-10 minutes
- **Total:** ~25-30 minutes

### Vercel Costs
- **Free tier:** 100GB bandwidth, 1000 serverless function invocations/day
- **Pro:** $20/month (unlimited)
- **For this app:** Free tier is sufficient initially

---

## Option 2: Deploy with Netlify

### Why Netlify?
- ✅ Easy for static sites
- ⚠️ Backend requires serverless functions
- ✅ Good for frontend-heavy apps
- ✅ Free tier includes 125,000 requests/month

### Challenges with Netlify
- Backend needs to be split into serverless functions
- More complex setup for Node.js backend
- Not ideal for this MERN stack

### If You Choose Netlify (40 minutes)

#### Step 1: Split Frontend and Backend (15 minutes)

**1.1 Deploy Frontend to Netlify:**
```bash
cd client
npm run build
# This creates dist/ folder
```

**1.2 Create `netlify.toml` in root:**
```toml
[build]
  command = "cd client && npm run build"
  publish = "client/dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

**1.3 Create `netlify/functions/api.js`:**
```javascript
const express = require('express');
const serverless = require('serverless-http');
const app = require('../../server.js');

module.exports.handler = serverless(app);
```

#### Step 2: Deploy Frontend (10 minutes)

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select repository
5. Configure:
   - **Build command:** `cd client && npm run build`
   - **Publish directory:** `client/dist`
6. Add environment variables
7. Deploy

#### Step 3: Deploy Backend (15 minutes)

Option A: Use Netlify Functions (complex)
Option B: Deploy backend separately to Heroku/Railway (easier)

### Netlify Deployment Timeline
- **Frontend setup:** 10 minutes
- **Backend setup:** 15-20 minutes
- **Environment config:** 5 minutes
- **Build & deploy:** 5-10 minutes
- **Total:** ~40-50 minutes

### Netlify Costs
- **Free tier:** 125,000 requests/month
- **Pro:** $19/month
- **For this app:** Free tier works, but backend needs separate hosting

---

## Recommended Deployment Architecture

### Option A: Vercel (BEST - All-in-one)
```
┌─────────────────────────────────┐
│         Vercel                  │
├─────────────────────────────────┤
│  Frontend (React/Vite)          │
│  Backend (Node.js/Express)      │
│  API Routes                     │
└─────────────────────────────────┘
         ↓
    MongoDB Atlas
    Google Cloud APIs
```

### Option B: Netlify + Heroku (Split)
```
┌──────────────────┐    ┌──────────────────┐
│  Netlify         │    │  Heroku/Railway  │
├──────────────────┤    ├──────────────────┤
│ Frontend (React) │    │ Backend (Node.js)│
│ Static files     │    │ API Routes       │
└──────────────────┘    └──────────────────┘
         ↓                      ↓
    MongoDB Atlas         MongoDB Atlas
                         Google Cloud APIs
```

---

## Complete Vercel Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] `.vercelignore` created
- [ ] `vercel.json` configured
- [ ] `server.js` exports app
- [ ] `vite.config.js` configured
- [ ] All dependencies in `package.json`

### Vercel Setup
- [ ] Vercel account created
- [ ] GitHub connected
- [ ] Project imported
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] MongoDB URI set
- [ ] Google API key set
- [ ] JWT secret set

### Post-Deployment
- [ ] Test login functionality
- [ ] Test interview creation
- [ ] Test voice recording
- [ ] Test answer submission
- [ ] Check database connection
- [ ] Monitor error logs
- [ ] Set up custom domain (optional)

---

## Troubleshooting

### Vercel Issues

**Issue: Build fails**
```
Solution: Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Check Node.js version compatibility
- Verify environment variables are set
```

**Issue: API not working**
```
Solution: Check rewrites in vercel.json
- Ensure /api routes are properly configured
- Check server.js exports
- Verify environment variables
```

**Issue: Database connection fails**
```
Solution: Check MongoDB URI
- Ensure IP whitelist includes Vercel IPs
- Use MongoDB Atlas connection string
- Test connection locally first
```

### Netlify Issues

**Issue: Backend not working**
```
Solution: Deploy backend separately
- Use Heroku, Railway, or Render
- Update API endpoints in frontend
- Configure CORS properly
```

**Issue: Environment variables not loading**
```
Solution: Check netlify.toml
- Ensure variables are in Netlify dashboard
- Restart deployment
- Clear cache
```

---

## Cost Comparison (Monthly)

| Service | Vercel | Netlify | Heroku | Total |
|---------|--------|---------|--------|-------|
| Frontend | Free | Free | - | Free |
| Backend | Free | - | $7 | $7 |
| Database | Free* | Free* | - | Free* |
| **Total** | **Free** | **$7** | - | **Free** |

*MongoDB Atlas free tier: 512MB storage

---

## Recommended Setup

**For Production:**
1. **Frontend:** Vercel (free tier)
2. **Backend:** Vercel (free tier)
3. **Database:** MongoDB Atlas (free tier)
4. **APIs:** Google Cloud (free tier)
5. **Total Cost:** $0/month initially

**When scaling:**
1. Upgrade to Vercel Pro ($20/month)
2. Upgrade MongoDB to paid tier ($57+/month)
3. Total: ~$80/month

---

## Next Steps

1. **Choose platform:** Vercel (recommended)
2. **Prepare project:** Create config files
3. **Push to GitHub:** Commit and push
4. **Connect to Vercel:** Import project
5. **Add environment variables:** Set secrets
6. **Deploy:** Click deploy button
7. **Test:** Verify all features work
8. **Monitor:** Check logs and performance

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **Express.js:** https://expressjs.com

---

## Summary

| Aspect | Vercel | Netlify |
|--------|--------|---------|
| **Setup Time** | 25-30 min | 40-50 min |
| **Complexity** | Low | Medium |
| **Cost** | Free | Free + $7 |
| **Recommendation** | ✅ BEST | Alternative |

**Recommendation:** Use **Vercel** for fastest, easiest deployment with full-stack support.

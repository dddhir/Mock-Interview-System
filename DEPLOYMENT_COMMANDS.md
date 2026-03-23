# Deployment Commands - Copy & Paste

## Step 1: Update server.js

Add this at the very end of `server.js`:

```javascript
// Export for Vercel
module.exports = app;
```

---

## Step 2: Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output** - you'll need it for Vercel environment variables.

---

## Step 3: Commit and Push to GitHub

```bash
# Stage all changes
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Push to main branch
git push origin main
```

---

## Step 4: Vercel Setup Commands

### Option A: Using Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option B: Using Web Dashboard (Recommended for first time)

1. Go to https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. Click "Import"
5. Configure and deploy

---

## Step 5: Environment Variables

### Get MongoDB URI

```bash
# You'll get something like:
# mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Get Google API Key

```bash
# You'll get something like:
# AIzaSyD...
```

### Set Environment Variables in Vercel

```bash
# Using Vercel CLI
vercel env add MONGODB_URI
# Paste: mongodb+srv://username:password@cluster.mongodb.net/dbname

vercel env add GOOGLE_GENAI_API_KEY
# Paste: AIzaSyD...

vercel env add JWT_SECRET
# Paste: (the output from Step 2)

vercel env add NODE_ENV
# Paste: production
```

---

## Step 6: Deploy

```bash
# Deploy to production
vercel --prod
```

---

## Verification Commands

### Test if deployment is live

```bash
# Replace YOUR_URL with your Vercel URL
curl https://YOUR_URL.vercel.app/api/health
```

### Check logs

```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow
```

---

## Rollback Commands

### If something goes wrong

```bash
# View all deployments
vercel list

# Rollback to previous deployment
vercel rollback

# Redeploy current version
vercel --prod
```

---

## Useful Vercel CLI Commands

```bash
# Login
vercel login

# Logout
vercel logout

# Check current project
vercel project list

# View environment variables
vercel env list

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# View deployments
vercel list

# View logs
vercel logs

# Redeploy
vercel --prod

# Rollback
vercel rollback
```

---

## Complete Deployment Script

Save this as `deploy.sh` and run `bash deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Vercel Deployment..."

# Step 1: Commit changes
echo "📝 Committing changes..."
git add .
git commit -m "Deploy to Vercel"
git push origin main

# Step 2: Install Vercel CLI
echo "📦 Installing Vercel CLI..."
npm install -g vercel

# Step 3: Login to Vercel
echo "🔐 Logging in to Vercel..."
vercel login

# Step 4: Deploy
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Check your Vercel dashboard for the live URL"
```

---

## Troubleshooting Commands

### Check Node version
```bash
node --version
# Should be 18+ for best compatibility
```

### Check npm version
```bash
npm --version
# Should be 9+
```

### Test build locally
```bash
cd client
npm run build
# Should create dist/ folder
```

### Test server locally
```bash
npm start
# Should start on port 5001
```

### Check environment variables
```bash
# View all env vars
vercel env list

# View specific env var
vercel env get MONGODB_URI
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `vercel login` | Login to Vercel |
| `vercel --prod` | Deploy to production |
| `vercel logs` | View deployment logs |
| `vercel list` | List all deployments |
| `vercel rollback` | Rollback to previous |
| `vercel env add VAR` | Add environment variable |
| `vercel env list` | List environment variables |

---

## Expected Output

### Successful Deployment
```
✅ Production: https://your-app.vercel.app
✅ Deployment complete
✅ Ready to use
```

### Check Deployment
```
curl https://your-app.vercel.app/api/health
# Should return: {"status":"OK","message":"AI Mock Interview System is running"}
```

---

## Next Steps After Deployment

```bash
# 1. Test the app
# Visit: https://your-app.vercel.app

# 2. Check logs if issues
vercel logs

# 3. Update environment variables if needed
vercel env add VARIABLE_NAME

# 4. Redeploy if changes made
vercel --prod

# 5. Set up custom domain (optional)
# In Vercel dashboard: Settings → Domains
```

---

## Emergency Rollback

If deployment breaks:

```bash
# Rollback to previous version
vercel rollback

# Or redeploy specific commit
vercel --prod --force
```

---

## Support

- **Vercel CLI Docs:** https://vercel.com/docs/cli
- **Vercel Troubleshooting:** https://vercel.com/support
- **GitHub Issues:** Your repository

---

## Summary

1. ✅ Update `server.js`
2. ✅ Generate JWT secret
3. ✅ Push to GitHub
4. ✅ Deploy with Vercel
5. ✅ Add environment variables
6. ✅ Test the app

**You're live!** 🎉

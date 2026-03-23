# Vercel Quick Start - 30 Minutes to Live

## TL;DR
1. Create config files (5 min)
2. Push to GitHub (2 min)
3. Connect to Vercel (5 min)
4. Add environment variables (5 min)
5. Deploy (10 min)
6. **Total: 27 minutes**

---

## Step 1: Create Config Files (5 minutes)

### Create `.vercelignore` in root:
```
node_modules
.git
.env.local
.DS_Store
ai-models
logs
uploads
.kiro
```

### Create `vercel.json` in root:
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
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server.js"
    }
  ]
}
```

### Update `server.js` (add at end):
```javascript
// Export for Vercel
module.exports = app;
```

---

## Step 2: Push to GitHub (2 minutes)

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

---

## Step 3: Connect to Vercel (5 minutes)

1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel
4. Click "New Project"
5. Select your repository
6. Click "Import"

---

## Step 4: Configure Project (5 minutes)

**Build Settings:**
- Framework: Node.js
- Build Command: `cd client && npm install && npm run build`
- Output Directory: `client/dist`
- Install Command: `npm install`

**Environment Variables:**
Add these in "Environment Variables" section:

```
MONGODB_URI = mongodb+srv://user:password@cluster.mongodb.net/dbname
GOOGLE_GENAI_API_KEY = your_api_key_here
JWT_SECRET = your_secret_key_here
NODE_ENV = production
```

---

## Step 5: Deploy (10 minutes)

1. Click "Deploy"
2. Wait for build (3-5 minutes)
3. Wait for deployment (2-3 minutes)
4. Get your live URL
5. Test the app

---

## Environment Variables Setup

### Get MongoDB URI:
1. Go to MongoDB Atlas
2. Click "Connect"
3. Choose "Drivers"
4. Copy connection string
5. Replace `<password>` with your password

### Get Google API Key:
1. Go to Google Cloud Console
2. Create new project
3. Enable Generative AI API
4. Create API key
5. Copy the key

### Create JWT Secret:
```bash
# Generate random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Verify Deployment

After deployment, test:

1. **Frontend loads:** Visit your Vercel URL
2. **Login works:** Try creating account
3. **Interview starts:** Create new interview
4. **Voice recording:** Test voice feature
5. **Answer submission:** Submit an answer
6. **Score displays:** Check if score appears

---

## Troubleshooting

### Build fails
```
Check: Vercel dashboard → Deployments → Failed build
Look for error messages
Common issues:
- Missing dependencies in package.json
- Environment variables not set
- Node.js version mismatch
```

### API not working
```
Check: Vercel dashboard → Functions
Ensure /api routes are working
Test with curl:
curl https://your-url.vercel.app/api/health
```

### Database connection fails
```
Check: MongoDB Atlas
- Add Vercel IP to whitelist (0.0.0.0/0 for testing)
- Verify connection string
- Check credentials
```

---

## After Deployment

### Set Custom Domain (Optional)
1. Go to Vercel dashboard
2. Project Settings → Domains
3. Add your domain
4. Update DNS records

### Monitor Performance
1. Vercel dashboard → Analytics
2. Check response times
3. Monitor errors
4. Check bandwidth usage

### Enable Auto-Deployments
1. Vercel dashboard → Git
2. Auto-deploy on push enabled by default
3. Just push to main branch to deploy

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Vercel (free tier) | $0 |
| MongoDB Atlas (free tier) | $0 |
| Google Cloud (free tier) | $0 |
| **Total** | **$0** |

---

## Timeline

| Step | Time |
|------|------|
| Create config files | 5 min |
| Push to GitHub | 2 min |
| Connect to Vercel | 5 min |
| Add environment variables | 5 min |
| Deploy | 10 min |
| **Total** | **27 min** |

---

## Success Checklist

- [ ] Config files created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Build successful
- [ ] Deployment successful
- [ ] Frontend loads
- [ ] Login works
- [ ] Interview works
- [ ] Voice recording works
- [ ] Answers submit
- [ ] Scores display

---

## Next Steps

1. ✅ Deploy to Vercel
2. 📊 Monitor performance
3. 🔧 Set up custom domain
4. 📈 Scale as needed
5. 💰 Upgrade to Pro when needed

---

## Support

- Vercel Docs: https://vercel.com/docs
- GitHub Issues: Check your repo
- Vercel Support: https://vercel.com/support

**You're live in 30 minutes!** 🚀

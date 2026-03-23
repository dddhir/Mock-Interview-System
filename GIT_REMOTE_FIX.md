# Fix Git Remote - Push to New Repository

## Problem
Git is still pointing to the old repository (`mia-rgb/ai-mock-interview-system.git`) instead of your new one (`dddhir/Mock-Interview-System.git`).

## Solution

### Step 1: Check Current Remote
```bash
git remote -v
```

You should see something like:
```
origin  https://github.com/mia-rgb/ai-mock-interview-system.git (fetch)
origin  https://github.com/mia-rgb/ai-mock-interview-system.git (push)
```

### Step 2: Remove Old Remote
```bash
git remote remove origin
```

### Step 3: Add New Remote
```bash
git remote add origin https://github.com/dddhir/Mock-Interview-System.git
```

### Step 4: Verify New Remote
```bash
git remote -v
```

Should now show:
```
origin  https://github.com/dddhir/Mock-Interview-System.git (fetch)
origin  https://github.com/dddhir/Mock-Interview-System.git (push)
```

### Step 5: Push to New Repository
```bash
git push -u origin main
```

---

## Complete Commands (Copy & Paste)

```bash
git remote remove origin
git remote add origin https://github.com/dddhir/Mock-Interview-System.git
git push -u origin main
```

---

## If You Get Permission Error

If you still get a permission error, you may need to authenticate:

### Option A: Use Personal Access Token (Recommended)
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Create new token with `repo` scope
3. Copy the token
4. Use this URL format:
```bash
git remote add origin https://YOUR_TOKEN@github.com/dddhir/Mock-Interview-System.git
```

### Option B: Use SSH (More Secure)
1. Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Add to GitHub:
   - Go to GitHub → Settings → SSH and GPG keys
   - Add new SSH key
   - Paste your public key

3. Use SSH URL:
```bash
git remote add origin git@github.com:dddhir/Mock-Interview-System.git
```

---

## Verify Push Worked

After pushing, verify on GitHub:
1. Go to https://github.com/dddhir/Mock-Interview-System
2. You should see all your files and commits

---

## Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/dddhir/Mock-Interview-System.git
```

### "Permission denied"
- Check you're using the correct GitHub username (dddhir)
- Verify the repository exists and is public/you have access
- Try using a Personal Access Token

### "Repository not found"
- Verify the repository URL is correct
- Make sure the repository exists on GitHub
- Check the repository is public or you have access

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `git remote -v` | View current remotes |
| `git remote remove origin` | Remove old remote |
| `git remote add origin URL` | Add new remote |
| `git push -u origin main` | Push to new remote |

---

## After Successful Push

Once you've pushed successfully:

1. ✅ All your code is on GitHub
2. ✅ Ready to deploy to Vercel
3. ✅ Can connect Vercel to this repository

Next: Go to https://vercel.com and import your repository!

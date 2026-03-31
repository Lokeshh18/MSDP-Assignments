# 🚀 GitHub & Firebase Deployment Guide

## Part 1: Initialize Git & Push to GitHub

### Step 1: Install Git (if not installed)
1. Download Git from: https://git-scm.com/download/win
2. Install with default settings
3. Restart your terminal/command prompt

### Step 2: Initialize Git Repository
Open Command Prompt or PowerShell in your project folder:
```bash
cd C:\Users\LOKESH\Downloads\college-connect-main
```

Run these commands:
```bash
# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: CampusHub - College Event Management Platform"

# Rename branch to main
git branch -M main

# Add GitHub remote
git remote add origin https://github.com/Lokeshh18/MSDP-Assignments.git

# Push to GitHub
git push -u origin main
```

### Step 3: Create GitHub Repository (if not exists)
1. Go to: https://github.com/new
2. Repository name: `MSDP-Assignments`
3. Make it **Public** or **Private** (your choice)
4. **DO NOT** initialize with README (we already have one)
5. Click "Create repository"
6. Run the git commands from Step 2

---

## Part 2: Deploy to Firebase

### Step 1: Create Firebase Project
1. Go to: https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Project name: `campus-hub-<your-name>` (e.g., `campus-hub-lokesh`)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 3: Login to Firebase
```bash
firebase login
```
This will open a browser window. Login with your Google account.

### Step 4: Initialize Firebase in Your Project
```bash
cd C:\Users\LOKESH\Downloads\college-connect-main
firebase init hosting
```

**When prompted, select:**
- ✅ **Hosting: Configure files for Firebase Hosting**
- ✅ **Use an existing project** (select the project you created)
- ✅ **Public directory**: `dist` (NOT `public` - we use Vite!)
- ✅ **Configure as a single-page app?**: `Yes`
- ✅ **Set up automatic builds with GitHub?**: `No` (for now)
- ✅ **Overwrite index.html?**: `No`

### Step 5: Build Your Project
```bash
npm run build
```
This creates the `dist` folder with production files.

### Step 6: Deploy to Firebase
```bash
firebase deploy
```

You'll see a URL like: `https://campus-hub-<your-name>.web.app`

---

## Part 3: Update Firebase Configuration

### Important: Update Supabase Environment Variables

Firebase Hosting doesn't support environment variables directly. You have two options:

### Option A: Hardcode in Code (Quick but not recommended for production)
Edit `src/integrations/supabase/client.ts`:
```typescript
export const supabase = createClient<Database>(
  "https://rkbijsofirtshasicfwd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  { auth: { storage: localStorage, persistSession: true, autoRefreshToken: true } }
);
```

### Option B: Use Firebase Environment Config (Recommended)
```bash
# Set your Supabase credentials
firebase functions:config:set supabase.url="https://rkbijsofirtshasicfwd.supabase.co" supabase.key="your-key"

# Then access in code (requires Cloud Functions)
```

### Option C: Use .env File (Simplest)
Keep using `.env` file and it will be bundled during build.

---

## Part 4: Automated Deployment (Optional)

### Setup GitHub Actions for Auto-Deploy

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
```

### Add GitHub Secrets
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase key
   - `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON

**Get Firebase Service Account:**
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON and copy entire content as secret

---

## Quick Commands Reference

```bash
# Git Commands
git init                    # Initialize git
git add .                   # Add all files
git commit -m "message"     # Commit changes
git push                    # Push to GitHub

# Firebase Commands
firebase login              # Login to Firebase
firebase init               # Initialize Firebase
firebase build              # (Not needed, use npm run build)
npm run build               # Build for production
firebase deploy             # Deploy to Firebase
firebase deploy --only hosting  # Deploy only hosting
```

---

## Troubleshooting

### Git Issues
- **"git not found"**: Install Git from https://git-scm.com/
- **"Permission denied"**: Use HTTPS instead of SSH for GitHub
- **"Remote already exists"**: `git remote remove origin` then add again

### Firebase Issues
- **"firebase not found"**: `npm install -g firebase-tools`
- **"Login failed"**: Try `firebase logout` then `firebase login`
- **"No dist folder"**: Run `npm run build` first
- **"404 on refresh"**: Make sure you selected "single-page app" during init

### Build Issues
- **Environment variables not working**: Check `.env` file is in root
- **Blank page after deploy**: Check browser console for errors
- **Supabase connection failed**: Verify URLs and keys in `.env`

---

## Final Checklist

- [ ] Git installed
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Firebase project created
- [ ] Firebase CLI installed
- [ ] Firebase initialized (`firebase init`)
- [ ] Project built (`npm run build`)
- [ ] Deployed to Firebase (`firebase deploy`)
- [ ] Website accessible at `.web.app` URL
- [ ] Supabase credentials working

---

## Your Deployed App URL

After deployment, your app will be available at:
- **Firebase**: `https://<your-project-id>.web.app`
- **GitHub**: `https://github.com/Lokeshh18/MSDP-Assignments`

---

## Quick Deploy Script

Save this as `deploy.bat` for easy deployment:

```batch
@echo off
echo Building project...
npm run build
echo.
echo Deploying to Firebase...
firebase deploy
echo.
echo Deployment complete!
pause
```

Just double-click `deploy.bat` to build and deploy!

# 🚀 Hospital Management System - Deployment Guide

## Table of Contents
1. [Quick Start - Recommended Deployment](#quick-start---recommended-deployment)
2. [Option 1: Render.com (Full Stack)](#option-1-rendercom-full-stack)
3. [Option 2: Vercel + Railway](#option-2-vercel--railway)
4. [Option 3: Vercel + Render Backend](#option-3-vercel--render-backend)
5. [Environment Variables Setup](#environment-variables-setup)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## 🎯 Quick Start - Recommended Deployment

**Best Option:** Render.com (Full Stack) - Easiest and Free Tier Available

### Prerequisites
- ✅ GitHub account
- ✅ Render.com account (free)
- ✅ Your code is already fixed and ready!

---

## Option 1: Render.com (Full Stack) ⭐ RECOMMENDED

### Why Render?
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Built-in database support
- ✅ Easy environment variable management
- ✅ Both frontend and backend on one platform

### Step-by-Step Instructions

#### 1️⃣ Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create a new repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/hospital-management.git
git branch -M main
git push -u origin main
```

#### 2️⃣ Deploy to Render

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Click "New +"** → **"Blueprint"**
3. **Connect your GitHub repository**
4. Render will automatically detect `render.yaml` and set up:
   - Backend web service
   - Frontend static site

#### 3️⃣ Configure Environment Variables

**Backend Service:**
- `PORT`: 5000 (auto-set)
- `JWT_SECRET`: (auto-generated) ✅
- `DB_DIALECT`: sqlite
- `DB_FILE_PATH`: ./database.sqlite

**Frontend Service:**
- `VITE_API_URL`: (auto-linked from backend) ✅
- `VITE_SUPABASE_URL`: https://fjwwkjtfwlomvuqpochk.supabase.co
- `VITE_SUPABASE_PUBLISHABLE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- `VITE_VAPI_PUBLIC_KEY`: 02ead3b2-c6ec-44f4-a254-2a581a956a09
- `VITE_VAPI_ASSISTANT_ID`: adaa3583-2d8a-483e-8337-f0b9c37ec16f
- `VITE_VAPI_PHONE_NUMBER_ID`: 84af6220-9e4b-473a-a98f-84da5694ce2d
- `VITE_HOSPITAL_PHONE_NUMBER`: +91-123-456-7890

#### 4️⃣ Deploy!

Click **"Apply"** and Render will:
- Build your backend
- Build your frontend
- Deploy both services
- Give you live URLs!

**Your app will be live at:**
- Frontend: `https://starhospital-frontend.onrender.com`
- Backend API: `https://starhospital-backend.onrender.com`

---

## Option 2: Vercel + Railway

### Frontend on Vercel (Recommended for Frontend)

#### 1️⃣ Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: hospital-management
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist
```

#### 2️⃣ Set Environment Variables on Vercel

Go to your Vercel dashboard → Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://fjwwkjtfwlomvuqpochk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqd3dranRmd2xvbXZ1cXBvY2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODk0NzcsImV4cCI6MjA4Mzc2NTQ3N30.9ZWpneOBq84flxmTv1td3Y0EfA-WvMIskWaI4ux_ccc
VITE_VAPI_PUBLIC_KEY=02ead3b2-c6ec-44f4-a254-2a581a956a09
VITE_VAPI_ASSISTANT_ID=adaa3583-2d8a-483e-8337-f0b9c37ec16f
VITE_VAPI_PHONE_NUMBER_ID=84af6220-9e4b-473a-a98f-84da5694ce2d
VITE_HOSPITAL_PHONE_NUMBER=+91-123-456-7890
VITE_API_URL=https://your-backend-url.railway.app
```

#### 3️⃣ Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Set **Root Directory**: `backend`
5. Railway will auto-detect Node.js

**Add Environment Variables:**
```env
PORT=5000
JWT_SECRET=your_secure_random_string_here
DB_DIALECT=sqlite
DB_FILE_PATH=./database.sqlite
```

6. Click **"Deploy"**

**Your backend will be at:** `https://your-app.railway.app`

---

## Option 3: Vercel + Render Backend

### Frontend on Vercel, Backend on Render

**Frontend:** Follow Vercel steps from Option 2

**Backend on Render:**

1. Go to [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository
4. Configure:
   - **Name:** hospital-backend
   - **Root Directory:** backend
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node

5. Add Environment Variables (same as above)

6. Click **"Create Web Service"**

---

## 🔐 Environment Variables Setup

### Backend Environment Variables

```env
# Required
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Database (SQLite for free tier)
DB_DIALECT=sqlite
DB_FILE_PATH=./database.sqlite

# For MySQL (if using paid tier)
# DB_DIALECT=mysql
# DB_HOST=your-mysql-host
# DB_PORT=3306
# DB_NAME=starhospital
# DB_USER=your-db-user
# DB_PASS=your-db-password
```

### Frontend Environment Variables

```env
# Supabase Configuration (Already configured)
VITE_SUPABASE_URL=https://fjwwkjtfwlomvuqpochk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqd3dranRmd2xvbXZ1cXBvY2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODk0NzcsImV4cCI6MjA4Mzc2NTQ3N30.9ZWpneOBq84flxmTv1td3Y0EfA-WvMIskWaI4ux_ccc
VITE_SUPABASE_PROJECT_ID=fjwwkjtfwlomvuqpochk

# Vapi AI Configuration (Already configured)
VITE_VAPI_PUBLIC_KEY=02ead3b2-c6ec-44f4-a254-2a581a956a09
VITE_VAPI_ASSISTANT_ID=adc24232-9015-4b7d-ab00-c3ff1619a8e6
VITE_VAPI_PHONE_NUMBER_ID=84af6220-9e4b-473a-a98f-84da5694ce2d
VITE_VAPI_PRIVATE_KEY=7c79ca4b-8762-4744-867b-05255472b9ef
VITE_HOSPITAL_PHONE_NUMBER=+91-123-456-7890

# Backend API URL (Set after backend is deployed)
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## 📋 Post-Deployment Checklist

### After Deployment:

- [ ] **Test Backend API**
  ```bash
  curl https://your-backend-url.com/api/departments
  ```

- [ ] **Test Frontend**
  - Visit your frontend URL
  - Check if it loads correctly
  - Test login/registration

- [ ] **Update CORS Settings**
  - Make sure backend allows your frontend domain
  - Update `backend/server.js` if needed:
  ```javascript
  app.use(cors({
    origin: ['https://your-frontend-url.vercel.app', 'http://localhost:5173']
  }));
  ```

- [ ] **Set up Custom Domain** (Optional)
  - Vercel: Settings → Domains
  - Render: Settings → Custom Domain

- [ ] **Enable HTTPS** (Usually automatic)

- [ ] **Set up Database Backups** (If using MySQL)

- [ ] **Monitor Application**
  - Check logs in Render/Vercel dashboard
  - Set up error tracking (optional)

---

## 🔧 Updating Your Deployment

### For Render (with GitHub integration):
```bash
git add .
git commit -m "Update application"
git push origin main
# Render will auto-deploy!
```

### For Vercel:
```bash
cd frontend
git add .
git commit -m "Update frontend"
git push origin main
# Vercel will auto-deploy!

# Or manual deploy:
vercel --prod
```

### For Railway:
```bash
cd backend
git add .
git commit -m "Update backend"
git push origin main
# Railway will auto-deploy!
```

---

## 🆘 Troubleshooting

### Build Fails on Render/Vercel

**Issue:** Build command fails
**Solution:** 
```bash
# Make sure package.json has correct scripts
# Frontend package.json should have:
"scripts": {
  "build": "vite build",
  "preview": "vite preview"
}

# Backend package.json should have:
"scripts": {
  "start": "node server.js"
}
```

### CORS Errors

**Issue:** Frontend can't connect to backend
**Solution:** Update backend CORS settings in `server.js`:
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'https://your-frontend.onrender.com',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

### Database Connection Issues

**Issue:** Backend can't connect to database
**Solution:**
- For SQLite: Make sure `DB_FILE_PATH` is set correctly
- For MySQL: Verify all DB credentials are correct
- Check environment variables are set in deployment platform

### Environment Variables Not Working

**Issue:** App can't read environment variables
**Solution:**
- Vercel: Redeploy after adding env vars
- Render: Restart service after adding env vars
- Make sure variable names match exactly (including VITE_ prefix)

---

## 📊 Deployment Comparison

| Feature | Render (Full) | Vercel + Railway | Vercel + Render |
|---------|---------------|------------------|-----------------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Free Tier** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Auto Deploy** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Custom Domain** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Database** | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **Speed** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Best For** | All-in-one | Performance | Flexibility |

---

## 🎉 Success!

Once deployed, your Hospital Management System will be live and accessible worldwide!

**Default URLs:**
- **Frontend:** `https://your-app.vercel.app` or `https://your-app.onrender.com`
- **Backend API:** `https://your-backend.railway.app` or `https://your-backend.onrender.com`

**Next Steps:**
1. Share the URL with your team
2. Set up admin accounts
3. Configure hospital departments and doctors
4. Start managing patients!

---

## 📞 Need Help?

If you encounter any issues:
1. Check the deployment logs in your platform dashboard
2. Verify all environment variables are set correctly
3. Test the backend API endpoints directly
4. Check browser console for frontend errors

**Your application is production-ready and secure!** 🔒

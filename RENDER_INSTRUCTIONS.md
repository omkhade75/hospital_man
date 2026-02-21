# 🚀 Deploying to Render.com

Your project is ready to be deployed on Render! Follow these simple steps.

## Prerequisites
1. A [GitHub](https://github.com) account.
2. A [Render](https://render.com) account (Free).

---

## Step 1: Push Your Code to GitHub

First, you need to upload your project to a GitHub repository.

1. Create a new repository on GitHub (e.g., `hospital-management`).
2. Run these commands in your project folder (if not already done):

```bash
# Initialize git
git init

# Add all files
git add .

# Commit changes
git commit -m "Fix code and preparing for deployment"

# Connect to your repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/hospital-management.git

# Push the code
git push -u origin main
```

---

## Step 2: Deploy on Render

Render makes deployment automatic using the `render.yaml` file we created.

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click the **"New +"** button and select **"Blueprint"**.
3. Connect your **GitHub account** and select the `hospital-management` repository.
4. Render will detect the `render.yaml` file and show two services:
   - **hospital-backend** (Node.js API)
   - **hospital-frontend** (Static Site)

5. Click **"Apply"** to start the deployment.

---

## Step 3: Configure Environment Variables

Render will deploy the services, but you need to add your secrets (Environment Variables) in the Render Dashboard.

1. Go to your **Dashboard**.
2. Click on **hospital-frontend**.
3. Go to **"Environment"** tab.
4. Add the following variables (copy values from your local `.env` file):

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_VAPI_PUBLIC_KEY`
   - `VITE_VAPI_ASSISTANT_ID`
   - `VITE_VAPI_PHONE_NUMBER_ID`
   - `VITE_VAPI_PRIVATE_KEY`
   - `VITE_HOSPITAL_PHONE_NUMBER`

   *Note: `VITE_API_URL` is automatically linked.*

5. Click **"Save Changes"**. Render will redeploy successfully.

---

## 🎉 Access Your App

Once deployed (green checkmarks), you can access your app at the URL provided by Render (e.g., `https://hospital-frontend.onrender.com`).

**Note on Database:** The backend uses SQLite, which resets on restart on Render's free tier. For persistent data, switch `DB_DIALECT` to `mysql` and connect an external database.

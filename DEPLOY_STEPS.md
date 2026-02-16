# How to Deploy 'hospital_man' to Render

I have prepared your code and scripts. Follow these exact steps:

## Step 1: Push Code to GitHub
1.  A new window should have opened running the deployment script.
2.  If asked, please **Authorize** GitHub in your browser.
3.  The script will automatically create the `hospital_man` repository and push your code.
    - If the script didn't run, double-click `deploy_hospital_man.ps1` in your folder.

## Step 2: Deploy on Render
1.  Go to your [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **Blueprint**.
3.  Connect your GitHub account.
4.  Select the **`hospital_man`** repository.
5.  Click **Apply**.

## Step 3: Add Environment Variables
Render will deploy the app, but you need to add your secrets manually in the Dashboard to make features work (like Login and Vapi).

1.  Click on the **`hospital-frontend`** service in Render.
2.  Go to **Environment**.
3.  Add these keys (copy values from your local `.env` file):
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_PUBLISHABLE_KEY`
    - `VITE_VAPI_PUBLIC_KEY`
    - `VITE_VAPI_ASSISTANT_ID`

**That's it! Your hospital management system is live.**

# 🚀 Vercel Deployment Guide

This guide will help you deploy your SkillsSwap project to Vercel.

## Prerequisites

1. A GitHub repository with your project
2. A Vercel account (free at [vercel.com](https://vercel.com))
3. Your Supabase project URL and anon key

## Step 1: Prepare Your Project

Your project is already configured for Vercel deployment with:
- ✅ `vercel.json` configuration file
- ✅ Environment variables setup in `src/integrations/supabase/client.ts`
- ✅ Build script in `package.json`

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "New Project"
   - Select your GitHub repository
   - Vercel will automatically detect it's a Vite project

3. **Configure Environment Variables**
   - In the project settings, go to "Environment Variables"
   - Add the following variables:
     ```
     VITE_SUPABASE_URL=https://pntykghlartojxtnxgdc.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudHlrZ2hsYXJ0b2p4dG54Z2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDg3MTIsImV4cCI6MjA2Nzg4NDcxMn0.vDd-Syovjusenyh8mMilrXk-nkKhUOSLMO7DjUOMhEw
     ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app automatically

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## Step 3: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Step 4: Set Up Automatic Deployments

- **Automatic**: Every push to your main branch will trigger a new deployment
- **Preview Deployments**: Pull requests get preview URLs automatically
- **Manual**: You can trigger deployments manually from the Vercel dashboard

## Environment Variables

Make sure these are set in your Vercel project:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure the build command is correct: `npm run build`
- Verify environment variables are set correctly

### Runtime Errors
- Check browser console for errors
- Verify Supabase connection in Network tab
- Ensure environment variables are accessible in the browser

### Common Issues
1. **Environment variables not loading**: Make sure they start with `VITE_`
2. **Supabase connection failing**: Verify URL and key are correct
3. **Build failing**: Check for TypeScript errors with `npm run lint`

## Local Development

For local development, create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://pntykghlartojxtnxgdc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudHlrZ2hsYXJ0b2p4dG54Z2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDg3MTIsImV4cCI6MjA2Nzg4NDcxMn0.vDd-Syovjusenyh8mMilrXk-nkKhUOSLMO7DjUOMhEw
```

## Security Notes

- ✅ The Supabase anon key is safe to expose in the browser
- ✅ Environment variables starting with `VITE_` are included in the build
- ✅ Never commit sensitive keys to your repository
- ✅ Use Vercel's environment variable system for production secrets

## Support

If you encounter issues:
1. Check the [Vercel documentation](https://vercel.com/docs)
2. Review the [Vite deployment guide](https://vitejs.dev/guide/static-deploy.html)
3. Check your project's build logs in Vercel dashboard 
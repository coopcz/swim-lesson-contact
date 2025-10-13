# Deployment Guide

This guide will walk you through deploying the LifeQuest Swim Comms System step-by-step.

## Before You Start

Make sure you have:
- ✅ Supabase account with project created
- ✅ Your Supabase URL and keys
- ✅ Twilio account with phone number purchased
- ✅ Resend account with API key
- ✅ GitHub account
- ✅ Vercel account

## Part 1: Database Setup (15 minutes)

### 1.1 Run Database Migrations

1. Log into your Supabase dashboard at [supabase.com](https://supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `supabase/migrations/001_initial_schema.sql` from your project
6. Copy ALL the contents
7. Paste into the Supabase SQL Editor
8. Click **Run** (bottom right corner)
9. You should see "Success. No rows returned"

10. Repeat for the second migration:
    - Click **New Query** again
    - Open `supabase/migrations/002_rls_policies.sql`
    - Copy and paste all contents
    - Click **Run**

### 1.2 Create Storage Bucket

1. In Supabase, click on **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Name it: `imports`
4. Make it **Private** (not public)
5. Click **Create bucket**

### 1.3 Create Your First User (Sarah)

1. Click on **Authentication** in the left sidebar
2. Click **Users**
3. Click **Add user** → **Create new user**
4. Enter:
   - Email: `sarah@lifequest.com` (or Sarah's real email)
   - Password: Create a strong password
   - Click **Create user**
5. **IMPORTANT**: Copy the User ID shown (it looks like: `123e4567-e89b-12d3-a456-426614174000`)

### 1.4 Create Organization and Add Sarah as Admin

1. Go back to **SQL Editor**
2. Run this query (replace `SARAH_EMAIL` with her actual email):

```sql
-- Create LifeQuest organization
INSERT INTO orgs (name) 
VALUES ('LifeQuest') 
RETURNING id;
```

3. Copy the `id` that's returned (this is your ORG_ID)

4. Now run this query (replace the IDs with your actual values):

```sql
-- Add Sarah as admin
INSERT INTO org_members (org_id, user_id, role) 
VALUES (
  'YOUR_ORG_ID_HERE',  -- The org ID from step 3
  'SARAH_USER_ID_HERE', -- Sarah's user ID from step 1.3
  'admin'
);
```

5. If successful, you'll see "Success. 1 rows affected"

## Part 2: Environment Variables (5 minutes)

### 2.1 Get Your Supabase Credentials

1. In Supabase, click on **Settings** (gear icon) → **API**
2. You'll see:
   - **Project URL** - Copy this
   - **anon public** key - Copy this
   - **service_role** key - Copy this (click to reveal)

### 2.2 Update .env.local File

1. Open `.env.local` in your project folder
2. Replace the placeholder values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
RESEND_API_KEY=your-resend-key
```

## Part 3: Test Locally (10 minutes)

### 3.1 Install Dependencies and Run

1. Open Terminal
2. Navigate to your project:
   ```bash
   cd /Users/coopcz/swim-lesson-contact
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to: http://localhost:3000

### 3.2 Test Login

1. You should see the login page
2. Enter Sarah's email and password
3. You should be redirected to the dashboard
4. If you see the dashboard with "Welcome to LifeQuest Swim Comms", it's working! 🎉

### 3.3 Test CSV Upload (Optional)

1. Create a test CSV file with these columns:
   ```
   Parent Name,Child Name,Email,Phone,Lesson Name
   John Doe,Johnny Doe,john@example.com,555-1234,Jellyfish
   Jane Smith,Janie Smith,jane@example.com,555-5678,Minos
   ```
2. Go to **Upload Roster**
3. Upload the CSV
4. Map the columns
5. Click **Import Roster**
6. Go to **Lessons** to see if they were imported

## Part 4: Deploy to Vercel (15 minutes)

### 4.1 Push to GitHub

If you haven't already:

1. Create a new repository on [github.com](https://github.com)
2. In Terminal, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - LifeQuest Swim Comms System"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

### 4.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** or **Log In** with GitHub
3. Click **Add New** → **Project**
4. Select your GitHub repository
5. Click **Import**
6. **Framework Preset**: Next.js (should auto-detect)
7. Click **Environment Variables** to expand
8. Add each variable from your `.env.local`:
   - Click **Add** for each one
   - Enter the name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the value
   - Repeat for all variables
9. Click **Deploy**
10. Wait 2-3 minutes for deployment
11. You'll get a URL like `https://swim-lesson-contact.vercel.app`

### 4.3 Update Supabase Authentication

1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add `https://your-app.vercel.app/**`
3. Click **Save**

### 4.4 Test Production

1. Visit your Vercel URL
2. Log in with Sarah's credentials
3. Test the upload flow
4. Test composing a message (don't send yet!)

## Part 5: Set Up Message Sending (Advanced)

**Note:** This requires the actual dispatcher to be implemented as a Supabase Edge Function or an external cron job.

### Option A: Vercel Cron Jobs (Recommended)

Create `app/api/cron/dispatcher/route.ts`:

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  // This route will be called by Vercel Cron every minute
  // It will process pending messages and send them via Twilio/Resend
  
  const supabase = await createServiceClient()
  
  // Get pending messages
  const { data: messages } = await supabase
    .from('message_outbox')
    .select('*')
    .eq('status', 'pending')
    .lte('send_after', new Date().toISOString())
    .lt('retry_count', 3)
    .limit(100)
  
  // Send each message...
  // (Implementation needed)
  
  return NextResponse.json({ processed: messages?.length || 0 })
}
```

Then in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/dispatcher",
    "schedule": "* * * * *"
  }]
}
```

### Option B: Supabase Edge Functions

This requires installing the Supabase CLI and deploying functions. This is more advanced and can be set up later.

## Part 6: Add Team Members

### To Add Lindsey:

1. Go to Supabase → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter Lindsey's email and create a password
4. Copy her User ID
5. Go to **SQL Editor** and run:

```sql
INSERT INTO org_members (org_id, user_id, role) 
VALUES (
  'YOUR_ORG_ID',      -- The org ID from Part 1
  'LINDSEY_USER_ID',  -- Lindsey's user ID
  'admin'             -- Or 'staff' for limited permissions
);
```

6. Send Lindsey her login credentials

## Troubleshooting

### Can't log in
- Check that the user exists in Supabase Authentication
- Check that they're in the `org_members` table
- Make sure Site URL is set correctly in Supabase

### CSV upload fails
- Check browser console for errors
- Verify storage bucket is created
- Check that migrations ran successfully

### Vercel deployment fails
- Check that all environment variables are set
- Look at the deployment logs for specific errors
- Make sure your code is pushed to GitHub

### Can't see lessons after upload
- Check Supabase logs in the dashboard
- Make sure the migrations created the tables
- Verify RLS policies are in place

## Next Steps

Once everything is deployed and working:

1. ✅ Test the complete flow: Upload → Compose → Send
2. ✅ Add Lindsey as a user
3. ✅ Create message templates
4. ✅ Test emergency alert flow
5. ✅ Set up monitoring/alerts

## Support Contacts

- **Supabase**: [supabase.com/support](https://supabase.com/support)
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Twilio**: [support.twilio.com](https://support.twilio.com)
- **Resend**: [resend.com/docs](https://resend.com/docs)

---

🎉 **Congratulations!** Your system should now be live and ready to use!


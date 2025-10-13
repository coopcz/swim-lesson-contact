# Quick Start Guide - 30 Minutes to Launch

Follow these steps IN ORDER to get your swim comms system running.

## ✅ Checklist

Before starting, make sure you have:
- [ ] Supabase account ([supabase.com](https://supabase.com))
- [ ] Twilio account with a phone number ([twilio.com](https://twilio.com))
- [ ] Resend account with API key ([resend.com](https://resend.com))
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] GitHub account ([github.com](https://github.com))

## Step 1: Set Up Database (5 min)

1. Go to your Supabase project
2. Click **SQL Editor** → **New Query**
3. Copy & paste contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**
5. Repeat for `supabase/migrations/002_rls_policies.sql`

## Step 2: Create Sarah's Account (2 min)

**In Supabase:**
1. Click **Authentication** → **Users** → **Add user**
2. Enter Sarah's email and password
3. Save the password somewhere safe!

**In SQL Editor, run these queries:**
```sql
-- Create org
INSERT INTO orgs (name) VALUES ('LifeQuest') RETURNING id;
-- Copy the org ID that's returned

-- Add Sarah (replace the IDs)
INSERT INTO org_members (org_id, user_id, role) 
VALUES ('03c72260-5f9c-44e4-a111-70c835c047f8', '367daa69-bdc5-4c7b-ad2a-778c4ed53f75', 'admin');
```

## Step 3: Add Your Keys (5 min)

Open `.env.local` and fill in:
```bash
# From Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# From Twilio Console
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# From Resend → API Keys
RESEND_API_KEY=re_...
```

## Step 4: Test Locally (5 min)

In Terminal:
```bash
cd /Users/coopcz/swim-lesson-contact
npm install
npm run dev
```

Go to http://localhost:3000 and log in with Sarah's credentials.

## Step 5: Deploy to Vercel (10 min)

**Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

**Deploy:**
1. Go to [vercel.com](https://vercel.com)
2. Click **New Project** → Import your GitHub repo
3. Add ALL environment variables from `.env.local`
4. Click **Deploy**
5. Copy your live URL (e.g., `https://swim-comms.vercel.app`)

**Update Supabase:**
1. Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`

## Step 6: Use It! (3 min)

1. Go to your Vercel URL
2. Log in as Sarah
3. Upload a CSV from Mindbody
4. Compose a test message
5. Send to yourself first!

## Done! 🎉

Your system is now live. Share the URL and Sarah's login credentials with her.

## Need Help?

- **Can't log in?** Make sure Sarah's user is in both `auth.users` AND `org_members` tables
- **CSV upload fails?** Check that you ran both migration files
- **Vercel deployment fails?** Make sure ALL environment variables are added
- **Messages not sending?** This requires the dispatcher function (see DEPLOYMENT_GUIDE.md)

## Add More Users

To add Lindsey:
1. Supabase → **Authentication** → Create user for Lindsey
2. SQL Editor: 
   ```sql
   INSERT INTO org_members (org_id, user_id, role) 
   VALUES ('YOUR_ORG_ID', 'LINDSEY_USER_ID', 'admin');
   ```

---

**For detailed instructions, see README.md and DEPLOYMENT_GUIDE.md**


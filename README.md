# LifeQuest Swim Comms System

A professional communication system for managing swim lesson notifications via email and SMS. Built for LifeQuest to enable Sarah and Lindsey to send emergency alerts and marketing campaigns to swim lesson parents.

## Features

- 📤 **CSV Upload**: Import swim lesson rosters from Mindbody
- 🏊 **Lesson Management**: View all lesson groups and enrolled parents
- ✉️ **Message Composer**: Send emails and SMS with template variables
- 📊 **Batch Monitoring**: Track delivery status in real-time
- 🚨 **Emergency Alerts**: Quick-send urgent notifications
- 🔒 **Secure**: Role-based access control with Supabase Auth
- 📱 **Responsive**: Works on desktop, tablet, and mobile

## What's Already Built

The system is fully built and includes:
- Complete frontend with Next.js
- Database schema with Supabase
- CSV upload and processing
- Message composition interface
- Delivery tracking dashboard
- User authentication and permissions

## What You Need to Do to Get It Running

### Step 1: Set Up Supabase Database

**You already have a Supabase account, now you need to set up the database:**

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the contents of `supabase/migrations/001_initial_schema.sql` 
5. Paste it into the SQL editor and click **Run**
6. Do the same for `supabase/migrations/002_rls_policies.sql`

This will create all the necessary tables for the system.

### Step 2: Create Your First Admin User

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter Sarah's email and create a password
4. Save the email and password somewhere safe - Sarah will need this to log in

5. Now go back to **SQL Editor** and run this command (replace the email with Sarah's actual email):

```sql
-- First, get Sarah's user ID
SELECT id FROM auth.users WHERE email = 'sarah@lifequest.com';

-- Create the LifeQuest organization
INSERT INTO orgs (name) VALUES ('LifeQuest') RETURNING id;

-- Add Sarah as an admin (replace USER_ID and ORG_ID with the values from above)
INSERT INTO org_members (org_id, user_id, role) 
VALUES ('ORG_ID_HERE', 'USER_ID_HERE', 'admin');
```

### Step 3: Add Environment Variables

1. Open the `.env.local` file in your project
2. Replace the placeholder values with your actual Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Get this from your Supabase project settings
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Get this from your Supabase project settings
   - `SUPABASE_SERVICE_ROLE_KEY` - Get this from your Supabase project settings (under Service Role)

### Step 4: Sign Up for Twilio (SMS Service)

**What Twilio does:** Sends text messages to parents' phones.

1. Go to [twilio.com](https://www.twilio.com)
2. Click **Sign Up** and create an account
3. Verify your phone number and email
4. **Add a payment method** (required, but they give you free trial credit)
5. **Buy a phone number:**
   - Go to **Phone Numbers** → **Buy a number**
   - Choose a number with SMS capability
   - Complete the purchase
6. **Get your credentials:**
   - Go to your Twilio Console dashboard
   - Copy your **Account SID** and **Auth Token**
   - Copy your **Phone Number** (the one you just bought)
7. Add these to your `.env.local` file:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Step 5: Sign Up for Resend (Email Service)

**What Resend does:** Sends emails to parents.

1. Go to [resend.com](https://resend.com)
2. Click **Sign Up** and create an account
3. **Verify your domain** (this is important!):
   - Go to **Domains** → **Add Domain**
   - Enter your domain (e.g., lifequest.com)
   - Resend will give you DNS records to add
   - You'll need to add these DNS records through your domain provider
   - Wait for verification (can take up to 24 hours)
4. **Get your API key:**
   - Go to **API Keys**
   - Click **Create API Key**
   - Copy the key (you can only see it once!)
5. Add this to your `.env.local` file:
   ```
   RESEND_API_KEY=your_resend_api_key_here
   ```

### Step 6: Test Locally

1. Open Terminal (on Mac, search for "Terminal" in Spotlight)
2. Navigate to your project folder:
   ```bash
   cd /Users/coopcz/swim-lesson-contact
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your web browser and go to: http://localhost:3000
5. Log in with Sarah's email and password
6. Try uploading a test CSV file

### Step 7: Deploy to Vercel (Make It Live)

**What Vercel does:** Hosts your website so anyone can access it online.

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** and sign up with GitHub
3. Click **Add New Project**
4. Import your GitHub repository (you'll need to push your code to GitHub first)
5. **Add environment variables in Vercel:**
   - In your project settings, go to **Settings** → **Environment Variables**
   - Add all the variables from your `.env.local` file:
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY
     - TWILIO_ACCOUNT_SID
     - TWILIO_AUTH_TOKEN
     - TWILIO_PHONE_NUMBER
     - RESEND_API_KEY
6. Click **Deploy**
7. Wait for deployment to finish (usually 2-3 minutes)
8. You'll get a URL like `https://swim-lesson-contact.vercel.app`

### Step 8: Push Code to GitHub

If you haven't already:

1. Go to [github.com](https://github.com) and create a new repository
2. In Terminal, run these commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

## How to Use the System

### For Sarah (Admin):

1. **Log in** at your Vercel URL
2. **Upload a roster:**
   - Export a CSV from Mindbody
   - Click "Upload Roster"
   - Map the columns (the system will auto-detect them)
   - Click "Import Roster"
3. **Send a message:**
   - Click "Compose"
   - Select a lesson group (e.g., "Jellyfish")
   - Choose Email, SMS, or Both
   - Write your message
   - Use variables like {{parent_name}} and {{child_name}}
   - Click "Preview" to see how it looks
   - Click "Send"
4. **Monitor delivery:**
   - Click "Batches" to see all sent messages
   - Click on a batch to see detailed delivery status
5. **Emergency alerts:**
   - Click the red "🚨 Emergency Alert" button in the nav bar
   - This bypasses quiet hours

### For Lindsey (Staff):

Lindsey will have the same access as Sarah. To add Lindsey:

1. In Supabase, go to **Authentication** → **Users**
2. Create a new user for Lindsey
3. Get Lindsey's user ID from the auth.users table
4. Run this SQL command:
   ```sql
   INSERT INTO org_members (org_id, user_id, role) 
   VALUES ('YOUR_ORG_ID', 'LINDSEY_USER_ID', 'admin');
   ```

## Important Notes

### SMS Opt-Out Compliance

- Every SMS automatically includes "Reply STOP to opt out"
- When someone replies STOP, they're automatically opted out
- You need to set up the Twilio webhook for this (see Advanced Setup below)

### Quiet Hours

- By default, SMS won't send between 9 PM and 7 AM
- Emergency mode bypasses this restriction
- You can change these times in the code (lib/utils.ts)

### Costs

- **Twilio:** ~$0.0079 per SMS sent (so 100 texts = $0.79)
- **Resend:** 3,000 emails/month free, then $20/month
- **Vercel:** Free for this size project
- **Supabase:** Free for this size project

### CSV Format

Your Mindbody export should include these columns:
- Parent Name
- Child Name
- Email
- Phone
- Lesson Name
- Lesson Time (optional)
- Weekday (optional)

The column mapper will auto-detect them, but you can manually map if needed.

## Troubleshooting

### "Can't connect to Supabase"
- Check that your environment variables are correct
- Make sure you ran the database migrations

### "SMS not sending"
- Check that your Twilio credentials are correct
- Make sure you have credit in your Twilio account
- Verify the phone number is valid and in E.164 format (+1234567890)

### "Email not sending"
- Check that your Resend API key is correct
- Make sure your domain is verified in Resend
- Check the Resend dashboard for error logs

### "Can't log in"
- Make sure the user exists in Supabase Authentication
- Make sure the user is added to the org_members table
- Check that the password is correct

## Next Steps (Optional Enhancements)

Once the system is working, you can add:
- [ ] Message templates library
- [ ] Scheduled messages (send later)
- [ ] Message history and analytics
- [ ] Multiple organizations support
- [ ] Automated Mindbody API sync (no CSV needed)
- [ ] SMS two-way conversations

## Support

If you need help:
1. Check the Supabase logs for database errors
2. Check the Vercel logs for deployment errors
3. Check the Twilio/Resend dashboards for delivery errors

## Built With

- **Next.js 15** - React framework
- **Supabase** - Database and authentication
- **Tailwind CSS** - Styling
- **Twilio** - SMS delivery
- **Resend** - Email delivery
- **Vercel** - Hosting

---

Made with ❤️ for LifeQuest Swim Lessons

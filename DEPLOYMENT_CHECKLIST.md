# 🚀 Deployment Checklist - LifeQuest Swim Comms

Follow this checklist to deploy your app to production. Check off each item as you complete it.

---

## Before Deployment

### ✅ Code Changes

- [x] Twilio and Resend packages installed
- [x] Dispatcher API route created (`app/api/cron/dispatcher/route.ts`)
- [x] Twilio webhook created (`app/api/webhooks/twilio-stop/route.ts`)
- [x] `vercel.json` cron configuration created
- [x] Test CSV file created (`test-roster.csv`)

### ⚠️ IMPORTANT: Update Email Address

**YOU MUST DO THIS BEFORE DEPLOYING!**

1. Open `/app/api/cron/dispatcher/route.ts`
2. Find line ~75 (in the Resend email section)
3. Change this line:
   ```typescript
   from: 'LifeQuest Swim Team <notifications@yourdomain.com>',
   ```
   to:
   ```typescript
   from: 'LifeQuest Swim Team <notifications@YOUR-VERIFIED-DOMAIN.com>',
   ```
4. Replace `YOUR-VERIFIED-DOMAIN.com` with the domain you verified in Resend
5. Save the file
6. Commit the change:
   ```bash
   git add .
   git commit -m "Update sender email address"
   git push
   ```

---

## Deployment Steps

### Step 1: Commit and Push Your Code

```bash
cd /Users/coopcz/swim-lesson-contact
git add .
git commit -m "Add message dispatcher and complete production setup"
git push origin main
```

**What this does:** Pushes all new code to GitHub, which Vercel will automatically detect and deploy.

---

### Step 2: Verify Vercel Deployment

1. Go to [vercel.com](https://vercel.com)
2. Log in to your account
3. Find your project: `swim-lesson-contact`
4. You should see a new deployment in progress
5. Wait for it to complete (usually 2-3 minutes)
6. Look for "✓ Deployment Ready"

---

### Step 3: Verify Environment Variables

Make sure ALL of these are set in Vercel:

1. In Vercel, go to your project → Settings → Environment Variables
2. Check that you have:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret!)
- [ ] `TWILIO_ACCOUNT_SID` - From Twilio console
- [ ] `TWILIO_AUTH_TOKEN` - From Twilio console
- [ ] `TWILIO_PHONE_NUMBER` - Your Twilio number (format: +1XXXXXXXXXX)
- [ ] `RESEND_API_KEY` - From Resend dashboard

**If any are missing:**
1. Click "Add New"
2. Enter the Name and Value
3. Click "Save"
4. Redeploy your app (Vercel → Deployments → Redeploy)

---

### Step 4: Verify Cron Job Is Active

1. In Vercel, go to your project → Cron Jobs tab
2. You should see: `/api/cron/dispatcher` scheduled to run every minute (`* * * * *`)
3. Status should be "Active"

**⚠️ Important:** Cron jobs require a Vercel Pro plan ($20/month). If you're on the free Hobby plan, you'll need to upgrade OR implement an alternative (contact support for options).

---

### Step 5: Configure Twilio Webhook (For SMS Opt-Outs)

1. Log into [Twilio Console](https://console.twilio.com)
2. Go to Phone Numbers → Manage → Active Numbers
3. Click on your SMS-enabled phone number
4. Scroll to "Messaging Configuration"
5. Under "A MESSAGE COMES IN":
   - Webhook: `https://YOUR-VERCEL-URL.vercel.app/api/webhooks/twilio-stop`
   - HTTP Method: `POST`
6. Click Save

**Replace `YOUR-VERCEL-URL` with your actual Vercel URL!**

---

## Testing Phase

Now it's time to test everything! Follow the comprehensive `TESTING_GUIDE.md` step by step.

### Critical Tests (Must Pass):

- [ ] **Test 1:** Login works
- [ ] **Test 2:** CSV upload works
- [ ] **Test 4:** SMS sends and arrives on your phone
- [ ] **Test 5:** Email sends and arrives in your inbox
- [ ] **Test 6:** Batch monitoring shows accurate status
- [ ] **Test 11:** SMS opt-out (reply STOP) works

**Start here:** Open `TESTING_GUIDE.md` and follow every test in order.

---

## Post-Testing Tasks

Once all tests pass:

### Update Test CSV with Your Info

Before Test 4 (SMS test), you'll need to:

1. Open `test-roster.csv`
2. Change the first row to YOUR phone number and email:
   ```
   Your Name,Child Name,your-email@example.com,+15551234567,Jellyfish,Monday,9:00 AM
   ```
3. Save the file
4. Upload this modified CSV through the app

### Clean Up (Optional)

- [ ] Delete test message batches from database (optional - they don't hurt anything)
- [ ] Remove test contacts if desired

---

## Going Live

### Step 1: Upload Real Roster

1. Export your actual roster from Mindbody as CSV
2. Log into your app at your Vercel URL
3. Go to Upload Roster
4. Upload the real CSV
5. Verify all lessons and parents imported correctly

### Step 2: Train Your Team

1. Send `USER_GUIDE.md` to Sarah and Lindsey
2. Walk them through the process once:
   - How to upload a roster
   - How to compose and send messages
   - How to monitor delivery
3. Have them send a test message with you watching

### Step 3: Send First Real Message

1. Choose a small lesson group (5-10 parents)
2. Compose a welcome or update message
3. Preview carefully
4. Send!
5. Monitor delivery on the Batches page
6. Verify a few parents received it

---

## Production Checklist

Before announcing to all staff:

- [ ] Database migrations completed in Supabase
- [ ] All environment variables set correctly
- [ ] Sender email domain verified in Resend
- [ ] Twilio webhook configured
- [ ] Cron job running (check Vercel logs)
- [ ] Test SMS received successfully
- [ ] Test email received successfully
- [ ] SMS opt-out tested and working
- [ ] Real roster uploaded successfully
- [ ] First real message sent successfully
- [ ] Team trained on how to use the system
- [ ] USER_GUIDE.md shared with Sarah and Lindsey

---

## Ongoing Maintenance

### Weekly Tasks

- [ ] Upload updated roster from Mindbody (to keep contact info current)
- [ ] Check Batches page for any failed messages
- [ ] Review delivery rates

### Monthly Tasks

- [ ] Check Twilio usage and costs
- [ ] Check Resend usage and costs
- [ ] Review Vercel logs for any errors
- [ ] Check Supabase database size

---

## Emergency Contacts & Resources

**If something breaks:**

1. **Check Vercel Logs**
   - Vercel Dashboard → Your Project → Logs
   - Filter by "Errors"

2. **Check Twilio Logs**
   - Twilio Console → Monitor → Logs → Messages

3. **Check Resend Logs**
   - Resend Dashboard → Logs

4. **Check Supabase Logs**
   - Supabase Dashboard → Logs

**Service Status Pages:**
- Vercel: [status.vercel.com](https://status.vercel.com)
- Twilio: [status.twilio.com](https://status.twilio.com)
- Supabase: [status.supabase.com](https://status.supabase.com)

---

## Success Criteria ✅

Your deployment is successful when:

1. ✅ You can log in
2. ✅ You can upload a CSV roster
3. ✅ You can compose a message
4. ✅ You receive test SMS on your phone
5. ✅ You receive test email in your inbox
6. ✅ Batches page shows accurate delivery status
7. ✅ SMS opt-out (STOP reply) works
8. ✅ Sarah and Lindsey can use the system independently

---

## What You've Built 🎉

Congratulations! You now have a fully functional swim lesson communication system with:

- **Roster Management** - Upload from Mindbody, auto-create lesson groups
- **Multi-Channel Messaging** - Send emails and SMS with one click
- **Personalization** - Template variables for custom messages
- **Delivery Tracking** - Real-time monitoring of message delivery
- **Compliance** - SMS opt-out support, quiet hours enforcement
- **Emergency Alerts** - Quick urgent message sending
- **Professional UI** - Clean, branded, mobile-responsive interface
- **Automated Processing** - Cron job sends messages automatically
- **Error Handling** - Retry logic, failure tracking, detailed logging

**This is impressive work for your first software project!** 🚀

---

## Next Steps

1. **Complete this checklist** ✓
2. **Update the sender email address** (CRITICAL!)
3. **Deploy to Vercel** (git push)
4. **Run through TESTING_GUIDE.md** (every test)
5. **Upload real roster**
6. **Send first real message**
7. **Train your team**
8. **Celebrate!** 🎊

You're ready to go live! Good luck! 🌟


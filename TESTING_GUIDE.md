# Testing Guide - LifeQuest Swim Comms System

This guide will walk you through testing every feature of your swim lesson communication system. Follow these steps **after you've deployed to Vercel**.

---

## Prerequisites

Before you start testing, make sure you have:

- ✅ Deployed the app to Vercel
- ✅ All environment variables set in Vercel
- ✅ Database migrations run in Supabase
- ✅ A user account created (Sarah's account)
- ✅ Your Vercel app URL (e.g., `https://swim-lesson-contact.vercel.app`)

---

## Test 1: Login and Dashboard

### What You're Testing
- User authentication works
- Dashboard displays correctly
- Navigation works

### Steps

1. **Open your Vercel URL in a browser**
   - You should see the login page

2. **Log in with your credentials**
   - Enter Sarah's email and password
   - Click "Sign In"

3. **Verify you're redirected to the dashboard**
   - You should see: "Welcome to LifeQuest Swim Comms"
   - Quick stats should show (even if zeros)
   - You should see 4 quick action cards: Upload Roster, Send Message, View Lessons, View Batches

4. **Test navigation**
   - Click each link in the top navigation bar
   - Verify all pages load without errors

### ✅ Success Criteria
- Login works
- Dashboard loads
- All navigation links work
- No error messages

---

## Test 2: CSV Upload and Roster Import

### What You're Testing
- File upload functionality
- CSV parsing
- Column mapping
- Database insertion

### Steps

1. **Go to Upload Roster page**
   - Click "Upload Roster" from the dashboard

2. **Upload the test CSV**
   - Find the `test-roster.csv` file in your project folder
   - Either drag and drop it onto the upload area, OR click "Browse Files"

3. **Map the columns**
   - The system should show you the CSV headers
   - Map each field:
     - Parent Name → "Parent Name"
     - Child Name → "Child Name"
     - Email → "Email"
     - Phone → "Phone"
     - Lesson Name → "Lesson Name"
     - Weekday → "Weekday"
     - Lesson Time → "Lesson Time"
   - Review the preview (first 5 rows shown)

4. **Click "Import Roster"**
   - Wait for processing (should take 5-10 seconds)
   - You should see a success message

5. **Verify the import**
   - Click "View Lessons"
   - You should see all the lesson groups from the CSV:
     - Jellyfish (Monday 9:00 AM) - 2 students
     - Minos (Monday 10:00 AM) - 2 students
     - Seahorse (Tuesday 9:00 AM) - 2 students
     - Stingray (Tuesday 10:00 AM) - 2 students
     - Starfish (Wednesday 9:00 AM) - 2 students
     - Dolphin (Wednesday 10:00 AM) - 2 students
     - Shark (Thursday 9:00 AM) - 2 students
     - Whale (Thursday 10:00 AM) - 2 students

6. **Click on one lesson group**
   - You should see the enrolled parents with their contact info
   - Email and phone numbers should be displayed

### ✅ Success Criteria
- CSV uploads successfully
- Column mapping works
- Import completes without errors
- All lessons appear in the lessons page
- All parents are associated with correct lessons
- Contact information is correct

---

## Test 3: Message Composition (Preview Only)

### What You're Testing
- Lesson selection
- Channel selection
- Message composition
- Template variables
- Preview functionality

### Steps

1. **Go to Compose Message**
   - Click "Send Message" from dashboard

2. **Select a lesson group**
   - Choose "Jellyfish" from the dropdown
   - You should see recipients appear on the right (2 parents)

3. **Choose a channel**
   - Select "Both" (Email + SMS)

4. **Write a subject line** (for email)
   ```
   Swim Lesson Reminder for {{child_name}}
   ```

5. **Write message body**
   ```
   Hi {{parent_name}},

   This is a friendly reminder about {{child_name}}'s swim lesson in the {{lesson_name}} group.

   Lesson time: {{lesson_time}}
   Date: {{date}}

   Please arrive 5 minutes early. Don't forget to bring a towel!

   See you at the pool!
   - LifeQuest Swim Team
   ```

6. **Check the recipients**
   - All recipients should be selected by default
   - You should see email (📧) and phone (📱) icons
   - The button should say "Send to 2 Parents"

7. **Click Preview**
   - A modal should open showing the message
   - Verify that variables are replaced with actual data:
     - `{{parent_name}}` → "Sarah Cooper" (or whoever is first)
     - `{{child_name}}` → "Emma Cooper"
     - `{{lesson_name}}` → "Jellyfish"
     - `{{lesson_time}}` → "9:00 AM"
     - `{{date}}` → Today's date

8. **Close the preview**
   - Click "Close"
   - **DON'T CLICK SEND YET** - we'll do a real test next

### ✅ Success Criteria
- Lesson selection works
- Recipients load correctly
- Message composition works
- Template variables show in the text
- Preview shows variables replaced correctly
- SMS character count shows (if SMS selected)

---

## Test 4: Send Test Message (SMS to Yourself)

### What You're Testing
- Actual message sending via Twilio
- Message queueing
- Dispatcher cron job
- Delivery tracking

### ⚠️ Important Setup First

Before this test, you need to:

1. **Update the test CSV with YOUR phone number and email**
   - Open `test-roster.csv`
   - Change the first row (Sarah Cooper) to use YOUR real phone number
   - Change the email to YOUR real email address
   - Save the file

2. **Re-upload the roster**
   - Go to Upload Roster
   - Upload the modified CSV
   - Complete the import (it will update existing records)

### Steps

1. **Go to Compose Message**

2. **Select "Jellyfish" lesson**

3. **Choose channel: SMS Only**

4. **Write a simple test message**
   ```
   Hi {{parent_name}}, this is a test message for {{child_name}}. If you receive this, the system works!
   ```

5. **Check recipients**
   - UNCHECK everyone except the first parent (the one with YOUR phone number)
   - Button should say "Send to 1 Parent"

6. **Click "Send to 1 Parent"**
   - Confirm the send

7. **You should be redirected to the Batch detail page**
   - Status should show "Sending" or "Pending"
   - You should see 1 message in the queue

8. **Wait 1-2 minutes**
   - The Vercel cron job runs every minute
   - Refresh the page after 1 minute
   - Status should change to "Sent"

9. **Check your phone**
   - You should receive a text message
   - Message should have your name and personalization
   - Message should end with "Reply STOP to opt out"

### ✅ Success Criteria
- Message queues successfully
- Batch detail page shows message in queue
- After 1-2 minutes, status changes to "Sent"
- You receive the SMS on your phone
- SMS has correct personalization
- SMS includes opt-out footer

### ❌ If It Doesn't Work

**If status stays "Pending" for more than 5 minutes:**
1. Check Vercel logs:
   - Go to Vercel dashboard → Your project → Logs
   - Look for errors from the `/api/cron/dispatcher` function
2. Check environment variables:
   - Make sure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are set
3. Check phone number format:
   - Must be in format: +1XXXXXXXXXX (E.164 format)

**If you don't receive the SMS:**
1. Check if the phone number in the database is correct
2. Go to Twilio dashboard → Monitor → Logs
3. Look for the message send attempt and any errors

---

## Test 5: Send Test Email

### What You're Testing
- Email sending via Resend
- Email formatting
- HTML email rendering

### Steps

1. **Go to Compose Message**

2. **Select "Jellyfish" lesson**

3. **Choose channel: Email Only**

4. **Write a subject**
   ```
   Test Email for {{child_name}}'s Swim Lesson
   ```

5. **Write message body**
   ```
   Hi {{parent_name}},

   This is a test email to confirm the system is working correctly.

   Student: {{child_name}}
   Lesson: {{lesson_name}}
   Time: {{lesson_time}}

   If you receive this email with proper formatting, everything is working!

   Best regards,
   LifeQuest Swim Team
   ```

6. **Select ONLY the recipient with YOUR email**
   - Uncheck all others

7. **Click Send**
   - Confirm

8. **Check the batch page**
   - Should show "Sending" then "Sent"

9. **Check your email inbox**
   - You should receive an email
   - Email should have:
     - LifeQuest branding (orange header)
     - Your personalized message
     - Professional formatting
     - Footer with opt-out info

### ✅ Success Criteria
- Email queues successfully
- Status changes to "Sent"
- Email arrives in your inbox
- Email has proper HTML formatting
- Variables are replaced correctly
- LifeQuest branding appears

### ⚠️ Important Note About Email

The dispatcher code has a placeholder email address:
```
from: 'LifeQuest Swim Team <notifications@yourdomain.com>'
```

**You need to update this to your verified Resend domain!**

In `/app/api/cron/dispatcher/route.ts`, line ~75, change:
```typescript
from: 'LifeQuest Swim Team <notifications@yourdomain.com>',
```
to:
```typescript
from: 'LifeQuest Swim Team <notifications@yourverifieddomain.com>',
```

Replace `yourverifieddomain.com` with the domain you verified in Resend.

---

## Test 6: Batch Monitoring

### What You're Testing
- Batch list page
- Batch details
- Delivery statistics
- Real-time updates

### Steps

1. **Go to "View Batches"**

2. **You should see all your test batches**
   - Latest at the top
   - Each showing: date, subject/preview, recipient count, status

3. **Click on any batch**

4. **Verify batch details page shows:**
   - Message subject and body
   - Lesson group
   - Channel (SMS, Email, or Both)
   - Created date/time
   - Delivery statistics:
     - Total messages
     - Sent count (green)
     - Pending count (yellow)
     - Failed count (red)

5. **Check the message list**
   - Each individual message should show:
     - Recipient name
     - Email or phone
     - Status (sent/pending/failed)
     - Timestamp (when sent)

### ✅ Success Criteria
- Batch list shows all sent batches
- Batch details show complete information
- Statistics are accurate
- Message statuses are correct

---

## Test 7: Multiple Recipients

### What You're Testing
- Sending to multiple people
- Batch processing
- Handling multiple messages

### Steps

1. **Update the test CSV**
   - Add YOUR phone number and email to 3-4 different rows
   - Re-upload the roster

2. **Compose a message**
   - Select a lesson with multiple recipients (that all have your contact info)
   - Choose "Both" channel
   - Write a simple message

3. **Send to all selected recipients**

4. **Monitor the batch**
   - You should see multiple messages queue up
   - All should process within 2-3 minutes

5. **Check your phone and email**
   - You should receive multiple texts and emails
   - Each should be personalized with different names

### ✅ Success Criteria
- All messages queue successfully
- All messages get sent
- You receive all texts and emails
- Each message has correct personalization

---

## Test 8: Template Variables

### What You're Testing
- All template variable types
- Variable replacement accuracy

### Steps

1. **Compose a message with ALL variables**
   ```
   Hi {{parent_name}},

   Student name: {{child_name}}
   Lesson: {{lesson_name}}
   Time: {{lesson_time}}
   Date: {{date}}

   All variables should be replaced correctly!
   ```

2. **Preview the message**
   - Verify each variable is replaced
   - Check that no `{{}}` remain in the preview

3. **Send to yourself**

4. **Check received message**
   - All variables should be replaced with actual data
   - No `{{variable_name}}` text should appear

### ✅ Success Criteria
- All variables are replaced correctly
- No broken variables in delivered message
- Data is accurate for each recipient

---

## Test 9: Failed Message Handling

### What You're Testing
- Error handling
- Retry logic
- Failure reporting

### Steps

1. **Create a client with invalid phone number**
   - In your test CSV, add a row with phone: "000-0000"
   - Upload the roster

2. **Send SMS to that lesson group**

3. **Check the batch after 2-3 minutes**
   - The message to invalid number should show "Failed"
   - Error message should be displayed
   - Other messages should still be sent

4. **Check retry behavior**
   - Failed messages will retry automatically
   - After 3 failed attempts, status stays "Failed"

### ✅ Success Criteria
- Invalid messages fail gracefully
- Error messages are helpful
- Valid messages still send
- Retry logic works (check Vercel logs)

---

## Test 10: Emergency Alert

### What You're Testing
- Emergency mode
- Urgent message sending
- Bypassing quiet hours (optional)

### Steps

1. **Find the Emergency Alert button**
   - Should be in the top navigation (if you're admin)
   - Icon: 🚨

2. **Click Emergency Alert**
   - You should be taken to compose page
   - Should see red banner: "EMERGENCY MODE"
   - Subject and body pre-filled with emergency template

3. **Select lesson and send**
   - Choose a lesson
   - Send to yourself
   - Should send immediately (bypasses quiet hours)

### ✅ Success Criteria
- Emergency button accessible to admin
- Pre-filled emergency template appears
- Messages send immediately
- Red warning banner shows

---

## Test 11: SMS Opt-Out

### What You're Testing
- SMS opt-out webhook
- Database update on STOP reply

### Steps

1. **Send yourself an SMS** (using tests above)

2. **Reply "STOP" to that SMS**

3. **Check for auto-reply**
   - You should get a confirmation message: "You have been unsubscribed..."

4. **Try sending another SMS to yourself**
   - The system should skip you (no SMS opt-out)
   - Or send only email if channel is "Both"

### ✅ Success Criteria
- Reply "STOP" works
- Auto-reply confirmation sent
- Database updates `sms_opt_out = true`
- Future SMS messages skip opted-out users

### ⚠️ Webhook Setup Required

For this to work, you need to configure Twilio:

1. Go to Twilio Console → Phone Numbers
2. Click your phone number
3. Scroll to "Messaging"
4. Set webhook URL: `https://your-vercel-url.vercel.app/api/webhooks/twilio-stop`
5. Method: POST
6. Save

---

## Test 12: Lessons Page

### What You're Testing
- Lesson list display
- Lesson details
- Enrollment information

### Steps

1. **Go to "View Lessons"**

2. **Verify all lessons appear**
   - Should see all lesson groups from your CSV
   - Each showing: name, day, time, enrollment count

3. **Click on a lesson**
   - Should see detail page
   - All enrolled parents listed
   - Contact information displayed
   - "Send Message" button should work

4. **Click "Send Message to This Lesson"**
   - Should open compose page
   - Lesson pre-selected

### ✅ Success Criteria
- All lessons display correctly
- Enrollment counts accurate
- Lesson details show all students
- Quick send button works

---

## Test 13: Mobile Responsiveness

### What You're Testing
- Mobile display
- Touch interactions
- Responsive design

### Steps

1. **Open the app on your phone**
   - Or use browser dev tools → mobile view

2. **Test all pages:**
   - Login
   - Dashboard
   - Upload
   - Compose
   - Lessons
   - Batches

3. **Verify:**
   - Text is readable (not too small)
   - Buttons are tappable
   - Forms work on mobile
   - Navigation menu works
   - No horizontal scrolling

### ✅ Success Criteria
- App works on mobile devices
- All features accessible
- Good user experience on small screens

---

## Final Checklist

Before going live with real data, verify:

- ✅ CSV upload works perfectly
- ✅ SMS sends and arrives
- ✅ Emails send and arrive with formatting
- ✅ Template variables work correctly
- ✅ Batch monitoring accurate
- ✅ Failed messages handled gracefully
- ✅ SMS opt-out works
- ✅ Emergency alerts work
- ✅ Mobile experience is good
- ✅ No errors in Vercel logs
- ✅ All pages load quickly

---

## Going to Production

Once all tests pass:

1. **Clean up test data** (optional)
   - Delete test batches from database if desired
   - Or leave them - they won't hurt anything

2. **Upload REAL Mindbody roster**
   - Export from your actual Mindbody account
   - Upload to the system
   - Verify all lessons and parents import correctly

3. **Send your first real message!**
   - Start with a small lesson group
   - Send a welcome message or update
   - Monitor delivery

4. **Train your team**
   - Share the USER_GUIDE.md with Sarah and Lindsey
   - Walk them through the process once
   - They'll be pros in no time!

---

## Troubleshooting Common Issues

### Messages stuck in "Pending"

**Check:**
1. Vercel cron is running (check Vercel dashboard → Cron Jobs)
2. Environment variables are set
3. Vercel logs for errors

**Fix:**
- Manually trigger cron in Vercel dashboard
- Check dispatcher logs for specific errors

### SMS not sending

**Check:**
1. Twilio credentials correct
2. Twilio phone number verified
3. Phone numbers in E.164 format (+1XXXXXXXXXX)

**Fix:**
- Check Twilio logs
- Verify phone number format
- Check Twilio account balance

### Emails not sending

**Check:**
1. Resend API key correct
2. Sender domain verified in Resend
3. Update `from` address in dispatcher code

**Fix:**
- Verify domain in Resend dashboard
- Update sender email address
- Check Resend logs

### Cron not running

**Check:**
1. `vercel.json` deployed correctly
2. Cron enabled for your Vercel plan (requires Pro plan)

**Fix:**
- Upgrade Vercel plan if needed
- Or implement polling system as alternative

---

## Success! 🎉

If all tests pass, your system is ready for production use!

You now have a fully functional swim lesson communication system that can:
- Upload rosters from Mindbody
- Send personalized emails and SMS
- Track delivery in real-time
- Handle failures gracefully
- Support emergency alerts
- Respect opt-outs

**Congratulations on building your first software project!** 🚀

---

## Need Help?

If you encounter issues during testing:

1. Check Vercel logs (Vercel dashboard → Your project → Logs)
2. Check Supabase logs (Supabase dashboard → Logs)
3. Check Twilio logs (Twilio console → Monitor → Logs)
4. Check Resend logs (Resend dashboard → Logs)

Most issues can be traced through these logs!


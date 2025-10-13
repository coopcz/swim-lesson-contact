# LifeQuest Swim Comms - User Guide

**Welcome!** This guide will help you use the swim lesson communication system to send emails and text messages to parents.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Uploading Your Roster](#uploading-your-roster)
3. [Sending Messages](#sending-messages)
4. [Monitoring Delivery](#monitoring-delivery)
5. [Emergency Alerts](#emergency-alerts)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Go to your app URL (provided by your administrator)
2. Enter your email and password
3. Click **Sign In**

You'll be taken to the dashboard where you can see:
- Total number of parents in your system
- Number of lesson groups
- Messages sent

---

## Uploading Your Roster

You need to upload your roster from Mindbody so the system knows who to contact.

### Step 1: Export from Mindbody

1. Log into your Mindbody account
2. Go to **Reports**
3. Export your class roster as a CSV file
4. Make sure the export includes: Parent Name, Child Name, Email, Phone, Lesson Name
5. Save the CSV file to your computer

### Step 2: Upload to the System

1. Click **Upload Roster** from the dashboard
2. Either:
   - **Drag and drop** the CSV file onto the upload area, OR
   - Click **Browse Files** and select the file
3. The system will automatically detect your columns

### Step 3: Map Your Columns

The first time you upload, you'll need to tell the system which column is which:

- **Parent Name** → Select the column with parent/guardian names
- **Child Name** → Select the column with student names
- **Email** → Select the email column
- **Phone** → Select the phone number column
- **Lesson Name** → Select the class/lesson name (e.g., "Jellyfish", "Minos")
- **Weekday** (optional) → Day of the week
- **Lesson Time** (optional) → Time of the lesson

4. Click **Import Roster**
5. Wait for confirmation that the upload was successful

**Note:** The system remembers your column mapping, so future uploads will be faster!

### What Happens Next?

The system will:
- Create lesson groups automatically
- Add all parents to their child's lesson group
- Update existing parent information if they're already in the system

---

## Sending Messages

### Step 1: Compose Your Message

1. Click **Send Message** from the dashboard
2. **Select a Lesson Group**: Choose which class you want to message (e.g., "Jellyfish Monday 9:00 AM")
3. **Choose Channel**: 
   - **Email Only** - Send via email
   - **SMS Only** - Send via text message
   - **Both** - Send both email and text

### Step 2: Write Your Message

**For Email:**
- Enter a **Subject Line** (e.g., "Pool Closure Tomorrow")
- Write your **Message** in the text box

**For SMS:**
- Just write your **Message** (no subject needed)
- Keep it under 160 characters if possible (longer messages count as multiple texts)

### Step 3: Use Template Variables

You can personalize messages with these special codes:

- `{{parent_name}}` - Will be replaced with the parent's name
- `{{child_name}}` - Will be replaced with the child's name  
- `{{lesson_name}}` - Will be replaced with the lesson group name
- `{{lesson_time}}` - Will be replaced with the lesson time
- `{{date}}` - Will be replaced with today's date

**Example:**
```
Hi {{parent_name}},

This is a reminder that {{child_name}}'s swim lesson in {{lesson_name}} 
is tomorrow at {{lesson_time}}.

See you at the pool!
- LifeQuest Swim Team
```

Will become:
```
Hi Sarah Cooper,

This is a reminder that Emma Cooper's swim lesson in Jellyfish 
is tomorrow at 9:00 AM.

See you at the pool!
- LifeQuest Swim Team
```

### Step 4: Select Recipients

On the right side, you'll see all parents in the selected lesson:
- By default, **everyone is selected**
- Uncheck anyone you don't want to message
- You can see who has email (📧) and phone (📱) icons

### Step 5: Preview and Send

1. Click **Preview** to see how your message will look
2. Review it carefully - check for typos!
3. When ready, click **Send to X Parents**
4. Confirm that you want to send

---

## Monitoring Delivery

### Viewing Message Batches

1. Click **View Batches** from the dashboard
2. You'll see a list of all messages you've sent
3. Each batch shows:
   - Date and time sent
   - Subject/preview of message
   - How many messages were sent
   - Delivery status

### Checking Delivery Status

Click on any batch to see detailed delivery information:

- **Sent** (green) - Message delivered successfully
- **Pending** (yellow) - Message is waiting to be sent
- **Failed** (red) - Message couldn't be delivered

### What If Messages Failed?

If some messages failed:

1. Click on the batch to see details
2. Look at the error message (usually "invalid phone number" or "invalid email")
3. Fix the contact information in your Mindbody roster
4. Upload the updated roster
5. Click **Retry Failed Messages** to try again

**OR**

- Download the failed recipients as a CSV
- Contact them by phone directly

---

## Emergency Alerts

For urgent situations (pool closure, emergency, etc.), use the **Emergency Alert** feature:

### How to Send an Emergency Alert

1. Look for the **🚨 Emergency Alert** button in the top navigation bar
2. Click it
3. You'll be taken to the compose page with:
   - Pre-filled urgent subject line
   - Emergency message template
4. Select your lesson group(s)
5. Edit the message as needed
6. **Important:** Emergency messages will bypass quiet hours and send immediately
7. Click **Send**

### When to Use Emergency Alerts

- Pool is closed unexpectedly
- Weather emergency (lightning)
- Schedule change affecting multiple classes
- Safety issues

**Note:** Only administrators can send emergency alerts.

---

## Troubleshooting

### "Invalid phone number" errors

**Problem:** Some text messages failed with "invalid phone number"

**Solution:** 
- Phone numbers must include area code
- Must be 10 digits for US numbers
- Format doesn't matter (555-1234, (555) 123-4567, 5551234567 all work)
- Update the phone in Mindbody and re-upload the roster

### "Invalid email address" errors

**Problem:** Some emails bounced or failed

**Solution:**
- Check for typos in the email address (missing @, .com vs .con)
- Make sure the email address is complete
- Update in Mindbody and re-upload

### Messages are stuck in "Pending"

**Problem:** Messages show as pending for more than 5 minutes

**Solution:**
- This is usually a temporary issue
- Messages will retry automatically
- If still pending after 30 minutes, contact your system administrator

### "Quiet Hours" blocking my message

**Problem:** You need to send a message but it's blocked by quiet hours (9 PM - 7 AM)

**Solution:**
- Use the **Emergency Alert** feature if it's truly urgent (bypasses quiet hours)
- OR wait until after 7 AM to send
- Regular messages won't send during quiet hours to respect parents' time

### Can't find a lesson group

**Problem:** You uploaded a roster but don't see the lesson group

**Solution:**
- Go to **View Lessons** to see all groups
- If it's missing, check that the CSV had a lesson name in that column
- Re-upload the roster if needed

### Parents didn't receive messages

**Problem:** Messages show as "Sent" but parents say they didn't get them

**Solution:**

**For Text Messages:**
- Ask if they've blocked the number
- Check if they previously replied STOP (they'll be opted out)
- Verify their phone number is correct

**For Emails:**
- Ask them to check spam/junk folder
- Have them add your email to contacts
- Verify their email address is correct

---

## Tips for Success

### ✅ Do's

- **Test first:** Send a test message to yourself before sending to everyone
- **Keep it short:** Shorter messages are more likely to be read
- **Use variables:** Personalize with parent and child names
- **Preview:** Always preview before sending
- **Update regularly:** Upload your roster weekly to keep contact info current

### ❌ Don'ts

- **Don't send too often:** Parents appreciate important updates, not spam
- **Don't use ALL CAPS:** Looks like shouting
- **Don't skip preview:** Typos happen!
- **Don't send during quiet hours:** Unless it's a true emergency
- **Don't forget opt-outs:** If someone opts out, respect their choice

---

## Getting Help

If you run into issues:

1. Check this guide first
2. Contact your system administrator
3. Check the **Batches** page for specific error messages

---

## Quick Reference

| Task | Steps |
|------|-------|
| Upload roster | Upload Roster → Drop CSV → Map Columns → Import |
| Send message | Compose → Select Lesson → Choose Channel → Write → Preview → Send |
| Check delivery | View Batches → Click on batch |
| Emergency alert | Click 🚨 button in nav → Write → Send |
| View lessons | View Lessons from dashboard |

---

**You've got this!** The system is designed to be simple and straightforward. If you follow these steps, you'll be communicating with parents efficiently in no time.

Questions? Contact your administrator.


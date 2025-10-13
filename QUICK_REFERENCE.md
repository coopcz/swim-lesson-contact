# Quick Reference Card - LifeQuest Swim Comms

Keep this handy for quick access to important information!

---

## 🔗 Important URLs

**Your App:** `https://YOUR-VERCEL-URL.vercel.app` (replace with your actual URL)

**Admin Dashboards:**
- Vercel: [vercel.com/dashboard](https://vercel.com/dashboard)
- Supabase: [supabase.com/dashboard](https://supabase.com/dashboard)
- Twilio: [console.twilio.com](https://console.twilio.com)
- Resend: [resend.com/dashboard](https://resend.com/dashboard)

---

## 🚀 Quick Actions

### Upload a Roster
1. Export CSV from Mindbody
2. Go to Upload Roster
3. Drop the CSV file
4. Map columns (first time only)
5. Click Import

### Send a Message
1. Go to Compose Message
2. Select lesson group
3. Choose Email, SMS, or Both
4. Write message (use {{variables}})
5. Preview
6. Send

### Check Delivery
1. Go to View Batches
2. Click on any batch
3. See sent/pending/failed status

### Emergency Alert
1. Click 🚨 in top nav
2. Select lesson groups
3. Edit emergency message
4. Send immediately

---

## 📝 Template Variables

Use these in your messages:

```
{{parent_name}}    - Parent's full name
{{child_name}}     - Child's full name
{{lesson_name}}    - Lesson group name
{{lesson_time}}    - Lesson time
{{date}}           - Today's date
```

**Example:**
```
Hi {{parent_name}}, reminder about {{child_name}}'s 
swim lesson in {{lesson_name}} at {{lesson_time}}.
```

---

## ⚙️ Environment Variables

Make sure these are set in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
RESEND_API_KEY
```

---

## 🔧 Troubleshooting

### Messages Stuck in Pending
- Check Vercel logs
- Verify cron job is running
- Check environment variables

### SMS Not Sending
- Check Twilio logs
- Verify phone numbers have +1 prefix
- Check Twilio account balance

### Email Not Sending  
- Verify domain in Resend
- Check sender email address
- Look at Resend logs

### Can't Upload CSV
- Make sure file is .csv format
- Check file has required columns
- Try with test-roster.csv first

---

## 📊 Key Metrics to Watch

**Daily:**
- Delivery success rate (should be >95%)
- Failed message count
- Cron job last run time

**Weekly:**
- Total messages sent
- SMS usage (Twilio costs)
- Email usage (Resend limits)

**Monthly:**
- Cost per message
- Parent engagement
- Opt-out rate

---

## 🆘 When Things Go Wrong

1. **Check the logs** (Vercel, Twilio, Resend, Supabase)
2. **Look for error messages** (usually very descriptive)
3. **Check environment variables** (most common issue)
4. **Restart the cron** (Vercel dashboard)
5. **Re-deploy if needed** (sometimes fixes weird issues)

---

## 📞 Support Resources

**Documentation:**
- `USER_GUIDE.md` - For Sarah and Lindsey
- `TESTING_GUIDE.md` - Complete testing instructions
- `DEPLOYMENT_CHECKLIST.md` - Deployment steps
- `DEPLOYMENT_GUIDE.md` - Original setup guide

**Service Docs:**
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Twilio: [twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- Resend: [resend.com/docs](https://resend.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)

---

## 💰 Monthly Costs (Estimated)

**Vercel:** $20/month (Pro plan for cron jobs)
**Twilio:** ~$0.0079 per SMS (estimate $10-50/month depending on volume)
**Resend:** Free up to 3,000 emails/month, then $20/month
**Supabase:** Free tier covers most needs, Pro $25/month if needed

**Total estimated:** $30-95/month depending on volume

---

## ✅ Success Checklist

- [ ] App deployed to Vercel
- [ ] All environment variables set
- [ ] Cron job running
- [ ] Test SMS received
- [ ] Test email received
- [ ] Real roster uploaded
- [ ] First message sent successfully
- [ ] Team trained

---

## 🎯 Best Practices

**Do's:**
- ✅ Test with yourself first
- ✅ Preview before sending
- ✅ Use template variables
- ✅ Update roster weekly
- ✅ Check delivery status
- ✅ Keep messages short and clear

**Don'ts:**
- ❌ Don't send during quiet hours (unless emergency)
- ❌ Don't spam parents with too many messages
- ❌ Don't forget to preview
- ❌ Don't ignore failed messages
- ❌ Don't share login credentials
- ❌ Don't ignore opt-outs

---

## 📱 Quick Commands

**Deploy changes:**
```bash
cd /Users/coopcz/swim-lesson-contact
git add .
git commit -m "Your change description"
git push origin main
```

**Check local logs:**
```bash
cd /Users/coopcz/swim-lesson-contact
npm run dev
# Then visit http://localhost:3000
```

**Update packages:**
```bash
cd /Users/coopcz/swim-lesson-contact
npm update
```

---

## 🎉 You Did It!

This is an amazing accomplishment for your first software project. You've built a professional, production-ready system that will save time and improve communication.

**Remember:** Every successful app has bugs and issues. Don't panic when something goes wrong - just check the logs, find the error message, and fix it step by step.

You've got this! 💪


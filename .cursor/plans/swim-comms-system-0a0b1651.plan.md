<!-- 0a0b1651-6bc9-4355-95a6-4c49e26ca47b b272ccbc-d48e-455b-b253-4be685da1796 -->
# Swim Comms System - Implementation Plan

## Phase 1: Project Foundation & Setup

### 1.1 Initialize Next.js Project

- Create Next.js 14+ project with TypeScript, App Router, and Tailwind CSS
- Configure LifeQuest brand colors (white background, orange #F6871F)
- Set up project structure: `/app`, `/components`, `/lib`, `/types`
- Install core dependencies: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `zod` for validation

### 1.2 Configure Supabase Database

- Create complete database schema with the following tables:
- `orgs` (id, name, created_at)
- `org_members` (id, org_id, user_id, role, created_at)
- `clients` (id, org_id, parent_name, child_name, email, phone, external_client_id, sms_opt_out, email_opt_out, created_at, updated_at)
- `lessons` (id, org_id, name, weekday, start_time, location, created_at)
- `enrollments` (id, lesson_id, client_id, status, created_at) with unique constraint
- `message_batches` (id, org_id, channel, subject, body, lesson_id, target_date, created_by, status, created_at)
- `message_outbox` (id, batch_id, client_id, dest_email, dest_phone, channel, status, provider_message_id, last_error, sent_at, retry_count)
- `import_mappings` (id, org_id, mapping_config, created_at)
- Enable Row Level Security (RLS) policies on all tables to restrict access by org_id
- Set up authentication schema for user roles (admin, staff)

### 1.3 Third-Party Service Setup Instructions

**You'll need to create accounts and get API keys for:**

**Vercel (Hosting):**

- Sign up at vercel.com with GitHub
- Connect your GitHub repository
- Note: Deployment will happen in Phase 6

**Twilio (SMS):**

- Sign up at twilio.com
- Verify your account and add payment method
- Buy a phone number for sending SMS
- Get Account SID and Auth Token from console
- Store in Vercel environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

**Resend (Email):**

- Sign up at resend.com
- Verify your sending domain (you'll need DNS access)
- Get API key from dashboard
- Store in Vercel environment variables: `RESEND_API_KEY`
- Set verified sender email in settings

### 1.4 Environment Setup

- Create `.env.local` with Supabase URL, anon key, and service role key
- Configure Supabase client utilities for server and client components
- Set up TypeScript types for database tables
- Add logo placeholder (you'll replace with "the-wellness-clinic-at-lifequest" image later)

---

## Phase 2: Authentication & User Management

### 2.1 Build Authentication Flow

- Create `/app/login/page.tsx` with email/password form
- Implement Supabase Auth with session management
- Create protected route middleware to require authentication
- Build `/app/layout.tsx` with auth session provider

### 2.2 User Management

- Create `/app/settings/users/page.tsx` for admins to invite staff
- Build invitation system (Sarah can add Lindsey and other employees)
- Implement role-based access control (admin vs staff permissions)
- Default first user (Sarah) as admin for LifeQuest org

---

## Phase 3: CSV Upload & Roster Management

### 3.1 CSV Upload Interface

- Create `/app/upload/page.tsx` with drag-and-drop file upload
- Upload CSV to Supabase Storage bucket (`imports/`)
- Display upload progress and validation feedback

### 3.2 Column Mapper UI

- Build intelligent column mapper for first-time uploads
- Detect and suggest mappings for: parent_name, child_name, email, phone, lesson_name, lesson_time, weekday
- Save mapping configuration to `import_mappings` table for future use
- Show preview of first 5 rows with mapped columns

### 3.3 CSV Parser & Data Ingest

- Create Supabase Edge Function `ingest_roster` to process CSV
- Parse CSV and apply saved column mappings
- Normalize phone numbers to E.164 format (US: +1XXXXXXXXXX)
- Upsert logic:
- `lessons` by (name, weekday, start_time)
- `clients` by external_client_id or (parent_name, email, phone)
- `enrollments` by (client_id, lesson_id)
- Return validation report: inserted/updated counts, skipped rows with reasons
- Display success/warning summary in UI with downloadable failure CSV

### 3.4 Lessons & Roster View

- Create `/app/lessons/page.tsx` listing all swim lesson groups (Jellyfish, Minos, etc.)
- Show enrollment count per lesson
- Drill-down view: click lesson to see all enrolled parents (name, child, email, phone)
- Add search and filter capabilities (by day, time, lesson name)

---

## Phase 4: Message Composition & Sending

### 4.1 Compose Interface

- Create `/app/compose/page.tsx` with intuitive message builder
- **Audience Selection:**
- Dropdown/search to select lesson group(s)
- Show individual parents in selected group with checkboxes
- Display recipient count prominently ("Sending to 32 parents")
- Filter chips: "Today's lessons", "Mondays", "Beginners", etc.
- **Channel Selection:** Email, SMS, or Both (radio buttons)
- **Subject & Body Fields:**
- Rich text area for message body
- Template variables: `{{parent_name}}`, `{{child_name}}`, `{{lesson_name}}`, `{{lesson_time}}`, `{{date}}`
- Character counter for SMS (160 char segments)

### 4.2 Template Library

- Build reusable template system with categories:
- Emergency Alert (pool closed, safety issue)
- Schedule Change (time/date changes)
- Marketing/Promo (new sessions, special events)
- Allow saving custom templates
- Quick-access templates in compose UI

### 4.3 Preview & Test Send

- **Preview:** Render message with sample data from random recipient (show variable substitution)
- **Test Send:** Button to send to Sarah and Lindsey's personal numbers/emails only
- Show modal with rendered preview before actual send

### 4.4 Safety Features

- **Quiet Hours:** Block SMS sends between 9 PM - 7 AM (configurable in settings)
- **Emergency Override:** Toggle to bypass quiet hours for urgent alerts
- **Confirmation Modal:** "Send to 32 parents via SMS + Email now?" with YES/Cancel
- Validate all recipients have required contact info (email for email, phone for SMS)

### 4.5 Send Queue Creation

- On "Send" confirmation:
- Create `message_batches` record with metadata
- Generate individual `message_outbox` rows for each recipient + channel
- Mark status as 'pending' with `send_after` timestamp
- Redirect to batch status page

---

## Phase 5: Message Dispatch & Monitoring

### 5.1 Dispatcher Cron Job

- Create Supabase Edge Function `dispatcher` scheduled every 1 minute
- Query `message_outbox` where `status='pending' AND send_after<=now() AND retry_count<3`
- Rate limiting: process max 100 messages per run to avoid provider throttling
- For each message:
- **SMS via Twilio:** Send with auto-appended footer "Reply STOP to opt out"
- **Email via Resend:** Send with unsubscribe link in footer
- Store provider message ID (Twilio SID, Resend ID)
- Update status to 'sent' or 'failed' with error details
- Implement exponential backoff retry (1min, 5min, 15min delays)

### 5.2 Compliance & Opt-Out Handling

- Create webhook endpoint `stop_webhook` for Twilio STOP replies
- When STOP received, set `clients.sms_opt_out=true`
- Create unsubscribe page `/app/unsubscribe/[token]` for email opt-outs
- Auto-filter opted-out contacts from future sends

### 5.3 Batch Monitoring Dashboard

- Create `/app/batches/page.tsx` listing all message batches
- Show real-time progress: sent count / total, failed count, status
- Live updates using Supabase real-time subscriptions
- Sortable/filterable by date, channel, lesson, creator

### 5.4 Batch Detail View

- Create `/app/batches/[id]/page.tsx` for individual batch details
- Display: subject, body, recipients, channel, send time
- Show delivery stats: pending, sent, failed with percentages
- List failed messages with error reasons
- **Retry Failed Button:** requeue all failed messages in batch
- **Download Failure CSV:** export failed recipients with error details

---

## Phase 6: Settings & Administration

### 6.1 Settings Dashboard

- Create `/app/settings/page.tsx` with tabbed interface:
- **General:** Verified sender email, Twilio phone number display
- **Quiet Hours:** Time range picker for SMS blocks
- **Templates:** Manage saved message templates
- **Users:** Invite/manage org members (admin only)

### 6.2 Health & Monitoring

- Build health dashboard section in settings:
- Last cron run timestamp
- Pending queue size (messages waiting to send)
- Error rate last 24 hours (% failed)
- Provider status indicators (Twilio/Resend API connectivity)

### 6.3 Observability Setup

- Install Sentry for error tracking (frontend + Edge Functions)
- Configure Sentry error boundaries in Next.js app
- Add context to errors (org_id, user_id, batch_id)
- Set up email alerts for critical issues:
- Dispatcher hasn't run in >10 minutes
- Batch failure rate >15%
- Twilio/Resend authentication errors

---

## Phase 7: Premium UX Enhancements

### 7.1 Global Emergency Banner

- Add quick-access "POOL CLOSED - Send Emergency Alert" button in nav bar
- Opens compose page pre-filled with emergency template
- Shows for admin users only

### 7.2 Onboarding Wizard

- First-run setup wizard for new orgs:
- Step 1: Verify sender email with Resend
- Step 2: Configure Twilio phone number
- Step 3: Set quiet hours preferences
- Step 4: Create first message template
- Step 5: Upload first roster CSV

### 7.3 Dry-Run Mode

- Add "Test Mode" toggle in compose page
- When enabled: send to only 3 random recipients
- Show warning banner: "TEST MODE - Limited Recipients"

### 7.4 UI Polish

- Implement LifeQuest brand styling throughout:
- Orange (#F6871F) for primary buttons and accents
- White backgrounds with clean layouts
- Add logo to navbar (placeholder now, replace with "the-wellness-clinic-at-lifequest" later)
- Large, obvious buttons (managers shouldn't think)
- Loading states and optimistic updates
- Success/error toast notifications
- Mobile-responsive design (Tailwind breakpoints)

---

## Phase 8: Deployment & Testing

### 8.1 Vercel Deployment

- Connect GitHub repo to Vercel
- Configure environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `RESEND_API_KEY`
- `SENTRY_DSN`
- Deploy Edge Functions to Supabase
- Set up cron schedule for dispatcher (every 1 minute)
- Configure custom domain if needed

### 8.2 End-to-End Testing

- Test complete user flow:

1. Sarah logs in and invites Lindsey
2. Lindsey uploads roster CSV with column mapping
3. Verify lesson groups and enrollments populated correctly
4. Compose emergency alert to one lesson group
5. Preview and test send to Sarah/Lindsey only
6. Send actual batch and monitor delivery
7. Verify SMS and emails received
8. Test STOP reply for SMS opt-out
9. Check batch dashboard shows accurate stats
10. Download failure CSV (if any)

- Test error scenarios: invalid phone, bad email, API failures
- Verify quiet hours enforcement (schedule test SMS during blocked time)

### 8.3 Documentation & Handoff

- Create user guide for Sarah and Lindsey:
- How to upload CSV from Mindbody
- How to compose and send messages
- How to monitor delivery and handle failures
- Emergency procedures (immediate alerts)
- Write technical runbook for you:
- How to check Supabase logs
- How to manually retry failed messages
- How to troubleshoot Twilio/Resend issues
- How to add new template variables
- Document environment variables and secrets management

---

## Post-Launch: Case Study & Metrics

### Capture Success Metrics

- Time saved per emergency alert (before: X minutes, after: Y minutes)
- Deliverability rate (% messages successfully sent)
- Parent reach rate (% of families notified)
- Error rate and resolution time
- User satisfaction (Sarah/Lindsey feedback)

### Build Case Study

- Document the problem, solution, and results
- Include screenshots of the UI
- Quote feedback from Sarah/Lindsey
- Calculate ROI (time saved × hourly rate)
- Use this to win your next 3 clients for your agency

---

## Key Files to Create

**Frontend (Next.js App):**

- `/app/login/page.tsx` - Authentication
- `/app/upload/page.tsx` - CSV upload & mapping
- `/app/lessons/page.tsx` - Lesson roster view
- `/app/compose/page.tsx` - Message composer
- `/app/batches/page.tsx` - Batch list
- `/app/batches/[id]/page.tsx` - Batch details
- `/app/settings/page.tsx` - Settings dashboard
- `/app/unsubscribe/[token]/page.tsx` - Email opt-out
- `/components/ColumnMapper.tsx` - CSV column mapping UI
- `/components/MessagePreview.tsx` - Message preview modal
- `/components/EmergencyBanner.tsx` - Quick emergency button
- `/lib/supabase/client.ts` - Supabase client setup
- `/lib/supabase/server.ts` - Supabase server client
- `/types/database.types.ts` - TypeScript database types

**Backend (Supabase Edge Functions):**

- `supabase/functions/ingest_roster/index.ts` - CSV parser
- `supabase/functions/dispatcher/index.ts` - Message sender cron
- `supabase/functions/stop_webhook/index.ts` - SMS opt-out handler

**Database:**

- `supabase/migrations/001_initial_schema.sql` - All table definitions
- `supabase/migrations/002_rls_policies.sql` - Row Level Security

**Configuration:**

- `.env.local` - Local development environment variables
- `tailwind.config.ts` - LifeQuest brand colors
- `next.config.js` - Next.js configuration
- `package.json` - Dependencies

---

## Todo Checklist

This plan covers all MVP features from your project scope. Once you approve, I'll build this system step-by-step, ensuring each phase works before moving to the next.

### To-dos

- [ ] Initialize Next.js project with TypeScript, Tailwind, and LifeQuest branding
- [ ] Create database schema with all tables and RLS policies
- [ ] Build authentication flow with login page and protected routes
- [ ] Create user invitation and role management for admins
- [ ] Create CSV upload interface with drag-and-drop
- [ ] Build column mapper UI for first-time CSV uploads
- [ ] Create Edge Function to parse CSV and populate database
- [ ] Create lessons page showing groups and enrolled parents
- [ ] Build message composer with audience selection and template variables
- [ ] Add preview and test send functionality to composer
- [ ] Configure Twilio and Resend integrations with environment variables
- [ ] Create dispatcher Edge Function to send queued messages
- [ ] Implement SMS STOP webhook and email unsubscribe page
- [ ] Create batch monitoring dashboard with real-time updates
- [ ] Build batch detail view with retry and failure CSV download
- [ ] Create settings page with quiet hours, templates, and health dashboard
- [ ] Install and configure Sentry for error tracking and alerts
- [ ] Add emergency banner, onboarding wizard, and UI polish
- [ ] Deploy to Vercel with environment variables and cron jobs
- [ ] Test complete user flow from CSV upload to message delivery
- [ ] Write user guide and technical runbook for handoff
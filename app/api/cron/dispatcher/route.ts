// @ts-nocheck - Supabase type inference issues
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Twilio } from 'twilio'
import { Resend } from 'resend'
import { replaceTemplateVariables } from '@/lib/utils'

// Initialize Twilio and Resend clients
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sets this automatically)
    const authHeader = request.headers.get('authorization')
    if (process.env.VERCEL_CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createClient()

    // Get pending messages that are ready to send
    const { data: messages, error: messagesError } = await supabase
      .from('message_outbox')
      .select(`
        *,
        batch:message_batches!inner(id, subject, body, lesson_id, org_id),
        client:clients!inner(id, parent_name, child_name, email, phone)
      `)
      .eq('status', 'pending')
      .lte('send_after', new Date().toISOString())
      .lt('retry_count', 3)
      .limit(100)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        failed: 0,
        message: 'No pending messages to process',
      })
    }

    let sentCount = 0
    let failedCount = 0

    // Process each message
    for (const msg of messages) {
      try {
        const batch = msg.batch
        const client = msg.client

        // Get lesson details for template variables
        let lessonName = ''
        let lessonTime = ''

        if (batch.lesson_id) {
          const { data: lesson } = await supabase
            .from('lessons')
            .select('name, start_time')
            .eq('id', batch.lesson_id)
            .single()

          if (lesson) {
            lessonName = lesson.name
            lessonTime = lesson.start_time || ''
          }
        }

        // Prepare template variables
        const variables = {
          parent_name: client.parent_name,
          child_name: client.child_name,
          lesson_name: lessonName,
          lesson_time: lessonTime,
          date: new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        }

        // Replace variables in subject and body
        const subject = batch.subject ? replaceTemplateVariables(batch.subject, variables) : ''
        const body = replaceTemplateVariables(batch.body, variables)

        // Send based on channel
        if (msg.channel === 'email' && msg.dest_email) {
          // Send email via Resend
          const emailBody = body.replace(/\n/g, '<br>')
          
          const { data, error: sendError } = await resend.emails.send({
            from: 'LifeQuest Swim Team <notifications@coopercazier.com>', // Update with your verified domain
            to: msg.dest_email,
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #F6871F; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">LifeQuest Swim Team</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                  <div style="background-color: white; padding: 20px; border-radius: 8px;">
                    ${emailBody}
                  </div>
                  <div style="margin-top: 20px; padding: 15px; background-color: #e8e8e8; border-radius: 8px; font-size: 12px; color: #666;">
                    <p style="margin: 0;">You're receiving this email because you're enrolled in our swim lesson program.</p>
                    <p style="margin: 5px 0 0 0;">If you wish to stop receiving emails, please contact us directly.</p>
                  </div>
                </div>
              </div>
            `,
          })

          if (sendError) {
            throw new Error(`Resend error: ${sendError.message}`)
          }

          // Update message status to sent
          await supabase
            .from('message_outbox')
            .update({
              status: 'sent',
              provider_message_id: data?.id || null,
              sent_at: new Date().toISOString(),
            })
            .eq('id', msg.id)

          sentCount++
        } else if (msg.channel === 'sms' && msg.dest_phone) {
          // Send SMS via Twilio with opt-out footer
          const smsBody = `${body}\n\nReply STOP to opt out`

          const twilioMessage = await twilioClient.messages.create({
            body: smsBody,
            to: msg.dest_phone,
            from: process.env.TWILIO_PHONE_NUMBER!,
          })

          // Update message status to sent
          await supabase
            .from('message_outbox')
            .update({
              status: 'sent',
              provider_message_id: twilioMessage.sid,
              sent_at: new Date().toISOString(),
            })
            .eq('id', msg.id)

          sentCount++
        } else {
          throw new Error('Invalid channel or missing destination')
        }
      } catch (error: any) {
        console.error(`Failed to send message ${msg.id}:`, error)

        // Calculate retry delay (exponential backoff: 1min, 5min, 15min)
        const retryDelays = [60, 300, 900] // seconds
        const nextRetryDelay = retryDelays[msg.retry_count] || 900
        const nextSendAfter = new Date(Date.now() + nextRetryDelay * 1000).toISOString()

        // Update message status to failed with retry info
        await supabase
          .from('message_outbox')
          .update({
            status: msg.retry_count >= 2 ? 'failed' : 'pending',
            retry_count: msg.retry_count + 1,
            last_error: error.message || 'Unknown error',
            send_after: msg.retry_count >= 2 ? msg.send_after : nextSendAfter,
          })
          .eq('id', msg.id)

        failedCount++
      }
    }

    // Update batch statuses
    const batchIds = [...new Set(messages.map(m => m.batch.id))]
    for (const batchId of batchIds) {
      const { data: batchMessages } = await supabase
        .from('message_outbox')
        .select('status')
        .eq('batch_id', batchId)

      if (batchMessages) {
        const allSent = batchMessages.every(m => m.status === 'sent')
        const allDone = batchMessages.every(m => m.status === 'sent' || m.status === 'failed')

        if (allSent) {
          await supabase
            .from('message_batches')
            .update({ status: 'sent' })
            .eq('id', batchId)
        } else if (allDone) {
          await supabase
            .from('message_batches')
            .update({ status: 'partial' })
            .eq('id', batchId)
        }
      }
    }

    console.log(`Dispatcher run complete: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      processed: messages.length,
      sent: sentCount,
      failed: failedCount,
    })
  } catch (error: any) {
    console.error('Dispatcher error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


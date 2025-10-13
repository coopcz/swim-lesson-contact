// @ts-nocheck - Supabase type inference issues
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const body = (formData.get('Body') as string)?.toUpperCase() || ''

    // Check if this is a STOP request
    if (!body.includes('STOP') && !body.includes('UNSUBSCRIBE')) {
      // Not an opt-out request, just acknowledge
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    const supabase = await createClient()

    // Find client by phone number and update opt-out status
    const { error: updateError } = await supabase
      .from('clients')
      .update({ sms_opt_out: true })
      .eq('phone', from)

    if (updateError) {
      console.error('Error updating opt-out status:', updateError)
    } else {
      console.log(`SMS opt-out processed for ${from}`)
    }

    // Respond with TwiML confirmation
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have been unsubscribed from SMS notifications. To re-subscribe, please contact us directly.</Message>
</Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    )
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/xml' },
      }
    )
  }
}


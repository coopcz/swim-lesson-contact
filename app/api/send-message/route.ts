// @ts-nocheck - Supabase type inference issues
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { lessonId, clientIds, channel, subject, body } = await request.json()

    if (!lessonId || !clientIds || clientIds.length === 0 || !channel || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create message batch
    const { data: batch, error: batchError } = await supabase
      .from('message_batches')
      .insert({
        org_id: orgMember.org_id,
        channel,
        subject: subject || null,
        body,
        lesson_id: lessonId,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (batchError || !batch) {
      throw new Error('Failed to create message batch')
    }

    // Get clients with their contact info
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .in('id', clientIds)
      .eq('org_id', orgMember.org_id)

    if (clientsError || !clients) {
      throw new Error('Failed to fetch clients')
    }

    // Create outbox entries
    const outboxEntries: any[] = []

    for (const client of clients) {
      // Check if we should send email
      if (
        (channel === 'email' || channel === 'both') &&
        client.email &&
        !client.email_opt_out
      ) {
        outboxEntries.push({
          batch_id: batch.id,
          client_id: client.id,
          dest_email: client.email,
          dest_phone: null,
          channel: 'email',
          status: 'pending',
          send_after: new Date().toISOString(),
        })
      }

      // Check if we should send SMS
      if (
        (channel === 'sms' || channel === 'both') &&
        client.phone &&
        !client.sms_opt_out
      ) {
        outboxEntries.push({
          batch_id: batch.id,
          client_id: client.id,
          dest_email: null,
          dest_phone: client.phone,
          channel: 'sms',
          status: 'pending',
          send_after: new Date().toISOString(),
        })
      }
    }

    if (outboxEntries.length === 0) {
      // Delete the batch if no valid recipients
      await supabase.from('message_batches').delete().eq('id', batch.id)
      return NextResponse.json(
        { error: 'No valid recipients found' },
        { status: 400 }
      )
    }

    // Insert outbox entries
    const { error: outboxError } = await supabase
      .from('message_outbox')
      .insert(outboxEntries)

    if (outboxError) {
      throw new Error('Failed to create outbox entries')
    }

    // Update batch status to sending
    await supabase
      .from('message_batches')
      .update({ status: 'sending' })
      .eq('id', batch.id)

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      recipientCount: outboxEntries.length,
    })
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


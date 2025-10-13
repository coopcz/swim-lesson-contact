// @ts-nocheck - Supabase type inference issues throughout this file
import { createClient } from '@/lib/supabase/server'
import { normalizePhone, isValidEmail } from '@/lib/utils'
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

    const { mapping, rows } = await request.json()

    let insertedClients = 0
    let updatedClients = 0
    let insertedEnrollments = 0
    let insertedLessons = 0
    const skippedRows: any[] = []

    // Process each row
    for (const row of rows) {
      try {
        const parentName = row[mapping.parent_name]
        const childName = row[mapping.child_name]
        const email = mapping.email ? row[mapping.email] : null
        const phone = mapping.phone ? row[mapping.phone] : null
        const lessonName = row[mapping.lesson_name]
        const lessonTime = mapping.lesson_time ? row[mapping.lesson_time] : null
        const weekday = mapping.weekday ? row[mapping.weekday] : null

        if (!parentName || !childName || !lessonName) {
          skippedRows.push({
            row,
            reason: 'Missing required fields (parent_name, child_name, or lesson_name)',
          })
          continue
        }

        // Normalize phone
        const normalizedPhone = phone ? normalizePhone(phone) : null

        // Validate email
        if (email && !isValidEmail(email)) {
          skippedRows.push({
            row,
            reason: 'Invalid email format',
          })
          continue
        }

        // Check if lesson exists
        const { data: existingLesson } = await supabase
          .from('lessons')
          .select('id')
          // @ts-expect-error - Supabase type inference issue with org_id filter
          .eq('org_id', orgMember.org_id)
          .eq('name', lessonName)
          .maybeSingle()

        let lessonId: string

        if (!existingLesson) {
          // Create new lesson
          const { data: newLesson, error: newLessonError } = await supabase
            .from('lessons')
            // @ts-expect-error - Supabase type inference issue
            .insert({
              org_id: orgMember.org_id,
              name: lessonName,
              weekday: weekday || null,
              start_time: lessonTime || null,
            })
            .select('id')
            .single()

          if (newLessonError || !newLesson) {
            skippedRows.push({
              row,
              reason: 'Failed to create lesson',
            })
            continue
          }

          lessonId = newLesson.id
          insertedLessons++
        } else {
          lessonId = existingLesson.id
        }

        // Upsert client
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          // @ts-expect-error - Supabase type inference issue with org_id filter
          .eq('org_id', orgMember.org_id)
          .eq('parent_name', parentName)
          .eq('child_name', childName)
          .maybeSingle()

        let clientId: string

        if (existingClient) {
          // Update existing client
          await supabase
            .from('clients')
            .update({
              email: email || null,
              phone: normalizedPhone,
            })
            .eq('id', existingClient.id)

          clientId = existingClient.id
          updatedClients++
        } else {
          // Insert new client
          const { data: newClient } = await supabase
            .from('clients')
            // @ts-expect-error - Supabase type inference issue
            .insert({
              org_id: orgMember.org_id,
              parent_name: parentName,
              child_name: childName,
              email: email || null,
              phone: normalizedPhone,
            })
            .select('id')
            .single()

          if (!newClient) {
            skippedRows.push({
              row,
              reason: 'Failed to create client',
            })
            continue
          }

          clientId = newClient.id
          insertedClients++
        }

        // Create enrollment (check first to avoid duplicates)
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          // @ts-expect-error - Supabase type inference issue with lesson_id filter
          .eq('lesson_id', lessonId)
          .eq('client_id', clientId)
          .maybeSingle()

        if (!existingEnrollment) {
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            // @ts-expect-error - Supabase type inference issue
            .insert({
              lesson_id: lessonId,
              client_id: clientId,
              status: 'active',
            })

          if (!enrollmentError) {
            insertedEnrollments++
          }
        }
      } catch (error: any) {
        skippedRows.push({
          row,
          reason: error.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      insertedClients,
      updatedClients,
      insertedLessons,
      insertedEnrollments,
      skippedRows: skippedRows.length,
      skippedDetails: skippedRows,
    })
  } catch (error: any) {
    console.error('Ingest error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


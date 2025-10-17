// @ts-nocheck - Supabase type inference issues
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

    const { parent_name, email, phone, children } = await request.json()

    // Validate
    if (!parent_name || !parent_name.trim()) {
      return NextResponse.json({ error: 'Parent name is required' }, { status: 400 })
    }

    if (!children || children.length === 0) {
      return NextResponse.json({ error: 'At least one child is required' }, { status: 400 })
    }

    // Validate email if provided
    if (email && email.trim() && !isValidEmail(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Normalize phone if provided
    const normalizedPhone = phone && phone.trim() ? normalizePhone(phone.trim()) : null

    // Create clients and enrollments for each child
    const createdClients = []
    
    for (const child of children) {
      if (!child.child_name || !child.child_name.trim()) {
        return NextResponse.json({ error: 'Child name is required' }, { status: 400 })
      }

      if (!child.class_id) {
        return NextResponse.json({ error: 'Class is required for each child' }, { status: 400 })
      }

      // Verify class exists and belongs to org
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', child.class_id)
        .eq('org_id', orgMember.org_id)
        .single()

      if (!lesson) {
        return NextResponse.json({ error: `Invalid class for child ${child.child_name}` }, { status: 400 })
      }

      // Create client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          org_id: orgMember.org_id,
          parent_name: parent_name.trim(),
          child_name: child.child_name.trim(),
          email: email && email.trim() ? email.trim() : null,
          phone: normalizedPhone,
        })
        .select()
        .single()

      if (clientError) {
        console.error('Error creating client:', clientError)
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
      }

      // Create enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          lesson_id: child.class_id,
          client_id: newClient.id,
          status: 'active',
        })

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError)
        // Try to clean up client
        await supabase.from('clients').delete().eq('id', newClient.id)
        return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
      }

      createdClients.push(newClient)
    }

    return NextResponse.json({ success: true, clients: createdClients })
  } catch (error: any) {
    console.error('POST /api/parents error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { parent_name, email, phone, children, originalParentKey } = await request.json()

    // Validate
    if (!parent_name || !parent_name.trim()) {
      return NextResponse.json({ error: 'Parent name is required' }, { status: 400 })
    }

    if (!children || children.length === 0) {
      return NextResponse.json({ error: 'At least one child is required' }, { status: 400 })
    }

    // Validate email if provided
    if (email && email.trim() && !isValidEmail(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Normalize phone if provided
    const normalizedPhone = phone && phone.trim() ? normalizePhone(phone.trim()) : null

    // Process each child
    for (const child of children) {
      if (!child.child_name || !child.child_name.trim()) {
        return NextResponse.json({ error: 'Child name is required' }, { status: 400 })
      }

      if (!child.class_id) {
        return NextResponse.json({ error: 'Class is required for each child' }, { status: 400 })
      }

      // Verify class exists and belongs to org
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', child.class_id)
        .eq('org_id', orgMember.org_id)
        .single()

      if (!lesson) {
        return NextResponse.json({ error: `Invalid class for child ${child.child_name}` }, { status: 400 })
      }

      if (child.id) {
        // Update existing client
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            parent_name: parent_name.trim(),
            child_name: child.child_name.trim(),
            email: email && email.trim() ? email.trim() : null,
            phone: normalizedPhone,
          })
          .eq('id', child.id)
          .eq('org_id', orgMember.org_id)

        if (updateError) {
          console.error('Error updating client:', updateError)
          return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
        }

        // Delete existing enrollments for this client
        const { error: deleteEnrollmentError } = await supabase
          .from('enrollments')
          .delete()
          .eq('client_id', child.id)

        if (deleteEnrollmentError) {
          console.error('Error deleting enrollment:', deleteEnrollmentError)
          return NextResponse.json({ error: 'Failed to delete enrollment' }, { status: 500 })
        }

        // Create new enrollment with the correct class
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            lesson_id: child.class_id,
            client_id: child.id,
            status: 'active',
          })

        if (enrollmentError) {
          console.error('Error creating enrollment:', enrollmentError)
          return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
        }
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            org_id: orgMember.org_id,
            parent_name: parent_name.trim(),
            child_name: child.child_name.trim(),
            email: email && email.trim() ? email.trim() : null,
            phone: normalizedPhone,
          })
          .select()
          .single()

        if (clientError) {
          console.error('Error creating client:', clientError)
          return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
        }

        // Create enrollment
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            lesson_id: child.class_id,
            client_id: newClient.id,
            status: 'active',
          })

        if (enrollmentError) {
          console.error('Error creating enrollment:', enrollmentError)
          await supabase.from('clients').delete().eq('id', newClient.id)
          return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT /api/parents error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { clientIds } = await request.json()

    if (!clientIds || clientIds.length === 0) {
      return NextResponse.json({ error: 'Client IDs are required' }, { status: 400 })
    }

    // Delete clients (enrollments will be cascade deleted)
    const { error } = await supabase
      .from('clients')
      .delete()
      .in('id', clientIds)
      .eq('org_id', orgMember.org_id)

    if (error) {
      console.error('Error deleting clients:', error)
      return NextResponse.json({ error: 'Failed to delete clients' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/parents error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


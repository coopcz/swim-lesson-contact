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

    const { name, weekday, start_time } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    // Create new class
    const { data: newClass, error } = await supabase
      .from('lessons')
      .insert({
        org_id: orgMember.org_id,
        name: name.trim(),
        weekday: weekday || null,
        start_time: start_time || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
    }

    return NextResponse.json({ success: true, class: newClass })
  } catch (error: any) {
    console.error('POST /api/classes error:', error)
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

    const { id, name, weekday, start_time } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    // Update class
    const { data: updatedClass, error } = await supabase
      .from('lessons')
      .update({
        name: name.trim(),
        weekday: weekday || null,
        start_time: start_time || null,
      })
      .eq('id', id)
      .eq('org_id', orgMember.org_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating class:', error)
      return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
    }

    return NextResponse.json({ success: true, class: updatedClass })
  } catch (error: any) {
    console.error('PUT /api/classes error:', error)
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

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // Delete class (enrollments will be cascade deleted)
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id)
      .eq('org_id', orgMember.org_id)

    if (error) {
      console.error('Error deleting class:', error)
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/classes error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


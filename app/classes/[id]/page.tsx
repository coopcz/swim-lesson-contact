// @ts-nocheck - Client component with Supabase type issues
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/layout/Navigation'
import Link from 'next/link'

interface Student {
  id: string
  enrollment_id: string
  parent_name: string
  child_name: string
  email: string | null
  phone: string | null
  status: string
}

interface Class {
  id: string
  name: string
  weekday: string | null
  start_time: string | null
  location: string | null
}

interface ExistingParent {
  parent_name: string
  email: string | null
  phone: string | null
  children: Array<{
    id: string
    child_name: string
  }>
}

export default function ClassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string
  
  const [classInfo, setClassInfo] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [existingParents, setExistingParents] = useState<ExistingParent[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [enrollMode, setEnrollMode] = useState<'existing' | 'new'>('existing')
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Form data for new enrollment
  const [newEnrollForm, setNewEnrollForm] = useState({
    parent_name: '',
    email: '',
    phone: '',
    child_name: '',
  })
  
  // Form data for existing parent enrollment
  const [existingEnrollForm, setExistingEnrollForm] = useState({
    selectedParent: '',
    selectedChildId: '',
  })
  
  // Form data for editing
  const [editForm, setEditForm] = useState({
    parent_name: '',
    email: '',
    phone: '',
    child_name: '',
  })

  useEffect(() => {
    loadData()
  }, [classId])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) return

    // Load class info
    const { data: classData } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', classId)
      .eq('org_id', orgMember.org_id)
      .single()

    if (!classData) {
      router.push('/classes')
      return
    }
    setClassInfo(classData)

    // Load enrolled students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        clients(*)
      `)
      .eq('lesson_id', classId)
      .eq('status', 'active')

    const studentsList = enrollments?.map((enrollment: any) => ({
      id: enrollment.clients.id,
      enrollment_id: enrollment.id,
      parent_name: enrollment.clients.parent_name,
      child_name: enrollment.clients.child_name,
      email: enrollment.clients.email,
      phone: enrollment.clients.phone,
      status: enrollment.status,
    })) || []

    setStudents(studentsList)

    // Load all clients for existing parent selection
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .order('parent_name')

    // Group by parent
    const grouped: Record<string, ExistingParent> = {}
    clientsData?.forEach((client: any) => {
      const key = `${client.parent_name}_${client.email}_${client.phone}`
      
      if (!grouped[key]) {
        grouped[key] = {
          parent_name: client.parent_name,
          email: client.email,
          phone: client.phone,
          children: [],
        }
      }

      grouped[key].children.push({
        id: client.id,
        child_name: client.child_name,
      })
    })

    setExistingParents(Object.values(grouped))
    setLoading(false)
  }

  const handleOpenEnrollModal = () => {
    setEnrollMode('existing')
    setNewEnrollForm({ parent_name: '', email: '', phone: '', child_name: '' })
    setExistingEnrollForm({ selectedParent: '', selectedChildId: '' })
    setShowEnrollModal(true)
  }

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student)
    setEditForm({
      parent_name: student.parent_name,
      email: student.email || '',
      phone: student.phone || '',
      child_name: student.child_name,
    })
    setShowEditModal(true)
  }

  const handleCloseModals = () => {
    setShowEnrollModal(false)
    setShowEditModal(false)
    setEditingStudent(null)
  }

  const handleEnrollExisting = async () => {
    if (!existingEnrollForm.selectedChildId) {
      alert('Please select a child to enroll')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('lesson_id', classId)
        .eq('client_id', existingEnrollForm.selectedChildId)
        .eq('status', 'active')
        .single()

      if (existing) {
        alert('This child is already enrolled in this class')
        setSubmitting(false)
        return
      }

      // Create enrollment
      const { error } = await supabase
        .from('enrollments')
        .insert({
          lesson_id: classId,
          client_id: existingEnrollForm.selectedChildId,
          status: 'active',
        })

      if (error) {
        throw new Error('Failed to enroll student')
      }

      await loadData()
      handleCloseModals()
      alert('Student enrolled successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to enroll student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnrollNew = async () => {
    if (!newEnrollForm.parent_name.trim() || !newEnrollForm.child_name.trim()) {
      alert('Parent name and child name are required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_name: newEnrollForm.parent_name,
          email: newEnrollForm.email,
          phone: newEnrollForm.phone,
          children: [{
            child_name: newEnrollForm.child_name,
            class_id: classId,
          }],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create and enroll student')
      }

      await loadData()
      handleCloseModals()
      alert('Parent and child created and enrolled successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to create and enroll student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStudent = async () => {
    if (!editForm.parent_name.trim() || !editForm.child_name.trim()) {
      alert('Parent name and child name are required')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('clients')
        .update({
          parent_name: editForm.parent_name.trim(),
          child_name: editForm.child_name.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
        })
        .eq('id', editingStudent!.id)

      if (error) {
        throw new Error('Failed to update student')
      }

      await loadData()
      handleCloseModals()
      alert('Student updated successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to update student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveStudent = async (student: Student) => {
    const confirmed = confirm(
      `Are you sure you want to remove ${student.child_name} from this class?`
    )
    
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', student.enrollment_id)

      if (error) {
        throw new Error('Failed to remove student')
      }

      await loadData()
      alert('Student removed from class successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to remove student')
    }
  }

  const getSelectedParent = () => {
    return existingParents.find(p => 
      `${p.parent_name}_${p.email}_${p.phone}` === existingEnrollForm.selectedParent
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={{}} showEmergency={false} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Loading class details...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={{}} showEmergency={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/classes"
            className="text-lifequest-orange hover:underline mb-4 inline-block"
          >
            ← Back to Classes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{classInfo?.name}</h1>
          <div className="mt-2 flex items-center space-x-4 text-gray-600">
            {classInfo?.weekday && (
              <span className="flex items-center">
                <span className="mr-2">📅</span>
                {classInfo.weekday}
              </span>
            )}
            {classInfo?.start_time && (
              <span className="flex items-center">
                <span className="mr-2">🕐</span>
                {classInfo.start_time}
              </span>
            )}
            {classInfo?.location && (
              <span className="flex items-center">
                <span className="mr-2">📍</span>
                {classInfo.location}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Enrolled Students ({students.length})
            </h2>
            <div className="flex space-x-3">
              <Link
                href={`/compose?lesson=${classId}`}
                className="px-6 py-2 border-2 border-lifequest-orange text-lifequest-orange rounded-md font-medium hover:bg-lifequest-orange hover:text-white transition-colors"
              >
                Send Message
              </Link>
              <button
                onClick={handleOpenEnrollModal}
                className="px-6 py-2 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
              >
                Enroll Student
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No students enrolled in this class yet</p>
              <button
                onClick={handleOpenEnrollModal}
                className="px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
              >
                Enroll First Student
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Child Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.parent_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.child_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.email || (
                          <span className="text-gray-400">No email</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.phone || (
                          <span className="text-gray-400">No phone</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                          title="Edit student"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleRemoveStudent(student)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove from class"
                        >
                          🗑️ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Enroll Student
            </h2>

            {/* Mode Toggle */}
            <div className="mb-6 flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setEnrollMode('existing')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  enrollMode === 'existing'
                    ? 'text-lifequest-orange border-b-2 border-lifequest-orange'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Select Existing Parent/Child
              </button>
              <button
                onClick={() => setEnrollMode('new')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  enrollMode === 'new'
                    ? 'text-lifequest-orange border-b-2 border-lifequest-orange'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Create New Parent/Child
              </button>
            </div>

            {enrollMode === 'existing' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Parent <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={existingEnrollForm.selectedParent}
                    onChange={(e) => setExistingEnrollForm({
                      ...existingEnrollForm,
                      selectedParent: e.target.value,
                      selectedChildId: '',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                  >
                    <option value="">-- Select Parent --</option>
                    {existingParents.map((parent, idx) => (
                      <option 
                        key={idx} 
                        value={`${parent.parent_name}_${parent.email}_${parent.phone}`}
                      >
                        {parent.parent_name} {parent.email && `(${parent.email})`}
                      </option>
                    ))}
                  </select>
                </div>

                {existingEnrollForm.selectedParent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Child <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={existingEnrollForm.selectedChildId}
                      onChange={(e) => setExistingEnrollForm({
                        ...existingEnrollForm,
                        selectedChildId: e.target.value,
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                    >
                      <option value="">-- Select Child --</option>
                      {getSelectedParent()?.children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.child_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={handleCloseModals}
                    disabled={submitting}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollExisting}
                    disabled={submitting || !existingEnrollForm.selectedChildId}
                    className="px-6 py-2 bg-lifequest-orange text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Enrolling...' : 'Enroll Student'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEnrollForm.parent_name}
                    onChange={(e) => setNewEnrollForm({ ...newEnrollForm, parent_name: e.target.value })}
                    placeholder="e.g., Sarah Cooper"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={newEnrollForm.email}
                    onChange={(e) => setNewEnrollForm({ ...newEnrollForm, email: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (optional)
                  </label>
                  <input
                    type="tel"
                    value={newEnrollForm.phone}
                    onChange={(e) => setNewEnrollForm({ ...newEnrollForm, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEnrollForm.child_name}
                    onChange={(e) => setNewEnrollForm({ ...newEnrollForm, child_name: e.target.value })}
                    placeholder="e.g., Emma Cooper"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={handleCloseModals}
                    disabled={submitting}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollNew}
                    disabled={submitting}
                    className="px-6 py-2 bg-lifequest-orange text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create & Enroll'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Edit Student Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.parent_name}
                  onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.child_name}
                  onChange={(e) => setEditForm({ ...editForm, child_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={handleCloseModals}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStudent}
                  disabled={submitting}
                  className="px-6 py-2 bg-lifequest-orange text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


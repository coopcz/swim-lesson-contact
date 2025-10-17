// @ts-nocheck - Client component with Supabase type issues
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/layout/Navigation'

interface Class {
  id: string
  name: string
  weekday: string | null
  start_time: string | null
  student_count?: number
}

export default function ClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    weekday: '',
    start_time: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) return

    // Get classes with enrollment counts
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select(`
        *,
        enrollments(count)
      `)
      .eq('org_id', orgMember.org_id)
      .order('name')

    const classesWithCounts = (lessonsData || []).map((lesson: any) => ({
      ...lesson,
      student_count: lesson.enrollments?.[0]?.count || 0,
    }))

    setClasses(classesWithCounts)
    setLoading(false)
  }

  const handleOpenAddModal = () => {
    setEditingClass(null)
    setFormData({ name: '', weekday: '', start_time: '' })
    setShowAddModal(true)
  }

  const handleOpenEditModal = (cls: Class) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      weekday: cls.weekday || '',
      start_time: cls.start_time || '',
    })
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingClass(null)
    setFormData({ name: '', weekday: '', start_time: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/classes', {
        method: editingClass ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClass ? { ...formData, id: editingClass.id } : formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save class')
      }

      await loadClasses()
      handleCloseModal()
      alert(editingClass ? 'Class updated successfully!' : 'Class created successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to save class')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (cls: Class) => {
    if (cls.student_count && cls.student_count > 0) {
      const confirmed = confirm(
        `This class has ${cls.student_count} student(s) enrolled. Are you sure you want to delete it? This will also remove all enrollments.`
      )
      if (!confirmed) return
    } else {
      const confirmed = confirm(`Are you sure you want to delete "${cls.name}"?`)
      if (!confirmed) return
    }

    try {
      const response = await fetch('/api/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cls.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete class')
      }

      await loadClasses()
      alert('Class deleted successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to delete class')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={{}} showEmergency={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Classes</h1>
            <p className="mt-2 text-gray-600">
              Create and organize your swim lesson classes
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
          >
            Add New Class
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🏊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Classes Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first swim lesson class to get started
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-block px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
            >
              Add New Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(cls)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit class"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(cls)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete class"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {cls.weekday && (
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      {cls.weekday}
                    </div>
                  )}
                  {cls.start_time && (
                    <div className="flex items-center">
                      <span className="mr-2">🕐</span>
                      {cls.start_time}
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="mr-2">👥</span>
                    {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/lessons/${cls.id}`)}
                  className="mt-4 w-full px-4 py-2 border-2 border-lifequest-orange text-lifequest-orange rounded-md font-medium hover:bg-lifequest-orange hover:text-white transition-colors"
                >
                  View Students
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Jellyfish, Minnows"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week (optional)
                </label>
                <select
                  value={formData.weekday}
                  onChange={(e) => setFormData({ ...formData, weekday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                >
                  <option value="">-- Select Day --</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-lifequest-orange text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


// @ts-nocheck - Client component with Supabase type issues
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/layout/Navigation'
import { normalizePhone } from '@/lib/utils'

interface ParentGroup {
  parent_name: string
  email: string | null
  phone: string | null
  children: Array<{
    id: string
    child_name: string
    class_name: string
    class_id: string
  }>
}

interface Class {
  id: string
  name: string
  weekday: string | null
  start_time: string | null
}

export default function ParentsPage() {
  const router = useRouter()
  const [parents, setParents] = useState<ParentGroup[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    parent_name: '',
    email: '',
    phone: '',
    children: [{ child_name: '', class_id: '' }],
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

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
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) return

    // Load classes
    const { data: classesData } = await supabase
      .from('lessons')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .order('name')

    setClasses(classesData || [])

    // Load clients with enrollments
    const { data: clientsData } = await supabase
      .from('clients')
      .select(`
        *,
        enrollments(
          lesson_id,
          lessons(id, name)
        )
      `)
      .eq('org_id', orgMember.org_id)
      .order('parent_name')

    // Group by parent
    const grouped: Record<string, ParentGroup> = {}
    
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

      const enrollment = client.enrollments?.[0]
      const lesson = enrollment?.lessons

      grouped[key].children.push({
        id: client.id,
        child_name: client.child_name,
        class_name: lesson?.name || 'Unknown',
        class_id: enrollment?.lesson_id || '',
      })
    })

    setParents(Object.values(grouped))
    setLoading(false)
  }

  const handleOpenAddModal = () => {
    setFormData({
      parent_name: '',
      email: '',
      phone: '',
      children: [{ child_name: '', class_id: '' }],
    })
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setFormData({
      parent_name: '',
      email: '',
      phone: '',
      children: [{ child_name: '', class_id: '' }],
    })
  }

  const handleAddChild = () => {
    setFormData({
      ...formData,
      children: [...formData.children, { child_name: '', class_id: '' }],
    })
  }

  const handleRemoveChild = (index: number) => {
    const newChildren = formData.children.filter((_, i) => i !== index)
    setFormData({ ...formData, children: newChildren })
  }

  const handleChildChange = (index: number, field: string, value: string) => {
    const newChildren = [...formData.children]
    newChildren[index] = { ...newChildren[index], [field]: value }
    setFormData({ ...formData, children: newChildren })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate
      if (!formData.parent_name.trim()) {
        throw new Error('Parent name is required')
      }

      if (formData.children.length === 0) {
        throw new Error('At least one child is required')
      }

      for (const child of formData.children) {
        if (!child.child_name.trim()) {
          throw new Error('All child names are required')
        }
        if (!child.class_id) {
          throw new Error('All children must be assigned to a class')
        }
      }

      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add parent')
      }

      await loadData()
      handleCloseModal()
      alert('Parent and children added successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to add parent')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteParent = async (parent: ParentGroup) => {
    const childNames = parent.children.map(c => c.child_name).join(', ')
    const confirmed = confirm(
      `Are you sure you want to delete ${parent.parent_name}? This will remove ${parent.children.length} child(ren): ${childNames}`
    )
    
    if (!confirmed) return

    try {
      const clientIds = parent.children.map(c => c.id)
      
      const response = await fetch('/api/parents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIds }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete parent')
      }

      await loadData()
      alert('Parent and children deleted successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to delete parent')
    }
  }

  const filteredParents = parents.filter(parent =>
    parent.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.children.some(child => child.child_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={{}} showEmergency={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Parents</h1>
            <p className="mt-2 text-gray-600">
              Add and organize parent and student information
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
          >
            Add Parent
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by parent or child name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
          />
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Loading parents...</p>
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'No Results Found' : 'No Parents Yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term' : 'Add your first parent and student to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenAddModal}
                className="inline-block px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
              >
                Add Parent
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Children & Classes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParents.map((parent, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {parent.parent_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {parent.email && <div>📧 {parent.email}</div>}
                        {parent.phone && <div>📱 {parent.phone}</div>}
                        {!parent.email && !parent.phone && <span className="text-gray-400">No contact info</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 space-y-1">
                        {parent.children.map((child, childIdx) => (
                          <div key={childIdx}>
                            <span className="font-medium">{child.child_name}</span>
                            {' → '}
                            <span className="text-gray-600">{child.class_name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDeleteParent(parent)}
                        className="text-red-600 hover:text-red-800 ml-4"
                        title="Delete parent"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Add Parent and Children
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Parent Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Parent Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      placeholder="e.g., Sarah Cooper"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                    />
                  </div>
                </div>
              </div>

              {/* Children */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Children</h3>
                
                <div className="space-y-3">
                  {formData.children.map((child, index) => (
                    <div key={index} className="flex space-x-3 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={child.child_name}
                          onChange={(e) => handleChildChange(index, 'child_name', e.target.value)}
                          placeholder="Child's name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <select
                          value={child.class_id}
                          onChange={(e) => handleChildChange(index, 'class_id', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                          required
                        >
                          <option value="">-- Select Class --</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} {cls.weekday && `(${cls.weekday})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChild(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                          title="Remove child"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddChild}
                  className="mt-3 px-4 py-2 border-2 border-lifequest-orange text-lifequest-orange rounded-md hover:bg-lifequest-orange hover:text-white transition-colors"
                >
                  + Add Another Child
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
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
                  {submitting ? 'Adding...' : 'Add Parent & Children'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


// @ts-nocheck - Client component with Supabase type issues
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/layout/Navigation'
import { countSmsSegments, replaceTemplateVariables } from '@/lib/utils'

interface Lesson {
  id: string
  name: string
  weekday: string | null
  start_time: string | null
}

interface Client {
  id: string
  parent_name: string
  child_name: string
  email: string | null
  phone: string | null
  sms_opt_out: boolean
  email_opt_out: boolean
}

function ComposePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emergencyMode = searchParams.get('emergency') === 'true'
  const preSelectedLesson = searchParams.get('lesson')

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [channel, setChannel] = useState<'email' | 'sms' | 'both'>('both')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewClient, setPreviewClient] = useState<Client | null>(null)

  useEffect(() => {
    loadLessons()
    if (emergencyMode) {
      setSubject('URGENT: Pool Closure Alert')
      setBody('Hello {{parent_name}},\n\nThis is an urgent notification regarding {{child_name}}\'s swim lesson.\n\nPlease contact us immediately for more information.\n\nThank you,\nLifeQuest Swim Team')
    }
  }, [emergencyMode])

  useEffect(() => {
    if (selectedLesson) {
      loadClients(selectedLesson)
    } else {
      setClients([])
      setSelectedClients(new Set())
    }
  }, [selectedLesson])

  useEffect(() => {
    if (preSelectedLesson && lessons.length > 0) {
      setSelectedLesson(preSelectedLesson)
    }
  }, [preSelectedLesson, lessons])

  const loadLessons = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) return

    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .order('name')

    setLessons(data || [])
  }

  const loadClients = async (lessonId: string) => {
    const supabase = createClient()

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('clients(*)')
      .eq('lesson_id', lessonId)
      .eq('status', 'active')

    const clientsList = (enrollments || [])
      .map((e: any) => e.clients)
      .filter(Boolean)

    setClients(clientsList)
    
    // Auto-select all clients
    const allClientIds = new Set(clientsList.map((c: Client) => c.id))
    setSelectedClients(allClientIds)

    // Set first client for preview
    if (clientsList.length > 0) {
      setPreviewClient(clientsList[0])
    }
  }

  const handleSelectAll = () => {
    if (selectedClients.size === clients.length) {
      setSelectedClients(new Set())
    } else {
      const allIds = new Set(clients.map(c => c.id))
      setSelectedClients(allIds)
    }
  }

  const handleClientToggle = (clientId: string) => {
    const newSelection = new Set(selectedClients)
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId)
    } else {
      newSelection.add(clientId)
    }
    setSelectedClients(newSelection)
  }

  const getValidRecipients = () => {
    return clients.filter(client => {
      if (!selectedClients.has(client.id)) return false
      
      if (channel === 'email' || channel === 'both') {
        if (!client.email || client.email_opt_out) return false
      }
      if (channel === 'sms' || channel === 'both') {
        if (!client.phone || client.sms_opt_out) return false
      }
      return true
    })
  }

  const handlePreview = () => {
    if (!previewClient) return
    setShowPreview(true)
  }

  const handleSend = async () => {
    if (!selectedLesson || selectedClients.size === 0) {
      alert('Please select a lesson and at least one recipient')
      return
    }

    if (!body.trim()) {
      alert('Please enter a message body')
      return
    }

    if ((channel === 'email' || channel === 'both') && !subject.trim()) {
      alert('Please enter a subject for email')
      return
    }

    const validRecipients = getValidRecipients()
    if (validRecipients.length === 0) {
      alert('No valid recipients found. Please check that selected clients have valid contact info.')
      return
    }

    const confirmed = confirm(
      `Send to ${validRecipients.length} ${validRecipients.length === 1 ? 'parent' : 'parents'} via ${channel.toUpperCase()}?`
    )

    if (!confirmed) return

    setLoading(true)

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson,
          clientIds: Array.from(selectedClients),
          channel,
          subject,
          body,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()
      alert('Message queued successfully!')
      router.push(`/batches/${result.batchId}`)
    } catch (error: any) {
      alert(error.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const validRecipients = getValidRecipients()
  const smsSegments = countSmsSegments(body)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={{}} showEmergency={false} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {emergencyMode && (
          <div className="mb-6 bg-red-50 border-2 border-red-500 text-red-700 px-6 py-4 rounded-lg font-semibold flex items-center">
            <span className="text-2xl mr-3">🚨</span>
            EMERGENCY MODE - This message will bypass quiet hours
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compose Message</h1>
          <p className="mt-2 text-gray-600">
            Send emails and SMS to swim lesson parents
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Message Composition */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lesson Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                1. Select Lesson Group
              </h2>
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
              >
                <option value="">-- Select a lesson --</option>
                {lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name} {lesson.weekday && `(${lesson.weekday})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                2. Select Channel
              </h2>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="channel"
                    value="email"
                    checked={channel === 'email'}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="mr-2"
                  />
                  Email Only
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="channel"
                    value="sms"
                    checked={channel === 'sms'}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="mr-2"
                  />
                  SMS Only
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="channel"
                    value="both"
                    checked={channel === 'both'}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="mr-2"
                  />
                  Both
                </label>
              </div>
            </div>

            {/* Message Composition */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                3. Compose Message
              </h2>

              {(channel === 'email' || channel === 'both') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Enter your message here. Use variables: {{parent_name}}, {{child_name}}, {{lesson_name}}, {{lesson_time}}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                />
                {(channel === 'sms' || channel === 'both') && (
                  <p className="mt-2 text-sm text-gray-600">
                    SMS Segments: {smsSegments} (160 chars per segment)
                  </p>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Available Variables:</strong> {'{{parent_name}}, {{child_name}}, {{lesson_name}}, {{lesson_time}}, {{date}}'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex space-x-4">
                <button
                  onClick={handlePreview}
                  disabled={!selectedLesson || !body || loading}
                  className="flex-1 px-6 py-3 border-2 border-lifequest-orange text-lifequest-orange rounded-md font-medium hover:bg-lifequest-orange hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview
                </button>
                <button
                  onClick={handleSend}
                  disabled={!selectedLesson || selectedClients.size === 0 || !body || loading}
                  className="flex-1 px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : `Send to ${validRecipients.length} ${validRecipients.length === 1 ? 'Parent' : 'Parents'}`}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Recipients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Recipients ({validRecipients.length})
              </h2>

              {clients.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  Select a lesson to see recipients
                </p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedClients.size === clients.length}
                        onChange={handleSelectAll}
                        className="mr-2"
                      />
                      <strong>Select All</strong>
                    </label>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {clients.map(client => {
                      const isSelected = selectedClients.has(client.id)
                      const hasEmail = client.email && !client.email_opt_out
                      const hasPhone = client.phone && !client.sms_opt_out

                      return (
                        <label
                          key={client.id}
                          className={`flex items-start p-2 rounded border ${
                            isSelected ? 'bg-orange-50 border-lifequest-orange' : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleClientToggle(client.id)}
                            className="mr-2 mt-1"
                          />
                          <div className="flex-1 text-sm">
                            <div className="font-medium text-gray-900">
                              {client.parent_name}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {client.child_name}
                            </div>
                            <div className="flex space-x-2 mt-1">
                              {hasEmail && <span className="text-xs text-green-600">📧</span>}
                              {hasPhone && <span className="text-xs text-green-600">📱</span>}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && previewClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Message Preview</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Preview for: <strong>{previewClient.parent_name}</strong> ({previewClient.child_name})
              </p>
            </div>

            {(channel === 'email' || channel === 'both') && (
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-700 mb-2">Email Subject:</div>
                <div className="text-gray-900">
                  {replaceTemplateVariables(subject, {
                    parent_name: previewClient.parent_name,
                    child_name: previewClient.child_name,
                    lesson_name: lessons.find(l => l.id === selectedLesson)?.name || '',
                    lesson_time: lessons.find(l => l.id === selectedLesson)?.start_time || '',
                    date: new Date().toLocaleDateString(),
                  })}
                </div>
              </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-700 mb-2">Message Body:</div>
              <div className="text-gray-900 whitespace-pre-wrap">
                {replaceTemplateVariables(body, {
                  parent_name: previewClient.parent_name,
                  child_name: previewClient.child_name,
                  lesson_name: lessons.find(l => l.id === selectedLesson)?.name || '',
                  lesson_time: lessons.find(l => l.id === selectedLesson)?.start_time || '',
                  date: new Date().toLocaleDateString(),
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComposePageContent />
    </Suspense>
  )
}


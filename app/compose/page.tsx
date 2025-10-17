// @ts-nocheck - Client component with Supabase type issues
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/layout/Navigation'
import { countSmsSegments } from '@/lib/utils'

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
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('single')
  const [selectedLesson, setSelectedLesson] = useState<string>('')
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [channel, setChannel] = useState<'email' | 'sms' | 'both'>('both')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    loadLessons()
    if (emergencyMode) {
      setSubject('URGENT: Pool Closure Alert')
      setBody('This is an urgent notification regarding swim lessons.\n\nPlease contact us immediately for more information.\n\nThank you,\nLifeQuest Swim Team')
    }
  }, [emergencyMode])

  useEffect(() => {
    if (selectionMode === 'single' && selectedLesson) {
      loadClients(selectedLesson)
    } else if (selectionMode === 'multiple' && selectedLessons.size > 0) {
      loadClientsFromMultipleLessons(Array.from(selectedLessons))
    } else {
      setClients([])
      setSelectedClients(new Set())
    }
  }, [selectedLesson, selectedLessons, selectionMode])

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
  }

  const loadClientsFromMultipleLessons = async (lessonIds: string[]) => {
    const supabase = createClient()

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('clients(*)')
      .in('lesson_id', lessonIds)
      .eq('status', 'active')

    // Deduplicate clients (same parent may have children in multiple classes)
    const clientsMap = new Map<string, Client>()
    ;(enrollments || []).forEach((e: any) => {
      const client = e.clients
      if (client) {
        clientsMap.set(client.id, client)
      }
    })

    const clientsList = Array.from(clientsMap.values())
    setClients(clientsList)
    
    // Auto-select all clients
    const allClientIds = new Set(clientsList.map((c: Client) => c.id))
    setSelectedClients(allClientIds)
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

  const handleShowConfirmation = () => {
    if (selectionMode === 'single' && !selectedLesson) {
      alert('Please select a class')
      return
    }

    if (selectionMode === 'multiple' && selectedLessons.size === 0) {
      alert('Please select at least one class')
      return
    }

    if (selectedClients.size === 0) {
      alert('Please select at least one recipient')
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

    setShowConfirmation(true)
  }

  const handleSend = async () => {
    setLoading(true)
    setShowConfirmation(false)

    try {
      const lessonIds = selectionMode === 'single' 
        ? [selectedLesson] 
        : Array.from(selectedLessons)

      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonIds,
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

  const handleLessonCheckboxChange = (lessonId: string) => {
    const newSelection = new Set(selectedLessons)
    if (newSelection.has(lessonId)) {
      newSelection.delete(lessonId)
    } else {
      newSelection.add(lessonId)
    }
    setSelectedLessons(newSelection)
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
                1. Select Class(es)
              </h2>
              
              <div className="mb-4 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="selectionMode"
                    checked={selectionMode === 'single'}
                    onChange={() => {
                      setSelectionMode('single')
                      setSelectedLessons(new Set())
                    }}
                    className="mr-2"
                  />
                  <span>Send to specific class</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="selectionMode"
                    checked={selectionMode === 'multiple'}
                    onChange={() => {
                      setSelectionMode('multiple')
                      setSelectedLesson('')
                    }}
                    className="mr-2"
                  />
                  <span>Send to multiple classes</span>
                </label>
              </div>

              {selectionMode === 'single' ? (
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                >
                  <option value="">-- Select a class --</option>
                  {lessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name} {lesson.weekday && `(${lesson.weekday})`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                  {lessons.length === 0 ? (
                    <p className="text-gray-500 text-sm">No classes available</p>
                  ) : (
                    lessons.map(lesson => (
                      <label key={lesson.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedLessons.has(lesson.id)}
                          onChange={() => handleLessonCheckboxChange(lesson.id)}
                          className="mr-2"
                        />
                        <span>{lesson.name} {lesson.weekday && `(${lesson.weekday})`}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
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
                  placeholder="Enter your message here"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lifequest-orange focus:border-lifequest-orange"
                />
                {(channel === 'sms' || channel === 'both') && (
                  <p className="mt-2 text-sm text-gray-600">
                    SMS Segments: {smsSegments} (160 chars per segment)
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={handleShowConfirmation}
                disabled={selectedClients.size === 0 || !body || loading}
                className="w-full px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? 'Sending...' : `Send to ${validRecipients.length} ${validRecipients.length === 1 ? 'Parent' : 'Parents'}`}
              </button>
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

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Send</h2>
            
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-700">Recipients:</div>
                <div className="text-xl font-bold text-lifequest-orange">
                  {validRecipients.length} {validRecipients.length === 1 ? 'Parent' : 'Parents'}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-700">Channel:</div>
                <div className="text-lg font-semibold text-gray-900">
                  {channel === 'both' ? 'Email & SMS' : channel.toUpperCase()}
                </div>
              </div>

              {selectionMode === 'multiple' && selectedLessons.size > 0 && (
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-700 mb-2">Classes:</div>
                  <div className="text-sm text-gray-900 space-y-1">
                    {Array.from(selectedLessons).map(lessonId => {
                      const lesson = lessons.find(l => l.id === lessonId)
                      return lesson ? (
                        <div key={lessonId}>• {lesson.name}</div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {selectionMode === 'single' && selectedLesson && (
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-700">Class:</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {lessons.find(l => l.id === selectedLesson)?.name}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to send this message?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="flex-1 px-6 py-2 bg-lifequest-orange text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Confirm Send'}
                </button>
              </div>
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


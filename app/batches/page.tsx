import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function BatchesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's org membership
  const { data: orgMember } = await supabase
    .from('org_members')
    .select('role, org_id')
    .eq('user_id', user.id)
    .single()

  const isAdmin = (orgMember as any)?.role === 'admin'

  // Get all message batches with stats
  const { data: batches } = await supabase
    .from('message_batches')
    .select(`
      *,
      lessons(name),
      message_outbox(id, status)
    `)
    .eq('org_id', (orgMember as any)?.org_id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        user={{ email: user.email, role: (orgMember as any)?.role }} 
        showEmergency={isAdmin}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Message Batches</h1>
            <p className="mt-2 text-gray-600">
              Monitor delivery status of sent messages
            </p>
          </div>
          <Link
            href="/compose"
            className="px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
          >
            Send New Message
          </Link>
        </div>

        {!batches || batches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Messages Sent Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start by composing and sending your first message
            </p>
            <Link
              href="/compose"
              className="inline-block px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
            >
              Compose Message
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lesson
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent / Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch: any) => {
                  const outbox = batch.message_outbox || []
                  const total = outbox.length
                  const sent = outbox.filter((m: any) => m.status === 'sent').length
                  const failed = outbox.filter((m: any) => m.status === 'failed').length
                  const pending = outbox.filter((m: any) => m.status === 'pending').length

                  return (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {batch.lessons?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {batch.subject || batch.body.substring(0, 50) + '...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                          {batch.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          batch.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : batch.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : batch.status === 'sending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">{sent}</span>
                          {failed > 0 && <span className="text-red-600">/ {failed}❌</span>}
                          {pending > 0 && <span className="text-yellow-600">/ {pending}⏳</span>}
                          <span className="text-gray-500">/ {total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/batches/${batch.id}`}
                          className="text-lifequest-orange hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}


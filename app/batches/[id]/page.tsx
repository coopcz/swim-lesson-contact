import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BatchDetailPage({ params }: PageProps) {
  const { id } = await params
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

  // Get batch details
  const { data: batch } = await supabase
    .from('message_batches')
    .select(`
      *,
      lessons(name, weekday, start_time)
    `)
    .eq('id', id)
    .eq('org_id', (orgMember as any)?.org_id || '')
    .single()

  if (!batch) {
    redirect('/batches')
  }

  // Get message outbox
  const { data: outbox } = await supabase
    .from('message_outbox')
    .select(`
      *,
      clients(parent_name, child_name, email, phone)
    `)
    .eq('batch_id', id)
    .order('status')

  const stats = {
    total: outbox?.length || 0,
    sent: outbox?.filter((m: any) => m.status === 'sent').length || 0,
    failed: outbox?.filter((m: any) => m.status === 'failed').length || 0,
    pending: outbox?.filter((m: any) => m.status === 'pending').length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        user={{ email: user.email, role: (orgMember as any)?.role }} 
        showEmergency={isAdmin}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/batches"
            className="text-lifequest-orange hover:underline mb-4 inline-block"
          >
            ← Back to Sent Messages
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Batch Details</h1>
          <p className="mt-2 text-gray-600">
            Sent on {new Date((batch as any).created_at).toLocaleString()}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Messages</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Sent</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{stats.sent}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Failed</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{stats.failed}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Pending</div>
            <div className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
        </div>

        {/* Message Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Message Details</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm font-medium text-gray-600">Lesson</div>
              <div className="text-gray-900">{(batch as any).lessons?.name || 'N/A'}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600">Channel</div>
              <div className="text-gray-900 uppercase">{(batch as any).channel}</div>
            </div>

            {(batch as any).subject && (
              <div className="col-span-2">
                <div className="text-sm font-medium text-gray-600">Subject</div>
                <div className="text-gray-900">{(batch as any).subject}</div>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Message Body</div>
            <div className="p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap text-gray-900">
              {(batch as any).body}
            </div>
          </div>
        </div>

        {/* Delivery Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Delivery Status</h2>
            {stats.failed > 0 && (
              <button className="px-4 py-2 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90">
                Retry Failed
              </button>
            )}
          </div>

          {!outbox || outbox.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No messages found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {outbox.map((message: any) => {
                    const client = message.clients
                    return (
                      <tr key={message.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{client.parent_name}</div>
                          <div className="text-gray-500 text-xs">{client.child_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {message.channel === 'email' ? message.dest_email : message.dest_phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                            {message.channel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            message.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : message.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {message.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {message.sent_at
                            ? new Date(message.sent_at).toLocaleString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                          {message.last_error || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


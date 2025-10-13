import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's org membership
  const { data: orgMember } = await supabase
    .from('org_members')
    .select('role, org_id, orgs(name)')
    .eq('user_id', user.id)
    .single()

  const isAdmin = (orgMember as any)?.role === 'admin'

  // Get quick stats
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', (orgMember as any)?.org_id || '')

  const { count: lessonsCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', (orgMember as any)?.org_id || '')

  const { count: batchesCount } = await supabase
    .from('message_batches')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', (orgMember as any)?.org_id || '')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        user={{ email: user.email, role: (orgMember as any)?.role }} 
        showEmergency={isAdmin}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to LifeQuest Swim Comms
          </h1>
          <p className="mt-2 text-gray-600">
            Manage swim lesson communications for {((orgMember as any)?.orgs as any)?.name || 'your organization'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Parents</div>
            <div className="mt-2 text-3xl font-bold text-lifequest-orange">
              {clientsCount || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Lesson Groups</div>
            <div className="mt-2 text-3xl font-bold text-lifequest-orange">
              {lessonsCount || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Messages Sent</div>
            <div className="mt-2 text-3xl font-bold text-lifequest-orange">
              {batchesCount || 0}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/upload"
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-lifequest-orange hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-2">📤</div>
              <div className="text-center font-medium text-gray-900">Upload Roster</div>
              <div className="text-sm text-gray-500 mt-1">Import from Mindbody</div>
            </Link>

            <Link
              href="/compose"
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-lifequest-orange hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-2">✉️</div>
              <div className="text-center font-medium text-gray-900">Send Message</div>
              <div className="text-sm text-gray-500 mt-1">Email or SMS blast</div>
            </Link>

            <Link
              href="/lessons"
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-lifequest-orange hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-2">🏊</div>
              <div className="text-center font-medium text-gray-900">View Lessons</div>
              <div className="text-sm text-gray-500 mt-1">See all groups</div>
            </Link>

            <Link
              href="/batches"
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-lifequest-orange hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-2">📊</div>
              <div className="text-center font-medium text-gray-900">View Batches</div>
              <div className="text-sm text-gray-500 mt-1">Monitor delivery</div>
            </Link>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <ol className="space-y-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-lifequest-orange text-white rounded-full text-sm font-bold mr-3">
                1
              </span>
              <div>
                <strong>Upload your roster:</strong> Export a CSV from Mindbody and upload it to import parent contacts and lesson groups.
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-lifequest-orange text-white rounded-full text-sm font-bold mr-3">
                2
              </span>
              <div>
                <strong>Compose a message:</strong> Select a lesson group, choose email/SMS, and write your message with template variables.
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-lifequest-orange text-white rounded-full text-sm font-bold mr-3">
                3
              </span>
              <div>
                <strong>Preview and send:</strong> Test your message, then send it to all parents in the selected group.
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-lifequest-orange text-white rounded-full text-sm font-bold mr-3">
                4
              </span>
              <div>
                <strong>Monitor delivery:</strong> Check the batches page to see delivery status and handle any failures.
              </div>
            </li>
          </ol>
        </div>
      </main>
    </div>
  )
}

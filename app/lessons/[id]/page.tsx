import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LessonDetailPage({ params }: PageProps) {
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

  // Get lesson details
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .eq('org_id', (orgMember as any)?.org_id || '')
    .single()

  if (!lesson) {
    redirect('/lessons')
  }

  // Get enrolled clients
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      clients(*)
    `)
    .eq('lesson_id', id)
    .eq('status', 'active')
    .order('clients(parent_name)')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        user={{ email: user.email, role: (orgMember as any)?.role }} 
        showEmergency={isAdmin}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/lessons"
            className="text-lifequest-orange hover:underline mb-4 inline-block"
          >
            ← Back to Lessons
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{(lesson as any).name}</h1>
          <div className="mt-2 flex items-center space-x-4 text-gray-600">
            {(lesson as any).weekday && (
              <span className="flex items-center">
                <span className="mr-2">📅</span>
                {(lesson as any).weekday}
              </span>
            )}
            {(lesson as any).start_time && (
              <span className="flex items-center">
                <span className="mr-2">🕐</span>
                {(lesson as any).start_time}
              </span>
            )}
            {(lesson as any).location && (
              <span className="flex items-center">
                <span className="mr-2">📍</span>
                {(lesson as any).location}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Enrolled Parents ({enrollments?.length || 0})
            </h2>
            <Link
              href={`/compose?lesson=${id}`}
              className="px-6 py-2 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
            >
              Send Message
            </Link>
          </div>

          {!enrollments || enrollments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No parents enrolled in this lesson yet</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.map((enrollment: any) => {
                    const client = enrollment.clients
                    return (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.parent_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {client.child_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {client.email || (
                            <span className="text-gray-400">No email</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {client.phone || (
                            <span className="text-gray-400">No phone</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            enrollment.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {enrollment.status}
                          </span>
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


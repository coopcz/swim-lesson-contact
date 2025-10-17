import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LessonsPage() {
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

  // Get all lessons with enrollment counts
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      *,
      enrollments(count)
    `)
    .eq('org_id', (orgMember as any)?.org_id || '')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        user={{ email: user.email, role: (orgMember as any)?.role }} 
        showEmergency={isAdmin}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Swim Lessons</h1>
          <p className="mt-2 text-gray-600">
            View all lesson groups and their enrolled students
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/classes"
            className="flex items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-lifequest-orange hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🏊</div>
              <div className="font-medium text-gray-900">Manage Classes</div>
              <div className="text-sm text-gray-500 mt-1">Add or edit classes</div>
            </div>
          </Link>
          <Link
            href="/parents"
            className="flex items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-lifequest-orange hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">👥</div>
              <div className="font-medium text-gray-900">Manage Parents</div>
              <div className="text-sm text-gray-500 mt-1">Add or edit families</div>
            </div>
          </Link>
          <Link
            href="/compose"
            className="flex items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-lifequest-orange hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">✉️</div>
              <div className="font-medium text-gray-900">Send Message</div>
              <div className="text-sm text-gray-500 mt-1">Email or SMS</div>
            </div>
          </Link>
        </div>

        {!lessons || lessons.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🏊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Classes Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first swim lesson class to get started
            </p>
            <Link
              href="/classes"
              className="inline-block px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
            >
              Add New Class
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson: any) => {
              const enrollmentCount = lesson.enrollments?.[0]?.count || 0
              
              return (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-lifequest-orange"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {lesson.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {lesson.weekday && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">📅</span>
                        {lesson.weekday}
                      </div>
                    )}
                    
                    {lesson.start_time && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">🕐</span>
                        {lesson.start_time}
                      </div>
                    )}
                    
                    {lesson.location && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">📍</span>
                        {lesson.location}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Enrolled</span>
                      <span className="text-2xl font-bold text-lifequest-orange">
                        {enrollmentCount}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}


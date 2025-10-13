import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
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

  // Get org members if admin
  const { data: members } = isAdmin ? await supabase
    .from('org_members')
    .select('*, users:user_id(email)')
    .eq('org_id', (orgMember as any)?.org_id || '')
    : { data: null }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        user={{ email: user.email, role: (orgMember as any)?.role }} 
        showEmergency={isAdmin}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization and system settings
          </p>
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Organization</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-600">Name</div>
              <div className="text-gray-900">{((orgMember as any)?.orgs as any)?.name || 'LifeQuest'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Your Role</div>
              <div className="text-gray-900 capitalize">{(orgMember as any)?.role}</div>
            </div>
          </div>
        </div>

        {/* Communication Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Communication Settings</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Quiet Hours for SMS</div>
              <div className="text-gray-900">9:00 PM - 7:00 AM (Default)</div>
              <p className="text-sm text-gray-500 mt-1">
                SMS messages will not be sent during these hours unless emergency mode is enabled
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Twilio SMS Configuration</div>
              <p className="text-sm text-gray-500">
                Configure your Twilio credentials in the Vercel environment variables:
              </p>
              <ul className="text-sm text-gray-600 mt-2 list-disc list-inside space-y-1">
                <li>TWILIO_ACCOUNT_SID</li>
                <li>TWILIO_AUTH_TOKEN</li>
                <li>TWILIO_PHONE_NUMBER</li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Resend Email Configuration</div>
              <p className="text-sm text-gray-500">
                Configure your Resend API key in the Vercel environment variables:
              </p>
              <ul className="text-sm text-gray-600 mt-2 list-disc list-inside">
                <li>RESEND_API_KEY</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Team Members (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
              <button className="px-4 py-2 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90">
                Invite User
              </button>
            </div>

            {!members || members.length === 0 ? (
              <p className="text-gray-600">No team members found</p>
            ) : (
              <div className="space-y-3">
                {members.map((member: any) => (
                  <div key={member.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                    <div>
                      <div className="font-medium text-gray-900">{(member.users as any)?.email || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* System Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Application Version</span>
              <span className="text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Environment</span>
              <span className="text-gray-900">Production</span>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">🔧 Setup Required</h3>
          <p className="text-sm text-blue-800 mb-3">
            To enable SMS and email functionality, you need to configure the following services:
          </p>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Sign up for <strong>Twilio</strong> (twilio.com) for SMS messaging</li>
            <li>Sign up for <strong>Resend</strong> (resend.com) for email delivery</li>
            <li>Add your API keys to Vercel environment variables</li>
            <li>Deploy the Supabase Edge Functions for message dispatching</li>
          </ol>
          <p className="text-sm text-blue-800 mt-3">
            See the README.md file for detailed setup instructions.
          </p>
        </div>
      </main>
    </div>
  )
}


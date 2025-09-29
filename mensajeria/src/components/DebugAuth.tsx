'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugAuth() {
  const { user, session, loading } = useAuth()
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [userKeys, setUserKeys] = useState<any>(null)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        setAuthStatus({
          hasSession: !!currentSession,
          hasUser: !!currentSession?.user,
          userId: currentSession?.user?.id?.substring(0, 8) + '...' || 'None',
          userEmail: currentSession?.user?.email || 'None',
          error: error?.message || null
        })

        // If user is authenticated, get their keys
        if (currentSession?.user?.id) {
          const { data: keys, error: keysError } = await supabase
            .from('profile_keys')
            .select('public_key, key_usage, curve_type')
            .eq('profile_id', currentSession.user.id)
            .eq('key_usage', 'keyAgreement')
            .eq('curve_type', 'x25519')
            .limit(1)

          if (keysError) {
            console.error('Error fetching user keys:', keysError)
            setUserKeys({ error: keysError.message })
          } else if (keys && keys.length > 0) {
            setUserKeys({
              hasKeys: true,
              publicKey: keys[0].public_key?.substring(0, 16) + '...' || 'None',
              keyUsage: keys[0].key_usage,
              curveType: keys[0].curve_type
            })
          } else {
            setUserKeys({ hasKeys: false })
          }
        } else {
          setUserKeys(null)
        }
      } catch (err) {
        setAuthStatus({
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    checkAuthStatus()
  }, [user, session])

  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded">
        🔄 Loading authentication...
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded max-w-sm">
      <h3 className="font-bold text-sm mb-2">🔐 Auth Debug</h3>
      <div className="text-xs space-y-1">
        <div><strong>Context User:</strong> {user ? user.id.substring(0, 8) + '...' : 'None'}</div>
        <div><strong>Context Session:</strong> {session ? 'Yes' : 'No'}</div>
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        {authStatus && (
          <>
            <div><strong>Current Session:</strong> {authStatus.hasSession ? 'Yes' : 'No'}</div>
            <div><strong>Current User:</strong> {authStatus.hasUser ? 'Yes' : 'No'}</div>
            <div><strong>User ID:</strong> {authStatus.userId}</div>
            <div><strong>User Email:</strong> {authStatus.userEmail}</div>
            {authStatus.error && (
              <div><strong>Error:</strong> {authStatus.error}</div>
            )}
          </>
        )}
        {userKeys && (
          <>
            <div className="border-t border-blue-300 pt-2 mt-2">
              <div><strong>🔑 User Keys:</strong></div>
              <div><strong>Has Keys:</strong> {userKeys.hasKeys ? 'Yes' : 'No'}</div>
              {userKeys.hasKeys && (
                <>
                  <div><strong>Public Key:</strong> {userKeys.publicKey}</div>
                  <div><strong>Key Usage:</strong> {userKeys.keyUsage}</div>
                  <div><strong>Curve Type:</strong> {userKeys.curveType}</div>
                </>
              )}
              {userKeys.error && (
                <div><strong>Keys Error:</strong> {userKeys.error}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

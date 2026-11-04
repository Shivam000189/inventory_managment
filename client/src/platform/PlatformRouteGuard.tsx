import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/ui/Feedback'
import { getAuthenticatedPath, isSuperAdmin } from './platformPaths'

export function PlatformRouteGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading" role="status" aria-busy="true">
        <span className="sr-only">Checking session authentication…</span>
        <Spinner size={32} />
      </div>
    )
  }
  if (!session?.user) return <Navigate to="/login" replace />
  if (session.user.mustChangePassword) return <Navigate to="/change-password" replace />
  if (!isSuperAdmin(session.user)) {
    return <Navigate to={getAuthenticatedPath(session.user)} replace />
  }

  return <>{children}</>
}

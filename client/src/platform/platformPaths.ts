import type { Account } from '../types'

export function getAuthenticatedPath(user: Account): string {
  if (user.platformRole === 'super_admin' || user.platform_role === 'super_admin') {
    return '/super-admin/dashboard'
  }

  if (
    user.role === 'team' ||
    user.role === 'salesperson' ||
    user.roleId === 'ROLE-SALESPERSON'
  ) {
    return '/pos'
  }

  return '/overview'
}

export function isSuperAdmin(user: Account | null | undefined): boolean {
  return user?.platformRole === 'super_admin' || user?.platform_role === 'super_admin'
}

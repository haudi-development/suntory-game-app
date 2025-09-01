import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type UserRole = 'user' | 'admin' | 'moderator'

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  return role?.role as UserRole || 'user'
}

export async function requireRole(requiredRoles: UserRole[]) {
  const role = await getUserRole()
  
  if (!role || !requiredRoles.includes(role)) {
    redirect('/unauthorized')
  }
  
  return role
}

export async function checkPermission(permission: string): Promise<boolean> {
  const role = await getUserRole()
  
  const permissions: Record<UserRole, string[]> = {
    admin: [
      'view_all_users',
      'edit_all_users',
      'delete_users',
      'manage_products',
      'manage_badges',
      'view_analytics',
      'manage_settings',
      'manage_roles'
    ],
    moderator: [
      'view_all_users',
      'manage_products',
      'manage_badges',
      'view_analytics'
    ],
    user: []
  }
  
  if (!role) return false
  return permissions[role].includes(permission)
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin'
}

export async function isModerator(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'moderator' || role === 'admin'
}
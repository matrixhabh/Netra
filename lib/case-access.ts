import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { caseMemberships } from '@/lib/db/schema'
import { headers } from 'next/headers'

export type CaseRole = 'investigator' | 'supervisor' | 'owner'

export async function getCaseAccess(caseId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const [membership] = await db
    .select({ role: caseMemberships.role })
    .from(caseMemberships)
    .where(and(eq(caseMemberships.caseId, caseId), eq(caseMemberships.userId, session.user.id)))
    .limit(1)

  if (!membership) return null
  return { user: session.user, role: membership.role as CaseRole }
}

export function canRemoveEvidence(role: CaseRole) {
  return role === 'supervisor' || role === 'owner'
}

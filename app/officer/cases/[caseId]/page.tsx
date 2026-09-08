import { CaseWorkspace } from '@/components/officer-portal'
import type { Locale } from '@/lib/i18n/types'

type Props = { params: Promise<{ caseId: string }>; searchParams: Promise<{ tab?: string }> }
export default async function CaseDetailPage({ params, searchParams }: Props) { const { caseId } = await params; const { tab } = await searchParams; return <CaseWorkspace caseId={caseId} initialTab={tab ?? 'overview'} locale={'en' as Locale} /> }

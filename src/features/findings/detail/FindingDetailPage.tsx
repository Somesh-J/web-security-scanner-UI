import { ChevronRight, SearchX } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useFinding, useTargets } from '@/api/queries'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ButtonLink } from '@/components/ui/Button'
import { Page } from '@/components/ui/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { FindingDetail } from './FindingDetail'

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading issue" className="flex flex-col gap-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-4 h-24 w-full rounded-lg" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

/** Full-page issue view at /findings/:id, used for direct links and reloads. */
export function FindingDetailPage() {
  const { id = '' } = useParams()
  const { search } = useLocation()
  const finding = useFinding(id)
  useDocumentTitle(finding.data?.title ?? 'Issue')
  const { data: targets } = useTargets()
  const target = targets?.find((t) => t.id === finding.data?.targetId)

  let body
  if (finding.data) body = <FindingDetail finding={finding.data} target={target} variant="page" />
  else if (finding.isError && finding.error instanceof ApiError && finding.error.status === 404)
    body = (
      <EmptyState
        icon={<SearchX />}
        title="This issue doesn't exist or was removed"
        detail="It may have been removed along with its website, or the link is wrong."
        action={<ButtonLink to="/findings">Back to issues</ButtonLink>}
      />
    )
  else if (finding.isError)
    body = (
      <ErrorState
        error={finding.error}
        resource="this issue"
        onRetry={() => void finding.refetch()}
        retrying={finding.isFetching}
      />
    )
  else body = <DetailSkeleton />

  return (
    <Page>
      <nav aria-label="Breadcrumb">
        <ol className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-ink-3">
          <li>
            <Link to={{ pathname: '/findings', search }} className="font-medium text-ink-2 hover:text-ink">
              Issues
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="min-w-0 truncate">
            {finding.data?.title ?? id}
          </li>
        </ol>
      </nav>
      {body}
    </Page>
  )
}

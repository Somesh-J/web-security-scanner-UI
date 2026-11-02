import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useFinding, useTargets } from '@/api/queries'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { FindingDetail } from './FindingDetail'

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading finding" className="flex flex-col gap-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-96 max-w-full" />
      <Skeleton className="mt-4 h-20 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

/** Full-page finding view at /findings/:id, used for direct links and reloads. */
export function FindingDetailPage() {
  const { id = '' } = useParams()
  const { search } = useLocation()
  const finding = useFinding(id)
  const { data: targets } = useTargets()
  const target = targets?.find((t) => t.id === finding.data?.targetId)

  let body
  if (finding.data) body = <FindingDetail finding={finding.data} target={target} variant="page" />
  else if (finding.isError && finding.error instanceof ApiError && finding.error.status === 404)
    body = (
      <EmptyState
        title={`${id}: no such finding`}
        detail="It may have been removed with its target, or the link is wrong."
        action={<ButtonLink to="/findings">Back to findings</ButtonLink>}
      />
    )
  else if (finding.isError)
    body = (
      <ErrorState
        error={finding.error}
        resource={`/api/findings/${id}`}
        onRetry={() => void finding.refetch()}
        retrying={finding.isFetching}
      />
    )
  else body = <DetailSkeleton />

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 py-6 md:px-6">
      <Link
        to={{ pathname: '/findings', search }}
        className="w-fit font-mono text-[12px] text-ash hover:text-bone"
      >
        ‹ cd ../findings
      </Link>
      {body}
    </div>
  )
}

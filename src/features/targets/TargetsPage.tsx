import * as Menu from '@radix-ui/react-dropdown-menu'
import { Globe, Lock, MoreHorizontal, Pencil, Plus, Radar, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDeleteTarget, useFindings, useScans, useTargets } from '@/api/queries'
import { EnvBadge, SeverityCounts } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Card, Page, PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatRelative, formatUtc } from '@/lib/format'
import { ENV_LABEL, isOpenStatus } from '@/lib/labels'
import { useUiStore } from '@/stores/ui'
import { ENVIRONMENTS, type Environment, type FindingsCount, type Target } from '@/types/domain'
import { TargetFormDialog } from './TargetFormDialog'

const menuItem =
  'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] text-ink outline-none data-[highlighted]:bg-surface-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'

const emptyCounts = (): FindingsCount => ({ critical: 0, high: 0, medium: 0, low: 0 })

export function TargetsPage() {
  const targets = useTargets()
  const { data: scans = [] } = useScans()
  const { data: findings } = useFindings()
  const remove = useDeleteTarget()
  const openNewScan = useUiStore((s) => s.openNewScan)
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [env, setEnv] = useState<Environment | ''>('')
  const [editing, setEditing] = useState<Target | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [removing, setRemoving] = useState<Target | null>(null)

  // `/targets?add=1` (from the command palette or the Overview checklist) opens the add dialog on arrival.
  // Derived from the URL rather than copied into state, so there is no effect and no extra render.
  const addFromUrl = params.get('add') === '1'
  const dialogOpen = formOpen || addFromUrl

  function setDialogOpen(open: boolean) {
    setFormOpen(open)
    if (!open && addFromUrl)
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('add')
          return next
        },
        { replace: true },
      )
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (targets.data ?? []).filter(
      (t) => (!env || t.environment === env) && (!q || `${t.name} ${t.url}`.toLowerCase().includes(q)),
    )
  }, [targets.data, search, env])

  const busy = useMemo(
    () =>
      new Set(scans.filter((s) => s.status === 'running' || s.status === 'queued').map((s) => s.targetId)),
    [scans],
  )

  /** Open issues per website, split by severity, so the table shows how bad as well as how many. */
  const openBySite = useMemo(() => {
    const map = new Map<string, FindingsCount>()
    for (const f of findings ?? []) {
      if (!isOpenStatus(f.status) || f.severity === 'info') continue
      const counts = map.get(f.targetId) ?? emptyCounts()
      counts[f.severity] += 1
      map.set(f.targetId, counts)
    }
    return map
  }, [findings])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(t: Target) {
    setEditing(t)
    setFormOpen(true)
  }

  const lastScanned = (t: Target) =>
    busy.has(t.id) ? (
      <span className="inline-flex items-center gap-1.5 font-medium text-brand-text">
        <span aria-hidden className="size-1.5 rounded-full bg-brand" />
        Scanning now
      </span>
    ) : t.lastScannedAt ? (
      <span title={formatUtc(t.lastScannedAt)}>{formatRelative(t.lastScannedAt, now)}</span>
    ) : (
      'Never'
    )

  const openIssues = (t: Target) => {
    const counts = openBySite.get(t.id)
    if (findings && counts) {
      return (
        <Link
          to={`/findings?target=${t.id}&status=open,confirmed`}
          className="inline-flex rounded-md hover:opacity-80"
          aria-label={`${t.openFindings} open issues on ${t.name}. View them`}
        >
          <SeverityCounts counts={counts} />
        </Link>
      )
    }
    if (t.openFindings > 0)
      return (
        <Link
          to={`/findings?target=${t.id}&status=open,confirmed`}
          className="tabular font-medium text-brand-text hover:underline"
        >
          {t.openFindings} open
        </Link>
      )
    return <SeverityCounts counts={emptyCounts()} emptyLabel="No open issues" />
  }

  const actions = (t: Target) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        icon={<Radar aria-hidden />}
        disabled={busy.has(t.id)}
        onClick={() => openNewScan(t.id)}
        aria-label={`Scan ${t.name}`}
      >
        Scan
      </Button>
      <Menu.Root>
        <Menu.Trigger
          className="inline-flex size-8 items-center justify-center rounded-md text-ink-2 hover:bg-surface-2 hover:text-ink data-[state=open]:bg-surface-2"
          aria-label={`More actions for ${t.name}`}
        >
          <MoreHorizontal aria-hidden className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-48 animate-fade rounded-lg border border-line bg-surface p-1.5 shadow-lg"
          >
            <Menu.Item className={menuItem} onSelect={() => openEdit(t)}>
              <Pencil aria-hidden className="size-4 text-ink-3" />
              Edit
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-line" />
            <Menu.Item className={cn(menuItem, 'text-danger')} onSelect={() => setRemoving(t)}>
              <Trash2 aria-hidden className="size-4" />
              Remove
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
    </div>
  )

  const nameCell = (t: Target) => (
    <div className="min-w-0">
      <p className="truncate text-[14px] font-medium text-ink">{t.name}</p>
      <p className="flex min-w-0 items-center gap-2 text-[13px] text-ink-3">
        <span className="truncate">{t.url}</span>
        {t.authenticated && (
          <span className="inline-flex shrink-0 items-center gap-1" title="Scans log in first">
            <Lock aria-hidden className="size-3" />
            Login
          </span>
        )}
      </p>
    </div>
  )

  let body
  if (targets.isPending)
    body = <SkeletonRows label="Loading your websites" columns={['w-48', 'w-24', 'w-20', 'w-28', 'w-24']} />
  else if (targets.isError)
    body = (
      <ErrorState
        error={targets.error}
        resource="your websites"
        onRetry={() => void targets.refetch()}
        retrying={targets.isFetching}
      />
    )
  else if ((targets.data ?? []).length === 0)
    body = (
      <EmptyState
        icon={<Globe />}
        title="No websites yet"
        detail="Add your first website to start scanning it for security issues."
        action={
          <Button variant="primary" icon={<Plus aria-hidden />} onClick={openCreate}>
            Add website
          </Button>
        }
      />
    )
  else if (rows.length === 0)
    body = (
      <EmptyState
        icon={<Search />}
        title="No websites match"
        detail="Try a different name or address, or clear the filters."
        action={
          <Button
            onClick={() => {
              setSearch('')
              setEnv('')
            }}
          >
            Clear filters
          </Button>
        }
      />
    )
  else
    body = (
      <>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <caption className="sr-only">Websites and APIs you can scan</caption>
            <thead>
              <tr className="border-y border-line bg-surface-2/60">
                {['Name', 'Environment', 'Last scanned', 'Open issues', ''].map((h, i) => (
                  <th key={h || i} scope="col" className={cn('label px-5 py-2.5', i === 4 && 'w-40')}>
                    {h || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-b-0 hover:bg-surface-2/60">
                  <td className="max-w-[340px] px-5 py-3.5">{nameCell(t)}</td>
                  <td className="px-5 py-3.5">
                    <EnvBadge environment={t.environment} />
                  </td>
                  <td className="px-5 py-3.5 text-[14px] text-ink-2">{lastScanned(t)}</td>
                  <td className="px-5 py-3.5 text-[14px]">{openIssues(t)}</td>
                  <td className="px-5 py-3.5">{actions(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line border-t border-line md:hidden" aria-label="Websites">
          {rows.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                {nameCell(t)}
                <EnvBadge environment={t.environment} className="shrink-0" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-2">
                <span>Last scanned: {lastScanned(t)}</span>
                {openIssues(t)}
              </div>
              {actions(t)}
            </li>
          ))}
        </ul>
      </>
    )

  return (
    <Page>
      <PageHeader
        title="Websites & APIs"
        description="Only add sites you own or have written permission to test."
        actions={
          <Button variant="primary" icon={<Plus aria-hidden />} onClick={openCreate}>
            Add website
          </Button>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
            />
            <label htmlFor="target-search" className="sr-only">
              Search websites
            </label>
            <input
              id="target-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or address"
              className="h-9 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[14px] text-ink placeholder:text-ink-3 focus:border-brand focus:ring-3 focus:ring-brand/20 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-2">
            <span className="sr-only sm:not-sr-only">Environment</span>
            <select
              value={env}
              onChange={(e) => setEnv(e.target.value as Environment | '')}
              className="h-9 cursor-pointer rounded-md border border-line-strong bg-surface px-3 text-[14px] text-ink focus:border-brand focus:outline-none"
            >
              <option value="">All environments</option>
              {ENVIRONMENTS.map((e) => (
                <option key={e} value={e}>
                  {ENV_LABEL[e]}
                </option>
              ))}
            </select>
          </label>
          {targets.data && (
            <p className="ml-auto text-[13px] text-ink-3">
              {rows.length} of {targets.data.length} {targets.data.length === 1 ? 'website' : 'websites'}
            </p>
          )}
        </div>
        {body}
      </Card>
      <TargetFormDialog open={dialogOpen} onOpenChange={setDialogOpen} target={addFromUrl ? null : editing} />
      <Dialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={removing ? `Remove ${removing.name}?` : 'Remove website?'}
        description="Its scan history stays in Reports. You can add it again at any time."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 aria-hidden />}
              onClick={() => {
                if (removing) remove.mutate(removing)
                setRemoving(null)
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <p className="pb-4 text-[14px] text-ink-2">
          Clearsite will stop showing this website and its open issues. Nothing on the website itself changes.
        </p>
      </Dialog>
    </Page>
  )
}

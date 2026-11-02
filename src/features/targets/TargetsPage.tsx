import * as Menu from '@radix-ui/react-dropdown-menu'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDeleteTarget, useFindings, useScans, useTargets } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { IconMore, IconPlus } from '@/components/ui/Icons'
import { PageHeader, Panel } from '@/components/ui/PageHeader'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States'
import { EnvTag } from '@/components/ui/Tags'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { focusOnMount } from '@/lib/focus'
import { formatRelative, formatUtc, pluralize } from '@/lib/format'
import type { Target } from '@/types/domain'
import { TargetFormDialog } from './TargetFormDialog'

const menuItem =
  'cursor-pointer rounded-xs px-2.5 py-1.5 font-mono text-[12px] text-bone outline-none data-[highlighted]:bg-panel-2'

export function TargetsPage() {
  const targets = useTargets()
  const { data: scans = [] } = useScans()
  const { data: findings = [] } = useFindings()
  const remove = useDeleteTarget()
  const navigate = useNavigate()
  const now = useNow()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Target | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (targets.data ?? []).filter(
      (t) => !q || `${t.name} ${t.url} ${t.environment} ${t.id}`.toLowerCase().includes(q),
    )
  }, [targets.data, search])

  const busy = useMemo(
    () =>
      new Set(scans.filter((s) => s.status === 'running' || s.status === 'queued').map((s) => s.targetId)),
    [scans],
  )

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(t: Target) {
    setEditing(t)
    setFormOpen(true)
  }

  let body
  if (targets.isPending)
    body = (
      <SkeletonRows label="fetching /api/targets" columns={['w-32', 'w-52', 'w-10', 'w-20', 'w-16', 'w-6']} />
    )
  else if (targets.isError)
    body = (
      <ErrorState
        error={targets.error}
        resource="/api/targets"
        onRetry={() => void targets.refetch()}
        retrying={targets.isFetching}
      />
    )
  else if ((targets.data ?? []).length === 0)
    body = (
      <EmptyState
        title="0 targets in scope"
        detail="Add the first website or API you are authorised to test."
        action={
          <Button variant="primary" icon={<IconPlus />} onClick={openCreate}>
            Add target
          </Button>
        }
      />
    )
  else if (rows.length === 0)
    body = (
      <EmptyState
        title={`0 targets match "${search}"`}
        action={<Button onClick={() => setSearch('')}>Clear search</Button>}
      />
    )
  else
    body = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">Targets in scope</caption>
          <thead>
            <tr className="border-b border-wire-2">
              {['Name', 'URL', 'Env', 'Last scanned', 'Open findings', ''].map((h, i) => (
                <th key={h || i} scope="col" className={cn('label px-4 py-2.5', i === 5 && 'w-12')}>
                  {h || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              if (confirmId === t.id) {
                const scanCount = scans.filter((s) => s.targetId === t.id).length
                const findingCount = findings.filter((f) => f.targetId === t.id).length
                return (
                  <tr key={t.id} className="border-b border-dashed border-wire bg-signal/[0.07]">
                    <td colSpan={6} className="px-4 py-3">
                      <div role="alert" className="flex flex-wrap items-center gap-3">
                        <p className="font-mono text-[12.5px] text-bone">
                          Remove <span className="text-signal">{t.name}</span>? This also deletes{' '}
                          {pluralize(scanCount, 'scan')} and {pluralize(findingCount, 'finding')}. Reports are
                          kept.
                        </p>
                        <div className="ml-auto flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmId(null)}
                            ref={focusOnMount}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              remove.mutate(t)
                              setConfirmId(null)
                            }}
                          >
                            Remove target
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={t.id} className="border-b border-dashed border-wire hover:bg-panel-2">
                  <td className="px-4 py-3">
                    <p className="text-[13.5px] font-medium text-bone">{t.name}</p>
                    <p className="font-mono text-[11px] text-smoke">
                      {t.id}
                      {t.authenticated && <span className="ml-2 text-ash">· authenticated</span>}
                    </p>
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 font-mono text-[12.5px] text-ash">
                    {t.url}
                  </td>
                  <td className="px-4 py-3">
                    <EnvTag environment={t.environment} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ash" title={formatUtc(t.lastScannedAt)}>
                    {busy.has(t.id) ? (
                      <span className="text-live">scanning now</span>
                    ) : (
                      formatRelative(t.lastScannedAt, now)
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12.5px]">
                    {t.openFindings > 0 ? (
                      <Link
                        to={`/findings?target=${t.id}&status=open,confirmed`}
                        className="tabular text-bone hover:underline"
                      >
                        {t.openFindings} open
                      </Link>
                    ) : (
                      <span className="text-smoke">0</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <Menu.Root>
                      <Menu.Trigger
                        className="flex size-8 items-center justify-center rounded-xs text-ash hover:bg-panel hover:text-bone"
                        aria-label={`Actions for ${t.name}`}
                      >
                        <IconMore />
                      </Menu.Trigger>
                      <Menu.Portal>
                        <Menu.Content
                          align="end"
                          sideOffset={4}
                          className="z-50 min-w-44 animate-fade rounded-sm border border-wire-2 bg-panel p-1 shadow-pop"
                        >
                          <Menu.Item className={menuItem} onSelect={() => openEdit(t)}>
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            className={cn(
                              menuItem,
                              'data-[disabled]:cursor-not-allowed data-[disabled]:text-smoke',
                            )}
                            disabled={busy.has(t.id)}
                            onSelect={() => navigate(`/scans?new=1&target=${t.id}`)}
                          >
                            Scan now
                          </Menu.Item>
                          <Menu.Item
                            className={menuItem}
                            onSelect={() => navigate(`/findings?target=${t.id}`)}
                          >
                            View findings
                          </Menu.Item>
                          <Menu.Separator className="my-1 h-px bg-wire" />
                          <Menu.Item
                            className={cn(menuItem, 'text-signal')}
                            onSelect={() => setConfirmId(t.id)}
                          >
                            Remove…
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Portal>
                    </Menu.Root>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )

  return (
    <div className="flex flex-col gap-5 px-4 py-6 md:px-6">
      <PageHeader
        title="Targets"
        meta={
          targets.data
            ? `${targets.data.length} in scope · ${busy.size} scanning`
            : targets.isError
              ? 'could not load targets'
              : 'loading targets'
        }
        actions={
          <Button variant="primary" icon={<IconPlus />} onClick={openCreate}>
            Add target
          </Button>
        }
      />
      <Panel label="targets in scope">
        <div className="border-b border-dashed border-wire-2 px-4 py-3">
          <label htmlFor="target-search" className="sr-only">
            Search targets
          </label>
          <input
            id="target-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="> filter by name, URL or environment"
            className="h-8 w-full max-w-sm rounded-xs border border-wire bg-panel-2 px-2.5 font-mono text-[12.5px] text-bone placeholder:text-smoke focus:border-live focus:outline-none"
          />
        </div>
        {body}
      </Panel>
      <TargetFormDialog open={formOpen} onOpenChange={setFormOpen} target={editing} />
    </div>
  )
}

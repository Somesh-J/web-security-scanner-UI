import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/stores/toast'
import type {
  Finding,
  FindingStatus,
  LoginInput,
  Report,
  Scan,
  Session,
  Target,
  TargetInput,
} from '@/types/domain'
import { api, ApiError, errorMessage } from './client'

/**
 * Server state lives in TanStack Query. Every resource has one query key, and mutations update the cache
 * optimistically where the user expects an instant response (triage, target edits), rolling back on failure.
 */

export const queryKeys = {
  targets: ['targets'] as const,
  scans: ['scans'] as const,
  findings: ['findings'] as const,
  finding: (id: string) => ['findings', id] as const,
  reports: ['reports'] as const,
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Only retry transport failures. HTTP errors surface immediately so the error state is visible
        // and the user decides when to retry.
        retry: (count, error) => error instanceof ApiError && error.status === 0 && count < 2,
      },
      mutations: { retry: false },
    },
  })
}

/* ---------- Auth ---------- */

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => api<Session>('/api/auth/login', { method: 'POST', body: input }),
  })
}

/* ---------- Targets ---------- */

export function useTargets() {
  return useQuery({ queryKey: queryKeys.targets, queryFn: () => api<Target[]>('/api/targets') })
}

export function useCreateTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TargetInput) => api<Target>('/api/targets', { method: 'POST', body: input }),
    onSuccess: (created) => {
      qc.setQueryData<Target[]>(queryKeys.targets, (old) => (old ? [...old, created] : [created]))
      toast.success('Target added', `${created.name} is ready to scan.`)
    },
  })
}

export function useUpdateTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TargetInput }) =>
      api<Target>(`/api/targets/${id}`, { method: 'PATCH', body: input }),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: queryKeys.targets })
      const previous = qc.getQueryData<Target[]>(queryKeys.targets)
      qc.setQueryData<Target[]>(queryKeys.targets, (old) =>
        old?.map((t) =>
          t.id === id
            ? {
                ...t,
                name: input.name,
                url: input.url,
                environment: input.environment,
                authenticated: input.authenticated,
              }
            : t,
        ),
      )
      return { previous }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(queryKeys.targets, ctx?.previous),
    onSuccess: (updated) => {
      qc.setQueryData<Target[]>(queryKeys.targets, (old) =>
        old?.map((t) => (t.id === updated.id ? updated : t)),
      )
      toast.success('Target saved', updated.name)
    },
  })
}

export function useDeleteTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (target: Target) => api<void>(`/api/targets/${target.id}`, { method: 'DELETE' }),
    onMutate: async (target) => {
      await qc.cancelQueries({ queryKey: queryKeys.targets })
      const previous = qc.getQueryData<Target[]>(queryKeys.targets)
      qc.setQueryData<Target[]>(queryKeys.targets, (old) => old?.filter((t) => t.id !== target.id))
      return { previous }
    },
    onError: (e, target, ctx) => {
      qc.setQueryData(queryKeys.targets, ctx?.previous)
      toast.error(`Could not remove ${target.name}`, errorMessage(e))
    },
    onSuccess: (_d, target) => {
      // The backend cascades to the target's scans and findings.
      void qc.invalidateQueries({ queryKey: queryKeys.scans })
      void qc.invalidateQueries({ queryKey: queryKeys.findings })
      toast.success('Target removed', target.name)
    },
  })
}

/* ---------- Scans ---------- */

/** Polls every 2 s while any scan is queued or running, so progress bars advance on a timer. */
export function useScans() {
  return useQuery({
    queryKey: queryKeys.scans,
    queryFn: () => api<Scan[]>('/api/scans'),
    refetchInterval: (query) =>
      query.state.data?.some((s) => s.status === 'running' || s.status === 'queued') ? 2000 : false,
  })
}

export function useCreateScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targetId: string) => api<Scan>('/api/scans', { method: 'POST', body: { targetId } }),
    onSuccess: (scan) => {
      qc.setQueryData<Scan[]>(queryKeys.scans, (old) => (old ? [scan, ...old] : [scan]))
      void qc.invalidateQueries({ queryKey: queryKeys.scans })
      toast.success(`${scan.id} queued`, 'It starts in a few seconds. Progress updates live.')
    },
  })
}

/* ---------- Findings ---------- */

export function useFindings() {
  return useQuery({ queryKey: queryKeys.findings, queryFn: () => api<Finding[]>('/api/findings') })
}

export function useFinding(id: string) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: queryKeys.finding(id),
    queryFn: () => api<Finding>(`/api/findings/${id}`),
    // Opening a row from the table is instant: reuse the list entry while the detail request runs.
    placeholderData: () => qc.getQueryData<Finding[]>(queryKeys.findings)?.find((f) => f.id === id),
  })
}

interface StatusChange {
  ids: string[]
  status: FindingStatus
}

/** Changes the status of one or many findings, optimistically, in both the list and detail caches. */
export function useSetFindingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, status }: StatusChange) =>
      ids.length === 1
        ? api<Finding>(`/api/findings/${ids[0]}`, { method: 'PATCH', body: { status } }).then((f) => [f])
        : api<Finding[]>('/api/findings', { method: 'PATCH', body: { ids, status } }),
    onMutate: async ({ ids, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.findings })
      const idSet = new Set(ids)
      const previousList = qc.getQueryData<Finding[]>(queryKeys.findings)
      const previousDetails = ids.map((id) => [id, qc.getQueryData<Finding>(queryKeys.finding(id))] as const)
      qc.setQueryData<Finding[]>(queryKeys.findings, (old) =>
        old?.map((f) => (idSet.has(f.id) ? { ...f, status } : f)),
      )
      for (const id of ids) {
        qc.setQueryData<Finding>(queryKeys.finding(id), (old) => (old ? { ...old, status } : old))
      }
      return { previousList, previousDetails }
    },
    onError: (e, _v, ctx) => {
      qc.setQueryData(queryKeys.findings, ctx?.previousList)
      ctx?.previousDetails.forEach(([id, data]) => qc.setQueryData(queryKeys.finding(id), data))
      toast.error('Status not saved', errorMessage(e))
    },
    onSettled: () => {
      // Open-finding counts on targets depend on statuses.
      void qc.invalidateQueries({ queryKey: queryKeys.targets })
    },
  })
}

/* ---------- Reports ---------- */

export function useReports() {
  return useQuery({ queryKey: queryKeys.reports, queryFn: () => api<Report[]>('/api/reports') })
}

export function useCreateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (scanId: string) => api<Report>('/api/reports', { method: 'POST', body: { scanId } }),
    onSuccess: (report) => {
      qc.setQueryData<Report[]>(queryKeys.reports, (old) => (old ? [report, ...old] : old))
      toast.success(`${report.id} generated`, `${report.target} · ${report.findings} findings`)
    },
  })
}

import { delay, http, HttpResponse } from 'msw'
import { findingStatusSchema, loginSchema, targetPayloadSchema } from '@/lib/schemas'
import { DEMO_ACCOUNT, FAULT_KEY } from '@/lib/demo'
import type { Session } from '@/types/domain'
import { ApiFailure, createDb, type MockDb } from './db'

interface HandlerOptions {
  db?: MockDb
  /** Override latency in ms. Defaults to a random 300 to 800 ms, as the brief requires. */
  latency?: () => number
  /** Turn off the deliberate first-request failure of GET /api/reports (used by tests). */
  failReportsOnce?: boolean
}

const randomLatency = () => 300 + Math.floor(Math.random() * 500)

function faultInjected(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(FAULT_KEY) === 'on'
  } catch {
    return false
  }
}

function fail(status: number, message: string) {
  return HttpResponse.json({ message }, { status })
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** Runs a resolver with latency, optional fault injection, and ApiFailure -> HTTP error mapping. */
async function respond(latency: () => number, run: () => Response, faultable = false): Promise<Response> {
  await delay(latency())
  if (faultable && faultInjected()) {
    return fail(500, 'Simulated outage is on. Turn it off in Settings to restore the API.')
  }
  try {
    return run()
  } catch (e) {
    if (e instanceof ApiFailure) return fail(e.status, e.message)
    throw e
  }
}

export function createHandlers(options: HandlerOptions = {}) {
  const db = options.db ?? createDb()
  const latency = options.latency ?? randomLatency
  // The reports endpoint fails on its first request in every page load. This is the failing endpoint
  // the brief asks for: the error state and its Retry action can be demonstrated every time.
  let reportsShouldFail = options.failReportsOnce ?? true

  return [
    http.post('/api/auth/login', async ({ request }) => {
      const body = await readJson(request)
      return respond(latency, () => {
        const parsed = loginSchema.safeParse(body)
        if (!parsed.success) return fail(400, 'Email and passphrase are required.')
        const { email, password } = parsed.data
        if (email.toLowerCase() !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
          return fail(401, 'Access denied. The email or passphrase is wrong.')
        }
        const session: Session = {
          token: `rc_${crypto.randomUUID().replaceAll('-', '')}`,
          user: { name: 'Alex Mercer', email: DEMO_ACCOUNT.email, role: 'Red team lead' },
        }
        return HttpResponse.json(session)
      })
    }),

    http.get('/api/targets', () => respond(latency, () => HttpResponse.json(db.listTargets()), true)),

    http.post('/api/targets', async ({ request }) => {
      const body = await readJson(request)
      return respond(latency, () => {
        const parsed = targetPayloadSchema.safeParse(body)
        if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'The target is not valid.')
        return HttpResponse.json(db.createTarget(parsed.data), { status: 201 })
      })
    }),

    http.patch('/api/targets/:id', async ({ request, params }) => {
      const body = await readJson(request)
      return respond(latency, () => {
        const parsed = targetPayloadSchema.safeParse(body)
        if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'The target is not valid.')
        return HttpResponse.json(db.updateTarget(String(params.id), parsed.data))
      })
    }),

    http.delete('/api/targets/:id', ({ params }) =>
      respond(latency, () => {
        db.deleteTarget(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    ),

    http.get('/api/scans', () => respond(latency, () => HttpResponse.json(db.listScans()), true)),

    http.post('/api/scans', async ({ request }) => {
      const body = await readJson(request)
      return respond(latency, () => {
        if (typeof body.targetId !== 'string') return fail(400, 'Choose a target to scan.')
        return HttpResponse.json(db.createScan(body.targetId), { status: 201 })
      })
    }),

    http.get('/api/findings', () => respond(latency, () => HttpResponse.json(db.listFindings()), true)),

    http.get('/api/findings/:id', ({ params }) =>
      respond(latency, () => HttpResponse.json(db.getFinding(String(params.id))), true),
    ),

    http.patch('/api/findings/:id', async ({ request, params }) => {
      const body = await readJson(request)
      return respond(latency, () => {
        const status = findingStatusSchema.safeParse(body.status)
        if (!status.success) return fail(400, 'Unknown status.')
        const [updated] = db.setFindingStatus([String(params.id)], status.data)
        return HttpResponse.json(updated)
      })
    }),

    http.patch('/api/findings', async ({ request }) => {
      const body = await readJson(request)
      return respond(latency, () => {
        const status = findingStatusSchema.safeParse(body.status)
        if (!status.success || !Array.isArray(body.ids)) return fail(400, 'Send ids and a valid status.')
        return HttpResponse.json(db.setFindingStatus(body.ids.map(String), status.data))
      })
    }),

    http.get('/api/reports', () =>
      respond(
        latency,
        () => {
          if (reportsShouldFail) {
            reportsShouldFail = false
            return fail(503, 'The reports service did not respond in time.')
          }
          return HttpResponse.json(db.listReports())
        },
        true,
      ),
    ),

    http.post('/api/reports', async ({ request }) => {
      const body = await readJson(request)
      return respond(latency, () => {
        if (typeof body.scanId !== 'string') return fail(400, 'Choose a completed scan.')
        return HttpResponse.json(db.createReport(body.scanId), { status: 201 })
      })
    }),
  ]
}

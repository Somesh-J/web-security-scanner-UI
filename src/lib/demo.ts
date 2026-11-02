/** The one demo account. Any other credentials get a 401, which shows the "bad credentials" state. */
export const DEMO_ACCOUNT = { email: 'op@redcell.io', password: 'redteam-2026' }

/** Settings > "Simulate API outage" writes this localStorage key. While set, every data GET returns 500. */
export const FAULT_KEY = 'redcell:fault'

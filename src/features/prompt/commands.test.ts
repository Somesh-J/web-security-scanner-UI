import { describe, expect, it } from 'vitest'
import { parseCommand } from './commands'

describe('parseCommand', () => {
  it('navigates with goto, cd, or a bare screen name', () => {
    expect(parseCommand('goto findings')).toEqual({ kind: 'goto', route: 'findings' })
    expect(parseCommand('cd ~/targets')).toEqual({ kind: 'goto', route: 'targets' })
    expect(parseCommand('reports')).toEqual({ kind: 'goto', route: 'reports' })
    expect(parseCommand('goto nowhere').kind).toBe('error')
  })

  it('opens findings by ID only', () => {
    expect(parseCommand('open FND_5231')).toEqual({ kind: 'open', id: 'fnd_5231' })
    expect(parseCommand('open sql').kind).toBe('error')
  })

  it('launches scans by target name', () => {
    expect(parseCommand('scan "Acme Store"')).toEqual({ kind: 'scan', target: 'Acme Store' })
    expect(parseCommand('scan')).toEqual({ kind: 'goto', route: 'scans' })
  })

  it('handles theme, export, help, clear and logout', () => {
    expect(parseCommand('theme light')).toEqual({ kind: 'theme', mode: 'light' })
    expect(parseCommand('theme pink').kind).toBe('error')
    expect(parseCommand('export csv')).toEqual({ kind: 'export' })
    expect(parseCommand('?')).toEqual({ kind: 'help' })
    expect(parseCommand('clear')).toEqual({ kind: 'clear' })
    expect(parseCommand('logout')).toEqual({ kind: 'logout' })
  })

  it('treats everything else as a findings query', () => {
    expect(parseCommand('sev:crit status:open')).toEqual({ kind: 'query', text: 'sev:crit status:open' })
    expect(parseCommand('sql injection')).toEqual({ kind: 'query', text: 'sql injection' })
  })

  it('rejects empty input with guidance', () => {
    expect(parseCommand('   ').kind).toBe('error')
  })
})

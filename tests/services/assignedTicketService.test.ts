import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiService } from '~/services/api'
import {
  listAssignedTickets,
  addInternalTicketNote,
  resolveAssignedTicket,
} from '~/services/assignedTicketService'

vi.mock('~/services/api', () => ({
  apiService: { get: vi.fn(), post: vi.fn() },
}))

describe('Assigned ticket service (FE-20)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('loads tickets for the current engineer with the selected status', async () => {
    vi.mocked(apiService.get).mockResolvedValue({ count: 0, next: null, previous: null, results: [] })
    await listAssignedTickets({ page: 2, estado: 'En gestion' })
    expect(apiService.get).toHaveBeenCalledWith('/support/mis-tickets/', {
      params: { page: 2, estado: 'En gestion' },
    })
  })

  it('requests all statuses when the filter is cleared', async () => {
    await listAssignedTickets({ page: 1, estado: null })
    expect(apiService.get).toHaveBeenCalledWith('/support/mis-tickets/', {
      params: { page: 1 },
    })
  })

  it('rejects an invalid page before requesting the API', () => {
    expect(() => listAssignedTickets({ page: 0 })).toThrow('Número de página no válido')
    expect(apiService.get).not.toHaveBeenCalled()
  })

  it('sends trimmed internal observations to the documented endpoint', async () => {
    await addInternalTicketNote('TK-2026-000123', '  Revisar logs.  ')
    expect(apiService.post).toHaveBeenCalledWith(
      '/support/tickets/TK-2026-000123/notas-internas/',
      { observaciones: 'Revisar logs.' },
    )
  })

  it('sends the official solution without changing the payload contract', async () => {
    await resolveAssignedTicket('123', '  Ajustado el certificado.  ')
    expect(apiService.post).toHaveBeenCalledWith(
      '/support/tickets/123/resolver/',
      { comentario_solucion: 'Ajustado el certificado.' },
    )
  })

  it('rejects empty messages and invalid ticket identifiers', () => {
    expect(() => addInternalTicketNote('123', '  ')).toThrow()
    expect(() => resolveAssignedTicket('123', '\n')).toThrow()
    expect(() => addInternalTicketNote('../admin', 'Hola')).toThrow()
    expect(apiService.post).not.toHaveBeenCalled()
  })
})

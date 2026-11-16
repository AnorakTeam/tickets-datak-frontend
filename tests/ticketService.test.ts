import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiService } from '~/services/api'
import { getClientTicket, listClientTickets } from '~/services/ticketService'

vi.mock('~/services/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('ticketService.listClientTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests the selected page without an empty status filter', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })

    await listClientTickets({ page: 2 })

    expect(apiService.get).toHaveBeenCalledWith('/client/tickets/', {
      params: { page: 2 },
    })
  })

  it('forwards the selected status to the backend', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })

    await listClientTickets({ page: 1, estado: 'En gestion' })

    expect(apiService.get).toHaveBeenCalledWith('/client/tickets/', {
      params: { page: 1, estado: 'En gestion' },
    })
  })
})

describe('ticketService.getClientTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests the client-safe detail endpoint using the radicado', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      radicado: 'TK-2026-000042',
    })

    await getClientTicket('TK-2026-000042')

    expect(apiService.get).toHaveBeenCalledWith('/client/tickets/TK-2026-000042/')
  })

  it('encodes the radicado before adding it to the request path', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      radicado: 'TK-2026-000042',
    })

    await getClientTicket('TK-2026/000042')

    expect(apiService.get).toHaveBeenCalledWith('/client/tickets/TK-2026%2F000042/')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ticketService } from '~/services/ticketService'
import { useClientTickets } from '~/composables/useClientTickets'

vi.mock('~/services/ticketService', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/services/ticketService')>()

  return {
    ...original,
    ticketService: {
      ...original.ticketService,
      listClientTickets: vi.fn(),
    },
  }
})

const emptyPage = {
  count: 0,
  next: null,
  previous: null,
  results: [],
}

describe('useClientTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the first page without a status filter', async () => {
    vi.mocked(ticketService.listClientTickets).mockResolvedValue(emptyPage)
    const clientTickets = useClientTickets()

    await clientTickets.loadTickets()

    expect(ticketService.listClientTickets).toHaveBeenCalledWith({ page: 1 })
    expect(clientTickets.errorMessage.value).toBeNull()
  })

  it('resets pagination when selecting a status filter', async () => {
    vi.mocked(ticketService.listClientTickets).mockResolvedValue(emptyPage)
    const clientTickets = useClientTickets()
    clientTickets.currentPage.value = 3

    await clientTickets.selectStatus('Resuelto')

    expect(clientTickets.currentPage.value).toBe(1)
    expect(ticketService.listClientTickets).toHaveBeenCalledWith({
      page: 1,
      estado: 'Resuelto',
    })
  })

  it('calculates the page count using the backend total', async () => {
    vi.mocked(ticketService.listClientTickets).mockResolvedValue({
      ...emptyPage,
      count: 24,
    })
    const clientTickets = useClientTickets()

    await clientTickets.loadTickets()

    expect(clientTickets.totalPages.value).toBe(3)
    expect(clientTickets.hasNextPage.value).toBe(true)
  })

  it('exposes a safe retryable error state', async () => {
    vi.mocked(ticketService.listClientTickets).mockRejectedValue(new Error('Internal details'))
    const clientTickets = useClientTickets()

    await clientTickets.loadTickets()

    expect(clientTickets.errorMessage.value).toBe(
      'No fue posible cargar los tickets. Intenta nuevamente.',
    )
    expect(clientTickets.tickets.value).toEqual([])
    expect(clientTickets.isLoading.value).toBe(false)
  })

  it('discards a response that finishes after a newer request', async () => {
    let resolveFirst: ((value: typeof emptyPage) => void) | undefined
    const firstRequest = new Promise<typeof emptyPage>((resolve) => {
      resolveFirst = resolve
    })
    const latestTicket = {
      radicado: 'TK-2026-000010',
      asunto: 'Solicitud vigente',
      modulo_nombre: 'Facturación',
      prioridad: 'Media' as const,
      estado: 'Abierto' as const,
      fecha_creacion: '2026-11-14T12:00:00Z',
    }

    vi.mocked(ticketService.listClientTickets)
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValueOnce({
        ...emptyPage,
        count: 1,
        results: [latestTicket],
      })

    const clientTickets = useClientTickets()
    const pendingFirstRequest = clientTickets.loadTickets()
    const latestRequest = clientTickets.loadTickets()

    await latestRequest
    resolveFirst?.(emptyPage)
    await pendingFirstRequest

    expect(clientTickets.tickets.value).toEqual([latestTicket])
    expect(clientTickets.totalTickets.value).toBe(1)
  })
})

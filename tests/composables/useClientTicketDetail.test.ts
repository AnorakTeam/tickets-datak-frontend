import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '~/services/api'
import { ticketService } from '~/services/ticketService'
import { useClientTicketDetail } from '~/composables/useClientTicketDetail'

vi.mock('~/services/ticketService', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/services/ticketService')>()

  return {
    ...original,
    ticketService: {
      ...original.ticketService,
      getClientTicket: vi.fn(),
    },
  }
})

const ticket = {
  radicado: 'TK-2026-000042',
  estado: 'Abierto' as const,
  prioridad: 'Alta' as const,
  asunto: 'Error al emitir factura',
  descripcion: 'La factura no se genera.',
  pestana_o_documento: 'Emisión de facturas',
  canal_origen: 'Portal',
  fecha_creacion: '2026-11-14T18:30:00Z',
}

describe('useClientTicketDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads a ticket using a valid radicado', async () => {
    vi.mocked(ticketService.getClientTicket).mockResolvedValue(ticket)
    const detail = useClientTicketDetail()

    await detail.loadTicket(' TK-2026-000042 ')

    expect(ticketService.getClientTicket).toHaveBeenCalledWith('TK-2026-000042')
    expect(detail.ticket.value).toEqual(ticket)
    expect(detail.error.value).toBeNull()
    expect(detail.isLoading.value).toBe(false)
  })

  it('rejects an invalid radicado without calling the backend', async () => {
    const detail = useClientTicketDetail()

    await detail.loadTicket('../internal-ticket')

    expect(ticketService.getClientTicket).not.toHaveBeenCalled()
    expect(detail.error.value).toBe('invalid-radicado')
  })

  it('maps a 404 response to a generic not-found state', async () => {
    vi.mocked(ticketService.getClientTicket).mockRejectedValue(
      new ApiError('Backend detail', 404),
    )
    const detail = useClientTicketDetail()

    await detail.loadTicket('TK-2026-000042')

    expect(detail.ticket.value).toBeNull()
    expect(detail.error.value).toBe('not-found')
  })

  it('does not expose technical details for other request failures', async () => {
    vi.mocked(ticketService.getClientTicket).mockRejectedValue(
      new Error('Database connection failed'),
    )
    const detail = useClientTicketDetail()

    await detail.loadTicket('TK-2026-000042')

    expect(detail.error.value).toBe('request-failed')
    expect(detail.ticket.value).toBeNull()
  })

  it('discards a response that finishes after a newer request', async () => {
    let resolveFirst: ((value: typeof ticket) => void) | undefined
    const firstRequest = new Promise<typeof ticket>((resolve) => {
      resolveFirst = resolve
    })
    const latestTicket = {
      ...ticket,
      radicado: 'TK-2026-000043',
      asunto: 'Solicitud vigente',
    }

    vi.mocked(ticketService.getClientTicket)
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValueOnce(latestTicket)

    const detail = useClientTicketDetail()
    const pendingFirstRequest = detail.loadTicket('TK-2026-000042')
    const latestRequest = detail.loadTicket('TK-2026-000043')

    await latestRequest
    resolveFirst?.(ticket)
    await pendingFirstRequest

    expect(detail.ticket.value).toEqual(latestTicket)
  })
})

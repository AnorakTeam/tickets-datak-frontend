import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSupportTickets } from '../../app/composables/useSupportTickets'
import { supportTicketService } from '../../app/services/supportTicketService'

vi.mock('../../app/services/supportTicketService', () => ({
  supportTicketService: {
    listSupportTickets: vi.fn(),
    getSupportEmpresas: vi.fn(),
  },
}))

describe('useSupportTickets composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default empty state and page 1', () => {
    const {
      tickets,
      totalTickets,
      currentPage,
      selectedEmpresa,
      selectedStatus,
      selectedPriority,
      selectedChannel,
      searchQuery,
      totalPages,
      hasPreviousPage,
      hasNextPage,
    } = useSupportTickets()

    expect(tickets.value).toEqual([])
    expect(totalTickets.value).toBe(0)
    expect(currentPage.value).toBe(1)
    expect(selectedEmpresa.value).toBeNull()
    expect(selectedStatus.value).toBeNull()
    expect(selectedPriority.value).toBeNull()
    expect(selectedChannel.value).toBeNull()
    expect(searchQuery.value).toBe('')
    expect(totalPages.value).toBe(1)
    expect(hasPreviousPage.value).toBe(false)
    expect(hasNextPage.value).toBe(false)
  })

  it('loads support tickets and sets pagination values', async () => {
    const mockTickets = [
      {
        id: 1,
        radicado: 'TK-2026-000001',
        asunto: 'Error en facturación',
        empresa: { id: 10, nombre: 'Acme Corp' },
        modulo: { id: 2, nombre: 'Facturación' },
        prioridad: 'Alta' as const,
        estado: 'Abierto' as const,
        canal_origen: 'WhatsApp',
        responsable: null,
        fecha_creacion: '2026-11-16T10:00:00Z',
      },
    ]

    vi.mocked(supportTicketService.listSupportTickets).mockResolvedValue({
      count: 25,
      next: 'http://localhost/api/v1/support/tickets/?page=2',
      previous: null,
      results: mockTickets,
    })

    const composable = useSupportTickets()
    await composable.loadTickets()

    expect(composable.tickets.value).toEqual(mockTickets)
    expect(composable.totalTickets.value).toBe(25)
    expect(composable.totalPages.value).toBe(3)
    expect(composable.hasNextPage.value).toBe(true)
    expect(composable.hasPreviousPage.value).toBe(false)
  })

  it('resets page to 1 and applies filters when setting filter options', async () => {
    vi.mocked(supportTicketService.listSupportTickets).mockResolvedValue({
      count: 5,
      next: null,
      previous: null,
      results: [],
    })

    const composable = useSupportTickets()
    composable.currentPage.value = 3

    await composable.setEmpresa(10)
    expect(composable.selectedEmpresa.value).toBe(10)
    expect(composable.currentPage.value).toBe(1)

    await composable.setStatus('En gestion')
    expect(composable.selectedStatus.value).toBe('En gestion')
    expect(composable.currentPage.value).toBe(1)

    await composable.setPriority('Critica')
    expect(composable.selectedPriority.value).toBe('Critica')

    await composable.setChannel('Slack')
    expect(composable.selectedChannel.value).toBe('Slack')

    await composable.setSearch('base de datos')
    expect(composable.searchQuery.value).toBe('base de datos')

    expect(supportTicketService.listSupportTickets).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        empresa: 10,
        estado: 'En gestion',
        prioridad: 'Critica',
        canal_origen: 'Slack',
        search: 'base de datos',
      }),
    )
  })

  it('clears all filters and resets to page 1', async () => {
    vi.mocked(supportTicketService.listSupportTickets).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })

    const composable = useSupportTickets()
    composable.selectedEmpresa.value = 10
    composable.selectedStatus.value = 'Resuelto'
    composable.selectedPriority.value = 'Alta'
    composable.selectedChannel.value = 'Portal'
    composable.searchQuery.value = 'busqueda'
    composable.currentPage.value = 2

    await composable.clearFilters()

    expect(composable.selectedEmpresa.value).toBeNull()
    expect(composable.selectedStatus.value).toBeNull()
    expect(composable.selectedPriority.value).toBeNull()
    expect(composable.selectedChannel.value).toBeNull()
    expect(composable.searchQuery.value).toBe('')
    expect(composable.currentPage.value).toBe(1)
  })

  it('loads company catalog into empresas', async () => {
    const mockEmpresas = [
      { id: 1, nombre: 'Empresa A' },
      { id: 2, nombre: 'Empresa B' },
    ]
    vi.mocked(supportTicketService.getSupportEmpresas).mockResolvedValue(mockEmpresas)

    const composable = useSupportTickets()
    await composable.loadEmpresas()

    expect(composable.empresas.value).toEqual(mockEmpresas)
  })

  it('handles error gracefully when loadTickets fails', async () => {
    vi.mocked(supportTicketService.listSupportTickets).mockRejectedValue(new Error('Network error'))

    const composable = useSupportTickets()
    await composable.loadTickets()

    expect(composable.tickets.value).toEqual([])
    expect(composable.totalTickets.value).toBe(0)
    expect(composable.errorMessage.value).toBe(
      'No fue posible cargar los tickets de soporte. Intenta nuevamente.',
    )
  })
})

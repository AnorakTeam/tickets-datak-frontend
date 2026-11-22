import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  supportTicketService,
  listSupportTickets,
  getSupportEmpresas,
} from '../../app/services/supportTicketService'
import { apiService } from '../../app/services/api'

vi.mock('../../app/services/api', () => ({
  apiService: {
    get: vi.fn(),
  },
}))

describe('supportTicketService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /support/tickets/ with empty filters when none provided', async () => {
    const mockPage = { count: 0, next: null, previous: null, results: [] }
    vi.mocked(apiService.get).mockResolvedValue(mockPage)

    const result = await listSupportTickets()

    expect(apiService.get).toHaveBeenCalledWith('/support/tickets/', {
      params: {},
    })
    expect(result).toEqual(mockPage)
  })

  it('passes all multi-tenant filter params correctly to GET /support/tickets/', async () => {
    const mockPage = { count: 1, next: null, previous: null, results: [] }
    vi.mocked(apiService.get).mockResolvedValue(mockPage)

    await supportTicketService.listSupportTickets({
      page: 2,
      empresa: 5,
      estado: 'Abierto',
      prioridad: 'Alta',
      canal_origen: 'WhatsApp',
      responsable: 12,
      search: 'Error en facturacion',
    })

    expect(apiService.get).toHaveBeenCalledWith('/support/tickets/', {
      params: {
        page: 2,
        empresa: 5,
        estado: 'Abierto',
        prioridad: 'Alta',
        canal_origen: 'WhatsApp',
        responsable: 12,
        search: 'Error en facturacion',
      },
    })
  })

  it('calls GET /support/empresas/ to fetch tenant company list', async () => {
    const mockEmpresas = [
      { id: 1, nombre: 'Empresa Alpha', activa: true },
      { id: 2, nombre: 'Empresa Beta', activa: true },
    ]
    vi.mocked(apiService.get).mockResolvedValue(mockEmpresas)

    const result = await getSupportEmpresas()

    expect(apiService.get).toHaveBeenCalledWith('/support/empresas/')
    expect(result).toEqual(mockEmpresas)
  })
})

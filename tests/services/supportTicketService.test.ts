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
    post: vi.fn(),
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

  it('calls GET /support/empresas/ to fetch tenant company list with modules', async () => {
    const mockEmpresas = [
      {
        id: 1,
        nombre: 'Empresa Alpha',
        activa: true,
        modulos_contratados: [{ id: 1, codigo: 'MOD-INV', nombre: 'Inventarios' }],
      },
      {
        id: 2,
        nombre: 'Empresa Beta',
        activa: true,
        modulos: [{ id: 2, codigo: 'MOD-FAC', nombre: 'Facturación' }],
      },
    ]
    vi.mocked(apiService.get).mockResolvedValue(mockEmpresas)

    const result = await getSupportEmpresas()

    expect(apiService.get).toHaveBeenCalledWith('/support/empresas/')
    expect(result).toEqual(mockEmpresas)
  })

  it('submits external ticket payload via POST /support/tickets/', async () => {
    const payload = {
      empresa_id: 5,
      modulo_id: 2,
      canal_origen: 'WhatsApp',
      pestana_o_documento: 'Factura Electrónica',
      asunto: 'Error en cálculo de IVA',
      descripcion: 'El cliente reporta que el IVA se calculó mal al timbrar.',
      mensaje_error: 'ERR_TAX_CALC_500',
      prioridad: 'Alta' as const,
    }

    const mockResponse = {
      id: 88,
      radicado: 'TK-2026-000088',
      estado: 'Abierto' as const,
      fecha_creacion: '2026-11-17T10:00:00Z',
      asunto: payload.asunto,
      modulo: { id: 2, nombre: 'Facturación' },
      empresa: { id: 5, nombre: 'Acme' },
      canal_origen: 'WhatsApp',
      mensaje: 'Ticket registrado con éxito',
    }

    vi.mocked(apiService.post).mockResolvedValueOnce(mockResponse)

    const result = await supportTicketService.createExternalTicket(payload)

    expect(apiService.post).toHaveBeenCalledWith('/support/tickets/', payload)
    expect(result).toEqual(mockResponse)
  })
})

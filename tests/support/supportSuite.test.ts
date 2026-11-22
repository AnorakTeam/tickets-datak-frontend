import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supportTicketService } from '../../app/services/supportTicketService'
import { supportTicketManagementService } from '../../app/services/supportTicketManagementService'
import { assignedTicketService } from '../../app/services/assignedTicketService'
import { apiService } from '../../app/services/api'

vi.mock('../../app/services/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('Support Console Comprehensive Integration Suite (FE-22, RF7-RF16)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Support Inbox & Filtering (RF7)', () => {
    it('queries tickets with state and company filters', async () => {
      const mockResult = {
        count: 1,
        results: [
          {
            id: 1,
            radicado: 'TK-2026-000001',
            asunto: 'Error en facturación',
            estado: 'Abierto',
            prioridad: 'Alta',
            empresa: { id: 10, nombre: 'Acme Industrial' },
          },
        ],
      }
      vi.mocked(apiService.get).mockResolvedValueOnce(mockResult)

      const result = await supportTicketService.listSupportTickets({
        estado: 'Abierto',
        empresa: 10,
        page: 1,
      })

      expect(apiService.get).toHaveBeenCalledWith('/support/tickets/', {
        params: {
          estado: 'Abierto',
          empresa: 10,
          page: 1,
        },
      })
      expect(result.results).toHaveLength(1)
      expect(result.results[0].radicado).toBe('TK-2026-000001')
    })
  })

  describe('External Ticket Intake (RF8)', () => {
    it('submits external ticket intake payload with required fields', async () => {
      const intakePayload = {
        empresa_id: 10,
        modulo_id: 2,
        asunto: 'Incidencia telefónica',
        descripcion: 'Cliente reporta error vía llamada',
        prioridad: 'Media' as const,
        canal_origen: 'Telefono' as const,
        pestana_o_documento: 'Ventas',
      }
      const createdTicket = {
        id: 99,
        radicado: 'TK-2026-000099',
        ...intakePayload,
      }
      vi.mocked(apiService.post).mockResolvedValueOnce(createdTicket)

      const response = await supportTicketService.createExternalTicket(intakePayload)

      expect(apiService.post).toHaveBeenCalledWith('/support/tickets/', intakePayload)
      expect(response.radicado).toBe('TK-2026-000099')
    })
  })

  describe('Triage & Assignment Management (RF10, RF11, RF12)', () => {
    it('classifies ticket and updates priority and category', async () => {
      const mockTicket = { id: 1, radicado: 'TK-2026-000001', clasificacion: 'Bug', prioridad: 'Alta' }
      vi.mocked(apiService.patch).mockResolvedValueOnce(mockTicket)

      const res = await supportTicketManagementService.classifySupportTicket('TK-2026-000001', {
        clasificacion: 'Bug',
        prioridad: 'Alta',
      })

      expect(apiService.patch).toHaveBeenCalledWith(
        '/support/tickets/TK-2026-000001/clasificar/',
        { clasificacion: 'Bug', prioridad: 'Alta' },
      )
      expect(res.clasificacion).toBe('Bug')
    })

    it('assigns ticket to responsible engineer with notes', async () => {
      const mockTicket = { id: 1, radicado: 'TK-2026-000001', estado: 'En gestion', responsable: { id: 5 } }
      vi.mocked(apiService.patch).mockResolvedValueOnce(mockTicket)

      const res = await supportTicketManagementService.assignSupportTicket('TK-2026-000001', 5)

      expect(apiService.patch).toHaveBeenCalledWith(
        '/support/tickets/TK-2026-000001/asignar/',
        { responsable_id: 5 },
      )
      expect(res.estado).toBe('En gestion')
    })

    it('dismisses ticket with justification (No procedente)', async () => {
      const mockTicket = { id: 1, radicado: 'TK-2026-000001', estado: 'No procedente' }
      vi.mocked(apiService.post).mockResolvedValueOnce(mockTicket)

      const res = await supportTicketManagementService.dismissSupportTicket(
        'TK-2026-000001',
        'Configuración fuera del alcance acordado.',
      )

      expect(apiService.post).toHaveBeenCalledWith(
        '/support/tickets/TK-2026-000001/no-procedente/',
        { motivo_no_procedente: 'Configuración fuera del alcance acordado.' },
      )
      expect(res.estado).toBe('No procedente')
    })
  })

  describe('Engineer Queue & Resolution (RF13, RF14, RF15)', () => {
    it('lists engineer assigned tickets', async () => {
      const mockQueue = { count: 1, results: [{ id: 5, radicado: 'TK-2026-000005' }] }
      vi.mocked(apiService.get).mockResolvedValueOnce(mockQueue)

      const res = await assignedTicketService.listAssignedTickets()

      expect(apiService.get).toHaveBeenCalledWith('/support/mis-tickets/', { params: {} })
      expect(res.results).toHaveLength(1)
    })

    it('adds internal note to ticket', async () => {
      const mockItem = { id: 10, tipo_accion: 'NOTA_INTERNA', observaciones: 'Revisando logs' }
      vi.mocked(apiService.post).mockResolvedValueOnce(mockItem)

      const res = await assignedTicketService.addInternalTicketNote('TK-2026-000005', 'Revisando logs')

      expect(apiService.post).toHaveBeenCalledWith(
        '/support/tickets/TK-2026-000005/notas-internas/',
        { observaciones: 'Revisando logs' },
      )
      expect(res).toEqual(mockItem)
    })

    it('resolves ticket with required solution comment', async () => {
      const resolved = { id: 5, estado: 'Resuelto', comentario_solucion: 'Parche aplicado' }
      vi.mocked(apiService.post).mockResolvedValueOnce(resolved)

      const res = await assignedTicketService.resolveAssignedTicket('TK-2026-000005', 'Parche aplicado')

      expect(apiService.post).toHaveBeenCalledWith(
        '/support/tickets/TK-2026-000005/resolver/',
        { comentario_solucion: 'Parche aplicado' },
      )
      expect(res).toEqual(resolved)
    })
  })
})

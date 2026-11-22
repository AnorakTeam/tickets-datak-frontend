import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiService } from '../../app/services/api'
import {
  listAssignableSupportUsers,
  classifySupportTicket,
  assignSupportTicket,
  dismissSupportTicket,
} from '../../app/services/supportTicketManagementService'

vi.mock('../../app/services/api', () => ({
  apiService: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}))

describe('supportTicketManagementService (FE-19)', () => {
  beforeEach(() => vi.resetAllMocks())

  it('loads internal assignable users from the confirmed backend endpoint', async () => {
    const staff = [{ id: 4, nombre: 'Agente', correo: 'agente@datak.co', rol: 'agente_soporte' }]
    vi.mocked(apiService.get).mockResolvedValue(staff)

    expect(await listAssignableSupportUsers()).toEqual(staff)
    expect(apiService.get).toHaveBeenCalledWith('/support/responsables/')
  })

  it('classifies a ticket and sends the backend exact field names', async () => {
    vi.mocked(apiService.patch).mockResolvedValue({ id: 15 })
    await classifySupportTicket('TK-2026-000015', { clasificacion: 'Solicitud de mejora', prioridad: 'Critica' })
    expect(apiService.patch).toHaveBeenCalledWith('/support/tickets/TK-2026-000015/clasificar/', {
      clasificacion: 'Solicitud de mejora', prioridad: 'Critica',
    })
  })

  it('assigns to a numeric staff id without changing the ticket payload shape', async () => {
    vi.mocked(apiService.patch).mockResolvedValue({ id: 15 })
    await assignSupportTicket('15', 8)
    expect(apiService.patch).toHaveBeenCalledWith('/support/tickets/15/asignar/', { responsable_id: 8 })
  })

  it('rejects invalid staff IDs before making a request', async () => {
    await expect(assignSupportTicket('15', 0)).rejects.toThrow('responsable válido')
    await expect(assignSupportTicket('15', 1.5)).rejects.toThrow('responsable válido')
    expect(apiService.patch).not.toHaveBeenCalled()
  })

  it('posts trimmed dismissal justification with the backend field name', async () => {
    vi.mocked(apiService.post).mockResolvedValue({ id: 15 })
    await dismissSupportTicket('tk-2026-000015', '  Caso duplicado  ')
    expect(apiService.post).toHaveBeenCalledWith('/support/tickets/TK-2026-000015/no-procedente/', {
      motivo_no_procedente: 'Caso duplicado',
    })
  })

  it('rejects blank dismissal text without calling the API', async () => {
    await expect(dismissSupportTicket('15', '   ')).rejects.toThrow('obligatorio')
    expect(apiService.post).not.toHaveBeenCalled()
  })

  it('rejects unsafe route identifiers in all mutations', async () => {
    await expect(classifySupportTicket('../admin', { clasificacion: 'Bug', prioridad: 'Alta' })).rejects.toThrow('no válido')
    await expect(assignSupportTicket('../admin', 3)).rejects.toThrow('no válido')
    await expect(dismissSupportTicket('../admin', 'No corresponde')).rejects.toThrow('no válido')
    expect(apiService.patch).not.toHaveBeenCalled()
    expect(apiService.post).not.toHaveBeenCalled()
  })
})

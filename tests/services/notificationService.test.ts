import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  notificationService,
  getClientNotifications,
  markNotificationAsRead,
} from '../../app/services/notificationService'
import { apiService } from '../../app/services/api'

vi.mock('../../app/services/api', () => ({
  apiService: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles object response with unread_count and results array', async () => {
    const mockResponse = {
      unread_count: 2,
      count: 2,
      results: [
        {
          id: 1,
          ticket_radicado: 'TK-2026-000001',
          titulo: 'Ticket resuelto',
          mensaje: 'Su incidencia ha sido solucionada.',
          leida: false,
          fecha_creacion: '2026-11-17T10:00:00Z',
        },
        {
          id: 2,
          ticket_radicado: 'TK-2026-000002',
          titulo: 'Ticket actualizado',
          mensaje: 'Nueva respuesta del equipo de soporte.',
          leida: false,
          fecha_creacion: '2026-11-17T11:00:00Z',
        },
      ],
    }

    vi.mocked(apiService.get).mockResolvedValueOnce(mockResponse)

    const result = await getClientNotifications()

    expect(apiService.get).toHaveBeenCalledWith('/client/notificaciones/')
    expect(result.unreadCount).toBe(2)
    expect(result.notifications).toHaveLength(2)
  })

  it('handles plain array response calculating unread count from items', async () => {
    const mockArray = [
      {
        id: 1,
        radicado: 'TK-2026-000001',
        titulo: 'Ticket resuelto',
        mensaje: 'Solución aplicada',
        leida: true,
        fecha_creacion: '2026-11-17T10:00:00Z',
      },
      {
        id: 2,
        radicado: 'TK-2026-000002',
        titulo: 'Ticket no procedente',
        mensaje: 'No corresponde a falla del sistema',
        leida: false,
        fecha_creacion: '2026-11-17T12:00:00Z',
      },
    ]

    vi.mocked(apiService.get).mockResolvedValueOnce(mockArray)

    const result = await notificationService.getClientNotifications()

    expect(apiService.get).toHaveBeenCalledWith('/client/notificaciones/')
    expect(result.unreadCount).toBe(1)
    expect(result.notifications).toEqual(mockArray)
  })

  it('marks a notification as read via PATCH /client/notificaciones/{id}/leida/', async () => {
    vi.mocked(apiService.patch).mockResolvedValueOnce({ success: true })

    const result = await markNotificationAsRead(42)

    expect(apiService.patch).toHaveBeenCalledWith('/client/notificaciones/42/leida/')
    expect(result).toEqual({ success: true })
  })
})

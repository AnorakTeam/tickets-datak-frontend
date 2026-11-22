import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  notificationService,
  getClientNotifications,
  markNotificationAsRead,
} from '../app/services/notificationService'
import { apiService } from '../app/services/api'

vi.mock('../app/services/api', () => ({
  apiService: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('Notifications Integration & Unit Suite (FE-22, RF16)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retrieves notifications and computes unread count correctly', async () => {
    const mockPayload = {
      unread_count: 1,
      results: [
        {
          id: 101,
          ticket_radicado: 'TK-2026-000003',
          titulo: 'Ticket Resuelto: TK-2026-000003',
          mensaje: 'Se solucionó el error de redondeo.',
          leida: false,
          fecha_creacion: '2026-11-22T10:00:00Z',
        },
        {
          id: 102,
          ticket_radicado: 'TK-2026-000001',
          titulo: 'Ticket En Gestión: TK-2026-000001',
          mensaje: 'Asignado al equipo de ingeniería.',
          leida: true,
          fecha_creacion: '2026-11-21T09:00:00Z',
        },
      ],
    }

    vi.mocked(apiService.get).mockResolvedValueOnce(mockPayload)

    const response = await getClientNotifications()

    expect(apiService.get).toHaveBeenCalledWith('/client/notificaciones/')
    expect(response.unreadCount).toBe(1)
    expect(response.notifications).toHaveLength(2)
  })

  it('marks a notification as read and calls the PATCH endpoint', async () => {
    vi.mocked(apiService.patch).mockResolvedValueOnce({
      id: 101,
      leida: true,
    })

    const result = await markNotificationAsRead(101)

    expect(apiService.patch).toHaveBeenCalledWith('/client/notificaciones/101/leida/')
    expect(result).toEqual({ id: 101, leida: true })
  })

  it('handles empty results gracefully and defaults to 0 unread', async () => {
    vi.mocked(apiService.get).mockResolvedValueOnce({
      unread_count: 0,
      results: [],
    })

    const response = await notificationService.getClientNotifications()

    expect(response.unreadCount).toBe(0)
    expect(response.notifications).toEqual([])
  })

  it('handles API errors without crashing', async () => {
    vi.mocked(apiService.get).mockRejectedValueOnce(new Error('Network error'))

    await expect(getClientNotifications()).rejects.toThrow('Network error')
  })
})

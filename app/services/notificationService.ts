import { apiService } from './api'

export interface ClientNotification {
  id: number
  ticket_radicado?: string
  radicado?: string
  ticket?: {
    id?: number
    radicado?: string
    asunto?: string
  }
  titulo: string
  mensaje: string
  leida: boolean
  fecha_creacion: string
  tipo?: 'resolucion' | 'no_procedente' | 'actualizacion' | 'info' | string
}

export interface NotificationFeed {
  unreadCount: number
  notifications: ClientNotification[]
}

export const getClientNotifications = async (): Promise<NotificationFeed> => {
  const data = await apiService.get<any>('/client/notificaciones/')

  if (Array.isArray(data)) {
    const unreadCount = data.filter((item) => !item.leida).length
    return {
      unreadCount,
      notifications: data,
    }
  }

  const notifications: ClientNotification[] = data.results || data.notificaciones || []
  const unreadCount =
    typeof data.unread_count === 'number'
      ? data.unread_count
      : notifications.filter((item) => !item.leida).length

  return {
    unreadCount,
    notifications,
  }
}

export const markNotificationAsRead = async (id: number): Promise<{ success: boolean }> => {
  return await apiService.patch<{ success: boolean }>(`/client/notificaciones/${id}/leida/`)
}

export const notificationService = {
  getClientNotifications,
  markNotificationAsRead,
}

export default notificationService

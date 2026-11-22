import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import NotificationBell from '~/components/notifications/NotificationBell.vue'

const {
  getClientNotificationsMock,
  markNotificationAsReadMock,
  mockPush,
} = vi.hoisted(() => ({
  getClientNotificationsMock: vi.fn(),
  markNotificationAsReadMock: vi.fn(),
  mockPush: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('~/services/notificationService', () => ({
  notificationService: {
    getClientNotifications: getClientNotificationsMock,
    markNotificationAsRead: markNotificationAsReadMock,
  },
}))

const mockNotifications = [
  {
    id: 10,
    ticket_radicado: 'TK-2026-000010',
    titulo: 'Incidencia resuelta',
    mensaje: 'Su incidencia sobre facturación ha sido resuelta satisfactoriamente.',
    leida: false,
    fecha_creacion: '2026-11-17T14:00:00Z',
    tipo: 'resolucion',
  },
  {
    id: 11,
    ticket_radicado: 'TK-2026-000011',
    titulo: 'Incidencia no procedente',
    mensaje: 'El reporte no corresponde a un error del sistema.',
    leida: true,
    fecha_creacion: '2026-11-16T10:00:00Z',
    tipo: 'no_procedente',
  },
]

const stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UIcon: {
    props: ['name'],
    template: '<i :data-icon="name" />',
  },
}

const mountComponent = () => mount(NotificationBell, {
  global: { stubs },
})

describe('NotificationBell Component (FE-21)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getClientNotificationsMock.mockResolvedValue({
      unreadCount: 1,
      notifications: mockNotifications,
    })
    markNotificationAsReadMock.mockResolvedValue({ success: true })
  })

  it('loads notifications on mount and displays unread badge count', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    expect(getClientNotificationsMock).toHaveBeenCalledOnce()
    const badge = wrapper.find('span.bg-red-600')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('1')
  })

  it('displays 9+ when unreadCount exceeds 9', async () => {
    getClientNotificationsMock.mockResolvedValueOnce({
      unreadCount: 15,
      notifications: [],
    })

    const wrapper = mountComponent()
    await flushPromises()

    const badge = wrapper.find('span.bg-red-600')
    expect(badge.text()).toBe('9+')
  })

  it('hides unread badge when unreadCount is 0', async () => {
    getClientNotificationsMock.mockResolvedValueOnce({
      unreadCount: 0,
      notifications: [],
    })

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('span.bg-red-600').exists()).toBe(false)
  })

  it('opens notifications dropdown panel on trigger click', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('[role="region"]').exists()).toBe(false)

    await wrapper.find('button[aria-haspopup="true"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="region"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Notificaciones')
    expect(wrapper.text()).toContain('Incidencia resuelta')
    expect(wrapper.text()).toContain('TK-2026-000010')
  })

  it('displays empty state when notifications list is empty', async () => {
    getClientNotificationsMock.mockResolvedValue({
      unreadCount: 0,
      notifications: [],
    })

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button[aria-haspopup="true"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No tienes notificaciones')
    expect(wrapper.text()).toContain('Te avisaremos cuando el equipo de soporte actualice o resuelva tus tickets.')
  })

  it('marks unread notification as read and deep-links to ticket detail on click', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button[aria-haspopup="true"]').trigger('click')
    await flushPromises()

    const itemButtons = wrapper.findAll('button').filter((b) => b.text().includes('Incidencia resuelta'))
    expect(itemButtons).toHaveLength(1)

    await itemButtons[0].trigger('click')
    await flushPromises()

    expect(markNotificationAsReadMock).toHaveBeenCalledWith(10)
    expect(mockPush).toHaveBeenCalledWith('/tickets/TK-2026-000010')
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('refreshes notifications when clicking the refresh button', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button[aria-haspopup="true"]').trigger('click')
    await flushPromises()

    const refreshBtn = wrapper.find('button[aria-label="Actualizar notificaciones"]')
    expect(refreshBtn.exists()).toBe(true)

    await refreshBtn.trigger('click')
    await flushPromises()

    expect(getClientNotificationsMock).toHaveBeenCalledTimes(3)
  })
})

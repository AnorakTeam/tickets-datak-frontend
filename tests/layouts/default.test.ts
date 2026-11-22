import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import DefaultLayout from '~/layouts/default.vue'

const { logoutMock, authState } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  authState: {
    isAuthenticated: true,
    empresa: { id: 1, nombre: 'Empresa Demo' } as any,
    user: {
      id: 1,
      nombre: 'Cliente Datak',
      correo: 'cliente@datak.co',
      rol: 'cliente',
    } as any,
    isSupportStaff: false,
    logout: vi.fn(),
  },
}))

authState.logout = logoutMock

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => authState,
}))

global.computed = computed

const stubs = {
  NuxtLink: {
    props: ['to', 'activeClass'],
    template: '<a :href="to"><slot /></a>',
  },
  UButton: {
    props: ['to', 'color', 'variant', 'icon', 'trailingIcon'],
    template: '<a v-if="to" :href="to"><slot /></a><button v-else><slot /></button>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
  UIcon: {
    props: ['name'],
    template: '<i :data-icon="name" />',
  },
  UDropdown: {
    name: 'UDropdown',
    props: ['items', 'popper'],
    template: '<div class="u-dropdown"><slot /></div>',
  },
  NotificationBell: {
    name: 'NotificationBell',
    template: '<div class="notification-bell-stub" />',
  },
}

describe('Default client portal layout (FE-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders company and client navigation information', () => {
    const wrapper = mount(DefaultLayout, {
      slots: { default: '<p>Contenido del portal</p>' },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('Tickets Datak')
    expect(wrapper.text()).toContain('Empresa Demo')
    expect(wrapper.text()).toContain('Cliente Datak')
    expect(wrapper.text()).toContain('cliente@datak.co')
    expect(wrapper.text()).toContain('Mis tickets')
    expect(wrapper.text()).toContain('Reportar incidencia')
    expect(wrapper.text()).toContain('Contenido del portal')
  })

  it('provides separate responsive navigation for desktop and mobile', () => {
    const wrapper = mount(DefaultLayout, { global: { stubs } })

    expect(wrapper.get('nav[aria-label="Navegación principal"]').classes()).toContain('md:flex')
    expect(wrapper.get('nav[aria-label="Navegación móvil"]').classes()).toContain('md:hidden')
  })

  it('delegates logout to the centralized auth store action', async () => {
    const wrapper = mount(DefaultLayout, { global: { stubs } })
    const dropdown = wrapper.getComponent({ name: 'UDropdown' })
    const items = dropdown.props('items') as Array<Array<{ click: () => Promise<void> }>>

    await items[0][0].click()

    expect(logoutMock).toHaveBeenCalledOnce()
  })

  it('renders support staff navigation and hides client chatbot for support users', () => {
    authState.isSupportStaff = true
    authState.user = {
      id: 2,
      nombre: 'Agente Soporte',
      correo: 'agente@datak.co',
      rol: 'agente_soporte',
    }

    const wrapper = mount(DefaultLayout, {
      slots: { default: '<p>Consola de soporte</p>' },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('Bandeja de soporte')
    expect(wrapper.text()).toContain('Registrar ticket')
    expect(wrapper.text()).toContain('Mis asignados')
    expect(wrapper.text()).toContain('Agente de soporte')
    expect(wrapper.text()).not.toContain('Reportar incidencia')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authStore: {
    isAuthenticated: false,
    userRole: null as string | null,
  },
}))

vi.mock('../app/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

global.defineNuxtRouteMiddleware = ((middleware: (to: any) => unknown) => middleware) as any
global.navigateTo = vi.fn()

const supportMiddleware = (await import('../app/middleware/support')).default as (to: any) => unknown

describe('support middleware', () => {
  beforeEach(() => {
    mocks.authStore.isAuthenticated = false
    mocks.authStore.userRole = null
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users to login with redirect query', () => {
    supportMiddleware({ fullPath: '/support/tickets' })

    expect(global.navigateTo).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/support/tickets' },
    })
  })

  it('redirects authenticated clients to client portal /tickets', () => {
    mocks.authStore.isAuthenticated = true
    mocks.authStore.userRole = 'cliente'

    supportMiddleware({ fullPath: '/support/tickets' })

    expect(global.navigateTo).toHaveBeenCalledWith('/tickets')
  })

  it('redirects users with missing role to /tickets', () => {
    mocks.authStore.isAuthenticated = true
    mocks.authStore.userRole = null

    supportMiddleware({ fullPath: '/support/tickets' })

    expect(global.navigateTo).toHaveBeenCalledWith('/tickets')
  })

  it('allows agente_soporte to access support routes', () => {
    mocks.authStore.isAuthenticated = true
    mocks.authStore.userRole = 'agente_soporte'

    const result = supportMiddleware({ fullPath: '/support/tickets' })

    expect(result).toBeUndefined()
    expect(global.navigateTo).not.toHaveBeenCalled()
  })

  it('allows responsable_atencion to access support routes', () => {
    mocks.authStore.isAuthenticated = true
    mocks.authStore.userRole = 'responsable_atencion'

    const result = supportMiddleware({ fullPath: '/support/tickets' })

    expect(result).toBeUndefined()
    expect(global.navigateTo).not.toHaveBeenCalled()
  })
})

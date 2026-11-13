import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authStore: { isAuthenticated: false },
}))

vi.mock('../app/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

global.defineNuxtRouteMiddleware = ((middleware: () => unknown) => middleware) as any
global.navigateTo = vi.fn()

const authMiddleware = (await import('../app/middleware/auth')).default as () => unknown

describe('auth middleware', () => {
  beforeEach(() => {
    mocks.authStore.isAuthenticated = false
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users to login', () => {
    authMiddleware()

    expect(global.navigateTo).toHaveBeenCalledWith('/login')
  })

  it('allows authenticated users to continue', () => {
    mocks.authStore.isAuthenticated = true

    const result = authMiddleware()

    expect(result).toBeUndefined()
    expect(global.navigateTo).not.toHaveBeenCalled()
  })
})

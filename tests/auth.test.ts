import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'

global.useCookie = () => ({ value: null })
global.computed = (fn: () => any) => ({ get value() { return fn() } })
global.navigateTo = vi.fn()

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with unauthenticated state', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated.value).toBe(false)
    expect(store.user.value).toBeNull()
  })

  it('updates state upon setting session', () => {
    const store = useAuthStore()
    store.setSession('test-access', 'test-refresh', {
      id: 1,
      correo: 'cliente@acme.com',
      nombre: 'Test Client',
      rol: 'cliente',
      empresa: { id: 1, nombre: 'Acme Corp' },
    })

    expect(store.accessToken.value).toBe('test-access')
    expect(store.refreshToken.value).toBe('test-refresh')
    expect(store.user.value?.correo).toBe('cliente@acme.com')
    expect(store.empresa.value?.nombre).toBe('Acme Corp')
  })

  it('clears session upon logout', () => {
    const store = useAuthStore()
    store.setSession('test-access', 'test-refresh', {
      id: 1,
      correo: 'cliente@acme.com',
      nombre: 'Test Client',
      rol: 'cliente',
    })

    store.clear()
    expect(store.accessToken.value).toBeNull()
    expect(store.refreshToken.value).toBeNull()
    expect(store.user.value).toBeNull()
  })

  it('logs in, stores the backend session, and redirects to tickets', async () => {
    global.$fetch = vi.fn().mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
      user: {
        id: 1,
        correo: 'cliente@datak.co',
        nombre: 'Cliente Datak',
        rol: 'cliente',
        empresa: { id: 1, nombre: 'Datak' },
      },
    }) as any

    const store = useAuthStore()
    await store.login('cliente@datak.co', 'secret')

    expect(global.$fetch).toHaveBeenCalledWith('/api/core/auth/token/', expect.objectContaining({
      method: 'POST',
      body: { correo: 'cliente@datak.co', password: 'secret' },
    }))
    expect(store.accessToken.value).toBe('access-token')
    expect(store.refreshToken.value).toBe('refresh-token')
    expect(store.user.value?.correo).toBe('cliente@datak.co')
    expect(global.navigateTo).toHaveBeenCalledWith('/tickets')
  })

  it('logs out, clears the session, and redirects to login', async () => {
    const store = useAuthStore()
    store.setSession('access-token', 'refresh-token', {
      id: 1,
      correo: 'cliente@datak.co',
      nombre: 'Cliente Datak',
      rol: 'cliente',
    })

    await store.logout()

    expect(store.accessToken.value).toBeNull()
    expect(store.refreshToken.value).toBeNull()
    expect(store.user.value).toBeNull()
    expect(global.navigateTo).toHaveBeenCalledWith('/login')
  })
})

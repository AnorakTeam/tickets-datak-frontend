import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'

interface CookieOptions {
  default?: () => unknown
  maxAge?: number
  path?: string
  sameSite?: string
  secure?: boolean
}

const cookieJar = new Map<string, { value: any }>()
const cookieOptions = new Map<string, CookieOptions>()

global.useCookie = ((name: string, options: CookieOptions = {}) => {
  cookieOptions.set(name, options)

  if (!cookieJar.has(name)) {
    cookieJar.set(name, { value: options.default?.() ?? null })
  }

  return cookieJar.get(name)!
}) as typeof useCookie
global.computed = (fn: () => any) => ({ get value() { return fn() } })
global.navigateTo = vi.fn()

describe('useAuthStore', () => {
  beforeEach(() => {
    cookieJar.clear()
    cookieOptions.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with unauthenticated state', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated.value).toBe(false)
    expect(store.user.value).toBeNull()
  })

  it('configures session cookies for application-wide persistence', () => {
    useAuthStore()

    expect(cookieOptions.get('access_token')).toMatchObject({
      maxAge: 60 * 60 * 2,
      path: '/',
      sameSite: 'lax',
    })
    expect(cookieOptions.get('refresh_token')).toMatchObject({
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
    expect(cookieOptions.get('auth_user')).toMatchObject({
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
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

  it('restores the persisted session when the Pinia store is recreated', () => {
    const firstStore = useAuthStore()
    firstStore.setSession('persisted-access', 'persisted-refresh', {
      id: 1,
      correo: 'cliente@datak.co',
      nombre: 'Cliente Datak',
      rol: 'cliente',
      empresa: { id: 1, nombre: 'Datak' },
    })

    setActivePinia(createPinia())
    const restoredStore = useAuthStore()

    expect(restoredStore.isAuthenticated.value).toBe(true)
    expect(restoredStore.accessToken.value).toBe('persisted-access')
    expect(restoredStore.refreshToken.value).toBe('persisted-refresh')
    expect(restoredStore.user.value?.correo).toBe('cliente@datak.co')
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

  it('does not mutate the session or redirect when login fails', async () => {
    global.$fetch = vi.fn().mockRejectedValue({
      response: {
        status: 401,
        _data: { detail: 'Credenciales inválidas' },
      },
    }) as any

    const store = useAuthStore()

    await expect(store.login('cliente@datak.co', 'invalid')).rejects.toThrow('Credenciales inválidas')
    expect(store.accessToken.value).toBeNull()
    expect(store.refreshToken.value).toBeNull()
    expect(store.user.value).toBeNull()
    expect(global.navigateTo).not.toHaveBeenCalled()
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

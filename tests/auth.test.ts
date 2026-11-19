import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { installNuxtMocks } from './helpers/nuxtMocks'
import { useAuthStore, type UserInfo } from '../app/stores/auth'

const clientUser: UserInfo = {
  id: 1,
  correo: 'cliente@datak.co',
  nombre: 'Cliente Datak',
  rol: 'cliente',
  empresa: { id: 1, nombre: 'Datak' },
}

let nuxtMocks: ReturnType<typeof installNuxtMocks>

describe('useAuthStore', () => {
  beforeEach(() => {
    nuxtMocks = installNuxtMocks()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    setActivePinia(undefined)
    vi.unstubAllGlobals()
  })

  it('starts unauthenticated with no user, company, or role', () => {
    const store = useAuthStore()

    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.empresa).toBeNull()
    expect(store.userRole).toBeNull()
  })

  it('configures session cookies for application-wide persistence', () => {
    useAuthStore()

    expect(nuxtMocks.cookieOptions.get('access_token')).toMatchObject({
      maxAge: 60 * 60 * 2,
      path: '/',
      sameSite: 'lax',
    })
    expect(nuxtMocks.cookieOptions.get('refresh_token')).toMatchObject({
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
    expect(nuxtMocks.cookieOptions.get('auth_user')).toMatchObject({
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
  })

  it('stores a successful session and exposes the user and company', () => {
    const store = useAuthStore()

    store.setSession('access-token', 'refresh-token', clientUser)

    expect(store.accessToken).toBe('access-token')
    expect(store.refreshToken).toBe('refresh-token')
    expect(store.user).toEqual(clientUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.empresa).toEqual(clientUser.empresa)
    expect(store.userRole).toBe('cliente')
  })

  it.each(['cliente', 'agente_soporte', 'responsable_atencion'] as const)(
    'exposes the %s user role',
    (role) => {
      const store = useAuthStore()
      store.setSession('access-token', 'refresh-token', { ...clientUser, rol: role })

      expect(store.userRole).toBe(role)
    },
  )

  it('restores the persisted session when the Pinia store is recreated', () => {
    const firstStore = useAuthStore()
    firstStore.setSession('persisted-access', 'persisted-refresh', clientUser)

    setActivePinia(createPinia())
    const restoredStore = useAuthStore()

    expect(restoredStore.isAuthenticated).toBe(true)
    expect(restoredStore.accessToken).toBe('persisted-access')
    expect(restoredStore.refreshToken).toBe('persisted-refresh')
    expect(restoredStore.user).toEqual(clientUser)
  })

  it('clears tokens, user, and derived authentication state on logout', () => {
    const store = useAuthStore()
    store.setSession('access-token', 'refresh-token', clientUser)

    store.clear()

    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.empresa).toBeNull()
    expect(store.userRole).toBeNull()
  })

  it('logs in, stores the backend session, and redirects to tickets', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
      user: clientUser,
    })
    vi.stubGlobal('$fetch', fetchMock)

    const store = useAuthStore()
    await store.login('cliente@datak.co', 'secret')

    expect(fetchMock).toHaveBeenCalledWith('/api/core/auth/token/', expect.objectContaining({
      method: 'POST',
      body: { correo: 'cliente@datak.co', password: 'secret' },
    }))
    expect(store.accessToken).toBe('access-token')
    expect(store.refreshToken).toBe('refresh-token')
    expect(store.user).toEqual(clientUser)
    expect(nuxtMocks.navigateTo).toHaveBeenCalledWith('/tickets')
  })

  it('does not mutate the session or redirect when login fails', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue({
      response: {
        status: 401,
        _data: { detail: 'Credenciales inválidas' },
      },
    }))

    const store = useAuthStore()

    await expect(store.login('cliente@datak.co', 'invalid')).rejects.toThrow('Credenciales inválidas')
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()
  })

  it('logs out, clears the session, and redirects to login', async () => {
    const store = useAuthStore()
    store.setSession('access-token', 'refresh-token', clientUser)

    await store.logout()

    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(nuxtMocks.navigateTo).toHaveBeenCalledWith('/login')
  })
})

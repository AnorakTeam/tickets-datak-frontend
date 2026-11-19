import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { installNuxtMocks } from './helpers/nuxtMocks'
import { useAuthStore, type UserInfo } from '../app/stores/auth'

const clientUser: UserInfo = {
  id: 1,
  correo: 'cliente@acme.com',
  nombre: 'Test Client',
  rol: 'cliente',
  empresa: { id: 7, nombre: 'Acme Corp', identificacion: '900123456' },
}

describe('useAuthStore', () => {
  beforeEach(() => {
    installNuxtMocks()
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

  it('restores tokens and user state from persisted Nuxt cookies/state', () => {
    const store = useAuthStore()
    store.setSession('persisted-access', 'persisted-refresh', clientUser)

    setActivePinia(createPinia())
    const restoredStore = useAuthStore()

    expect(restoredStore.accessToken).toBe('persisted-access')
    expect(restoredStore.refreshToken).toBe('persisted-refresh')
    expect(restoredStore.user).toEqual(clientUser)
    expect(restoredStore.isAuthenticated).toBe(true)
  })
})

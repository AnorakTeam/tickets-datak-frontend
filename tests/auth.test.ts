import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'

// Mock useCookie and useState for test environment
global.useCookie = () => ({ value: null })
global.useState = (key: string, init: () => any) => ({ value: init() })
global.computed = (fn: () => any) => ({ get value() { return fn() } })

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
})

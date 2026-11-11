import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'
import { createApiClient, ApiError } from '../app/services/api'

// Mock useCookie and useState for test environment
global.useCookie = () => ({ value: null })
global.useState = (key: string, init: () => any) => ({ value: init() })
global.computed = (fn: () => any) => ({ get value() { return fn() } })

describe('ApiClient and Services (FE-02)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('creates client with get, post, put, patch, delete methods', () => {
    const client = createApiClient()
    expect(typeof client.get).toBe('function')
    expect(typeof client.post).toBe('function')
    expect(typeof client.put).toBe('function')
    expect(typeof client.patch).toBe('function')
    expect(typeof client.delete).toBe('function')
  })

  it('attaches Bearer token header when authStore has accessToken', async () => {
    const authStore = useAuthStore()
    authStore.accessToken.value = 'mock-jwt-token'

    let capturedHeaders: any = null
    global.$fetch = vi.fn().mockImplementation((url, opts) => {
      capturedHeaders = opts.headers
      return Promise.resolve({ success: true })
    }) as any

    const client = createApiClient()
    const res = await client.get('/client/tickets/')

    expect(res).toEqual({ success: true })
    expect(capturedHeaders['Authorization']).toBe('Bearer mock-jwt-token')
  })

  it('throws ApiError with message and status on fetch error', async () => {
    const errorObj: any = new Error('Not found')
    errorObj.response = {
      status: 404,
      _data: { detail: 'Ticket no encontrado' },
    }

    global.$fetch = vi.fn().mockRejectedValue(errorObj) as any

    const client = createApiClient()
    await expect(client.get('/client/tickets/TK-9999-999999/')).rejects.toThrow(ApiError)
  })

  it('clears session on 401 response error if refresh fails', async () => {
    const authStore = useAuthStore()
    authStore.accessToken.value = 'expired-token'
    authStore.refreshToken.value = 'expired-refresh'

    const errorObj: any = new Error('Unauthorized')
    errorObj.response = {
      status: 401,
      _data: { detail: 'Token inválido' },
    }

    global.$fetch = vi.fn().mockRejectedValue(errorObj) as any

    const client = createApiClient()
    try {
      await client.get('/client/tickets/')
    } catch {
      // Expected rejection
    }

    expect(authStore.accessToken.value).toBeNull()
  })
})

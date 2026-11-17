import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'
import { createApiClient, ApiError } from '../app/services/api'
import { resolveProxyTarget, resolveAuthHeaders } from '../server/api/core/[...path]'

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

    let capturedHeaders: Record<string, string> = {}
    global.$fetch = vi.fn().mockImplementation((_url, opts) => {
      capturedHeaders = opts.headers
      return Promise.resolve({ success: true })
    }) as any

    const client = createApiClient()
    const res = await client.get('/client/tickets/')

    expect(res).toEqual({ success: true })
    expect(capturedHeaders['Authorization']).toBe('Bearer mock-jwt-token')
  })

  it('passes request body and method properly on POST request', async () => {
    let capturedMethod = ''
    let capturedBody: any = null
    global.$fetch = vi.fn().mockImplementation((_url, opts) => {
      capturedMethod = opts.method
      capturedBody = opts.body
      return Promise.resolve({ id: 101, created: true })
    }) as any

    const client = createApiClient()
    const payload = { asunto: 'Error en módulo de ventas', modulo_id: 3 }
    const res = await client.post('/client/tickets/', payload)

    expect(res).toEqual({ id: 101, created: true })
    expect(capturedMethod).toBe('POST')
    expect(capturedBody).toEqual(payload)
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

  it('refreshes token on 401 and automatically replays the original request', async () => {
    const authStore = useAuthStore()
    authStore.accessToken.value = 'expired-jwt'
    authStore.refreshToken.value = 'valid-refresh'

    let callCount = 0
    const capturedAuthHeaders: string[] = []

    global.$fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      callCount++
      if (url === '/api/core/auth/token/refresh/') {
        return Promise.resolve({ access: 'new-valid-jwt' })
      }
      if (url === '/api/core/client/tickets/') {
        capturedAuthHeaders.push(opts?.headers?.['Authorization'])
        if (callCount === 1) {
          // First attempt fails with 401
          const err: any = new Error('Unauthorized')
          err.response = { status: 401, _data: { detail: 'Token expirado' } }
          return Promise.reject(err)
        }
        // Second attempt succeeds
        return Promise.resolve({ data: [{ radicado: 'TK-2026-000001' }] })
      }
      return Promise.reject(new Error('Unknown url'))
    }) as any

    const client = createApiClient()
    const result = await client.get<{ data: Array<{ radicado: string }> }>('/client/tickets/')

    expect(result).toEqual({ data: [{ radicado: 'TK-2026-000001' }] })
    expect(authStore.accessToken.value).toBe('new-valid-jwt')
    expect(capturedAuthHeaders[0]).toBe('Bearer expired-jwt')
    expect(capturedAuthHeaders[1]).toBe('Bearer new-valid-jwt')
  })

  it('prevents multiple simultaneous token refresh calls when multiple requests receive 401 concurrently', async () => {
    const authStore = useAuthStore()
    authStore.accessToken.value = 'expired-jwt'
    authStore.refreshToken.value = 'valid-refresh'

    let refreshCallCount = 0

    global.$fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      if (url === '/api/core/auth/token/refresh/') {
        refreshCallCount++
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 10))
        return { access: 'refreshed-jwt-token' }
      }

      // Check if bearer token is the new one
      const auth = opts?.headers?.['Authorization']
      if (auth === 'Bearer refreshed-jwt-token') {
        return { success: true, url }
      }

      // Fail initially with 401
      const err: any = new Error('Unauthorized')
      err.response = { status: 401, _data: { detail: 'Token expirado' } }
      throw err
    }) as any

    const client = createApiClient()
    // Trigger 3 concurrent requests that all fail with 401
    const [res1, res2, res3] = await Promise.all([
      client.get('/client/tickets/'),
      client.get('/modulos/'),
      client.get('/empresa/'),
    ])

    expect(res1).toEqual({ success: true, url: '/api/core/client/tickets/' })
    expect(res2).toEqual({ success: true, url: '/api/core/modulos/' })
    expect(res3).toEqual({ success: true, url: '/api/core/empresa/' })
    // Verify that refresh was only called ONCE despite 3 simultaneous 401s
    expect(refreshCallCount).toBe(1)
  })

  it('prevents infinite retry loop when retried request also responds with 401', async () => {
    const authStore = useAuthStore()
    authStore.accessToken.value = 'invalid-jwt'
    authStore.refreshToken.value = 'valid-refresh'

    let refreshCallCount = 0
    let ticketCallCount = 0

    global.$fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/core/auth/token/refresh/') {
        refreshCallCount++
        return Promise.resolve({ access: 'another-jwt' })
      }
      if (url === '/api/core/client/tickets/') {
        ticketCallCount++
        const err: any = new Error('Unauthorized')
        err.response = { status: 401, _data: { detail: 'Sin permisos' } }
        return Promise.reject(err)
      }
      return Promise.reject(new Error('Unknown url'))
    }) as any

    const client = createApiClient()
    await expect(client.get('/client/tickets/')).rejects.toThrow(ApiError)

    // Should only have attempted 1 original + 1 retry = 2 attempts max, and exactly 1 refresh
    expect(ticketCallCount).toBe(2)
    expect(refreshCallCount).toBe(1)
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

describe('Nitro Server Proxy Target & Auth Headers (FE-02)', () => {
  it('correctly maps target backend URL with query parameters', () => {
    const target = resolveProxyTarget('http://localhost:8000', 'client/tickets/', {
      page: 2,
      search: 'factura',
      ordering: '-created_at',
    })

    expect(target).toBe('http://localhost:8000/api/v1/client/tickets/?page=2&search=factura&ordering=-created_at')
  })

  it('handles paths with or without leading slashes and trailing slashes correctly', () => {
    const targetA = resolveProxyTarget('http://backend:8000/', '/modulos/')
    expect(targetA).toBe('http://backend:8000/api/v1/modulos/')

    const targetB = resolveProxyTarget('http://backend:8000', 'v1/modulos')
    expect(targetB).toBe('http://backend:8000/api/v1/modulos')
  })

  it('forwards Authorization header when present', () => {
    const headers = resolveAuthHeaders('Bearer custom-jwt-token', undefined)
    expect(headers['authorization']).toBe('Bearer custom-jwt-token')
  })

  it('extracts Bearer token from cookie when Authorization header is absent', () => {
    const headers = resolveAuthHeaders(undefined, 'cookie-access-token')
    expect(headers['authorization']).toBe('Bearer cookie-access-token')
  })

  it('prioritizes incoming Authorization header over cookie token', () => {
    const headers = resolveAuthHeaders('Bearer header-token', 'cookie-token')
    expect(headers['authorization']).toBe('Bearer header-token')
  })
})

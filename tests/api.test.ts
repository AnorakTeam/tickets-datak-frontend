import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'
import { createApiClient, ApiError } from '../app/services/api'
import { resolveProxyTarget, resolveAuthHeaders } from '../server/api/core/[...path]'
import { installNuxtMocks } from './helpers/nuxtMocks'

describe('ApiClient and Services (FE-02)', () => {
  beforeEach(() => {
    installNuxtMocks()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    setActivePinia(undefined)
    vi.unstubAllGlobals()
  })

  it('creates a client with the supported HTTP methods', () => {
    const client = createApiClient()

    expect(typeof client.get).toBe('function')
    expect(typeof client.post).toBe('function')
    expect(typeof client.put).toBe('function')
    expect(typeof client.patch).toBe('function')
    expect(typeof client.delete).toBe('function')
  })

  it('sends requests through the relative API path and attaches a bearer token', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'mock-jwt-token'
    const fetchMock = vi.fn().mockResolvedValue({ success: true })
    vi.stubGlobal('$fetch', fetchMock)

    const result = await createApiClient().get('/client/tickets/')

    expect(result).toEqual({ success: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/core/client/tickets/', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        Authorization: 'Bearer mock-jwt-token',
      }),
    }))
  })

  it('passes request body and method properly on POST request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ id: 101, created: true })
    vi.stubGlobal('$fetch', fetchMock)

    const client = createApiClient()
    const payload = { asunto: 'Error en módulo de ventas', modulo_id: 3 }
    const res = await client.post('/client/tickets/', payload)

    expect(res).toEqual({ id: 101, created: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/core/client/tickets/', expect.objectContaining({
      method: 'POST',
      body: payload,
    }))
  })

  it('converts an HTTP error into an ApiError with the server message and status', async () => {
    const error = Object.assign(new Error('Not found'), {
      response: {
        status: 404,
        _data: { detail: 'Ticket no encontrado' },
      },
    })
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(error))

    await expect(createApiClient().get('/client/tickets/TK-9999-999999/'))
      .rejects.toMatchObject({
        name: 'ApiError',
        message: 'Ticket no encontrado',
        status: 404,
      } satisfies Partial<ApiError>)
  })

  it('refreshes token on 401 and automatically replays the original request', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'expired-jwt'
    authStore.refreshToken = 'valid-refresh'

    let callCount = 0
    const capturedAuthHeaders: string[] = []

    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string, opts: any) => {
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
    }))

    const client = createApiClient()
    const result = await client.get<{ data: Array<{ radicado: string }> }>('/client/tickets/')

    expect(result).toEqual({ data: [{ radicado: 'TK-2026-000001' }] })
    expect(authStore.accessToken).toBe('new-valid-jwt')
    expect(capturedAuthHeaders[0]).toBe('Bearer expired-jwt')
    expect(capturedAuthHeaders[1]).toBe('Bearer new-valid-jwt')
  })

  it('prevents multiple simultaneous token refresh calls when multiple requests receive 401 concurrently', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'expired-jwt'
    authStore.refreshToken = 'valid-refresh'

    let refreshCallCount = 0

    vi.stubGlobal('$fetch', vi.fn().mockImplementation(async (url: string, opts: any) => {
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
    }))

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

  it('isolates concurrent refresh operations across two Pinia sessions', async () => {
    const firstPinia = createPinia()
    const secondPinia = createPinia()

    setActivePinia(firstPinia)
    const firstStore = useAuthStore()
    firstStore.accessToken = 'expired-first'
    firstStore.refreshToken = 'refresh-first'

    setActivePinia(secondPinia)
    const secondStore = useAuthStore()
    secondStore.accessToken = 'expired-second'
    secondStore.refreshToken = 'refresh-second'

    const refreshTokens: string[] = []
    const requestHeaders: string[] = []

    vi.stubGlobal('$fetch', vi.fn().mockImplementation(async (url: string, options: any) => {
      if (url === '/api/core/auth/token/refresh/') {
        const refreshToken = options.body.refresh as string
        refreshTokens.push(refreshToken)
        await new Promise((resolve) => setTimeout(resolve, 10))
        return {
          access: refreshToken === 'refresh-first' ? 'new-first' : 'new-second',
        }
      }

      const authorization = options.headers?.Authorization as string
      requestHeaders.push(authorization)
      if (authorization === 'Bearer new-first') return { session: 'first' }
      if (authorization === 'Bearer new-second') return { session: 'second' }

      const error: any = new Error('Unauthorized')
      error.response = { status: 401, _data: { detail: 'Token expirado' } }
      throw error
    }))

    const client = createApiClient()
    setActivePinia(firstPinia)
    const firstRequest = client.get('/client/tickets/')
    setActivePinia(secondPinia)
    const secondRequest = client.get('/client/tickets/')

    const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest])

    expect(firstResponse).toEqual({ session: 'first' })
    expect(secondResponse).toEqual({ session: 'second' })
    expect(refreshTokens.sort()).toEqual(['refresh-first', 'refresh-second'])
    expect(firstStore.accessToken).toBe('new-first')
    expect(secondStore.accessToken).toBe('new-second')
    expect(requestHeaders).toContain('Bearer new-first')
    expect(requestHeaders).toContain('Bearer new-second')
  })

  it('prevents infinite retry loop when retried request also responds with 401', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'invalid-jwt'
    authStore.refreshToken = 'valid-refresh'

    let refreshCallCount = 0
    let ticketCallCount = 0

    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
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
    }))

    const client = createApiClient()
    await expect(client.get('/client/tickets/')).rejects.toThrow(ApiError)

    // Should only have attempted 1 original + 1 retry = 2 attempts max, and exactly 1 refresh
    expect(ticketCallCount).toBe(2)
    expect(refreshCallCount).toBe(1)
  })

  it('clears the session when an unauthorized response cannot refresh the token', async () => {
    const authStore = useAuthStore()
    authStore.setSession('expired-token', 'expired-refresh', {
      id: 1,
      correo: 'cliente@acme.com',
      nombre: 'Test Client',
      rol: 'cliente',
    })
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(Object.assign(new Error('Unauthorized'), {
      response: {
        status: 401,
        _data: { detail: 'Token inválido' },
      },
    })))

    await expect(createApiClient().get('/client/tickets/')).rejects.toBeInstanceOf(ApiError)

    expect(authStore.accessToken).toBeNull()
    expect(authStore.refreshToken).toBeNull()
    expect(authStore.user).toBeNull()
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

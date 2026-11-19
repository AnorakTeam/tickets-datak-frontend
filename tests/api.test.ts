import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'
import { ApiError, createApiClient } from '../app/services/api'
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

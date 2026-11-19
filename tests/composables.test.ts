import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiService } from '../app/services/api'
import { useApiClient } from '../app/composables/useApiClient'

vi.mock('../app/services/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}))

describe('useApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the shared API service and its HTTP methods', () => {
    const client = useApiClient()

    expect(client).toBe(apiService)
    expect(client.get).toBe(apiService.get)
    expect(client.post).toBe(apiService.post)
    expect(client.put).toBe(apiService.put)
    expect(client.patch).toBe(apiService.patch)
    expect(client.delete).toBe(apiService.delete)
  })

  it('preserves API responses and errors from the service', async () => {
    const response = { results: [{ radicado: 'TK-2026-000001' }] }
    vi.mocked(apiService.get).mockResolvedValue(response)
    const client = useApiClient()

    await expect(client.get('/client/tickets/')).resolves.toBe(response)
    expect(apiService.get).toHaveBeenCalledWith('/client/tickets/')

    const failure = new Error('Request failed')
    vi.mocked(apiService.post).mockRejectedValue(failure)

    await expect(client.post('/client/tickets/', {})).rejects.toBe(failure)
  })
})

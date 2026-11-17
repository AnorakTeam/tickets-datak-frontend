import { useAuthStore } from '~/stores/auth'

export interface ApiResponse<T = unknown> {
  data: T
  status: number
}

export interface ApiErrorResponse {
  message: string
  status: number
  errors?: Record<string, string[]>
  details?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly errors?: Record<string, string[]>
  readonly details?: unknown

  constructor(message: string, status: number, errors?: Record<string, string[]>, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.details = details
  }
}

export interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, unknown>
  body?: unknown
  signal?: AbortSignal
  _retry?: boolean
}

interface FetchResponseLike {
  status?: number
  _data?: unknown
}

interface FetchErrorLike {
  status?: number
  statusCode?: number
  message?: string
  response?: FetchResponseLike
  data?: unknown
}

export const createApiClient = () => {
  // Concurrency mutex: single shared promise for in-flight token refresh
  let refreshPromise: Promise<string | null> | null = null

  const getHeaders = (customHeaders?: Record<string, string>): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    try {
      const authStore = useAuthStore()
      const rawToken = authStore?.accessToken
      const token = typeof rawToken === 'object' && rawToken !== null && 'value' in rawToken
        ? (rawToken as { value: string | null }).value
        : (rawToken as unknown as string | null)

      if (token && typeof token === 'string') {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // Pinia might not be active in non-Vue test contexts
    }

    return headers
  }

  const handleResponseError = (error: FetchErrorLike): never => {
    const status = error.response?.status || error.statusCode || error.status || 500
    const rawData = error.response?._data || error.data
    const data = typeof rawData === 'object' && rawData !== null
      ? (rawData as Record<string, unknown>)
      : {}

    const detailMsg = typeof data.detail === 'string' ? data.detail : null
    const genericMsg = typeof data.message === 'string' ? data.message : null
    const message = detailMsg || genericMsg || error.message || 'Error en la petición al servidor'

    const errors = data.errors && typeof data.errors === 'object'
      ? (data.errors as Record<string, string[]>)
      : !detailMsg && Object.keys(data).length > 0
        ? (data as Record<string, string[]>)
        : undefined

    throw new ApiError(message, status, errors, rawData)
  }

  const performTokenRefresh = async (): Promise<string | null> => {
    if (refreshPromise) {
      return refreshPromise
    }

    refreshPromise = (async () => {
      try {
        const authStore = useAuthStore()
        const rawRefresh = authStore?.refreshToken
        const refreshToken = typeof rawRefresh === 'object' && rawRefresh !== null && 'value' in rawRefresh
          ? (rawRefresh as { value: string | null }).value
          : (rawRefresh as unknown as string | null)

        if (!refreshToken || typeof refreshToken !== 'string') {
          throw new Error('No refresh token available')
        }

        const refreshRes = await $fetch<{ access: string }>('/api/core/auth/token/refresh/', {
          method: 'POST',
          body: { refresh: refreshToken },
        })

        const newAccessToken = refreshRes?.access
        if (newAccessToken && typeof newAccessToken === 'string') {
          const rawAccess = authStore.accessToken
          if (typeof rawAccess === 'object' && rawAccess !== null && 'value' in rawAccess) {
            (rawAccess as { value: string }).value = newAccessToken
          } else {
            authStore.accessToken = newAccessToken as unknown as typeof authStore.accessToken
          }
          return newAccessToken
        }
        throw new Error('Refresh response missing access token')
      } catch {
        try {
          const authStore = useAuthStore()
          authStore.clear()
        } catch {
          // Ignore if store is inaccessible
        }
        return null
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  const request = async <T = unknown>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    options: RequestOptions = {}
  ): Promise<T> => {
    const baseURL = '/api/core'
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${baseURL}${cleanEndpoint}`

    try {
      return await $fetch<T>(url, {
        method,
        headers: getHeaders(options.headers),
        params: options.params as Record<string, string | number | boolean> | undefined,
        body: options.body as BodyInit | Record<string, unknown> | null | undefined,
        signal: options.signal,
      })
    } catch (err: unknown) {
      const error = err as FetchErrorLike
      const status = error.response?.status || error.statusCode || error.status || 500

      // Concurrency & single-retry handling for 401 Unauthorized
      const isRefreshEndpoint = endpoint.includes('/auth/token/refresh')
      if (status === 401 && !options._retry && !isRefreshEndpoint) {
        const newAccessToken = await performTokenRefresh()
        if (newAccessToken) {
          const retryHeaders: Record<string, string> = {
            ...(options.headers || {}),
            Authorization: `Bearer ${newAccessToken}`,
          }
          return request<T>(endpoint, method, {
            ...options,
            headers: retryHeaders,
            _retry: true, // Strict retry loop prevention
          })
        }
      }

      return handleResponseError(error)
    }
  }

  return {
    get: <T = unknown>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, 'GET', options),
    post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>(endpoint, 'POST', { ...options, body }),
    put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>(endpoint, 'PUT', { ...options, body }),
    patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>(endpoint, 'PATCH', { ...options, body }),
    delete: <T = unknown>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, 'DELETE', options),
    request,
  }
}

export const apiService = createApiClient()

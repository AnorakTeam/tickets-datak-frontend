import { useAuthStore } from '~/stores/auth'

export interface ApiResponse<T = any> {
  data: T
  status: number
}

export interface ApiErrorResponse {
  message: string
  status: number
  errors?: Record<string, string[]>
  details?: any
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  details?: any

  constructor(message: string, status: number, errors?: Record<string, string[]>, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.details = details
  }
}

export interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, any>
  body?: any
  signal?: AbortSignal
}

export const createApiClient = () => {
  const getHeaders = (customHeaders?: Record<string, string>): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    try {
      const authStore = useAuthStore()
      const rawToken = authStore?.accessToken
      const token = typeof rawToken === 'object' && rawToken !== null && 'value' in rawToken
        ? rawToken.value
        : rawToken

      if (token && typeof token === 'string') {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // Pinia might not be active in non-Vue test contexts
    }

    return headers
  }

  const handleResponseError = async (error: any): Promise<never> => {
    const status = error?.response?.status || error?.status || 500
    const data = error?.response?._data || error?.data || {}
    const message = data.detail || data.message || error.message || 'Error en la petición al servidor'
    const errors = data.errors || (typeof data === 'object' && !data.detail ? data : undefined)

    // Token refresh logic if 401
    if (status === 401) {
      try {
        const authStore = useAuthStore()
        const rawRefresh = authStore?.refreshToken
        const refreshToken = typeof rawRefresh === 'object' && rawRefresh !== null && 'value' in rawRefresh
          ? rawRefresh.value
          : rawRefresh

        if (refreshToken && typeof refreshToken === 'string') {
          const refreshRes = await $fetch<{ access: string }>('/api/core/auth/token/refresh/', {
            method: 'POST',
            body: { refresh: refreshToken },
          })
          if (refreshRes?.access) {
            if (typeof authStore.accessToken === 'object' && authStore.accessToken !== null && 'value' in authStore.accessToken) {
              authStore.accessToken.value = refreshRes.access
            } else {
              authStore.accessToken = refreshRes.access
            }
          }
        }
      } catch {
        try {
          const authStore = useAuthStore()
          authStore.clear()
        } catch {
          // Ignore
        }
      }
    }

    throw new ApiError(message, status, errors, data)
  }

  const request = async <T = any>(endpoint: string, method: string, options: RequestOptions = {}): Promise<T> => {
    const baseURL = '/api/core'
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${baseURL}${cleanEndpoint}`

    try {
      return await $fetch<T>(url, {
        method: method as any,
        headers: getHeaders(options.headers),
        params: options.params,
        body: options.body,
        signal: options.signal,
      })
    } catch (err: any) {
      return handleResponseError(err)
    }
  }

  return {
    get: <T = any>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, 'GET', options),
    post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => request<T>(endpoint, 'POST', { ...options, body }),
    put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => request<T>(endpoint, 'PUT', { ...options, body }),
    patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => request<T>(endpoint, 'PATCH', { ...options, body }),
    delete: <T = any>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, 'DELETE', options),
    request,
  }
}

export const apiService = createApiClient()

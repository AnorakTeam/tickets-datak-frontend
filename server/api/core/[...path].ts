import { defineEventHandler, proxyRequest, getHeader, getCookie, getQuery } from 'h3'

export const resolveProxyTarget = (
  apiBaseUrl: string,
  rawPath: string,
  query: Record<string, unknown> = {}
): string => {
  const cleanBase = apiBaseUrl.replace(/\/+$/, '')
  const cleanPath = rawPath.replace(/^\/+/, '')
  const pathWithVersion = cleanPath.startsWith('v1/') ? cleanPath : `v1/${cleanPath}`

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }
  const queryString = searchParams.toString()

  return `${cleanBase}/api/${pathWithVersion}${queryString ? `?${queryString}` : ''}`
}

export const resolveAuthHeaders = (
  authHeader?: string,
  cookieToken?: string
): Record<string, string> => {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['authorization'] = authHeader
  } else if (cookieToken) {
    headers['authorization'] = `Bearer ${cookieToken}`
  }
  return headers
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawPath = event.context.params?.path || ''
  const apiBaseUrl = (config.apiBaseUrl as string) || (config.public?.apiBaseUrl as string) || 'http://localhost:8000'

  const query = getQuery(event) as Record<string, unknown>
  const targetUrl = resolveProxyTarget(apiBaseUrl, rawPath, query)

  const authHeader = getHeader(event, 'authorization')
  const tokenCookie = getCookie(event, 'auth_access_token') || getCookie(event, 'auth_token') || getCookie(event, 'access_token')
  const headers = resolveAuthHeaders(authHeader, tokenCookie)

  return proxyRequest(event, targetUrl, {
    headers,
  })
})

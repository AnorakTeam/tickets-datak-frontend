import { defineEventHandler, proxyRequest, getHeader, getCookie, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawPath = event.context.params?.path || ''
  const apiBaseUrl = (config.public.apiBaseUrl as string) || 'http://localhost:8000'

  // Build target URL to Django backend under /api/v1/
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const targetUrl = `${apiBaseUrl.replace(/\/+$/, '')}/api/v1/${rawPath}${queryString ? `?${queryString}` : ''}`

  // Ensure Bearer Authorization is attached either from incoming header or cookie
  const authHeader = getHeader(event, 'authorization')
  const tokenCookie = getCookie(event, 'auth_token') || getCookie(event, 'access_token')

  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['authorization'] = authHeader
  } else if (tokenCookie) {
    headers['authorization'] = `Bearer ${tokenCookie}`
  }

  return proxyRequest(event, targetUrl, {
    headers,
  })
})

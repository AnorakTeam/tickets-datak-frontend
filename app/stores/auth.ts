import { defineStore } from 'pinia'
import { authService } from '~/services/authService'

export interface EmpresaInfo {
  id: number
  nombre: string
  identificacion?: string
}

export interface UserInfo {
  id: number
  correo: string
  nombre: string
  rol: 'cliente' | 'agente_soporte' | 'responsable_atencion'
  empresa?: EmpresaInfo | null
}

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 2
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export const useAuthStore = defineStore('auth', () => {
  const accessToken = useCookie<string | null>('access_token', {
    default: () => null,
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: import.meta.env.PROD,
  })

  const refreshToken = useCookie<string | null>('refresh_token', {
    default: () => null,
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: import.meta.env.PROD,
  })

  const user = useCookie<UserInfo | null>('auth_user', {
    default: () => null,
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: import.meta.env.PROD,
  })

  const isAuthenticated = computed(() => !!accessToken.value)
  const empresa = computed(() => user.value?.empresa || null)
  const userRole = computed(() => user.value?.rol || null)

  const setSession = (access: string, refresh: string, userData: UserInfo) => {
    accessToken.value = access
    refreshToken.value = refresh
    user.value = userData
  }

  const clear = () => {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  const login = async (email: string, password: string) => {
    const session = await authService.login({ correo: email, password })
    setSession(session.access, session.refresh, session.user)
    await navigateTo('/tickets')
  }

  const logout = async () => {
    clear()
    await navigateTo('/login')
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    empresa,
    userRole,
    setSession,
    clear,
    login,
    logout,
  }
})

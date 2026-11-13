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

export const useAuthStore = defineStore('auth', () => {
  const accessToken = useCookie<string | null>('access_token', {
    maxAge: 60 * 60 * 2, // 2 hours
    sameSite: 'lax',
  })

  const refreshToken = useCookie<string | null>('refresh_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  })

  const user = useCookie<UserInfo | null>('auth_user', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
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

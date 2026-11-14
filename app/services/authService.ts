import { apiService } from '~/services/api'
import type { UserInfo } from '~/stores/auth'

export interface LoginPayload {
  correo: string
  password: string
}

export interface AuthSession {
  access: string
  refresh: string
  user: UserInfo
}

export const authService = {
  login: (payload: LoginPayload) => apiService.post<AuthSession>('/auth/token/', payload),
}

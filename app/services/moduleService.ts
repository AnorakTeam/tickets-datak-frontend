import { apiService } from './api'

export interface ContractedModule {
  id: number
  codigo: string
  nombre: string
  activo?: boolean
}

/**
 * Fetches the active contracted modules for the authenticated user's company (RF2).
 * Consumes endpoint: GET /api/v1/modulos/ via Nitro server proxy.
 */
export const getContractedModules = async (): Promise<ContractedModule[]> => {
  return await apiService.get<ContractedModule[]>('/modulos/')
}

export const moduleService = {
  getContractedModules,
}

export default moduleService

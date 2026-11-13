import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { moduleService, type ContractedModule } from '../app/services/moduleService'
import { apiService, ApiError } from '../app/services/api'

// Mock useCookie and useState for test environment
global.useCookie = () => ({ value: null })
global.useState = (key: string, init: () => any) => ({ value: init() })
global.computed = (fn: () => any) => ({ get value() { return fn() } })

describe('moduleService (FE-05 / RF2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('fetches contracted modules successfully', async () => {
    const mockModules: ContractedModule[] = [
      { id: 10, codigo: 'FACTURACION', nombre: 'Facturación Electrónica' },
      { id: 11, codigo: 'INVENTARIO', nombre: 'Control de Inventarios' },
    ]

    vi.spyOn(apiService, 'get').mockResolvedValue(mockModules)

    const result = await moduleService.getContractedModules()

    expect(apiService.get).toHaveBeenCalledWith('/modulos/')
    expect(result).toEqual(mockModules)
    expect(result).toHaveLength(2)
    expect(result[0].nombre).toBe('Facturación Electrónica')
  })

  it('handles empty modules array when company has no active contracted modules', async () => {
    vi.spyOn(apiService, 'get').mockResolvedValue([])

    const result = await moduleService.getContractedModules()

    expect(apiService.get).toHaveBeenCalledWith('/modulos/')
    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it('propagates ApiError when API returns an error response', async () => {
    const apiError = new ApiError('No autorizado para consultar módulos', 401)
    vi.spyOn(apiService, 'get').mockRejectedValue(apiError)

    await expect(moduleService.getContractedModules()).rejects.toThrow(ApiError)
  })
})

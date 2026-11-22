import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiService } from '../../app/services/api'
import {
  getSupportTicketDetail,
  normalizeSupportTicketLookup,
} from '../../app/services/supportTicketDetailService'

vi.mock('../../app/services/api', () => ({
  apiService: { get: vi.fn() },
}))

describe('Support ticket detail service (FE-18)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests the internal support endpoint by numeric ID', async () => {
    const response = { id: 101, radicado: 'TK-2026-000101', historial: [] }
    vi.mocked(apiService.get).mockResolvedValue(response)

    await expect(getSupportTicketDetail('101')).resolves.toEqual(response)
    expect(apiService.get).toHaveBeenCalledWith('/support/tickets/101/')
  })

  it('accepts and normalizes a radicado supported by the backend', async () => {
    vi.mocked(apiService.get).mockResolvedValue({ id: 101 })
    await getSupportTicketDetail(' tk-2026-000101 ')

    expect(apiService.get).toHaveBeenCalledWith('/support/tickets/TK-2026-000101/')
  })

  it('rejects malformed or unsafe route identifiers before HTTP', async () => {
    expect(normalizeSupportTicketLookup(' ../../admin ')).toBeNull()
    expect(normalizeSupportTicketLookup('1/2')).toBeNull()
    expect(normalizeSupportTicketLookup('TK-2026-12345')).toBeNull()
    expect(normalizeSupportTicketLookup('   ')).toBeNull()

    await expect(getSupportTicketDetail('../admin')).rejects.toThrow('Identificador de ticket no válido')
    expect(apiService.get).not.toHaveBeenCalled()
  })
})

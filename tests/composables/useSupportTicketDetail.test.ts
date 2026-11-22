import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '~/services/api'
import { useSupportTicketDetail } from '~/composables/useSupportTicketDetail'

const { fetchDetailMock } = vi.hoisted(() => ({
  fetchDetailMock: vi.fn(),
}))

vi.mock('~/services/supportTicketDetailService', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/services/supportTicketDetailService')>()
  return { ...original, getSupportTicketDetail: fetchDetailMock }
})

const ticket = (id: number) => ({
  id,
  radicado: `TK-2026-${String(id).padStart(6, '0')}`,
  historial: [],
})

describe('useSupportTicketDetail (FE-18)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('distinguishes an invalid identifier, a 404 and a connection failure', async () => {
    const detail = useSupportTicketDetail()
    await detail.loadTicket('../secret')
    expect(detail.error.value).toBe('invalid-id')
    expect(fetchDetailMock).not.toHaveBeenCalled()

    fetchDetailMock.mockRejectedValueOnce(new ApiError('Not found', 404))
    await detail.loadTicket('101')
    expect(detail.error.value).toBe('not-found')

    fetchDetailMock.mockRejectedValueOnce(new Error('Network failed'))
    await detail.loadTicket('101')
    expect(detail.error.value).toBe('request-failed')
  })

  it('ignores a stale response when navigation changes tickets', async () => {
    let finishFirst: ((value: unknown) => void) | undefined
    fetchDetailMock
      .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve }))
      .mockResolvedValueOnce(ticket(202))

    const detail = useSupportTicketDetail()
    const first = detail.loadTicket('101')
    const second = detail.loadTicket('202')

    await second
    finishFirst?.(ticket(101))
    await first

    expect(detail.ticket.value?.id).toBe(202)
    expect(detail.isLoading.value).toBe(false)
    expect(detail.error.value).toBeNull()
  })

  it('sorts audit events chronologically without mutating the HTTP response', async () => {
    const audit = [
      { id: 2, fecha_creacion: '2026-11-17T11:00:00Z' },
      { id: 3, fecha_creacion: '2026-11-17T11:00:00Z' },
      { id: 1, fecha_creacion: '2026-11-16T11:00:00Z' },
    ]
    fetchDetailMock.mockResolvedValueOnce({ ...ticket(101), historial: audit })

    const detail = useSupportTicketDetail()
    await detail.loadTicket('101')

    expect(detail.history.value.map((event) => event.id)).toEqual([1, 2, 3])
    expect(audit.map((event) => event.id)).toEqual([2, 3, 1])
  })
})

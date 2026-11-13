import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { chatbotService, type ChatbotMessageResponse } from '../../app/services/chatbotService'
import { apiService, ApiError } from '../../app/services/api'

// Mock Nuxt globals
global.useCookie = () => ({ value: null })
global.useState = (key: string, init: () => any) => ({ value: init() })
global.computed = (fn: () => any) => ({ get value() { return fn() } })

describe('chatbotService (FE-10 / RF3, RF6)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('sends message to chatbot endpoint successfully', async () => {
    const mockResponse: ChatbotMessageResponse = {
      session_id: 'session-123',
      tipo_respuesta: 'PREGUNTA',
      mensaje: '¿En qué pantalla ocurrió el problema?',
      campos_recolectados: { modulo: 'FACTURACION' },
    }

    vi.spyOn(apiService, 'post').mockResolvedValue(mockResponse)

    const result = await chatbotService.sendChatbotMessage({
      session_id: 'session-123',
      mensaje: 'Tengo un fallo en facturación',
    })

    expect(apiService.post).toHaveBeenCalledWith('/chatbot/mensajes/', {
      session_id: 'session-123',
      mensaje: 'Tengo un fallo en facturación',
    })
    expect(result).toEqual(mockResponse)
    expect(result.tipo_respuesta).toBe('PREGUNTA')
  })

  it('handles ticket creation response from chatbot', async () => {
    const mockTicketResponse: ChatbotMessageResponse = {
      session_id: 'session-123',
      tipo_respuesta: 'TICKET_CREADO',
      radicado: 'TK-2026-000088',
      mensaje: 'He creado tu ticket exitosamente con el radicado TK-2026-000088.',
    }

    vi.spyOn(apiService, 'post').mockResolvedValue(mockTicketResponse)

    const result = await chatbotService.sendChatbotMessage({
      session_id: 'session-123',
      mensaje: 'Confirmar reporte',
    })

    expect(result.tipo_respuesta).toBe('TICKET_CREADO')
    expect(result.radicado).toBe('TK-2026-000088')
  })

  it('handles ticket status inquiry response from chatbot', async () => {
    const mockStatusResponse: ChatbotMessageResponse = {
      session_id: 'session-123',
      tipo_respuesta: 'ESTADO_TICKET',
      radicado: 'TK-2026-000001',
      datos: {
        estado: 'En gestion',
        asunto: 'Error 500 al emitir factura',
        fecha_creacion: '2026-11-09',
      },
      mensaje: 'Tu ticket TK-2026-000001 se encuentra En gestión.',
    }

    vi.spyOn(apiService, 'post').mockResolvedValue(mockStatusResponse)

    const result = await chatbotService.sendChatbotMessage({
      session_id: 'session-123',
      mensaje: 'TK-2026-000001',
    })

    expect(result.tipo_respuesta).toBe('ESTADO_TICKET')
    expect(result.datos?.estado).toBe('En gestion')
  })

  it('propagates ApiError when chatbot service encounters an error', async () => {
    const apiError = new ApiError('Error en el servicio del chatbot', 500)
    vi.spyOn(apiService, 'post').mockRejectedValue(apiError)

    await expect(
      chatbotService.sendChatbotMessage({
        session_id: 'session-123',
        mensaje: 'Hola',
      })
    ).rejects.toThrow(ApiError)
  })
})

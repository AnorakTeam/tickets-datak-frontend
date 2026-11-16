import { apiService } from './api'

export type ChatbotResponseType = 'PREGUNTA' | 'TICKET_CREADO' | 'ESTADO_TICKET' | 'ERROR' | 'INFO'

export interface ChatbotMessagePayload {
  session_id: string
  mensaje: string
}

export interface ChatbotMessageResponse {
  session_id: string
  tipo_respuesta: ChatbotResponseType
  mensaje: string
  radicado?: string
  datos?: {
    estado?: string
    asunto?: string
    fecha_creacion?: string
    modulo?: string
    comentario_solucion?: string
  }
  campos_recolectados?: Record<string, any>
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp: Date
  type?: ChatbotResponseType
  radicado?: string
  data?: Record<string, any>
}

/**
 * Sends a message to the conversational chatbot assistant (RF3, RF6).
 * Consumes endpoint: POST /api/v1/chatbot/mensajes/ via Nitro server proxy.
 */
export const sendChatbotMessage = async (
  payload: ChatbotMessagePayload
): Promise<ChatbotMessageResponse> => {
  return await apiService.post<ChatbotMessageResponse>('/chatbot/mensajes/', payload)
}

export const chatbotService = {
  sendChatbotMessage,
}

export default chatbotService

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import {
  chatbotService,
  type ChatMessage,
  type ChatbotMessageResponse,
} from '~/services/chatbotService'
import ChatbotSummaryCard from '~/components/chatbot/ChatbotSummaryCard.vue'
import ChatbotRadicadoCard from '~/components/chatbot/ChatbotRadicadoCard.vue'
import ChatbotStatusCard from '~/components/chatbot/ChatbotStatusCard.vue'

interface Props {
  initialOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialOpen: false,
})

const emit = defineEmits<{
  (e: 'toggle', isOpen: boolean): void
  (e: 'ticket-created', radicado: string): void
}>()

const isOpen = ref<boolean>(props.initialOpen)
const inputMessage = ref<string>('')
const isTyping = ref<boolean>(false)
const messagesContainer = ref<HTMLElement | null>(null)

// Generate or retrieve persistent session ID
const sessionId = ref<string>('')

const messages = ref<ChatMessage[]>([])

const generateSessionId = (): string => {
  return 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const initializeChat = () => {
  sessionId.value = generateSessionId()
  messages.value = [
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: '¡Hola! Soy tu asistente virtual de Tickets Datak. Puedo orientarte para reportar incidencias en tus módulos contratados o consultar el estado de tu ticket mediante su número de radicado.',
      timestamp: new Date(),
      type: 'INFO',
    },
  ]
}

const toggleOpen = () => {
  isOpen.value = !isOpen.value
  emit('toggle', isOpen.value)
  if (isOpen.value) {
    scrollToBottom()
  }
}

const resetChat = () => {
  initializeChat()
  scrollToBottom()
}

const sendMessageText = async (textToSend: string) => {
  const trimmed = textToSend.trim()
  if (!trimmed || isTyping.value) return

  // Push user message
  const userMsg: ChatMessage = {
    id: 'user_' + Date.now(),
    sender: 'user',
    text: trimmed,
    timestamp: new Date(),
  }
  messages.value.push(userMsg)
  inputMessage.value = ''
  isTyping.value = true
  scrollToBottom()

  try {
    const res: ChatbotMessageResponse = await chatbotService.sendChatbotMessage({
      session_id: sessionId.value,
      mensaje: trimmed,
    })

    const botMsg: ChatMessage = {
      id: 'bot_' + Date.now(),
      sender: 'bot',
      text: res.mensaje,
      timestamp: new Date(),
      type: res.tipo_respuesta,
      radicado: res.radicado,
      data: res.datos,
      campos_recolectados: res.campos_recolectados,
    }
    messages.value.push(botMsg)

    if (res.tipo_respuesta === 'TICKET_CREADO' && res.radicado) {
      emit('ticket-created', res.radicado)
    }
  } catch (err: any) {
    const errorMsg: ChatMessage = {
      id: 'err_' + Date.now(),
      sender: 'bot',
      text: err?.message || 'Lo siento, ocurrió un error al comunicarme con el servidor. Por favor intenta de nuevo.',
      timestamp: new Date(),
      type: 'ERROR',
    }
    messages.value.push(errorMsg)
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

const handleSummaryConfirm = () => {
  sendMessageText('Sí, confirmar y radicar ticket')
}

const handleSummaryCancel = () => {
  sendMessageText('Deseo corregir la información ingresada')
}

const handleSend = () => {
  sendMessageText(inputMessage.value)
}

const handleQuickChip = (actionText: string) => {
  sendMessageText(actionText)
}

const formatTime = (date: Date): string => {
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

onMounted(() => {
  initializeChat()
})

defineExpose({
  isOpen,
  messages,
  isTyping,
  toggleOpen,
  resetChat,
  sendMessageText,
})
</script>

<template>
  <div class="chatbot-widget-container">
    <!-- Floating Action Button (FAB) in Datak purple with i-lucide-messages-square -->
    <div class="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        class="w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 active:scale-95"
        :aria-label="isOpen ? 'Cerrar asistente virtual' : 'Abrir asistente virtual'"
        data-testid="chatbot-toggle-btn"
        @click="toggleOpen"
      >
        <UIcon
          :name="isOpen ? 'i-lucide-x' : 'i-lucide-messages-square'"
          class="w-6 h-6 text-white transition-transform duration-200"
        />
        <!-- Pulse ping badge when closed -->
        <span
          v-if="!isOpen"
          class="absolute -top-1 -right-1 flex h-3.5 w-3.5"
        >
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
        </span>
      </button>
    </div>

    <!-- Collapsible Chatbot Drawer / Window -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-8 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-8 opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[540px] max-h-[85vh] bg-default rounded-2xl shadow-xl border border-default flex flex-col overflow-hidden"
        data-testid="chatbot-drawer"
      >
        <!-- Header: Sobria cabecera morada con icono sparkles y controles limpios -->
        <header class="bg-primary-600 dark:bg-primary-700 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
          <div class="flex items-center space-x-2.5 min-w-0">
            <div class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-white" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold tracking-tight leading-tight truncate">
                Asistente Virtual Datak
              </h3>
              <div class="flex items-center space-x-1.5 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span class="text-[11px] text-white/80 font-medium">En línea · Soporte 24/7</span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-1">
            <button
              type="button"
              class="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Reiniciar conversación"
              data-testid="chatbot-reset-btn"
              @click="resetChat"
            >
              <UIcon name="i-lucide-rotate-ccw" class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Cerrar asistente"
              data-testid="chatbot-close-btn"
              @click="toggleOpen"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>
        </header>

        <!-- Message History Container -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 space-y-3.5 bg-page"
          data-testid="chatbot-messages-container"
        >
          <!-- Message Bubbles -->
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="[
              'flex flex-col',
              msg.sender === 'user' ? 'items-end' : 'items-start'
            ]"
            :data-testid="`message-${msg.sender}`"
          >
            <!-- Bubble wrapper -->
            <div
              :class="[
                'p-3 text-sm rounded-2xl shadow-xs break-words leading-relaxed',
                msg.sender === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-xs max-w-[85%]'
                  : 'bg-muted border border-default text-highlighted rounded-tl-xs max-w-[88%]'
              ]"
            >
              <p class="whitespace-pre-line">
                {{ msg.text }}
              </p>

              <!-- Radicado Confirmation Card (FE-11 / RF1, AGENTS.md Rule 4) -->
              <ChatbotRadicadoCard
                v-if="msg.type === 'TICKET_CREADO' && msg.radicado"
                :radicado="msg.radicado"
                :mensaje="msg.text"
              />

              <!-- Interactive Incident Summary Card (FE-11) -->
              <ChatbotSummaryCard
                v-else-if="msg.type === 'RESUMEN' || (msg.campos_recolectados && Object.keys(msg.campos_recolectados).length >= 2)"
                :campos="msg.campos_recolectados"
                :disabled="isTyping"
                @confirm="handleSummaryConfirm"
                @cancel="handleSummaryCancel"
              />

              <!-- Ticket Status Inquiry Card (FE-12 / RF6) -->
              <ChatbotStatusCard
                v-else-if="msg.type === 'ESTADO_TICKET' && msg.radicado"
                :radicado="msg.radicado"
                :datos="msg.data"
                :mensaje="msg.text"
              />

              <!-- Optional Status / Radicado Details Card -->
              <div
                v-else-if="msg.radicado"
                class="mt-2.5 pt-2 border-t border-default flex items-center justify-between gap-2"
              >
                <div class="text-xs">
                  <span class="text-muted font-medium">Radicado: </span>
                  <span class="font-mono font-bold tabular-nums text-primary-600 dark:text-primary-400">{{ msg.radicado }}</span>
                </div>
                <UBadge
                  v-if="msg.data?.estado"
                  size="xs"
                  color="gray"
                  variant="subtle"
                  class="rounded-md"
                >
                  {{ msg.data.estado }}
                </UBadge>
              </div>
            </div>

            <!-- Timestamp -->
            <span class="text-xs text-muted mt-1 px-1 tabular-nums">
              {{ formatTime(msg.timestamp) }}
            </span>
          </div>

          <!-- Typing Indicator -->
          <div
            v-if="isTyping"
            class="flex items-center space-x-2 text-muted text-xs py-1 px-2"
            data-testid="typing-indicator"
          >
            <div class="flex space-x-1">
              <span class="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse [animation-delay:-0.3s]" />
              <span class="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse [animation-delay:-0.15s]" />
              <span class="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
            </div>
            <span class="text-muted font-medium">Escribiendo respuesta...</span>
          </div>
        </div>

        <!-- Quick Suggestions Chips (when few messages) -->
        <div
          v-if="messages.length <= 2"
          class="px-3.5 py-2 bg-default border-t border-default flex flex-wrap gap-2 shrink-0"
        >
          <button
            type="button"
            class="text-xs bg-muted hover:bg-default text-highlighted font-medium py-1 px-2.5 rounded-full border border-default transition-colors inline-flex items-center gap-1.5"
            @click="handleQuickChip('Quiero reportar un problema en un módulo')"
          >
            <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5 text-primary-500" />
            <span>Reportar un problema</span>
          </button>
          <button
            type="button"
            class="text-xs bg-muted hover:bg-default text-highlighted font-medium py-1 px-2.5 rounded-full border border-default transition-colors inline-flex items-center gap-1.5"
            @click="handleQuickChip('Quiero consultar el estado de un radicado')">
            <UIcon name="i-lucide-search" class="w-3.5 h-3.5 text-muted" />
            <span>Consultar radicado</span>
          </button>
        </div>

        <!-- Footer / Input Form -->
        <footer class="p-2.5 bg-default border-t border-default shrink-0">
          <form class="flex items-center space-x-2" @submit.prevent="handleSend">
            <input
              v-model="inputMessage"
              type="text"
              placeholder="Escribe tu mensaje o radicado..."
              class="flex-1 text-xs sm:text-sm bg-muted border border-default rounded-xl px-3.5 py-2 text-highlighted placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 focus:bg-default transition-all"
              :disabled="isTyping"
              data-testid="chatbot-input"
            />
            <button
              type="submit"
              class="w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-xs transition-colors"
              :disabled="!inputMessage.trim() || isTyping"
              aria-label="Enviar mensaje"
              data-testid="chatbot-send-btn"
            >
              <UIcon name="i-lucide-send" class="w-4 h-4 text-white" />
            </button>
          </form>
        </footer>
      </div>
    </Transition>
  </div>
</template>

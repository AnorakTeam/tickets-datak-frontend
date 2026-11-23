<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSupportTicketDetail } from '~/composables/useSupportTicketDetail'
import SupportTicketActions from '~/components/support/SupportTicketActions.vue'
import EngineerTicketActions from '~/components/support/EngineerTicketActions.vue'
import type { SupportTicketHistoryItem } from '~/services/supportTicketDetailService'
import {
  formatTicketDateTime,
  getTicketPriorityPresentation,
  getTicketStatusPresentation,
} from '~/utils/ticketPresentation'

definePageMeta({ middleware: 'support' })

useHead({ title: 'Detalle de soporte — Tickets Datak' })

const route = useRoute()
const { ticket, history, isLoading, error, loadTicket } = useSupportTicketDetail()
const copyFeedback = ref<'idle' | 'copied' | 'failed'>('idle')

const routeLookup = computed(() => {
  const value = route.params.id
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
})

const statusPresentation = computed(() => ticket.value
  ? getTicketStatusPresentation(ticket.value.estado)
  : null)

const priorityPresentation = computed(() => ticket.value
  ? getTicketPriorityPresentation(ticket.value.prioridad)
  : null)

const getStatusIcon = (estado?: string): string => {
  switch (estado) {
    case 'Abierto':
      return 'i-lucide-clock'
    case 'En gestion':
      return 'i-lucide-hourglass'
    case 'Resuelto':
      return 'i-lucide-check-circle-2'
    case 'No procedente':
      return 'i-lucide-ban'
    default:
      return 'i-lucide-help-circle'
  }
}

const getPriorityIcon = (prioridad?: string): string => {
  switch (prioridad) {
    case 'Baja':
      return 'i-lucide-arrow-down'
    case 'Media':
      return 'i-lucide-minus'
    case 'Alta':
      return 'i-lucide-arrow-up'
    case 'Critica':
      return 'i-lucide-alert-triangle'
    default:
      return 'i-lucide-info'
  }
}

const getChannelIcon = (canal?: string): string => {
  switch (canal?.toLowerCase()) {
    case 'whatsapp':
      return 'i-lucide-message-circle'
    case 'correo':
    case 'email':
      return 'i-lucide-mail'
    case 'portal':
    case 'web':
      return 'i-lucide-globe'
    default:
      return 'i-lucide-inbox'
  }
}

const actionLabels: Record<string, string> = {
  CREACION: 'Creación del ticket',
  CLASIFICACION: 'Clasificación del ticket',
  ASIGNACION: 'Asignación de responsable',
  CAMBIO_ESTADO: 'Cambio de estado',
  NOTA_INTERNA: 'Nota interna',
  RESOLUCION: 'Ticket resuelto',
  NO_PROCEDENTE: 'Ticket no procedente',
}

const actionLabel = (item: SupportTicketHistoryItem): string =>
  actionLabels[item.tipo_accion] ?? 'Actualización del ticket'

const refresh = () => { void loadTicket(routeLookup.value) }

const copyRadicado = async () => {
  if (!ticket.value) return
  copyFeedback.value = 'idle'

  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      throw new Error('Portapapeles no disponible en el navegador')
    }
    await navigator.clipboard.writeText(ticket.value.radicado)
    copyFeedback.value = 'copied'
  } catch {
    copyFeedback.value = 'failed'
  }
}

// The support inbox reuses this component when navigating between tickets.
watch(routeLookup, () => {
  copyFeedback.value = 'idle'
  refresh()
})

onMounted(refresh)
</script>

<template>
  <section class="space-y-6">
    <NuxtLink
      to="/support/tickets"
      class="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-highlighted transition-colors"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Volver a la bandeja de soporte
    </NuxtLink>

    <div
      v-if="isLoading"
      class="rounded-xl border border-default bg-default p-10 text-center shadow-sm"
      data-testid="support-detail-loading"
      role="status"
    >
      <UIcon name="i-lucide-loader-2" class="mx-auto h-8 w-8 animate-spin text-primary-500" />
      <p class="mt-3 text-sm text-muted">Cargando detalle del ticket...</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-default bg-default p-8 text-center shadow-sm"
      data-testid="support-detail-error"
      role="alert"
    >
      <UIcon name="i-lucide-file-search" class="mx-auto h-10 w-10 text-dimmed" />
      <h1 class="mt-4 text-xl font-semibold text-highlighted">
        {{ error === 'not-found' ? 'Ticket no encontrado' : error === 'invalid-id' ? 'Identificador no válido' : 'No fue posible cargar el ticket' }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ error === 'not-found'
          ? 'No encontramos un ticket de soporte con ese identificador.'
          : error === 'invalid-id'
            ? 'Verifica el identificador e inténtalo nuevamente desde la bandeja.'
            : 'Comprueba tu conexión e inténtalo nuevamente.' }}
      </p>
      <UButton
        v-if="error === 'request-failed'"
        class="mt-4"
        color="gray"
        variant="outline"
        icon="i-lucide-rotate-cw"
        data-testid="support-detail-retry"
        @click="refresh"
      >
        Reintentar
      </UButton>
    </div>

    <template v-else-if="ticket">
      <header class="rounded-xl border border-default bg-default p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <h1 class="break-words text-xl font-semibold tracking-tight text-highlighted sm:text-2xl">
              {{ ticket.asunto }}
            </h1>
            <div class="mt-3.5 flex flex-wrap items-center gap-2">
              <UBadge color="gray" variant="subtle" size="sm" class="font-medium">
                <UIcon name="i-lucide-building-2" class="mr-1 h-3.5 w-3.5 text-muted" />
                {{ ticket.empresa.nombre }}
              </UBadge>
              <UBadge v-if="statusPresentation" :color="statusPresentation.color" variant="subtle" size="sm" class="font-medium">
                <UIcon :name="getStatusIcon(ticket.estado)" class="mr-1 h-3.5 w-3.5" />
                {{ statusPresentation.label }}
              </UBadge>
              <UBadge v-if="priorityPresentation" :color="priorityPresentation.color" variant="subtle" size="sm" class="font-medium">
                <UIcon :name="getPriorityIcon(ticket.prioridad)" class="mr-1 h-3.5 w-3.5" />
                Prioridad {{ priorityPresentation.label.toLowerCase() }}
              </UBadge>
              <UBadge color="gray" variant="subtle" size="sm" class="font-medium">
                <UIcon :name="getChannelIcon(ticket.canal_origen)" class="mr-1 h-3.5 w-3.5 text-muted" />
                {{ ticket.canal_origen }}
              </UBadge>
            </div>
          </div>

          <div class="min-w-0 rounded-lg border border-default bg-muted/40 p-4 lg:min-w-60">
            <span class="text-xs font-medium uppercase tracking-wider text-muted">Radicado</span>
            <div class="mt-1.5 flex items-center justify-between gap-3">
              <span class="break-all font-mono tabular-nums text-sm font-semibold text-highlighted sm:text-base">{{ ticket.radicado }}</span>
              <button
                type="button"
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-default hover:text-highlighted border border-transparent hover:border-default transition-colors"
                aria-label="Copiar radicado"
                data-testid="support-detail-copy"
                @click="copyRadicado"
              >
                <UIcon name="i-lucide-copy" class="h-4 w-4" />
              </button>
            </div>
            <p
              v-if="copyFeedback !== 'idle'"
              class="mt-1.5 text-xs font-medium"
              :class="copyFeedback === 'copied' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
              data-testid="support-detail-copy-feedback"
              role="status"
            >
              {{ copyFeedback === 'copied' ? 'Radicado copiado.' : 'No fue posible copiar el radicado.' }}
            </p>
          </div>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <div class="min-w-0 space-y-6">
          <article class="rounded-xl border border-default bg-default p-5 shadow-sm sm:p-6" data-testid="support-report-card">
            <h2 class="text-base font-semibold text-highlighted">Información del reporte</h2>
            <dl class="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Empresa</dt>
                <dd class="mt-1 break-words text-sm font-semibold text-highlighted">{{ ticket.empresa.nombre }}</dd>
                <dd v-if="ticket.empresa.identificacion" class="mt-0.5 text-xs text-muted tabular-nums">{{ ticket.empresa.identificacion }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Cliente que reportó</dt>
                <dd class="mt-1 break-words text-sm font-semibold text-highlighted">{{ ticket.creado_por.nombre }}</dd>
                <dd class="mt-0.5 break-all text-xs text-muted">{{ ticket.creado_por.correo }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Módulo contratado</dt>
                <dd class="mt-1 text-sm font-semibold text-highlighted">{{ ticket.modulo.nombre }}</dd>
                <dd class="mt-0.5 text-xs text-muted font-mono">{{ ticket.modulo.codigo }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Pantalla o documento</dt>
                <dd class="mt-1 break-words text-sm font-semibold text-highlighted">{{ ticket.pestana_o_documento }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Registrado por agente</dt>
                <dd class="mt-1 break-words text-sm font-semibold text-highlighted">{{ ticket.registrado_por_agente?.nombre || 'Registrado por el cliente' }}</dd>
                <dd v-if="ticket.registrado_por_agente" class="mt-0.5 break-all text-xs text-muted">{{ ticket.registrado_por_agente.correo }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Fecha de creación</dt>
                <dd class="mt-1 text-sm font-semibold text-highlighted tabular-nums">{{ formatTicketDateTime(ticket.fecha_creacion) }}</dd>
              </div>
            </dl>
            <div class="mt-6 border-t border-default pt-5">
              <h3 class="text-xs font-medium uppercase tracking-wide text-muted">Descripción de la incidencia</h3>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-default">{{ ticket.descripcion }}</p>
            </div>
            <div v-if="ticket.mensaje_error" class="mt-5 rounded-lg border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                <UIcon name="i-lucide-alert-triangle" class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Mensaje de error reportado</span>
              </div>
              <pre class="mt-2 whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-amber-900 dark:text-amber-200">{{ ticket.mensaje_error }}</pre>
            </div>
            <div v-if="ticket.estado === 'Resuelto' && ticket.comentario_solucion" class="mt-5 rounded-lg border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                <UIcon name="i-lucide-check-circle-2" class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Solución registrada</span>
              </div>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-emerald-900 dark:text-emerald-200">{{ ticket.comentario_solucion }}</p>
            </div>
            <div v-if="ticket.estado === 'No procedente' && ticket.motivo_no_procedente" class="mt-5 rounded-lg border border-default bg-muted/50 p-4">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-highlighted">
                <UIcon name="i-lucide-ban" class="h-4 w-4 shrink-0 text-muted" />
                <span>Motivo de no procedencia</span>
              </div>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-default">{{ ticket.motivo_no_procedente }}</p>
            </div>
          </article>

          <article class="rounded-xl border border-default bg-default p-5 shadow-sm sm:p-6" data-testid="support-history-card">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-highlighted">Historial de auditoría</h2>
                <p class="mt-1 text-xs text-muted">Registro cronológico de la actividad interna y pública del ticket.</p>
              </div>
              <UBadge color="gray" variant="subtle" size="xs" class="font-medium">{{ history.length }} eventos</UBadge>
            </div>

            <p v-if="history.length === 0" class="mt-6 rounded-lg border border-dashed border-default bg-muted/40 p-5 text-sm text-muted" data-testid="support-history-empty">
              Este ticket no registra eventos de auditoría todavía.
            </p>
            <ol v-else class="mt-6 space-y-0" data-testid="support-history-timeline">
              <li
                v-for="(item, index) in history"
                :key="item.id"
                class="relative flex gap-3.5 pb-6 last:pb-0"
                data-testid="support-history-event"
              >
                <span v-if="index < history.length - 1" class="absolute left-[0.6875rem] top-6 h-[calc(100%-1.5rem)] w-px bg-default" />
                <span
                  class="relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                  :class="item.es_interna ? 'border-amber-200 bg-amber-500 dark:border-amber-800 dark:bg-amber-500' : 'border-primary-200 bg-primary-600 dark:border-primary-800 dark:bg-primary-500'"
                />
                <div
                  class="min-w-0 flex-1 rounded-lg p-3.5 transition-colors"
                  :class="item.es_interna
                    ? 'border border-amber-200/50 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/10'
                    : 'border border-default bg-default'"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <h3 class="text-xs font-semibold text-highlighted">{{ actionLabel(item) }}</h3>
                      <UBadge v-if="item.es_interna" color="amber" variant="subtle" size="xs">
                        <UIcon name="i-lucide-lock" class="mr-1 h-3 w-3" />
                        Nota interna
                      </UBadge>
                    </div>
                    <span class="text-xs text-muted tabular-nums">
                      {{ formatTicketDateTime(item.fecha_creacion) }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-muted">
                    {{ item.actor.nombre }}
                  </p>
                  <p v-if="item.estado_anterior || item.estado_nuevo" class="mt-2 text-xs text-default">
                    Estado: <span class="font-medium text-muted">{{ item.estado_anterior || 'Sin estado anterior' }}</span> → <span class="font-semibold text-highlighted">{{ item.estado_nuevo || 'Sin cambio registrado' }}</span>
                  </p>
                  <p v-if="item.responsable_asignado" class="mt-1 text-xs text-default">
                    Responsable asignado: <span class="font-semibold text-highlighted">{{ item.responsable_asignado.nombre }}</span>
                  </p>
                  <p v-if="item.observaciones" class="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-default">{{ item.observaciones }}</p>
                </div>
              </li>
            </ol>
          </article>
        </div>

        <aside class="min-w-0 space-y-6">
          <section class="rounded-xl border border-default bg-default p-5 shadow-sm sm:p-6" data-testid="support-management-summary">
            <h2 class="text-base font-semibold text-highlighted">Resumen de gestión</h2>
            <dl class="mt-4 space-y-3.5">
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Responsable actual</dt>
                <dd class="mt-1 text-sm font-semibold text-highlighted">{{ ticket.responsable?.nombre || 'Sin asignar' }}</dd>
                <dd v-if="ticket.responsable" class="mt-0.5 break-all text-xs text-muted">{{ ticket.responsable.correo }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Clasificación</dt>
                <dd class="mt-1 text-sm font-semibold text-highlighted">{{ ticket.clasificacion || 'Sin clasificar' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Última actualización</dt>
                <dd class="mt-1 text-sm font-semibold text-highlighted tabular-nums">{{ formatTicketDateTime(ticket.fecha_actualizacion) }}</dd>
              </div>
              <div v-if="ticket.fecha_resolucion">
                <dt class="text-xs font-medium uppercase tracking-wide text-muted">Fecha de cierre</dt>
                <dd class="mt-1 text-sm font-semibold text-highlighted tabular-nums">{{ formatTicketDateTime(ticket.fecha_resolucion) }}</dd>
              </div>
            </dl>
          </section>
          <SupportTicketActions :ticket="ticket" @updated="refresh" />
          <EngineerTicketActions :ticket="ticket" @updated="refresh" />
        </aside>
      </div>
    </template>
  </section>
</template>

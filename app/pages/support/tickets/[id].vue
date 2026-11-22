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
      class="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
    >
      <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
      Volver a la bandeja de soporte
    </NuxtLink>

    <div
      v-if="isLoading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      data-testid="support-detail-loading"
      role="status"
    >
      <UIcon name="i-heroicons-arrow-path" class="mx-auto h-8 w-8 animate-spin text-primary-600" />
      <p class="mt-3 text-sm text-slate-600">Cargando detalle del ticket...</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      data-testid="support-detail-error"
      role="alert"
    >
      <UIcon name="i-heroicons-document-magnifying-glass" class="mx-auto h-10 w-10 text-slate-400" />
      <h1 class="mt-4 text-xl font-bold text-slate-950">
        {{ error === 'not-found' ? 'Ticket no encontrado' : error === 'invalid-id' ? 'Identificador no válido' : 'No fue posible cargar el ticket' }}
      </h1>
      <p class="mt-2 text-sm text-slate-600">
        {{ error === 'not-found'
          ? 'No encontramos un ticket de soporte con ese identificador.'
          : error === 'invalid-id'
            ? 'Verifica el identificador e inténtalo nuevamente desde la bandeja.'
            : 'Comprueba tu conexión e inténtalo nuevamente.' }}
      </p>
      <UButton
        v-if="error === 'request-failed'"
        class="mt-4"
        color="primary"
        variant="soft"
        icon="i-heroicons-arrow-path"
        data-testid="support-detail-retry"
        @click="refresh"
      >
        Reintentar
      </UButton>
    </div>

    <template v-else-if="ticket">
      <header class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-amber-600">Consola de soporte</p>
            <h1 class="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {{ ticket.asunto }}
            </h1>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <UBadge v-if="statusPresentation" :color="statusPresentation.color" variant="subtle">
                {{ statusPresentation.label }}
              </UBadge>
              <UBadge v-if="priorityPresentation" :color="priorityPresentation.color" variant="subtle">
                Prioridad {{ priorityPresentation.label.toLowerCase() }}
              </UBadge>
              <UBadge color="gray" variant="subtle">{{ ticket.canal_origen }}</UBadge>
            </div>
          </div>

          <div class="min-w-0 rounded-lg bg-slate-50 p-4 lg:min-w-60">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Radicado</p>
            <div class="mt-2 flex items-center justify-between gap-3">
              <span class="break-all font-mono text-sm font-bold text-slate-950 sm:text-base">{{ ticket.radicado }}</span>
              <button
                type="button"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-primary-600 hover:bg-primary-50"
                aria-label="Copiar radicado"
                data-testid="support-detail-copy"
                @click="copyRadicado"
              >
                <UIcon name="i-heroicons-clipboard-document" class="h-5 w-5" />
              </button>
            </div>
            <p
              v-if="copyFeedback !== 'idle'"
              class="mt-2 text-xs font-medium"
              :class="copyFeedback === 'copied' ? 'text-green-700' : 'text-red-700'"
              data-testid="support-detail-copy-feedback"
              role="status"
            >
              {{ copyFeedback === 'copied' ? 'Radicado copiado.' : 'No fue posible copiar el radicado.' }}
            </p>
          </div>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div class="min-w-0 space-y-6">
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" data-testid="support-report-card">
            <h2 class="text-lg font-bold text-slate-950">Información del reporte</h2>
            <dl class="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Empresa</dt>
                <dd class="mt-1 break-words text-sm font-medium text-slate-900">{{ ticket.empresa.nombre }}</dd>
                <dd v-if="ticket.empresa.identificacion" class="mt-0.5 text-xs text-slate-500">{{ ticket.empresa.identificacion }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente que reportó</dt>
                <dd class="mt-1 break-words text-sm font-medium text-slate-900">{{ ticket.creado_por.nombre }}</dd>
                <dd class="mt-0.5 break-all text-xs text-slate-500">{{ ticket.creado_por.correo }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Módulo contratado</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">{{ ticket.modulo.nombre }}</dd>
                <dd class="mt-0.5 text-xs text-slate-500">{{ ticket.modulo.codigo }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Pantalla o documento</dt>
                <dd class="mt-1 break-words text-sm font-medium text-slate-900">{{ ticket.pestana_o_documento }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Registrado por agente</dt>
                <dd class="mt-1 break-words text-sm font-medium text-slate-900">{{ ticket.registrado_por_agente?.nombre || 'Registrado por el cliente' }}</dd>
                <dd v-if="ticket.registrado_por_agente" class="mt-0.5 break-all text-xs text-slate-500">{{ ticket.registrado_por_agente.correo }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha de creación</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">{{ formatTicketDateTime(ticket.fecha_creacion) }}</dd>
              </div>
            </dl>
            <div class="mt-6 border-t border-slate-100 pt-5">
              <h3 class="text-sm font-semibold text-slate-900">Descripción de la incidencia</h3>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{{ ticket.descripcion }}</p>
            </div>
            <div v-if="ticket.mensaje_error" class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 class="text-sm font-semibold text-amber-900">Mensaje de error reportado</h3>
              <pre class="mt-2 whitespace-pre-wrap break-all font-mono text-xs leading-5 text-amber-900">{{ ticket.mensaje_error }}</pre>
            </div>
            <div v-if="ticket.estado === 'Resuelto' && ticket.comentario_solucion" class="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 class="text-sm font-semibold text-green-900">Solución registrada</h3>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm text-green-900">{{ ticket.comentario_solucion }}</p>
            </div>
            <div v-if="ticket.estado === 'No procedente' && ticket.motivo_no_procedente" class="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 class="text-sm font-semibold text-slate-900">Motivo de no procedencia</h3>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{{ ticket.motivo_no_procedente }}</p>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" data-testid="support-history-card">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-bold text-slate-950">Historial de auditoría</h2>
              <UBadge color="gray" variant="subtle">{{ history.length }} eventos</UBadge>
            </div>
            <p class="mt-1 text-xs text-slate-500">Registro cronológico de la actividad interna y pública del ticket.</p>

            <p v-if="history.length === 0" class="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600" data-testid="support-history-empty">
              Este ticket no registra eventos de auditoría todavía.
            </p>
            <ol v-else class="mt-6 space-y-0" data-testid="support-history-timeline">
              <li
                v-for="(item, index) in history"
                :key="item.id"
                class="relative flex gap-4 pb-7 last:pb-0"
                data-testid="support-history-event"
              >
                <span v-if="index < history.length - 1" class="absolute left-[0.6875rem] top-6 h-[calc(100%-1.5rem)] w-px bg-slate-200" />
                <span
                  class="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-4"
                  :class="item.es_interna ? 'border-amber-100 bg-amber-600' : 'border-primary-100 bg-primary-600'"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-sm font-semibold text-slate-950">{{ actionLabel(item) }}</h3>
                    <UBadge v-if="item.es_interna" color="amber" variant="subtle" size="xs">Nota interna</UBadge>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ item.actor.nombre }} · {{ formatTicketDateTime(item.fecha_creacion) }}
                  </p>
                  <p v-if="item.estado_anterior || item.estado_nuevo" class="mt-2 text-xs font-medium text-slate-600">
                    Estado: {{ item.estado_anterior || 'Sin estado anterior' }} → {{ item.estado_nuevo || 'Sin cambio registrado' }}
                  </p>
                  <p v-if="item.responsable_asignado" class="mt-1 text-xs text-slate-600">
                    Responsable asignado: {{ item.responsable_asignado.nombre }}
                  </p>
                  <p v-if="item.observaciones" class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{{ item.observaciones }}</p>
                </div>
              </li>
            </ol>
          </article>
        </div>

        <aside class="min-w-0 space-y-6">
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" data-testid="support-management-summary">
            <h2 class="text-lg font-bold text-slate-950">Resumen de gestión</h2>
            <dl class="mt-5 space-y-4">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Responsable actual</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">{{ ticket.responsable?.nombre || 'Sin asignar' }}</dd>
                <dd v-if="ticket.responsable" class="mt-0.5 break-all text-xs text-slate-500">{{ ticket.responsable.correo }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Clasificación</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">{{ ticket.clasificacion || 'Sin clasificar' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Última actualización</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">{{ formatTicketDateTime(ticket.fecha_actualizacion) }}</dd>
              </div>
              <div v-if="ticket.fecha_resolucion">
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha de cierre</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">{{ formatTicketDateTime(ticket.fecha_resolucion) }}</dd>
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

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAssignedTickets } from '~/composables/useAssignedTickets'
import { assignedTicketService, type AssignedTicketFilter } from '~/services/assignedTicketService'
import type { SupportTicketSummary } from '~/services/supportTicketService'
import {
  formatTicketDateTime,
  getTicketPriorityPresentation,
  getTicketStatusPresentation,
} from '~/utils/ticketPresentation'
import { ApiError } from '~/services/api'

definePageMeta({ middleware: 'support' })
useHead({ title: 'Mis tickets asignados — Tickets Datak' })

const toast = typeof useToast === 'function' ? useToast() : { add: () => {} }

const {
  tickets, filter, currentPage, totalTickets,
  hasNextPage, hasPreviousPage, isLoading, error,
  loadTickets, changeFilter, changePage,
} = useAssignedTickets()

const statusFilters: Array<{ label: string; value: AssignedTicketFilter }> = [
  { label: 'En gestión', value: 'En gestion' },
  { label: 'Resueltos', value: 'Resuelto' },
  { label: 'Todos', value: null },
]

// Modal & Quick Actions State for Direct Resolution and Internal Notes
const showNoteModal = ref(false)
const showResolveModal = ref(false)
const activeTicket = ref<SupportTicketSummary | null>(null)
const internalNoteText = ref('')
const resolutionSolutionText = ref('')
const isSubmittingAction = ref(false)
const actionError = ref<string | null>(null)

const openNoteModal = (ticket: SupportTicketSummary) => {
  activeTicket.value = ticket
  internalNoteText.value = ''
  actionError.value = null
  showNoteModal.value = true
}

const openResolveModal = (ticket: SupportTicketSummary) => {
  activeTicket.value = ticket
  resolutionSolutionText.value = ''
  actionError.value = null
  showResolveModal.value = true
}

const describeActionError = (cause: unknown): string => {
  if (cause instanceof ApiError) {
    if (cause.status === 403) return 'No tienes permisos para modificar este ticket.'
    if (cause.status === 404) return 'El ticket ya no está disponible.'
    if (cause.status === 400) return cause.message || 'El servidor rechazó la operación.'
  }
  return 'No se pudo completar la operación. Comprueba tu conexión e inténtalo nuevamente.'
}

const submitInternalNote = async () => {
  if (!activeTicket.value || isSubmittingAction.value) return
  const text = internalNoteText.value.trim()
  if (!text) {
    actionError.value = 'Escribe una nota interna antes de guardar.'
    return
  }

  isSubmittingAction.value = true
  actionError.value = null
  try {
    await assignedTicketService.addInternalTicketNote(activeTicket.value.radicado, text)
    toast.add({
      title: 'Nota interna agregada',
      description: `Se registró la nota en el ticket ${activeTicket.value.radicado}`,
      color: 'green',
      icon: 'i-lucide-check-circle',
    })
    showNoteModal.value = false
    void loadTickets()
  } catch (err) {
    actionError.value = describeActionError(err)
    toast.add({
      title: 'No se pudo guardar la nota',
      description: actionError.value,
      color: 'red',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isSubmittingAction.value = false
  }
}

const submitResolution = async () => {
  if (!activeTicket.value || isSubmittingAction.value) return
  const text = resolutionSolutionText.value.trim()
  if (!text) {
    actionError.value = 'El comentario oficial de solución es obligatorio.'
    return
  }

  isSubmittingAction.value = true
  actionError.value = null
  try {
    await assignedTicketService.resolveAssignedTicket(activeTicket.value.radicado, text)
    toast.add({
      title: 'Ticket resuelto',
      description: `El ticket ${activeTicket.value.radicado} ha sido resuelto exitosamente.`,
      color: 'green',
      icon: 'i-lucide-check-circle',
    })
    showResolveModal.value = false
    void loadTickets()
  } catch (err) {
    actionError.value = describeActionError(err)
    toast.add({
      title: 'No se pudo resolver el ticket',
      description: actionError.value,
      color: 'red',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isSubmittingAction.value = false
  }
}

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

const getClasificacionPresentation = (clasificacion?: string | null) => {
  switch (clasificacion) {
    case 'Bug':
      return { label: 'Bug', color: 'red' as const, icon: 'i-lucide-bug' }
    case 'Error de uso':
      return { label: 'Error de uso', color: 'blue' as const, icon: 'i-lucide-help-circle' }
    case 'Solicitud de mejora':
      return { label: 'Mejora', color: 'emerald' as const, icon: 'i-lucide-sparkles' }
    default:
      return { label: clasificacion || 'Sin clasificar', color: 'gray' as const, icon: 'i-lucide-tag' }
  }
}

onMounted(() => { void loadTickets() })
</script>

<template>
  <section class="space-y-5" data-testid="assigned-tickets-page">
    <!-- Header with 2-weight hierarchy (semibold & normal only) -->
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Consola de soporte · Cola de ingeniería
        </p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
          Mis tickets asignados
        </h1>
        <p class="mt-1 text-sm font-normal text-muted">
          Cola de trabajo técnico. Agrega notas de depuración o formaliza la solución oficial sin salir de la bandeja.
        </p>
      </div>
      <UButton
        to="/support/tickets"
        color="gray"
        variant="outline"
        icon="i-lucide-arrow-left"
        class="self-start text-xs font-medium"
      >
        Bandeja de soporte
      </UButton>
    </header>

    <!-- Toolbar / Status Filter Tabs -->
    <div class="rounded-xl border border-default bg-default p-3 shadow-sm sm:p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar mis tickets por estado">
          <UButton
            v-for="option in statusFilters"
            :key="option.label"
            size="sm"
            :color="filter === option.value ? 'primary' : 'gray'"
            :variant="filter === option.value ? 'soft' : 'ghost'"
            :class="filter === option.value ? 'border border-primary-200 dark:border-primary-800 font-semibold' : 'font-normal'"
            :disabled="isLoading"
            :aria-pressed="filter === option.value"
            @click="changeFilter(option.value)"
          >
            {{ option.label }}
          </UButton>
        </div>

        <div class="text-xs font-normal text-muted tabular-nums">
          <span class="font-semibold text-highlighted">{{ totalTickets }}</span> {{ totalTickets === 1 ? 'ticket asignado' : 'tickets asignados' }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="rounded-xl border border-default bg-default p-10 text-center shadow-sm"
      data-testid="assigned-tickets-loading"
      role="status"
    >
      <UIcon name="i-lucide-loader-2" class="mx-auto h-7 w-7 animate-spin text-primary-500" />
      <p class="mt-3 text-sm font-normal text-muted">Cargando mis tickets asignados...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50/70 p-6 text-sm font-normal text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
      data-testid="assigned-tickets-error"
      role="alert"
    >
      <p>{{ error }}</p>
      <UButton
        color="red"
        variant="soft"
        size="sm"
        class="mt-3 font-medium"
        icon="i-lucide-rotate-cw"
        @click="loadTickets"
      >
        Reintentar
      </UButton>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="tickets.length === 0"
      class="rounded-xl border border-dashed border-default bg-default px-5 py-12 text-center"
      data-testid="assigned-tickets-empty"
    >
      <UIcon name="i-lucide-inbox" class="mx-auto h-9 w-9 text-dimmed" />
      <h2 class="mt-3 text-base font-semibold text-highlighted">Sin tickets asignados</h2>
      <p class="mt-1 text-sm font-normal text-muted">No tienes tickets asignados que coincidan con el estado seleccionado.</p>
    </div>

    <!-- High-Density Operative Table -->
    <template v-else>
      <div class="hidden overflow-hidden rounded-xl border border-default bg-default shadow-sm md:block">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-default text-left text-sm" data-testid="assigned-tickets-table">
            <thead class="bg-muted text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" class="px-3.5 py-2.5">Radicado</th>
                <th scope="col" class="px-3.5 py-2.5">Incidencia</th>
                <th scope="col" class="px-3.5 py-2.5">Empresa</th>
                <th scope="col" class="px-3.5 py-2.5">Clasificación</th>
                <th scope="col" class="px-3.5 py-2.5">Prioridad</th>
                <th scope="col" class="px-3.5 py-2.5">Estado</th>
                <th scope="col" class="px-3.5 py-2.5">Creación</th>
                <th scope="col" class="px-3.5 py-2.5 text-right">Acciones directas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="ticket in tickets"
                :key="ticket.id"
                class="hover:bg-muted/50 transition-colors"
                :data-testid="`assigned-row-${ticket.id}`"
              >
                <!-- Radicado -->
                <td class="whitespace-nowrap px-3.5 py-2.5 font-mono tabular-nums text-xs font-semibold text-primary-600 dark:text-primary-400">
                  <NuxtLink
                    :to="`/support/tickets/${ticket.id}`"
                    class="hover:underline focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                  >
                    {{ ticket.radicado }}
                  </NuxtLink>
                </td>

                <!-- Incidencia & Módulo -->
                <td class="max-w-xs px-3.5 py-2.5">
                  <p class="truncate text-xs font-semibold text-highlighted" :title="ticket.asunto">
                    {{ ticket.asunto }}
                  </p>
                  <p class="mt-0.5 truncate text-[11px] font-normal text-muted">
                    {{ ticket.modulo?.nombre || 'Módulo no disponible' }}
                  </p>
                </td>

                <!-- Empresa -->
                <td class="px-3.5 py-2.5 text-xs font-normal text-default">
                  {{ ticket.empresa?.nombre || '—' }}
                </td>

                <!-- Clasificación Clara -->
                <td class="whitespace-nowrap px-3.5 py-2.5">
                  <UBadge
                    :color="getClasificacionPresentation(ticket.clasificacion).color"
                    variant="subtle"
                    size="xs"
                    class="font-medium"
                  >
                    <UIcon :name="getClasificacionPresentation(ticket.clasificacion).icon" class="mr-1 h-3 w-3" />
                    {{ getClasificacionPresentation(ticket.clasificacion).label }}
                  </UBadge>
                </td>

                <!-- Prioridad Clara -->
                <td class="whitespace-nowrap px-3.5 py-2.5">
                  <UBadge
                    :color="getTicketPriorityPresentation(ticket.prioridad).color"
                    variant="subtle"
                    size="xs"
                    class="font-medium"
                  >
                    <UIcon :name="getPriorityIcon(ticket.prioridad)" class="mr-1 h-3 w-3" />
                    {{ getTicketPriorityPresentation(ticket.prioridad).label }}
                  </UBadge>
                </td>

                <!-- Estado -->
                <td class="whitespace-nowrap px-3.5 py-2.5">
                  <UBadge
                    :color="getTicketStatusPresentation(ticket.estado).color"
                    variant="subtle"
                    size="xs"
                    class="font-medium"
                  >
                    <UIcon :name="getStatusIcon(ticket.estado)" class="mr-1 h-3 w-3" />
                    {{ getTicketStatusPresentation(ticket.estado).label }}
                  </UBadge>
                </td>

                <!-- Creación / Antigüedad -->
                <td class="whitespace-nowrap px-3.5 py-2.5 text-xs font-normal text-muted tabular-nums">
                  {{ formatTicketDateTime(ticket.fecha_creacion) }}
                </td>

                <!-- Acciones Directas de Resolución y Notas Internas -->
                <td class="whitespace-nowrap px-3.5 py-2.5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <template v-if="ticket.estado === 'En gestion'">
                      <UButton
                        size="xs"
                        color="gray"
                        variant="ghost"
                        icon="i-lucide-file-text"
                        title="Agregar nota interna rápida"
                        aria-label="Agregar nota interna"
                        data-testid="quick-add-note-btn"
                        @click="openNoteModal(ticket)"
                      >
                        <span class="hidden xl:inline text-xs font-normal">Nota</span>
                      </UButton>
                      <UButton
                        size="xs"
                        color="emerald"
                        variant="soft"
                        icon="i-lucide-check-circle"
                        title="Resolver caso de inmediato"
                        aria-label="Resolver caso de inmediato"
                        class="font-medium"
                        data-testid="quick-resolve-btn"
                        @click="openResolveModal(ticket)"
                      >
                        <span class="hidden xl:inline text-xs font-medium">Resolver</span>
                      </UButton>
                    </template>
                    <UButton
                      :to="`/support/tickets/${ticket.id}`"
                      color="gray"
                      variant="ghost"
                      size="xs"
                      icon="i-lucide-arrow-up-right"
                      title="Abrir detalle completo"
                      class="text-xs font-normal"
                    >
                      <span class="hidden sm:inline">Detalle</span>
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile List Cards -->
      <div class="space-y-3 md:hidden" data-testid="assigned-tickets-mobile">
        <article
          v-for="ticket in tickets"
          :key="ticket.id"
          class="rounded-xl border border-default bg-default p-4 shadow-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="break-all font-mono tabular-nums text-xs font-semibold text-primary-600 dark:text-primary-400">
              {{ ticket.radicado }}
            </span>
            <UBadge :color="getTicketStatusPresentation(ticket.estado).color" variant="subtle" size="xs" class="font-medium">
              <UIcon :name="getStatusIcon(ticket.estado)" class="mr-1 h-3 w-3" />
              {{ getTicketStatusPresentation(ticket.estado).label }}
            </UBadge>
          </div>

          <h2 class="mt-2.5 break-words text-sm font-semibold text-highlighted">
            {{ ticket.asunto }}
          </h2>
          <p class="mt-1 text-xs font-normal text-muted">
            {{ ticket.empresa?.nombre || 'Empresa no disponible' }} · {{ ticket.modulo?.nombre || 'Módulo no disponible' }}
          </p>

          <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
            <UBadge
              :color="getClasificacionPresentation(ticket.clasificacion).color"
              variant="subtle"
              size="xs"
              class="font-medium"
            >
              <UIcon :name="getClasificacionPresentation(ticket.clasificacion).icon" class="mr-1 h-3 w-3" />
              {{ getClasificacionPresentation(ticket.clasificacion).label }}
            </UBadge>
            <UBadge
              :color="getTicketPriorityPresentation(ticket.prioridad).color"
              variant="subtle"
              size="xs"
              class="font-medium"
            >
              <UIcon :name="getPriorityIcon(ticket.prioridad)" class="mr-1 h-3 w-3" />
              {{ getTicketPriorityPresentation(ticket.prioridad).label }}
            </UBadge>
            <span class="text-[11px] font-normal text-muted tabular-nums ml-auto">
              {{ formatTicketDateTime(ticket.fecha_creacion) }}
            </span>
          </div>

          <!-- Mobile Direct Actions -->
          <div class="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-default pt-2.5">
            <div class="flex items-center gap-1.5">
              <template v-if="ticket.estado === 'En gestion'">
                <UButton
                  size="xs"
                  color="gray"
                  variant="ghost"
                  icon="i-lucide-file-text"
                  @click="openNoteModal(ticket)"
                >
                  Nota
                </UButton>
                <UButton
                  size="xs"
                  color="emerald"
                  variant="soft"
                  icon="i-lucide-check-circle"
                  @click="openResolveModal(ticket)"
                >
                  Resolver
                </UButton>
              </template>
            </div>
            <UButton
              :to="`/support/tickets/${ticket.id}`"
              size="xs"
              color="gray"
              variant="outline"
              class="font-normal"
            >
              Ver detalle
            </UButton>
          </div>
        </article>
      </div>
    </template>

    <!-- Pagination Footer -->
    <footer
      v-if="!isLoading && !error && (tickets.length > 0 || hasPreviousPage)"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default px-4 py-3 text-xs font-normal text-muted shadow-sm tabular-nums"
    >
      <p>{{ totalTickets }} tickets · Página {{ currentPage }}</p>
      <div class="flex items-center gap-2">
        <UButton
          size="xs"
          color="gray"
          variant="outline"
          :disabled="!hasPreviousPage"
          data-testid="assigned-prev"
          @click="changePage(-1)"
        >
          Anterior
        </UButton>
        <UButton
          size="xs"
          color="gray"
          variant="outline"
          :disabled="!hasNextPage"
          data-testid="assigned-next"
          @click="changePage(1)"
        >
          Siguiente
        </UButton>
      </div>
    </footer>

    <!-- Direct Action Modal: Nota Interna Rápida -->
    <UModal v-model="showNoteModal" data-testid="assigned-note-modal">
      <UCard :ui="{ ring: 'ring-1 ring-default', shadow: 'shadow-xl', rounded: 'rounded-xl', background: 'bg-default' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-file-text" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 class="text-base font-semibold text-highlighted">
              Nota interna · <span class="font-mono tabular-nums">{{ activeTicket?.radicado }}</span>
            </h2>
          </div>
        </template>
        <p class="text-xs font-normal text-muted mb-3">
          Este comentario técnico es confidencial y solo será visible para el equipo interno de soporte.
        </p>
        <label for="modal-internal-note" class="block text-xs font-semibold text-default mb-1">
          Observaciones de depuración o avance técnico
        </label>
        <UTextarea
          id="modal-internal-note"
          v-model="internalNoteText"
          :rows="4"
          class="w-full"
          :disabled="isSubmittingAction"
          placeholder="Describe avances técnicos, trazas o notas de investigación..."
          data-testid="assigned-note-input"
        />
        <p v-if="actionError" class="mt-2 text-xs font-normal text-red-600 dark:text-red-400" role="alert">
          {{ actionError }}
        </p>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <UButton
              color="gray"
              variant="ghost"
              size="sm"
              :disabled="isSubmittingAction"
              @click="showNoteModal = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              icon="i-lucide-file-text"
              :loading="isSubmittingAction"
              :disabled="isSubmittingAction || !internalNoteText.trim()"
              data-testid="assigned-submit-note"
              @click="submitInternalNote"
            >
              Guardar nota interna
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Direct Action Modal: Resolución Rápida -->
    <UModal v-model="showResolveModal" data-testid="assigned-resolve-modal">
      <UCard :ui="{ ring: 'ring-1 ring-default', shadow: 'shadow-xl', rounded: 'rounded-xl', background: 'bg-default' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 class="text-base font-semibold text-highlighted">
              Resolver ticket · <span class="font-mono tabular-nums">{{ activeTicket?.radicado }}</span>
            </h2>
          </div>
        </template>
        <p class="text-xs font-normal text-muted mb-3">
          Al resolver el caso, el comentario oficial de solución será visible para el cliente y el ticket quedará cerrado.
        </p>
        <label for="modal-solution-text" class="block text-xs font-semibold text-default mb-1">
          Comentario oficial de solución <span class="text-red-500">*</span>
        </label>
        <UTextarea
          id="modal-solution-text"
          v-model="resolutionSolutionText"
          :rows="4"
          class="w-full"
          :disabled="isSubmittingAction"
          placeholder="Explica la causa identificada y cómo fue resuelto el problema..."
          data-testid="assigned-solution-input"
        />
        <p v-if="actionError" class="mt-2 text-xs font-normal text-red-600 dark:text-red-400" role="alert">
          {{ actionError }}
        </p>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <UButton
              color="gray"
              variant="ghost"
              size="sm"
              :disabled="isSubmittingAction"
              @click="showResolveModal = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="emerald"
              variant="solid"
              size="sm"
              icon="i-lucide-check-circle"
              :loading="isSubmittingAction"
              :disabled="isSubmittingAction || !resolutionSolutionText.trim()"
              data-testid="assigned-submit-resolution"
              @click="submitResolution"
            >
              Confirmar resolución
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </section>
</template>

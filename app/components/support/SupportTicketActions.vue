<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import type { TicketPriority } from '~/services/ticketService'
import type { SupportTicketDetail } from '~/services/supportTicketDetailService'
import {
  supportTicketManagementService,
  type AssignableSupportUser,
  type SupportTicketClassification,
} from '~/services/supportTicketManagementService'
import { ApiError } from '~/services/api'

const props = defineProps<{ ticket: SupportTicketDetail }>()
const emit = defineEmits<{ (event: 'updated'): void }>()

const authStore = useAuthStore()
const toast = useToast()

const isAgent = computed(() => authStore.userRole === 'agente_soporte')
const isClosed = computed(() => props.ticket.estado === 'Resuelto' || props.ticket.estado === 'No procedente')
const canManage = computed(() => isAgent.value && !isClosed.value)
const busyAction = ref<'classify' | 'assign' | 'dismiss' | null>(null)
const actionError = ref<string | null>(null)
const classification = ref<SupportTicketClassification | ''>('')
const priority = ref<TicketPriority>('Media')
const selectedResponsableId = ref<number | null>(null)
const responsables = ref<AssignableSupportUser[]>([])
const loadingResponsables = ref(false)
const responsablesError = ref<string | null>(null)
const showDismissModal = ref(false)
const dismissalReason = ref('')
let version = 0
let responsablesRequest = 0

const classificationOptions: SupportTicketClassification[] = [
  'Error de uso', 'Bug', 'Solicitud de mejora',
]
const priorityOptions: Array<{ value: TicketPriority; label: string }> = [
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Critica', label: 'Crítica' },
]

const resetSelections = () => {
  classification.value = classificationOptions.find((value) => value === props.ticket.clasificacion) ?? ''
  priority.value = props.ticket.prioridad
  selectedResponsableId.value = props.ticket.responsable?.id ?? null
  actionError.value = null
  showDismissModal.value = false
  dismissalReason.value = ''
}

watch(() => props.ticket.id, () => {
  ++version
  busyAction.value = null
  resetSelections()
})

watch(() => props.ticket.fecha_actualizacion, resetSelections)

// A role change or an externally closed ticket invalidates any pending UI action.
watch(canManage, (allowed) => {
  if (!allowed) {
    ++version
    busyAction.value = null
    showDismissModal.value = false
  }
})

const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'No tienes permisos para realizar esta acción.'
    if (error.status === 404) return 'Este ticket ya no está disponible.'
    if (error.status === 400) return error.message || 'La operación fue rechazada por el servidor.'
  }
  return 'No fue posible completar la operación. Intenta nuevamente.'
}

const loadResponsables = async () => {
  if (!canManage.value) return
  const requestId = ++responsablesRequest
  responsablesError.value = null
  loadingResponsables.value = true
  try {
    const response = await supportTicketManagementService.listAssignableSupportUsers()
    if (requestId !== responsablesRequest) return
    responsables.value = response
  } catch {
    if (requestId !== responsablesRequest) return
    responsables.value = []
    responsablesError.value = 'No se pudieron cargar los responsables disponibles.'
  } finally {
    if (requestId === responsablesRequest) loadingResponsables.value = false
  }
}

const performAction = async (action: 'classify' | 'assign' | 'dismiss', execute: () => Promise<SupportTicketDetail>, title: string) => {
  if (!canManage.value || busyAction.value) return
  const currentVersion = version
  busyAction.value = action
  actionError.value = null
  try {
    await execute()
    if (currentVersion !== version) return
    toast.add({ title, color: 'green', icon: 'i-lucide-check-circle' })
    if (action === 'dismiss') showDismissModal.value = false
    emit('updated')
  } catch (error: unknown) {
    if (currentVersion !== version) return
    actionError.value = errorMessage(error)
    toast.add({ title: 'No se pudo guardar el cambio', description: actionError.value, color: 'red', icon: 'i-lucide-alert-circle' })
  } finally {
    if (currentVersion === version) busyAction.value = null
  }
}

const submitClassification = () => {
  if (!classification.value) {
    actionError.value = 'Selecciona la clasificación del ticket.'
    return
  }
  void performAction('classify', () => supportTicketManagementService.classifySupportTicket(props.ticket.radicado, {
    clasificacion: classification.value as SupportTicketClassification,
    prioridad: priority.value,
  }), 'Clasificación actualizada')
}

const submitAssignment = () => {
  if (!selectedResponsableId.value) {
    actionError.value = 'Selecciona un responsable de soporte.'
    return
  }
  if (selectedResponsableId.value === props.ticket.responsable?.id) return
  void performAction('assign', () => supportTicketManagementService.assignSupportTicket(
    props.ticket.radicado, selectedResponsableId.value!,
  ), 'Responsable actualizado')
}

const openDismissModal = () => {
  if (!canManage.value || busyAction.value) return
  actionError.value = null
  dismissalReason.value = ''
  showDismissModal.value = true
}

const submitDismissal = () => {
  const reason = dismissalReason.value.trim()
  if (!reason) {
    actionError.value = 'Debes escribir un motivo antes de continuar.'
    return
  }
  void performAction('dismiss', () => supportTicketManagementService.dismissSupportTicket(
    props.ticket.radicado, reason,
  ), 'Ticket marcado como no procedente')
}

resetSelections()
onMounted(() => { void loadResponsables() })
onBeforeUnmount(() => { ++version; ++responsablesRequest })
</script>

<template>
  <section class="space-y-4" data-testid="support-ticket-actions">
    <div v-if="!isAgent" class="rounded-xl border border-default bg-muted p-5 text-sm text-muted" data-testid="actions-forbidden">
      Las acciones de clasificación, asignación y no procedencia están disponibles únicamente para agentes de soporte.
    </div>

    <div v-else-if="isClosed" class="rounded-xl border border-default bg-muted p-5" data-testid="actions-closed">
      <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
        <UIcon name="i-lucide-lock" class="h-4 w-4 text-muted" />
        Ticket cerrado
      </div>
      <p class="mt-2 text-sm leading-6 text-muted">
        No se permiten cambios de clasificación, responsable ni no procedencia en tickets cerrados.
      </p>
    </div>

    <template v-else>
      <div v-if="actionError" class="rounded-lg border border-red-200 bg-red-50/70 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300" role="alert" data-testid="support-actions-error">
        {{ actionError }}
      </div>

      <section class="rounded-xl border border-default bg-default p-5 shadow-sm sm:p-6" aria-labelledby="classification-title">
        <h2 id="classification-title" class="text-base font-bold text-highlighted">Clasificación y prioridad</h2>
        <p class="mt-1 text-xs leading-5 text-muted">Registra el tipo de incidencia y su impacto.</p>
        <div class="mt-4 space-y-3">
          <label class="block text-xs font-semibold text-default" for="ticket-classification">Clasificación</label>
          <select id="ticket-classification" v-model="classification" class="w-full rounded-lg border border-default bg-default px-3 py-2 text-sm text-default focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" :disabled="busyAction !== null" data-testid="support-classification">
            <option value="">Seleccionar clasificación</option>
            <option v-for="option in classificationOptions" :key="option" :value="option">{{ option }}</option>
          </select>
          <label class="block text-xs font-semibold text-default" for="ticket-priority">Prioridad</label>
          <select id="ticket-priority" v-model="priority" class="w-full rounded-lg border border-default bg-default px-3 py-2 text-sm text-default focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" :disabled="busyAction !== null" data-testid="support-priority">
            <option v-for="option in priorityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <UButton block color="primary" variant="soft" icon="i-lucide-tag" :disabled="busyAction !== null || !classification" :loading="busyAction === 'classify'" data-testid="support-save-classification" @click="submitClassification">Guardar clasificación</UButton>
        </div>
      </section>

      <section class="rounded-xl border border-default bg-default p-5 shadow-sm sm:p-6" aria-labelledby="assignment-title">
        <h2 id="assignment-title" class="text-base font-bold text-highlighted">Asignación de responsable</h2>
        <p class="mt-1 text-xs leading-5 text-muted">Asigna o reasigna la atención del caso a personal interno.</p>
        <div class="mt-4 space-y-3">
          <label class="block text-xs font-semibold text-default" for="ticket-responsable">Responsable</label>
          <select id="ticket-responsable" v-model.number="selectedResponsableId" class="w-full rounded-lg border border-default bg-default px-3 py-2 text-sm text-default focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" :disabled="busyAction !== null || loadingResponsables || Boolean(responsablesError)" data-testid="support-responsable">
            <option :value="null">Seleccionar responsable</option>
            <option v-for="person in responsables" :key="person.id" :value="person.id">{{ person.nombre }} ({{ person.correo }})</option>
          </select>
          <p v-if="loadingResponsables" class="text-xs text-muted" role="status">Cargando responsables...</p>
          <div v-if="responsablesError" role="alert" class="space-y-2">
            <p class="text-xs text-red-700 dark:text-red-400">{{ responsablesError }}</p>
            <UButton size="xs" color="gray" variant="outline" data-testid="retry-responsables" @click="loadResponsables">Reintentar carga</UButton>
          </div>
          <p v-else-if="!loadingResponsables && responsables.length === 0" class="text-xs text-muted">No hay responsables disponibles.</p>
          <UButton block color="primary" variant="soft" icon="i-lucide-user-plus" :disabled="busyAction !== null || !selectedResponsableId || Boolean(responsablesError) || loadingResponsables || selectedResponsableId === ticket.responsable?.id" :loading="busyAction === 'assign'" data-testid="support-save-assignment" @click="submitAssignment">
            {{ ticket.responsable ? 'Reasignar responsable' : 'Asignar responsable' }}
          </UButton>
        </div>
      </section>

      <section class="rounded-xl border border-red-200 bg-red-50/40 p-5 sm:p-6 dark:border-red-900/40 dark:bg-red-950/20" aria-labelledby="dismiss-title">
        <h2 id="dismiss-title" class="text-base font-bold text-highlighted">No procedente</h2>
        <p class="mt-2 text-xs leading-5 text-muted">Esta acción cierra el ticket y notifica el motivo al cliente. No se puede deshacer desde esta pantalla.</p>
        <UButton block class="mt-4" color="red" variant="soft" icon="i-lucide-alert-triangle" :disabled="busyAction !== null" data-testid="support-open-dismiss" @click="openDismissModal">Marcar como no procedente</UButton>
      </section>
    </template>

    <UModal v-model="showDismissModal" :prevent-close="busyAction === 'dismiss'" data-testid="support-dismiss-modal">
      <UCard>
        <template #header>
          <h2 class="text-lg font-bold text-highlighted">Confirmar no procedencia</h2>
        </template>
        <p class="text-sm leading-6 text-muted">Escribe el motivo que podrá consultar el cliente. El ticket quedará cerrado.</p>
        <label for="ticket-dismiss-reason" class="mt-4 block text-sm font-semibold text-highlighted">Motivo de no procedencia</label>
        <UTextarea id="ticket-dismiss-reason" v-model="dismissalReason" class="mt-2 w-full" :rows="4" :disabled="busyAction !== null" placeholder="Explica por qué el caso no procede..." data-testid="support-dismiss-reason" />
        <p v-if="actionError" class="mt-2 text-xs text-red-700 dark:text-red-400" role="alert">{{ actionError }}</p>
        <template #footer>
          <div class="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <UButton color="gray" variant="ghost" :disabled="busyAction !== null" @click="showDismissModal = false">Cancelar</UButton>
            <UButton color="red" :disabled="busyAction !== null || !dismissalReason.trim()" :loading="busyAction === 'dismiss'" data-testid="support-confirm-dismiss" @click="submitDismissal">Confirmar no procedencia</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </section>
</template>

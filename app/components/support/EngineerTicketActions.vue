<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ApiError } from '~/services/api'
import { assignedTicketService } from '~/services/assignedTicketService'
import type { SupportTicketDetail } from '~/services/supportTicketDetailService'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{ ticket: SupportTicketDetail }>()
const emit = defineEmits<{ (event: 'updated'): void }>()

const authStore = useAuthStore()
const toast = useToast()
const note = ref('')
const solution = ref('')
const showResolveModal = ref(false)
const busy = ref<'note' | 'resolve' | null>(null)
const actionError = ref<string | null>(null)

const isSupportRole = computed(() => ['agente_soporte', 'responsable_atencion'].includes(authStore.userRole ?? ''))
const isAssignedToMe = computed(() =>
  isSupportRole.value && authStore.user?.id !== undefined &&
  props.ticket.responsable?.id === authStore.user.id,
)
const isClosed = computed(() => props.ticket.estado === 'Resuelto' || props.ticket.estado === 'No procedente')
const canUpdate = computed(() => isAssignedToMe.value && !isClosed.value)
let requestVersion = 0

watch(() => props.ticket.id, () => {
  ++requestVersion
  busy.value = null
  note.value = ''
  solution.value = ''
  actionError.value = null
  showResolveModal.value = false
})
watch(canUpdate, (allowed) => {
  if (!allowed) {
    ++requestVersion
    busy.value = null
    showResolveModal.value = false
  }
})
onBeforeUnmount(() => { ++requestVersion })

const describeError = (cause: unknown): string => {
  if (cause instanceof ApiError) {
    if (cause.status === 403) return 'No tienes permisos para modificar este ticket.'
    if (cause.status === 404) return 'El ticket ya no está disponible.'
    if (cause.status === 400) return cause.message || 'El servidor rechazó la operación.'
  }
  return 'No se pudo completar la operación. Comprueba tu conexión e inténtalo nuevamente.'
}

const execute = async (kind: 'note' | 'resolve', text: string) => {
  if (!canUpdate.value || busy.value) return
  const version = requestVersion
  const lookup = props.ticket.radicado
  busy.value = kind
  actionError.value = null
  try {
    if (kind === 'note') {
      await assignedTicketService.addInternalTicketNote(lookup, text)
    } else {
      await assignedTicketService.resolveAssignedTicket(lookup, text)
    }
    if (version !== requestVersion) return
    if (kind === 'note') note.value = ''
    if (kind === 'resolve') {
      solution.value = ''
      showResolveModal.value = false
    }
    toast.add({
      title: kind === 'note' ? 'Nota interna registrada' : 'Ticket resuelto',
      color: 'green',
      icon: 'i-lucide-check-circle',
    })
    emit('updated')
  } catch (cause: unknown) {
    if (version !== requestVersion) return
    actionError.value = describeError(cause)
    toast.add({ title: 'No se guardaron los cambios', description: actionError.value, color: 'red' })
  } finally {
    if (version === requestVersion) busy.value = null
  }
}

const submitNote = () => {
  if (!canUpdate.value || busy.value) return
  const text = note.value.trim()
  if (!text) {
    actionError.value = 'Escribe una nota interna antes de guardar.'
    return
  }
  void execute('note', text)
}

const openResolveModal = () => {
  if (!canUpdate.value || busy.value) return
  actionError.value = null
  solution.value = ''
  showResolveModal.value = true
}

const submitResolution = () => {
  if (!canUpdate.value || busy.value || !showResolveModal.value) return
  const text = solution.value.trim()
  if (!text) {
    actionError.value = 'La solución oficial es obligatoria.'
    return
  }
  void execute('resolve', text)
}
</script>

<template>
  <section class="space-y-4" data-testid="engineer-ticket-actions">
    <div v-if="!isAssignedToMe" class="rounded-xl border border-default bg-muted/40 p-5 text-xs leading-relaxed text-muted" data-testid="engineer-not-assigned">
      Solo el responsable asignado puede agregar notas internas o resolver este ticket.
    </div>
    <div v-else-if="isClosed" class="rounded-xl border border-default bg-muted/40 p-5 text-xs leading-relaxed text-muted" data-testid="engineer-closed">
      Este ticket está cerrado. Las notas internas y la resolución están deshabilitadas.
    </div>

    <template v-else>
      <div v-if="actionError && !showResolveModal" role="alert" class="rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400" data-testid="engineer-action-error">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-alert-circle" class="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{{ actionError }}</span>
        </div>
      </div>

      <section class="rounded-xl border border-amber-200/50 bg-amber-50/15 p-5 shadow-sm sm:p-6 dark:border-amber-900/30 dark:bg-amber-950/10">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-highlighted">Nota interna</h2>
          <UBadge color="amber" variant="subtle" size="xs">
            <UIcon name="i-lucide-lock" class="mr-1 h-3 w-3" />
            Confidencial
          </UBadge>
        </div>
        <p class="mt-1 text-xs leading-relaxed text-muted">Este comentario es privado y solo se mostrará en la consola del equipo de soporte.</p>
        <label for="engineer-note" class="mt-4 block text-xs font-medium text-muted">Observaciones del equipo</label>
        <UTextarea
          id="engineer-note"
          v-model="note"
          :rows="4"
          class="mt-1.5 w-full"
          :disabled="busy !== null"
          placeholder="Describe el avance o la revisión técnica..."
          data-testid="engineer-note-input"
        />
        <UButton
          block
          color="amber"
          variant="soft"
          icon="i-lucide-file-text"
          class="mt-3"
          :disabled="busy !== null || !note.trim()"
          :loading="busy === 'note'"
          data-testid="engineer-add-note"
          @click="submitNote"
        >
          Agregar nota interna
        </UButton>
      </section>

      <section class="rounded-xl border border-emerald-200/50 bg-emerald-50/15 p-5 shadow-sm sm:p-6 dark:border-emerald-900/30 dark:bg-emerald-950/10">
        <h2 class="text-sm font-semibold text-highlighted">Resolución del ticket</h2>
        <p class="mt-1 text-xs leading-relaxed text-muted">Al resolver el caso, el comentario de solución será visible para el cliente en su portal.</p>
        <UButton
          block
          color="primary"
          variant="solid"
          icon="i-lucide-check-circle"
          class="mt-4"
          :disabled="busy !== null"
          data-testid="engineer-open-resolve"
          @click="openResolveModal"
        >
          Resolver ticket
        </UButton>
      </section>
    </template>

    <UModal v-model="showResolveModal" :prevent-close="busy === 'resolve'" data-testid="engineer-resolve-modal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle-2" class="h-5 w-5 text-primary-500" />
            <h2 class="text-base font-semibold text-highlighted">Confirmar resolución</h2>
          </div>
        </template>
        <p class="text-xs leading-relaxed text-muted">Registra la solución oficial. El ticket quedará resuelto y el cliente podrá consultar este comentario.</p>
        <label for="engineer-solution" class="mt-4 block text-xs font-medium text-muted">Comentario de solución</label>
        <UTextarea
          id="engineer-solution"
          v-model="solution"
          class="mt-1.5 w-full"
          :rows="4"
          :disabled="busy !== null"
          placeholder="Explica cómo se resolvió la incidencia..."
          data-testid="engineer-solution-input"
        />
        <div v-if="actionError" class="mt-3 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400" role="alert" data-testid="engineer-action-error">
          <div class="flex items-center gap-1.5 font-medium">
            <UIcon name="i-lucide-alert-circle" class="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{{ actionError }}</span>
          </div>
        </div>
        <template #footer>
          <div class="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <UButton color="gray" variant="ghost" :disabled="busy !== null" @click="showResolveModal = false">Cancelar</UButton>
            <UButton
              color="primary"
              variant="solid"
              icon="i-lucide-check-circle"
              :disabled="busy !== null || !solution.trim()"
              :loading="busy === 'resolve'"
              data-testid="engineer-confirm-resolve"
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

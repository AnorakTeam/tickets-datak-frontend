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
      icon: 'i-heroicons-check-circle',
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
    <div v-if="!isAssignedToMe" class="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600" data-testid="engineer-not-assigned">
      Solo el responsable asignado puede agregar notas internas o resolver este ticket.
    </div>
    <div v-else-if="isClosed" class="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600" data-testid="engineer-closed">
      Este ticket está cerrado. Las notas internas y la resolución están deshabilitadas.
    </div>

    <template v-else>
      <div v-if="actionError && !showResolveModal" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="engineer-action-error">{{ actionError }}</div>

      <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 class="text-base font-bold text-slate-950">Nota interna</h2>
        <p class="mt-1 text-xs leading-5 text-slate-500">Este comentario es privado y solo se mostrará en la consola del equipo de soporte.</p>
        <label for="engineer-note" class="mt-4 block text-xs font-semibold text-slate-700">Observaciones del equipo</label>
        <UTextarea id="engineer-note" v-model="note" :rows="4" class="mt-2 w-full" :disabled="busy !== null" placeholder="Describe el avance o la revisión técnica..." data-testid="engineer-note-input" />
        <UButton block color="primary" variant="soft" icon="i-heroicons-document-plus" class="mt-3" :disabled="busy !== null || !note.trim()" :loading="busy === 'note'" data-testid="engineer-add-note" @click="submitNote">
          Agregar nota interna
        </UButton>
      </section>

      <section class="rounded-xl border border-green-200 bg-green-50/50 p-5 sm:p-6">
        <h2 class="text-base font-bold text-slate-950">Resolución del ticket</h2>
        <p class="mt-2 text-xs leading-5 text-slate-600">Al resolver el caso, el comentario de solución será visible para el cliente.</p>
        <UButton block color="green" variant="soft" icon="i-heroicons-check-circle" class="mt-4" :disabled="busy !== null" data-testid="engineer-open-resolve" @click="openResolveModal">
          Resolver ticket
        </UButton>
      </section>
    </template>

    <UModal v-model="showResolveModal" :prevent-close="busy === 'resolve'" data-testid="engineer-resolve-modal">
      <UCard>
        <template #header><h2 class="text-lg font-bold text-slate-950">Confirmar resolución</h2></template>
        <p class="text-sm leading-6 text-slate-600">Registra la solución oficial. El ticket quedará resuelto y el cliente podrá consultar este comentario.</p>
        <label for="engineer-solution" class="mt-4 block text-sm font-semibold text-slate-800">Comentario de solución</label>
        <UTextarea id="engineer-solution" v-model="solution" class="mt-2 w-full" :rows="4" :disabled="busy !== null" placeholder="Explica cómo se resolvió la incidencia..." data-testid="engineer-solution-input" />
        <p v-if="actionError" class="mt-2 text-xs text-red-700" role="alert">{{ actionError }}</p>
        <template #footer>
          <div class="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <UButton color="gray" variant="ghost" :disabled="busy !== null" @click="showResolveModal = false">Cancelar</UButton>
            <UButton color="green" icon="i-heroicons-check-circle" :disabled="busy !== null || !solution.trim()" :loading="busy === 'resolve'" data-testid="engineer-confirm-resolve" @click="submitResolution">Confirmar resolución</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </section>
</template>

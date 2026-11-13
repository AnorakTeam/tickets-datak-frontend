<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  modelValue?: boolean
  radicado: string
  asunto?: string
  moduloNombre?: string
  mensaje?: string
  redirectPath?: string
  preventClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  asunto: '',
  moduloNombre: '',
  mensaje: 'Su incidencia ha sido registrada en el sistema de manera exitosa. Se ha enviado un acuse de recibo a su correo electrónico.',
  redirectPath: '/tickets',
  preventClose: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'copied', radicado: string): void
}>()

const router = useRouter()
const toast = useToast()
const isCopied = ref<boolean>(false)

const handleCopy = async () => {
  if (!props.radicado) return

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.radicado)
    }
    isCopied.value = true
    emit('copied', props.radicado)

    toast.add({
      title: 'Radicado copiado',
      description: `El número ${props.radicado} fue copiado al portapapeles.`,
      color: 'green',
      icon: 'i-heroicons-clipboard-document-check',
    })

    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch {
    toast.add({
      title: 'Error al copiar',
      description: 'No se pudo copiar automáticamente. Por favor selecciónelo manualmente.',
      color: 'amber',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}

const handleRedirect = async () => {
  emit('update:modelValue', false)
  emit('close')
  if (props.redirectPath) {
    await router.push(props.redirectPath)
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <UModal
    :model-value="modelValue"
    :prevent-close="preventClose"
    data-testid="radicado-modal"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UCard :ui="{ ring: '', divide: 'divide-y divide-slate-100' }" class="p-2 sm:p-4">
      <template #header>
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 leading-snug">
              ¡Incidencia Radicada Exitosamente!
            </h3>
            <p class="text-xs text-slate-500">
              Comprobante oficial de soporte técnico
            </p>
          </div>
        </div>
      </template>

      <!-- Modal Body -->
      <div class="space-y-4 py-2">
        <p class="text-sm text-slate-600 leading-relaxed">
          {{ mensaje }}
        </p>

        <!-- Radicado Display Box with Copy Button -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="text-center sm:text-left">
            <span class="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
              Número de Radicado
            </span>
            <span
              class="font-mono text-2xl font-black text-blue-700 tracking-wider select-all"
              data-testid="radicado-number"
            >
              {{ radicado }}
            </span>
          </div>

          <UButton
            size="sm"
            :color="isCopied ? 'green' : 'primary'"
            :variant="isCopied ? 'solid' : 'soft'"
            :icon="isCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
            data-testid="copy-radicado-btn"
            class="shrink-0 font-medium"
            @click="handleCopy"
          >
            {{ isCopied ? '¡Copiado!' : 'Copiar Radicado' }}
          </UButton>
        </div>

        <!-- Ticket Summary Metadata -->
        <div v-if="moduloNombre || asunto" class="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs space-y-1.5 text-slate-700">
          <div v-if="moduloNombre" class="flex items-center justify-between">
            <span class="text-slate-500 font-medium">Módulo afectado:</span>
            <span class="font-semibold text-slate-800">{{ moduloNombre }}</span>
          </div>
          <div v-if="asunto" class="flex items-start justify-between gap-2">
            <span class="text-slate-500 font-medium shrink-0">Asunto:</span>
            <span class="font-medium text-slate-800 text-right truncate max-w-[240px]">{{ asunto }}</span>
          </div>
        </div>

        <div class="flex items-center space-x-2 text-xs text-slate-500 pt-1">
          <UIcon name="i-heroicons-envelope" class="w-4 h-4 text-slate-400 shrink-0" />
          <span>Guarde este número para consultar el avance o comunicarse con el equipo de soporte.</span>
        </div>
      </div>

      <!-- Modal Footer -->
      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-1">
          <UButton
            variant="ghost"
            color="gray"
            size="sm"
            class="w-full sm:w-auto"
            data-testid="modal-close-btn"
            @click="handleClose"
          >
            Cerrar
          </UButton>
          <UButton
            color="primary"
            size="sm"
            icon="i-heroicons-queue-list"
            class="w-full sm:w-auto font-semibold"
            data-testid="modal-redirect-btn"
            @click="handleRedirect"
          >
            Consultar Mis Tickets
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

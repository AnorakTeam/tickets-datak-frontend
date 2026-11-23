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
  (e: 'redirect', path: string): void
  (e: 'copied', radicado: string): void
}>()

const router = useRouter()
const toast = useToast()
const isCopied = ref<boolean>(false)

const handleCopy = async () => {
  if (!props.radicado) return

  const hasClipboardApi = typeof navigator !== 'undefined' && Boolean(navigator?.clipboard?.writeText)

  if (!hasClipboardApi) {
    toast.add({
      title: 'Portapapeles no disponible',
      description: 'Su navegador o entorno actual no soporta copiado automático. Por favor seleccione y copie el radicado manualmente.',
      color: 'amber',
      icon: 'i-lucide-alert-triangle',
    })
    return
  }

  try {
    await navigator.clipboard.writeText(props.radicado)
    isCopied.value = true
    emit('copied', props.radicado)

    toast.add({
      title: 'Radicado copiado',
      description: `El número ${props.radicado} fue copiado al portapapeles.`,
      color: 'green',
      icon: 'i-lucide-check-circle-2',
    })

    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch {
    toast.add({
      title: 'Error al copiar',
      description: 'No se pudo copiar automáticamente. Por favor selecciónelo manualmente.',
      color: 'amber',
      icon: 'i-lucide-alert-triangle',
    })
  }
}

// Unified close handler for "Cerrar" button, backdrop click, and Escape key
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const onModalVisibilityChange = (visible: boolean) => {
  if (!visible) {
    handleClose()
  } else {
    emit('update:modelValue', true)
  }
}

// Single responsibility for navigation: only this handler triggers navigation to redirectPath
const handleRedirect = async () => {
  emit('update:modelValue', false)
  emit('redirect', props.redirectPath)
  if (props.redirectPath) {
    await router.push(props.redirectPath)
  }
}
</script>

<template>
  <UModal
    :model-value="modelValue"
    :prevent-close="preventClose"
    data-testid="radicado-modal"
    @update:model-value="onModalVisibilityChange"
  >
    <UCard :ui="{ ring: '', divide: 'divide-y divide-default' }" class="p-2 sm:p-4 bg-default">
      <template #header>
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-check-circle-2" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-highlighted leading-snug">
              ¡Incidencia Radicada Exitosamente!
            </h3>
            <p class="text-xs text-muted">
              Comprobante oficial de soporte técnico
            </p>
          </div>
        </div>
      </template>

      <!-- Modal Body -->
      <div class="space-y-4 py-2">
        <p class="text-sm text-default leading-relaxed">
          {{ mensaje }}
        </p>

        <!-- Radicado Display Box with Copy Button -->
        <div class="bg-muted border border-default rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="text-center sm:text-left">
            <span class="block text-xs uppercase tracking-wider text-muted font-semibold mb-0.5">
              Número de Radicado
            </span>
            <span
              class="font-mono text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-wider tabular-nums select-all"
              data-testid="radicado-number"
            >
              {{ radicado }}
            </span>
          </div>

          <UButton
            size="sm"
            :color="isCopied ? 'emerald' : 'primary'"
            :variant="isCopied ? 'solid' : 'soft'"
            :icon="isCopied ? 'i-lucide-check' : 'i-lucide-copy'"
            data-testid="copy-radicado-btn"
            class="shrink-0 font-medium"
            @click="handleCopy"
          >
            {{ isCopied ? '¡Copiado!' : 'Copiar Radicado' }}
          </UButton>
        </div>

        <!-- Ticket Summary Metadata -->
        <div v-if="moduloNombre || asunto" class="bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 text-xs space-y-1.5 text-default">
          <div v-if="moduloNombre" class="flex items-center justify-between">
            <span class="text-muted font-medium">Módulo afectado:</span>
            <span class="font-semibold text-highlighted">{{ moduloNombre }}</span>
          </div>
          <div v-if="asunto" class="flex items-start justify-between gap-2">
            <span class="text-muted font-medium shrink-0">Asunto:</span>
            <span class="font-medium text-highlighted text-right truncate max-w-[240px]">{{ asunto }}</span>
          </div>
        </div>

        <div class="flex items-center space-x-2 text-xs text-muted pt-1">
          <UIcon name="i-lucide-mail" class="w-4 h-4 text-muted shrink-0" />
          <span>Guarde este número para consultar el avance o comunicarse con el equipo de soporte.</span>
        </div>
      </div>

      <!-- Modal Footer -->
      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-1">
          <UButton
            variant="outline"
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
            variant="solid"
            size="sm"
            icon="i-lucide-list"
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

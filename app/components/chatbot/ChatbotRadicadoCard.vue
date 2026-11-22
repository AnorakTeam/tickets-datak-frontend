<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  radicado: string
  mensaje?: string
}

const props = withDefaults(defineProps<Props>(), {
  mensaje: 'Tu ticket ha sido registrado en el sistema con total trazabilidad.',
})

const emit = defineEmits<{
  (e: 'copied', radicado: string): void
}>()

let toast: any = null
try {
  if (typeof useToast === 'function') {
    toast = useToast()
  }
} catch {
  // Ignored in test environment
}
const isCopied = ref<boolean>(false)

const handleCopy = async () => {
  if (!props.radicado) return

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.radicado)
    }
    isCopied.value = true
    emit('copied', props.radicado)

    if (toast?.add) {
      toast.add({
        title: 'Radicado copiado',
        description: `El número ${props.radicado} fue copiado al portapapeles.`,
        color: 'green',
        icon: 'i-heroicons-clipboard-document-check',
      })
    }

    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch {
    toast.add({
      title: 'Error al copiar',
      description: 'Por favor selecciona el número manualmente.',
      color: 'amber',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}
</script>

<template>
  <div class="mt-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-2 text-slate-800" data-testid="chatbot-radicado-card">
    <div class="flex items-center space-x-1.5 font-bold text-emerald-900 border-b border-emerald-200 pb-1.5">
      <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-emerald-600 shrink-0" />
      <span>Ticket Radicado Exitosamente</span>
    </div>

    <p class="text-xs text-slate-600">
      {{ mensaje }}
    </p>

    <!-- Radicado Display with Copy Button -->
    <div class="bg-white border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
      <div>
        <span class="block text-[10px] uppercase font-semibold text-slate-400">Radicado Oficial</span>
        <span class="font-mono text-base font-extrabold text-blue-700 tracking-wider select-all" data-testid="chatbot-radicado-number">
          {{ radicado }}
        </span>
      </div>

      <UButton
        size="2xs"
        :color="isCopied ? 'green' : 'primary'"
        :variant="isCopied ? 'solid' : 'soft'"
        :icon="isCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
        class="font-medium shrink-0"
        data-testid="chatbot-copy-radicado-btn"
        @click="handleCopy"
      >
        {{ isCopied ? '¡Copiado!' : 'Copiar' }}
      </UButton>
    </div>

    <!-- Navigation Link -->
    <div class="pt-1 flex justify-end">
      <NuxtLink
        to="/tickets"
        class="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <span>Ver en Mis Tickets</span>
        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>
  </div>
</template>

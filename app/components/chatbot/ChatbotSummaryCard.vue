<script setup lang="ts">
interface Props {
  campos?: Record<string, any>
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  campos: () => ({}),
  disabled: false,
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div class="mt-2.5 bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs space-y-2.5 text-slate-800" data-testid="chatbot-summary-card">
    <div class="flex items-center space-x-1.5 font-bold text-blue-900 border-b border-blue-200 pb-1.5">
      <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4 text-blue-600 shrink-0" />
      <span>Resumen de la Incidencia a Radicar</span>
    </div>

    <div class="space-y-1.5 text-xs">
      <div v-if="campos.modulo || campos.modulo_nombre" class="flex justify-between items-start gap-2">
        <span class="text-slate-500 font-medium shrink-0">Módulo:</span>
        <span class="font-semibold text-slate-800 text-right">{{ campos.modulo_nombre || campos.modulo }}</span>
      </div>

      <div v-if="campos.pantalla || campos.pestana_o_documento" class="flex justify-between items-start gap-2">
        <span class="text-slate-500 font-medium shrink-0">Pantalla:</span>
        <span class="font-medium text-slate-800 text-right truncate max-w-[180px]">{{ campos.pantalla || campos.pestana_o_documento }}</span>
      </div>

      <div v-if="campos.asunto" class="flex justify-between items-start gap-2">
        <span class="text-slate-500 font-medium shrink-0">Asunto:</span>
        <span class="font-medium text-slate-800 text-right truncate max-w-[180px]">{{ campos.asunto }}</span>
      </div>

      <div v-if="campos.descripcion" class="pt-1 border-t border-blue-100">
        <span class="text-slate-500 font-medium block mb-0.5">Descripción:</span>
        <p class="text-slate-700 italic line-clamp-3 bg-white/60 p-1.5 rounded">
          "{{ campos.descripcion }}"
        </p>
      </div>
    </div>

    <!-- Interactive Confirmation Actions -->
    <div class="pt-1.5 border-t border-blue-200 flex items-center justify-end gap-2">
      <UButton
        size="2xs"
        variant="ghost"
        color="gray"
        :disabled="disabled"
        data-testid="summary-cancel-btn"
        @click="emit('cancel')"
      >
        Corregir
      </UButton>
      <UButton
        size="2xs"
        color="primary"
        icon="i-heroicons-check"
        :disabled="disabled"
        class="font-semibold"
        data-testid="summary-confirm-btn"
        @click="emit('confirm')"
      >
        Confirmar y Radicar
      </UButton>
    </div>
  </div>
</template>

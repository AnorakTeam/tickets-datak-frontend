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
  <div class="mt-2.5 bg-default border border-primary-200 dark:border-primary-800 rounded-xl p-3 text-xs space-y-2.5 text-default shadow-xs" data-testid="chatbot-summary-card">
    <div class="flex items-center space-x-1.5 font-semibold text-highlighted border-b border-default pb-1.5">
      <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-primary-500 shrink-0" />
      <span>Resumen de la Incidencia a Radicar</span>
    </div>

    <div class="space-y-1.5 text-xs">
      <div v-if="campos.modulo || campos.modulo_nombre" class="flex justify-between items-start gap-2">
        <span class="text-muted font-medium shrink-0">Módulo:</span>
        <span class="font-semibold text-highlighted text-right">{{ campos.modulo_nombre || campos.modulo }}</span>
      </div>

      <div v-if="campos.pantalla || campos.pestana_o_documento" class="flex justify-between items-start gap-2">
        <span class="text-muted font-medium shrink-0">Pantalla:</span>
        <span class="font-medium text-highlighted text-right truncate max-w-[180px]">{{ campos.pantalla || campos.pestana_o_documento }}</span>
      </div>

      <div v-if="campos.asunto" class="flex justify-between items-start gap-2">
        <span class="text-muted font-medium shrink-0">Asunto:</span>
        <span class="font-medium text-highlighted text-right truncate max-w-[180px]">{{ campos.asunto }}</span>
      </div>

      <div v-if="campos.descripcion" class="pt-1 border-t border-default">
        <span class="text-muted font-medium block mb-0.5">Descripción:</span>
        <p class="text-default italic line-clamp-3 bg-muted p-2 rounded-lg border border-default">
          "{{ campos.descripcion }}"
        </p>
      </div>
    </div>

    <!-- Interactive Confirmation Actions -->
    <div class="pt-1.5 border-t border-default flex items-center justify-end gap-2">
      <UButton
        size="2xs"
        variant="outline"
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
        variant="solid"
        icon="i-lucide-check"
        :disabled="disabled"
        class="font-medium"
        data-testid="summary-confirm-btn"
        @click="emit('confirm')"
      >
        Confirmar y Radicar
      </UButton>
    </div>
  </div>
</template>

<template>
  <div class="grid grid-cols-12 gap-2 my-4">
    <!-- Buscador: 4 columnas en desktop (lg:col-span-4), 5 en md, 12 en móvil -->
    <div class="col-span-12 md:col-span-5 lg:col-span-4">
      <UInput
        v-model="search"
        :placeholder="placeholder"
        :autofocus="autofocus"
        icon="i-lucide-search"
        :ui="{ base: 'h-9 max-md:h-10' }"
      />
    </div>

    <!-- Acciones: alineadas a la derecha -->
    <div
      v-if="$slots.actions"
      class="col-span-12 flex flex-row flex-wrap items-center gap-2 md:col-span-7 lg:col-span-8 md:justify-end [&_button:not([aria-label])]:h-9 max-md:[&_button:not([aria-label])]:h-10"
    >
      <slot name="actions" />
    </div>

    <!-- Fila de filtros -->
    <div v-if="$slots.filters" class="col-span-12">
      <slot name="filters" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder?: string
    autofocus?: boolean
  }>(),
  {
    placeholder: 'Buscar por asunto, módulo o radicado...',
    autofocus: false,
  },
)

const search = defineModel<string>('search', { default: '' })
</script>

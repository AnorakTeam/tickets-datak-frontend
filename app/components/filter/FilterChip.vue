<template>
  <button
    type="button"
    role="tab"
    :aria-selected="active"
    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer select-none"
    :class="active
      ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-950/40 dark:border-primary-800 dark:text-primary-300 font-semibold shadow-2xs'
      : 'bg-default border-default text-muted hover:border-accented hover:text-highlighted'"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span>{{ label }}</span>
    <span v-if="display" class="font-normal text-default dark:text-dimmed">: {{ display }}</span>
    <UIcon
      v-if="active && clearable"
      name="i-lucide-x"
      class="h-3 w-3 ml-0.5 text-primary-600 hover:text-primary-900 transition-colors"
      @click.stop="$emit('clear')"
    />
    <UIcon
      v-else-if="chevron"
      name="i-lucide-chevron-down"
      class="h-3 w-3 ml-0.5 text-dimmed"
    />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    display?: string | null
    active?: boolean
    clearable?: boolean
    chevron?: boolean
    disabled?: boolean
  }>(),
  {
    display: null,
    active: false,
    clearable: false,
    chevron: false,
    disabled: false,
  },
)

defineEmits<{
  click: []
  clear: []
}>()
</script>

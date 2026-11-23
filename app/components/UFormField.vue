<template>
  <UFormGroup
    :label="label"
    :description="description"
    :help="help"
    :error="error"
    :hint="hint"
    :required="required"
    :size="size"
    :ui="ui"
    v-bind="$attrs"
  >
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
    <template v-if="$slots.help" #help>
      <slot name="help" />
    </template>
    <template v-if="$slots.hint" #hint>
      <slot name="hint" />
    </template>
    <slot />
  </UFormGroup>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  description?: string
  help?: string
  error?: string | boolean
  hint?: string
  required?: boolean
  size?: string
  ui?: Record<string, any>
}>()
</script>

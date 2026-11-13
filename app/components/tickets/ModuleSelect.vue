<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { moduleService, type ContractedModule } from '~/services/moduleService'

interface Props {
  modelValue?: number | null
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  help?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: 'Módulo del sistema',
  placeholder: 'Seleccione el módulo afectado...',
  searchPlaceholder: 'Buscar módulo...',
  disabled: false,
  required: false,
  error: '',
  help: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'change', module: ContractedModule | null): void
  (e: 'loaded', modules: ContractedModule[]): void
  (e: 'empty', isEmpty: boolean): void
}>()

const modules = ref<ContractedModule[]>([])
const isLoading = ref<boolean>(true)
const fetchError = ref<string | null>(null)

const selectedModuleId = computed<number | undefined>({
  get: () => (props.modelValue !== null && props.modelValue !== undefined ? props.modelValue : undefined),
  set: (val: number | undefined) => {
    const finalVal = val !== undefined ? val : null
    emit('update:modelValue', finalVal)
    const selected = modules.value.find((m) => m.id === finalVal) || null
    emit('change', selected)
  },
})

const hasModules = computed(() => modules.value.length > 0)
const isEmpty = computed(() => !isLoading.value && !fetchError.value && modules.value.length === 0)

const fetchModules = async () => {
  isLoading.value = true
  fetchError.value = null

  try {
    const data = await moduleService.getContractedModules()
    modules.value = Array.isArray(data) ? data : []
    emit('loaded', modules.value)
    emit('empty', modules.value.length === 0)
  } catch (err: any) {
    fetchError.value = err?.message || 'Error al cargar los módulos contratados. Por favor intente nuevamente.'
    modules.value = []
    emit('empty', true)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchModules()
})

defineExpose({
  modules,
  isLoading,
  fetchError,
  hasModules,
  isEmpty,
  fetchModules,
})
</script>

<template>
  <UFormGroup
    :label="label"
    :required="required"
    :error="error"
    :help="help"
    class="w-full"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-2" data-testid="module-select-loading">
      <div class="flex items-center space-x-2 text-xs text-slate-500">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-blue-600" />
        <span>Cargando módulos contratados...</span>
      </div>
      <USkeleton class="h-10 w-full rounded-lg" />
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError" class="space-y-2" data-testid="module-select-error">
      <UAlert
        color="red"
        variant="soft"
        icon="i-heroicons-exclamation-circle"
        title="Error al cargar módulos"
        :description="fetchError"
      />
      <UButton
        size="xs"
        color="gray"
        variant="outline"
        icon="i-heroicons-arrow-path"
        @click="fetchModules"
      >
        Reintentar
      </UButton>
    </div>

    <!-- Empty State (No contracted modules) -->
    <div v-else-if="isEmpty" class="space-y-2" data-testid="module-select-empty">
      <UAlert
        color="amber"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="Sin módulos contratados"
        description="Su empresa no cuenta actualmente con módulos de software activos disponibles para reportar incidentes. Por favor contacte al administrador de su cuenta."
      />
    </div>

    <!-- Ready / Populated State -->
    <div v-else data-testid="module-select-ready">
      <USelectMenu
        v-model="selectedModuleId"
        :options="modules"
        value-attribute="id"
        option-attribute="nombre"
        searchable
        :searchable-placeholder="searchPlaceholder"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full"
        size="md"
      >
        <template #option="{ option }">
          <div class="flex items-center justify-between w-full py-0.5">
            <span class="text-sm font-medium text-slate-800">{{ option.nombre }}</span>
            <UBadge size="xs" color="gray" variant="subtle" class="font-mono text-xs ml-2">
              {{ option.codigo }}
            </UBadge>
          </div>
        </template>
      </USelectMenu>
    </div>
  </UFormGroup>
</template>

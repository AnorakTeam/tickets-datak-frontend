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
  (e: 'error', error: string | null): void
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
    emit('error', null)
    emit('empty', modules.value.length === 0)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cargar los módulos contratados. Por favor intente nuevamente.'
    fetchError.value = message
    modules.value = []
    // Do NOT emit empty: true when load fails due to network or connection error!
    emit('empty', false)
    emit('error', message)
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
      <div class="flex items-center space-x-2 text-xs text-muted">
        <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin text-primary-500" />
        <span>Cargando módulos contratados...</span>
      </div>
      <USkeleton class="h-9 w-full rounded-lg" />
    </div>

    <!-- Error State (Network or server connection failure) -->
    <div v-else-if="fetchError" class="space-y-2" data-testid="module-select-error">
      <UAlert
        color="red"
        variant="soft"
        icon="i-lucide-alert-circle"
        title="Error al cargar módulos"
        :description="fetchError"
      />
      <UButton
        size="xs"
        color="gray"
        variant="outline"
        icon="i-lucide-refresh-cw"
        @click="fetchModules"
      >
        Reintentar carga
      </UButton>
    </div>

    <!-- Empty State (Successful load, but company has no modules contracted) -->
    <div v-else-if="isEmpty" class="space-y-2" data-testid="module-select-empty">
      <UAlert
        color="amber"
        variant="soft"
        icon="i-lucide-alert-triangle"
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
        size="sm"
        :ui="{ base: 'h-9 focus:ring-2 focus:ring-primary-100 focus:border-primary-400' }"
      >
        <template #option="{ option }">
          <div class="flex items-center justify-between w-full py-0.5">
            <span class="text-sm font-medium text-highlighted">{{ option.nombre }}</span>
            <UBadge size="xs" color="gray" variant="subtle" class="font-mono text-xs ml-2 tabular-nums">
              {{ option.codigo }}
            </UBadge>
          </div>
        </template>
      </USelectMenu>
    </div>
  </UFormGroup>
</template>

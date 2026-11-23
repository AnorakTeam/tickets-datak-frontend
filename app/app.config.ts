export default defineAppConfig({
  ui: {
    primary: 'purple',
    gray: 'slate',
    colors: {
      primary: 'purple',
      neutral: 'slate',
      success: 'emerald',
      warning: 'amber',
      error: 'red',
      info: 'sky',
    },
    notifications: {
      position: 'top-0 bottom-auto',
    },
    badge: {
      default: {
        size: 'xs',
        variant: 'subtle',
      },
      size: {
        xs: 'text-xs px-2 py-0.5 gap-1 font-medium rounded-md',
        sm: 'text-xs px-2.5 py-1 gap-1.5 font-medium rounded-md',
      },
    },
    table: {
      th: {
        base: 'text-left rtl:text-right',
        padding: 'py-2.5 px-3',
        color: 'text-slate-500 dark:text-slate-400',
        font: 'font-semibold text-[11px] uppercase tracking-wide',
      },
      td: {
        base: 'whitespace-nowrap',
        padding: 'py-2.5 px-3',
        color: 'text-slate-700 dark:text-slate-200',
        size: 'text-xs',
      },
      tr: {
        base: 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150',
      },
    },
    card: {
      base: 'overflow-hidden',
      background: 'bg-white dark:bg-slate-900',
      divide: 'divide-y divide-slate-200 dark:divide-slate-800',
      ring: 'ring-1 ring-slate-200 dark:ring-slate-800',
      rounded: 'rounded-xl',
      shadow: 'shadow-sm',
      header: {
        padding: 'px-5 py-4 sm:px-6',
      },
      body: {
        padding: 'p-5 sm:p-6',
      },
      footer: {
        padding: 'px-5 py-3 sm:px-6 bg-slate-50/50 dark:bg-slate-900/50',
      },
    },
    button: {
      rounded: 'rounded-lg',
      default: {
        size: 'sm',
        loadingIcon: 'i-lucide-loader-circle',
      },
    },
    input: {
      rounded: 'rounded-lg',
      default: {
        size: 'sm',
        color: 'white',
      },
    },
  },
})

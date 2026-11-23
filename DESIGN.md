---
name: Datak Tickets Design System
description: Estándar visual oficial y tokens de diseño extraídos directamente de Datak ERP (Nuxt 4 + Nuxt UI + TailwindCSS)
colors:
  primary: "#a855f7"
  primary-hover: "#9333ea"
  primary-active: "#7e22ce"
  primary-soft: "#faf5ff"
  primary-soft-border: "#d8b4fe"
  primary-soft-text: "#7e22ce"
  brand-accent: "#f59e0b"
  brand-accent-end: "#d97706"
  neutral-page: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-muted: "#f1f5f9"
  neutral-border: "#e2e8f0"
  neutral-border-accented: "#cbd5e1"
  neutral-text-highlighted: "#0f172a"
  neutral-text-default: "#334155"
  neutral-text-muted: "#64748b"
  neutral-text-dimmed: "#94a3b8"
  semantic-success: "#10b981"
  semantic-warning: "#f59e0b"
  semantic-error: "#ef4444"
  semantic-info: "#0ea5e9"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2rem"
  h2:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.125rem"
  caption:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
  micro:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: "0.875rem"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-default:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
---

## Overview

Este sistema de diseño define el estándar visual oficial de Datak ERP para el portal de clientes y la mesa de ayuda de tickets. Construido sobre Nuxt 4, Nuxt UI y TailwindCSS, prioriza la claridad operativa, la jerarquía de señales rigurosa y la consistencia sin adornos superficiales.

**La Regla de la Señal Única (The Single Signal Rule).** El color primario (morado `#a855f7`) y la negrilla son recursos escasos que comunican jerarquía activa: si aparecen en todas partes, dejan de tener significado. El morado se reserva de forma estricta para:
1. La acción principal de la pantalla (`UButton color="primary" variant="solid"`), con un máximo de **uno** por vista.
2. Elementos activos o seleccionados (ítem de menú actual, pestaña activa, filtro aplicado, checkbox marcado).
3. Links de texto y estados de foco interactivo (`focus-visible`).

**La Franja de Marca Datak.** Una línea superior decorativa de 2px de altura con degradado ámbar (`linear-gradient(to right, #f59e0b, #d97706)`) corona el topbar de la aplicación, manteniendo la identidad distintiva del ERP Datak.

---

## Colors

### Primary — Morado Datak
* `{colors.primary}` (`#a855f7` / `purple-500`): Botón primario sólido, links activos, checkboxes seleccionados.
* `{colors.primary-hover}` (`#9333ea` / `purple-600`): Hover de la acción principal y breadcrumb activo.
* `{colors.primary-active}` (`#7e22ce` / `purple-700`): Estado presionado / active.
* `{colors.primary-soft}` (`#faf5ff` / `purple-50`): Fondo sutil para chips de filtros activos y pestañas activas.
* `{colors.primary-soft-border}` (`#d8b4fe` / `purple-300`): Bordes de chips y elementos seleccionados.

### Neutros — Escala Slate
* `{colors.neutral-page}` (`#f8fafc` / `slate-50`): Fondo general de página (`bg-page`), que en modo oscuro transmuta a `slate-950`.
* `{colors.neutral-surface}` (`#ffffff` / `white`): Fondo de tarjetas, modales e inputs (`bg-default`), en modo oscuro `slate-900`.
* `{colors.neutral-muted}` (`#f1f5f9` / `slate-100`): Hover de filas de tabla y encabezados de tabla (`bg-muted`).
* `{colors.neutral-border}` (`#e2e8f0` / `slate-200`): Bordes estructurales de tarjetas, inputs y divisores (`border-default`).
* `{colors.neutral-text-highlighted}` (`#0f172a` / `slate-900`): Títulos, encabezados y texto principal (`text-highlighted`).
* `{colors.neutral-text-default}` (`#334155` / `slate-700`): Texto de lectura y cuerpo general (`text-default`).
* `{colors.neutral-text-muted}` (`#64748b` / `slate-500`): Etiquetas de campos, descripciones secundarias y captions (`text-muted`).
* `{colors.neutral-text-dimmed}` (`#94a3b8` / `slate-400`): Placeholders y elementos deshabilitados (`text-dimmed`).

### Semánticos Fijos
Fuera del morado y la escala slate, únicamente se permiten los siguientes colores semánticos con significados rigurosos:
* **`success` (`emerald-500` `#10b981`):** Casos terminados internamente sin acciones pendientes (p. ej. `Resuelto`).
* **`warning` (`amber-500` `#f59e0b`):** Casos que requieren acción humana o están en trámite (p. ej. `Abierto`, `En gestión`).
* **`error` (`red-500` `#ef4444`):** Rechazos, desestimaciones o anulaciones (p. ej. `No procedente`, acciones destructivas).
* **`info` (`sky-500` `#0ea5e9`):** Reservado para transmisiones y entidades externas (DIAN, pasarelas).
* **`neutral` (`slate-500` `#64748b`):** Estados neutros, borradores o en espera de sincronización.

**La Regla de Declaración Única de Tema (Single Theme Declaration Rule).** Nunca escribir pares `bg-white dark:bg-slate-900` ni clases de tonos duros. Toda superficie, texto y borde debe usar las variables semánticas de Nuxt UI y Datak (`bg-page`, `bg-default`, `bg-muted`, `text-highlighted`, `text-default`, `text-muted`, `border-default`).

---

## Typography

* **Fuente Principal:** Poppins (`sans-serif`), cargada en pesos 400 (Regular), 500 (Medium), 600 (SemiBold) y 700 (Bold).
* **Fuente Monoespaciada:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.
* **Escala y Roles:**
  * **H1 Principal:** 28px / leading 32px / `font-bold` (`text-[28px] font-bold leading-tight text-highlighted`).
  * **H2 de Tarjetas:** 18px / leading 24px / `font-semibold` (`text-lg font-semibold text-highlighted`).
  * **Cuerpo Destacado:** 14px / leading 20px / `font-medium` (`text-sm font-medium text-default`).
  * **Cuerpo General / Tablas:** 13px / leading 18px / `font-normal` (`text-[13px] text-default`).
  * **Captions y Subtítulos:** 12px / leading 16px / `font-medium` (`text-xs font-medium text-muted`).
  * **Micro / Encabezados `<th>`:** 11px / leading 14px / `font-semibold uppercase tracking-wide` (`text-[11px] font-semibold uppercase tracking-wide text-muted`).
  * **KPI Numérico:** 26px / leading 32px / `font-bold tabular-nums` (`text-[26px] font-bold tabular-nums text-highlighted`).

**La Regla de los Dos Pesos (The Two-Weight Rule).** Dentro de una pantalla solo conviven dos pesos: normal (400) y semibold (600). La negrilla `font-bold` (700) queda restringida exclusivamente al H1 de página y a grandes cifras de KPI. Las etiquetas de datos («Radicado:», «Módulo:») se presentan siempre en `text-muted` sin negrilla. Todos los radicados, fechas y cifras usan `tabular-nums` para evitar parpadeos visuales.

---

## Layout

* **Topbar Fijo:** 56px de altura (`h-14`), fondo `bg-default`, borde inferior `border-b border-default` y franja superior de acento ámbar de 2px. Contiene el breadcrumb neutro de ubicación, buscador rápido, notificaciones y menú de usuario.
* **Espaciado de Página:** `p-4 md:p-6 space-y-5`.
* **Grilla de Barra de Listado (12 columnas):**
  * Buscador: 4 columnas en desktop (`lg:col-span-4`), 5 en tablet (`md:col-span-5`), 12 en móvil.
  * Acciones: 8 columnas en desktop (`lg:col-span-8`), alineadas a la derecha con el botón primario al extremo final.
  * Filtros: 12 columnas debajo del buscador y las acciones.
* **Contenedores de Configuración y Formularios:** Columna única centrada de `max-w-2xl` o `max-w-4xl` con espaciado vertical `space-y-6`.

---

## Elevation & Depth

* **Cards y Paneles:** Sombra mínima de 1px (`shadow-sm`: `0 1px 2px rgba(15, 23, 42, 0.04)`), apoyada en un borde fino `border border-default`.
* **Dropdowns, Modales y Popovers:** Sombra profunda de elevación (`shadow-xl`: `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`).
* **Hover:** Cambio de borde a `border-accented` o `hover:bg-muted`, sin desplazamientos ni elevaciones artificiales.

---

## Shapes

* **Tarjetas y Modales:** Esquinas redondeadas de 12px (`rounded-xl`).
* **Botones, Inputs y Selects:** Esquinas redondeadas de 8px (`rounded-lg`).
* **Badges:** Esquinas redondeadas de 6px (`rounded-md`).
* **Avatares y Chips:** Esquinas redondeadas completas (`rounded-full`).

---

## Components

### Botones (`UButton`)
* **Solid Primary:** Relleno morado `{colors.primary}`, texto blanco, radio 8px (`rounded-lg`), altura 36px (`h-9`), padding horizontal 14px (`px-3.5`).
* **Outline Neutral:** Borde `border-default`, fondo transparente o `bg-default`, texto `text-default`, hover `hover:bg-muted`. Utilizado para acciones secundarias.
* **Ghost Neutral:** Sin borde ni fondo base, texto `text-muted`, hover `hover:bg-muted text-highlighted`. Utilizado para acciones de fila e iconos.
* **Ghost Red:** Texto `text-muted`, hover `hover:bg-red-50 hover:text-red-600`. Para desestimaciones o eliminaciones.

### Badges (`UBadge`)
* Variante `variant="subtle"` (soft) con radio 6px (`rounded-md`) y tamaño mínimo 12px (`text-xs`).
* **Sin emojis.** Siempre acompañados de su icono Lucide semántico (`i-lucide-*`).

### Campos de Entrada (`UInput`, `USelectMenu`, `UTextarea`)
* Altura 36px (`h-9`), texto 13px (`text-[13px]`), borde `border-default`, fondo `bg-default`, radio 8px (`rounded-lg`).
* Foco con halo morado tenue: `focus:border-primary-400 focus:ring-2 focus:ring-primary-100`.

### Tablas (`UTable`)
* Encabezados `<th>`: Fondo `bg-muted`, texto 11px mayúscula `font-semibold text-muted tracking-wide`.
* Filas `<tr>`: Fondo `bg-default`, hover suave `hover:bg-muted`.
* Celdas `<td>`: Padding vertical compacto (`py-2.5`), texto 13px.

### Filtros (`FilterChip`)
* Disparador con etiqueta en singular («Estado», «Empresa», «Prioridad») y chevron hacia abajo.
* Estado activo con tinte morado suave (`bg-primary-50 text-primary-700 border-primary-300`) y botón `✕` para limpiar el filtro individual.
* Botón global «Limpiar» visible cuando hay uno o más filtros activos.

---

## Do's and Don'ts

### Do's
* Utilizar `UButton color="primary" variant="solid"` para un **único** botón principal por vista.
* Usar siempre clases semánticas (`bg-default`, `bg-page`, `text-highlighted`, `text-muted`, `border-default`).
* Especificar `tabular-nums` en cualquier celda o texto con números, fechas o radicados.
* Alinear pares etiqueta-valor con `text-muted` para la etiqueta y `text-default` o `text-highlighted` para el valor.
* Emplear iconos exclusivamente de la librería Lucide (`i-lucide-*`).

### Don'ts
* **Prohibido el uso de emojis** en badges de estado, botones, modales o títulos.
* **Prohibido duplicar acciones primarias:** nunca dos botones morados sólidos en el mismo encabezado o sección.
* **Prohibido hardcodear colores de Tailwind** como `bg-white`, `text-black`, `text-slate-900`, `border-gray-200` o pares `dark:`.
* **Prohibido el texto en gradiente** o sombras duras desalineadas (`4px 4px 0`).
* **Prohibido `font-bold` en etiquetas de formulario** o encabezados repetitivos de lista.
* **Prohibido agregar colores inventados** para estados; ceñirse estrictamente a los 5 roles semánticos definidos.

# OP-211 — Lógica de cálculo de semanas

> Canvas ID: OP-461 | Historia padre: OP-210

## Contexto

`src/lib/dates.ts` ya contiene las utilidades base de fechas del sistema:
- `normalizeDate(input)` — normaliza a UTC midnight
- `today()` — fecha de hoy normalizada
- `getWeekRange(date)` — devuelve `{ start: Monday, end: Friday }` de la semana que contiene la fecha dada
- `isSameDay(a, b)` — comparación de días
- `toDateString(date)` — formatea como `YYYY-MM-DD`

No existe todavía ninguna utilidad que calcule semana actual + semana siguiente, ni que determine el día laborable por defecto. Esta subtarea crea esa capa sin duplicar nada de `dates.ts`.

La ubicación correcta es `src/lib/week-selector.ts` (lógica de negocio del selector, no componente de UI).

## Objetivo

Crear `src/lib/week-selector.ts` con las funciones que la UI del selector necesita:

1. Calcular la semana actual y la semana siguiente como arrays de días laborables (L–V)
2. Determinar el día laborable por defecto (hoy si es L–V, si no el próximo lunes)
3. Exponer un tipo `WorkWeek` que represente una semana con sus días y metadatos de display

## Restricciones

- Usar exclusivamente las utilidades de `src/lib/dates.ts` — no reimplementar lógica de fechas
- No introducir dependencias externas de calendario
- No mezclar lógica de UI en este módulo (no debe importar nada de React)
- Todas las fechas deben estar normalizadas (UTC midnight) usando `normalizeDate`
- Funciones puras y testeables de forma aislada

## Casos límite

- Hoy es sábado o domingo → día por defecto es el lunes siguiente (semana siguiente)
- Hoy es viernes → día por defecto es el viernes; la semana siguiente empieza el lunes próximo
- Semanas que cruzan cambio de mes (e.g., lunes 28 → viernes 1 del siguiente mes)
- Semanas que cruzan cambio de año (e.g., lunes 30 dic → viernes 3 enero)
- La "semana siguiente" desde un viernes debe ser la semana natural siguiente (no +7 días del viernes)

## API pública esperada

```typescript
/** Representa un día laborable dentro de una semana */
export interface WorkDay {
  date: Date;           // Date normalizada (UTC midnight)
  dateString: string;   // "YYYY-MM-DD"
  label: string;        // "Lun", "Mar", "Mié", "Jue", "Vie"
  dayNumber: number;    // 1–31 (getUTCDate)
}

/** Representa una semana laboral (L–V) con metadatos de display */
export interface WorkWeek {
  days: WorkDay[];       // Exactamente 5 elementos (L–V)
  label: string;         // e.g., "5 – 9 may" o "30 dic – 3 ene"
  weekOffset: number;    // 0 = semana actual, 1 = semana siguiente
}

/** Devuelve [semanaActual, semanaSiguiente] */
export function getWorkWeeks(referenceDate?: Date): [WorkWeek, WorkWeek]

/** Devuelve el día laborable por defecto dado un referenceDate (hoy si no se pasa) */
export function getDefaultWorkDay(referenceDate?: Date): WorkDay
```

> El parámetro opcional `referenceDate` permite inyectar la fecha en tests sin mockear `Date`.

## Criterios de aceptación

- AC-1: `getWorkWeeks()` devuelve exactamente dos semanas, cada una con 5 `WorkDay` (L–V), días normalizados y ordenados de lunes a viernes
- AC-2: Los `label` de `WorkWeek` representan correctamente el rango de fechas, incluyendo cruces de mes y año
- AC-3: `getDefaultWorkDay()` devuelve hoy si es día laborable (L–V)
- AC-4: `getDefaultWorkDay()` devuelve el lunes siguiente si hoy es sábado o domingo
- AC-5: `getWorkWeeks()` y `getDefaultWorkDay()` aceptan un `referenceDate` inyectable — no dependen de `Date.now()` interno
- AC-6: El módulo no importa nada de React ni de capas de UI

## Criterio de done

- Todos los AC en PASS
- Tests unitarios en `tests/unit/week-selector.test.ts` cubriendo AC-1 a AC-5
- verify en verde
- Spec actualizada con `## Execution Result`

## Execution Result

- Fecha de implementación: 2026-05-07 20:53 (CET)
- Rama: feature/OP-210-selector-semana-dia
- Commit: (ver commit feat(OP-211))
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — `getWorkWeeks()` devuelve [WorkWeek, WorkWeek], cada una con 5 WorkDay (L–V) normalizados y ordenados
  - AC-2: PASS — `label` formateado correctamente incluyendo cruces de mes (mar–abr) y año (dic–ene)
  - AC-3: PASS — `getDefaultWorkDay()` devuelve el propio día si es L–V
  - AC-4: PASS — `getDefaultWorkDay()` devuelve el lunes siguiente para sábado (+2) y domingo (+1)
  - AC-5: PASS — ambas funciones aceptan `referenceDate` opcional; tests sin mock de `Date`
  - AC-6: PASS — módulo no importa React ni ninguna capa de UI
- Ficheros creados o modificados:
  - `src/lib/week-selector.ts`
  - `tests/unit/week-selector.test.ts`
- verify:
  - Comando ejecutado: `npm run test:unit`
  - Resultado: PASS — 95 tests pasados (55 nuevos en week-selector.test.ts + 40 existentes en dates.test.ts)
  - ESLint: PASS — 0 errores, 4 warnings preexistentes (no introducidos por este cambio)
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: implementación completa de week-selector.ts y tests unitarios
- Decisiones técnicas:
  - `referenceDate` opcional en ambas funciones para testabilidad sin mock global de Date
  - `buildWeekLabel` muestra mes en ambos extremos solo cuando cruzan de mes, evitando redundancia en semanas del mismo mes
  - `daysUntilMonday` diferenciado: sábado→+2, domingo→+1 (más explícito que calcular módulo)

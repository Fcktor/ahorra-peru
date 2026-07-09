# Gamificación completa de AhorraPeru

**Fecha:** 2026-07-09
**Estado:** Aprobado, pendiente de plan de implementación

## Objetivo

Gamificar toda la app (no solo el glosario) con un enfoque de **cambio de comportamiento financiero real + educación** — se premian acciones que de verdad ayudan a ahorrar (usar la calculadora, seguir el plan, revisar el estado de cuenta y actuar sobre sus recomendaciones), no solo "usar la app" por usarla. Fuera de alcance explícito: retención pura vía rachas diarias y conversión a Pro como gancho directo (ver sección "Fuera de alcance").

## Contexto actual

El único sistema de gamificación existente es el quiz del glosario (`components/GlossaryQuiz.tsx` + `services/quizStorage.ts`): racha, mejor racha, precisión y "términos dominados". Todo vive en `AsyncStorage` del dispositivo — no está ligado a la cuenta del usuario, no sincroniza entre dispositivos, y no conecta con ninguna otra pantalla de la app (comparador, calculadora, plan, tarjetas, tasas, estado de cuenta).

## Arquitectura

### Modelo de datos (Supabase)

- **`profiles`** (existente) → nueva columna `xp_total` (int, default 0). El `level` se deriva de `xp_total` en el cliente, no se persiste (evita desincronización).
- **`xp_events`** (nueva) → `id, user_id, action_key, xp_amount, metadata jsonb, created_at`. Cada acción que otorga puntos inserta una fila. `action_key` es un identificador fijo (`quiz_correct`, `plan_saved`, `statement_uploaded`, etc.) usado para deduplicar acciones de una sola vez (ej. `glossary_term_read:tcea`). RLS: cada usuario ve/inserta solo sus propias filas, igual patrón que `savings_plans`/`followed_products`.
- **`achievements`** → catálogo estático en código (`constants/achievements.ts`, mismo patrón que `constants/glossary.ts`), no en base de datos.
- **`user_achievements`** (nueva) → `user_id, achievement_key, unlocked_at`. RLS por usuario.
- **`bank_statement_analyses`** (existente) → nueva columna `gastos_evitables_aplicados` (array de índices, default `{}`) para marcar qué gastos evitables el usuario confirmó haber aplicado.

### Servicio central

`services/gamification.ts` expone `awardXP(userId, actionKey, xpAmount, dedupeKey?)`:
1. Si `dedupeKey` está presente, revisa si ya existe un evento con ese `action_key` + `metadata.dedupeKey` para el usuario — si existe, no hace nada.
2. Inserta en `xp_events`.
3. Actualiza `xp_total` en `profiles` (incremento atómico).
4. Evalúa criterios de logros contra el nuevo estado y desbloquea los que correspondan en `user_achievements`.
5. Devuelve `{ xpGained, leveledUp, newAchievements }` para que la UI dé feedback inmediato.

Un hook `useGamification()` (contexto, mismo patrón que `useAuth()`) expone `xpTotal`, `level`, `xpToNextLevel`, `recentUnlocks` a cualquier pantalla.

### Por qué esta arquitectura (vs. alternativas consideradas)

- **Contadores sueltos en `profiles`** (una columna por tipo de acción): descartado — cada logro nuevo requeriría una columna nueva, sin historial auditable, deduplicación ad-hoc por acción.
- **XP calculado al vuelo desde datos existentes** (contar filas en `savings_plans`, `followed_products`, etc.): descartado — no permite premiar acciones que hoy no dejan rastro en la base (leer un término, correr una simulación en la calculadora), y no da contexto para el toast "ganaste X XP por Y".
- **Elegido: tabla de eventos + contador cacheado.** Historial auditable, deduplicación limpia vía `dedupeKey`, y una única función central (`awardXP`) que absorbe toda futura fuente de XP sin rediseñar el motor.

## Niveles

Curva de XP creciente por nivel: nivel *n* requiere `n × 150` XP acumulado.

Nombres: `Ahorrador Novato → Ahorrador Consciente → Ahorrador Estratega → Ahorrador Experto → Maestro del Ahorro`.

## Fuentes de XP por pantalla

| Pantalla | Acción | XP | Deduplicación |
|---|---|---|---|
| Glosario (quiz) | Responder correcto | +5 | Ninguna (repetible) |
| Glosario (explorar) | Leer un término nuevo | +2 | 1 vez por término |
| Comparador (`/comparar`) | Comparar 2 productos | +5 | 1 vez por par de productos |
| Calculadora | Completar una simulación | +3 | 1 vez por día (evita farmeo) |
| Mi Plan | Guardar un plan nuevo | +10 | Ninguna (cada plan guardado cuenta) |
| Mi Plan | Revisar un plan guardado, 7+ días después de creado | +8 | 1 vez por plan por ventana de 7 días |
| Tasas | Seguir un producto | +5 | 1 vez por producto |
| Tarjetas | Comparar tarjetas | +5 | 1 vez por par de tarjetas |
| Estado de cuenta | Subir y analizar un PDF | +20 | Ninguna (cada análisis cuenta) |
| Estado de cuenta | Marcar un gasto evitable como aplicado | +15 | 1 vez por gasto (por índice, por análisis) |
| Estado de cuenta | Subir un estado de cuenta 2 meses calendario consecutivos | +25 (+ logro) | 1 vez por par de meses consecutivos |

La acción "marcar gasto evitable como aplicado" es la pieza central del objetivo de comportamiento real: conecta una recomendación de Claude con una confirmación explícita del usuario de que la aplicó. Requiere agregar un checkbox por gasto evitable en `app/estado-cuenta.tsx`, que hace `update` sobre `gastos_evitables_aplicados` en `bank_statement_analyses` y dispara `awardXP`.

## Logros (hitos dentro del camino de XP)

Catálogo inicial (ampliable sin migraciones, vive en código):

- **Primeros pasos** — completar el primer quiz del glosario
- **Erudito** — dominar 20 términos del glosario
- **Comparador experto** — comparar 10 pares de productos
- **Constructor de planes** — guardar el primer plan
- **Ojo de águila** — subir estado de cuenta 3 meses consecutivos
- **Manos a la obra** — marcar 5 recomendaciones como aplicadas

## UI/UX

- **Badge persistente**: pill con nivel + mini barra de XP, visible en el header de cada pantalla (móvil) y en `components/DesktopSidebar.tsx` (escritorio). Al tocarlo abre `/progreso`.
- **`/progreso`** (pantalla modal nueva, mismo patrón que `app/estado-cuenta.tsx` y `app/upgrade.tsx`): nivel actual, barra de progreso hacia el siguiente nivel, grid de logros (bloqueados en gris, desbloqueados a color), lista de actividad reciente de XP (últimos `xp_events`).
- **Feedback inmediato**: banner de "+X XP" / "¡Subiste de nivel!" / "¡Nuevo logro!" reutilizando el patrón visual de `milestoneBanner` ya existente en `GlossaryQuiz.tsx`.

## Migración del progreso del quiz existente

El progreso actual vive en `AsyncStorage` (`services/quizStorage.ts`). Al desplegar esta funcionalidad, se ejecuta una migración única por usuario: al iniciar sesión, si hay datos locales y el usuario no tiene eventos `quiz_correct` en `xp_events`, se convierten a XP (ej. `totalCorrect × 5`) y se registran como un solo evento de migración (`action_key: 'quiz_migration'`). Después de esa migración puntual, `AsyncStorage` deja de usarse para esto — el quiz pasa a leer/escribir contra Supabase igual que las demás fuentes de XP.

## Fuera de alcance (fase 2, no ahora)

- Leaderboards sociales entre usuarios
- Recompensas monetarias o descuentos reales atados a nivel/logros
- Notificaciones push (la app no está publicada en tiendas — ver [[project-progress]])
- Compartir logros en redes sociales

## Testing

- `services/gamification.ts`: tests unitarios de `awardXP` — deduplicación por `dedupeKey`, cálculo de nivel, criterios de desbloqueo de logros.
- Integración manual por pantalla: verificar que cada acción de la tabla de fuentes de XP dispara el evento correcto una sola vez (o según su regla de dedup) y que el badge/toast refleja el nuevo total.
- Migración: probar con una cuenta que tenga progreso viejo en `AsyncStorage` y confirmar que migra una sola vez (repetir login no debe duplicar XP).

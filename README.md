# AhorraPerú

App móvil que responde una sola pregunta: **¿dónde pongo mis soles para que realmente generen intereses?**

En Perú hay decenas de cuentas de ahorro, depósitos a plazo y fondos con tasas muy distintas, y compararlos significa entrar a una docena de sitios. AhorraPerú trae las tasas de referencia del BCRP en vivo, compara las opciones disponibles lado a lado y arma un plan personalizado según cuánto tienes y por cuánto tiempo puedes dejarlo.

**Demo:** https://ahorra-peru.vercel.app

## Funcionalidades

- **Comparador de tasas** — opciones de ahorro ordenadas por rendimiento efectivo, con datos del BCRP
- **Calculadora de intereses** — proyecta rendimientos en el tiempo con capitalización
- **Plan personalizado** — un quiz corto mapea tu monto y horizonte a una distribución recomendada
- **Estado de cuenta** — controla qué colocaste y cuánto ha generado
- **Glosario** — TEA, TREA, capitalización y el resto explicados sin jerga
- **Plan premium** — pagos vía Culqi / Mercado Pago

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React Native 0.85 + Expo 56 |
| Ruteo | Expo Router (basado en archivos) |
| Lenguaje | TypeScript 6 |
| Backend | Supabase (auth + base de datos) |
| Pagos | Culqi, Mercado Pago |
| Fuente de datos | API abierta del BCRP |
| Tipografía | Archivo, Figtree |

## Estructura

```
app/
├── landing.tsx           # Pantalla de entrada
├── login.tsx             # Autenticación
├── (tabs)/
│   ├── index.tsx         # Inicio
│   ├── calculadora.tsx   # Calculadora de intereses
│   ├── plan.tsx          # Plan personalizado
│   ├── tarjetas.tsx      # Opciones guardadas
│   ├── historial.tsx     # Historial
│   └── glosario.tsx      # Glosario financiero
├── comparar.tsx          # Comparación lado a lado
├── detalle.tsx           # Detalle de cada opción
├── estado-cuenta.tsx     # Estado de cuenta
└── upgrade.tsx           # Upgrade a premium

services/
├── bcrp.ts               # Ingesta de tasas del BCRP
├── supabase.ts           # Cliente de base de datos
├── culqi.ts              # Procesamiento de pagos
└── quizStorage.ts        # Persistencia del quiz

lib/
└── interestMath.ts       # Matemática de capitalización y tasa efectiva
```

## Ejecutar localmente

```bash
pnpm install
cp .env.example .env      # completa tus claves de Supabase y pagos
pnpm start
```

Luego presiona `a` para Android, `i` para iOS o `w` para web.

## Variables de entorno

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MP_PUBLIC_KEY=
```

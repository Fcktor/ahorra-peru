# AhorraPerú

Mobile app that answers one question: **where should I put my soles so they actually earn interest?**

Peru has dozens of savings accounts, term deposits and funds with wildly different rates, and comparing them means visiting a dozen sites. AhorraPerú pulls live reference rates from the BCRP (Peru's central bank), compares the available options side by side, and produces a personalized plan based on how much you have and how long you can leave it.

**Live demo:** https://ahorra-peru.vercel.app

## Features

- **Rate comparison** — savings options ranked by effective return, sourced from BCRP data
- **Interest calculator** — projects returns over time with compounding
- **Personalized plan** — a short quiz maps your amount and horizon to a recommended allocation
- **Account statement** — track what you've placed and what it has earned
- **Glossary** — plain-language explanations of TEA, TREA, capitalization and the rest
- **Premium tier** — payments through Culqi / Mercado Pago

## Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.85 + Expo 56 |
| Routing | Expo Router (file-based) |
| Language | TypeScript 6 |
| Backend | Supabase (auth + database) |
| Payments | Culqi, Mercado Pago |
| Data source | BCRP open API |
| Typography | Archivo, Figtree |

## Project structure

```
app/
├── landing.tsx           # Marketing entry screen
├── login.tsx             # Auth
├── (tabs)/
│   ├── index.tsx         # Home
│   ├── calculadora.tsx   # Interest calculator
│   ├── plan.tsx          # Personalized plan
│   ├── tarjetas.tsx      # Saved options
│   ├── historial.tsx     # History
│   └── glosario.tsx      # Financial glossary
├── comparar.tsx          # Side-by-side comparison
├── detalle.tsx           # Option detail
├── estado-cuenta.tsx     # Account statement
└── upgrade.tsx           # Premium upgrade

services/
├── bcrp.ts               # BCRP rate ingestion
├── supabase.ts           # Database client
├── culqi.ts              # Payment processing
└── quizStorage.ts        # Quiz state persistence

lib/
└── interestMath.ts       # Compounding and effective-rate math
```

## Running locally

```bash
pnpm install
cp .env.example .env      # fill in your Supabase and payment keys
pnpm start
```

Then press `a` for Android, `i` for iOS, or `w` for web.

## Environment variables

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MP_PUBLIC_KEY=
```

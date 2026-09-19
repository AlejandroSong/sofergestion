# SOFER Gestión

App de administración de fincas (incidencias, finanzas, roles). Acceso solo con Google.

## URL de producción (cliente)

https://sofergestion.es

También: https://www.sofergestion.es

Respaldo Vercel: https://sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app

No uses `sofergestion-8za0q407m.vercel.app` ni URLs de Preview (`*-hash.vercel.app`): se redirigen a `sofergestion.es`.

En Vercel, **Deployment Protection → Vercel Authentication** debe estar apagado en Production.

## Qué incluye esta versión

- Login solo con Google.
- Cuentas nuevas entran **sin rol**; el administrador las asigna.
- Paneles por rol (admin, presidente, trabajador, vecino).
- Notificaciones, vivienda, calendario de visitas y catálogo SOFER.
- Arranque **sin fincas de demostración**: el administrador registra las comunidades reales.

## Local

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_GOOGLE_CLIENT_ID`.

## Google Cloud

Orígenes de JavaScript y URIs de redirección:

- `https://sofergestion.es`
- `https://www.sofergestion.es`
- `https://sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app`
- `http://localhost:3000`

## Supabase

En el SQL Editor ejecuta **todo** `supabase/profiles.sql`.

Site URL de Auth = `https://sofergestion.es`.

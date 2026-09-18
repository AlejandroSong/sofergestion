# SOFER Gestión

App de administración de edificios (incidencias, finanzas, roles). Acceso solo con Google.

## URL

https://sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app

No uses `sofergestion-8za0q407m.vercel.app` (versión antigua).

## Local

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_GOOGLE_CLIENT_ID`.

## Google Cloud

Origen de JavaScript: la URL de Production y `http://localhost:3000`.

## Supabase

En SQL Editor ejecuta `supabase/profiles.sql` para que el admin vea las altas de Google de otros dispositivos.

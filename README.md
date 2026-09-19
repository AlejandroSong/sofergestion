# SOFER Gestión

App de administración de edificios (incidencias, finanzas, roles). Acceso solo con Google.

## URL de Production

https://sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app

No uses `sofergestion-8za0q407m.vercel.app` (versión antigua con el callback 500).
No uses URLs de Preview / Visit (`*-hash.vercel.app`): se redirigen a Production.

En Vercel, **Deployment Protection → Vercel Authentication** debe estar apagado en Production. Si aparece “Request Sent”, el visitante no llega al login de Google.

## Qué incluye esta versión

- Login solo con Google (GIS + Supabase `signInWithIdToken`).
- Cuentas nuevas entran como **sin rol**; el admin las ve y asigna.
- Notificaciones de solicitud de acceso (SQL + panel).
- El admin puede ceder el rol: el cliente puede quitarte el admin. Solo se protege al **último** administrador.
- Al eliminar una cuenta se revoca el acceso; no puede volver a entrar con el mismo correo.
- Trabajador, presidente y vecino ven su propio panel (sin simulador de perfiles).

## Local

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_GOOGLE_CLIENT_ID`.

## Google Cloud

Orígenes de JavaScript:

- `https://sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app`
- `http://localhost:3000`

## Supabase

En el SQL Editor ejecuta **todo** `supabase/profiles.sql` (perfiles, columnas, RLS, `is_app_admin`, `assign_profile_role`, revocaciones y notificaciones).

Site URL de Auth = la URL de Production.

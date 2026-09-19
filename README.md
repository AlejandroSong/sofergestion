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

## Apps Android e iOS (mismo proyecto)

No hace falta un repo nuevo. Capacitor envuelve esta web: las carpetas `android/` e `iOS/` viven aquí.

**Una vez en este PC (Windows):**

```bash
npm install
npm run mobile:sync
npm run mobile:android
```

Se abre **Android Studio**. Ahí: un emulador o un móvil por USB → Run.

**iOS:** la carpeta `ios/` ya está en el repo (mismo `appId` que Android: `es.sofergestion.app`). **Firmar y subir a App Store hace falta un Mac con Xcode** y certificados en Appflow. En el Mac, en esta misma carpeta:

```bash
npm install
npm run mobile:ios
```

**Google (imprescindible para el login en el móvil):** en Google Cloud → cliente Web, añade origen y URI de redirección:

- `https://localhost`
- `https://localhost/google-callback.html`

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

En el SQL Editor ejecuta **una vez** `supabase/sync_realtime.sql` (o todo `supabase/profiles.sql`). Sin eso, fincas e incidencias no salen del navegador de quien las crea.

Site URL de Auth = `https://sofergestion.es`.

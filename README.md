# SOFER Gestión

App de administración de fincas (incidencias, finanzas, roles). Acceso solo con Google.

## URL de producción (cliente)

https://www.sofergestion.es

El apex `https://sofergestion.es` redirige a www.

Respaldo Vercel: https://sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app

No uses `sofergestion-8za0q407m.vercel.app` ni URLs de Preview (`*-hash.vercel.app`): se redirigen a `www.sofergestion.es`.

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
npm run mobile:apk
```

Eso genera `sofer-gestion-debug.apk` (y `android/app/build/outputs/apk/debug/app-debug.apk`). Instálalo en el móvil (hay que permitir “orígenes desconocidos”). La app carga `https://www.sofergestion.es` dentro del WebView, con Google dentro de SOFER, no en Chrome.

Si no hay JDK/SDK en el PC, instala **Android Studio**, ábrelo una vez y vuelve a `npm run mobile:apk`. Alternativa: `npm run mobile:android` abre Android Studio para emulador o USB.

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

Orígenes de JavaScript y URIs de redirección (cliente **Web**, no Firebase):

- `https://sofergestion.es`
- `https://www.sofergestion.es`
- `https://www.sofergestion.es/google-callback.html`
- `https://sofergestion.es/google-callback.html`
- `https://sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app`
- `http://localhost:3000`
- `https://localhost`
- `https://localhost/google-callback.html`

Esta app **no usa** `google-services.json` ni Firebase Auth. El login es OAuth de Google (Client ID web) + `signInWithIdToken` de Supabase. El SHA-1/SHA-256 del APK solo hace falta para App Links (`.well-known/assetlinks.json`), no para entrar con Google dentro del WebView.

En Supabase → Authentication → Providers → Google, el Client ID y el secret deben ser los del **mismo** cliente Web.

## Supabase

En el SQL Editor ejecuta **una vez** `supabase/sync_realtime.sql` (o todo `supabase/profiles.sql`). Sin eso, fincas e incidencias no salen del navegador de quien las crea.

Site URL de Auth = `https://www.sofergestion.es`.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const androidDir = path.join(root, 'android');
const isWin = process.platform === 'win32';
const wrapper = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');
const outApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const copyTo = path.join(root, 'sofer-gestion-debug.apk');

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(wrapper)) {
  fail('No está android/gradlew. Ejecuta npx cap add android y vuelve a intentar.');
}

const env = { ...process.env };
const localProps = path.join(androidDir, 'local.properties');
const sdkGuess = [
  env.ANDROID_HOME,
  env.ANDROID_SDK_ROOT,
  path.join(env.LOCALAPPDATA || '', 'Android', 'Sdk'),
  path.join(env.USERPROFILE || '', 'AppData', 'Local', 'Android', 'Sdk'),
].filter(Boolean);

const sdk = sdkGuess.find((candidate) => fs.existsSync(path.join(String(candidate), 'platform-tools')));
if (sdk && !fs.existsSync(localProps)) {
  const sdkDir = String(sdk).replace(/\\/g, '\\\\');
  fs.writeFileSync(localProps, `sdk.dir=${sdkDir}\n`);
  console.log('Creado android/local.properties');
}

if (!env.JAVA_HOME) {
  const jbr = [
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    'C:\\Program Files\\Android\\Android Studio\\jre',
  ].find((candidate) => fs.existsSync(candidate));
  if (jbr) env.JAVA_HOME = jbr;
}

const javaOk = Boolean(env.JAVA_HOME) || Boolean(spawnSync(isWin ? 'where' : 'which', ['java'], { env }).status === 0);
if (!javaOk && !sdk) {
  fail(
    [
      'En este PC no hay JDK ni Android SDK, así que el APK no se puede firmar aquí.',
      'Instala Android Studio (incluye Java 21 y el SDK), ábrelo una vez y luego:',
      '  npm run mobile:apk',
      'El APK quedará en android/app/build/outputs/apk/debug/app-debug.apk',
      'También puedes generar el debug en Appflow (Ionic) sobre la rama main.',
    ].join('\n')
  );
}

const result = spawnSync(wrapper, ['assembleDebug'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: isWin,
});

if (result.status !== 0) {
  fail('Gradle no pudo generar el APK. Abre la carpeta android/ con Android Studio y pulsa Build > Build APK(s).');
}

if (fs.existsSync(outApk)) {
  fs.copyFileSync(outApk, copyTo);
  console.log(`APK listo: ${copyTo}`);
  console.log(`También: ${outApk}`);
} else {
  fail('Gradle terminó pero no aparece app-debug.apk.');
}

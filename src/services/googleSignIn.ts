/**
 * googleSignIn.ts
 * Wrapper del SDK nativo @react-native-google-signin/google-signin.
 *
 * Objetivo: obtener el `idToken` de Google mediante el selector NATIVO de cuentas
 * (bottom-sheet in-app, sin abrir el navegador) para luego intercambiarlo con
 * Supabase vía `supabase.auth.signInWithIdToken({ provider: 'google', token })`.
 *
 * Notas:
 * - Solo funciona en builds nativas (NO en Expo Go ni en web).
 * - En web se usa el flujo OAuth por navegador (ver AuthContext.loginWithGoogle).
 * - El `webClientId` es el "OAuth Web Client ID" de Google Cloud, el MISMO que
 *   está configurado como Client ID en el proveedor Google de Supabase. Es
 *   imprescindible para que el idToken tenga la audiencia correcta.
 */

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// El Web Client ID se inyecta por variable de entorno (EXPO_PUBLIC_*)
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

let configured = false;

/**
 * Expo Go (StoreClient) NO incluye módulos nativos personalizados, por lo que
 * intentar cargar @react-native-google-signin dispara un Invariant Violation
 * ("RNGoogleSignin could not be found"). Detectamos ese entorno para saltarlo.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Carga perezosa del módulo nativo. En web, en Expo Go o si el módulo no está
 * disponible, devuelve null para que el caller use el flujo por navegador.
 */
function getGoogleModule(): any | null {
  if (Platform.OS === 'web') return null;
  if (isExpoGo) return null; // el módulo nativo no existe en Expo Go
  try {
    // require dinámico para evitar que el bundler web intente resolver el nativo
    return require('@react-native-google-signin/google-signin');
  } catch (e) {
    console.warn('⚠️ Google Sign-In nativo no disponible:', e);
    return null;
  }
}

/** Indica si el login nativo de Google está disponible en esta plataforma/build. */
export function isNativeGoogleSignInAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  if (!WEB_CLIENT_ID) return false;
  return getGoogleModule() != null;
}

function ensureConfigured(GoogleSignin: any): void {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    // offlineAccess=false: no necesitamos refresh token del lado servidor propio;
    // Supabase gestiona la sesión con el idToken.
    offlineAccess: false,
  });
  configured = true;
}

export interface NativeGoogleResult {
  idToken: string;
  /** Presente en algunas versiones del SDK; útil para providers que lo requieran. */
  accessToken?: string;
}

/**
 * Lanza el selector nativo de cuentas de Google y devuelve el idToken.
 * @throws Error con código 'CANCELLED' si el usuario cierra el selector.
 */
export async function nativeGoogleSignIn(): Promise<NativeGoogleResult> {
  const mod = getGoogleModule();
  if (!mod) {
    throw new Error('Google Sign-In nativo no disponible en esta plataforma');
  }
  if (!WEB_CLIENT_ID) {
    throw new Error('Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }

  const { GoogleSignin, statusCodes } = mod;
  ensureConfigured(GoogleSignin);

  // En Android verifica que Google Play Services esté disponible/actualizado.
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  try {
    const response = await GoogleSignin.signIn();

    // El SDK cambió la forma del resultado entre versiones:
    //  - v13+: { type: 'success', data: { idToken, ... } }
    //  - anteriores: { idToken, user, ... }
    const data = response?.data ?? response;
    const idToken: string | undefined = data?.idToken;

    if (response?.type === 'cancelled') {
      const err: any = new Error('CANCELLED');
      err.code = 'CANCELLED';
      throw err;
    }
    if (!idToken) {
      throw new Error('Google no devolvió un idToken');
    }

    return { idToken };
  } catch (error: any) {
    const code = error?.code;
    if (statusCodes && (code === statusCodes.SIGN_IN_CANCELLED || code === 'CANCELLED')) {
      const err: any = new Error('CANCELLED');
      err.code = 'CANCELLED';
      throw err;
    }
    throw error;
  }
}

/** Cierra la sesión del SDK de Google (no cierra la sesión de Supabase). */
export async function nativeGoogleSignOut(): Promise<void> {
  const mod = getGoogleModule();
  if (!mod) return;
  try {
    await mod.GoogleSignin.signOut();
  } catch (e) {
    // no-op: si no había sesión de Google, se ignora
  }
}

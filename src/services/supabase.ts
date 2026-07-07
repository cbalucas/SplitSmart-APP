/**
 * supabase.ts
 * Cliente Supabase compartido para toda la app.
 * Usa AsyncStorage como adaptador de sesión (funciona en iOS, Android y Web).
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase: EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY no están definidas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage funciona tanto en nativo como en web (usa localStorage en web)
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // PKCE: en nativo el login OAuth vuelve con ?code=... y se intercambia con
    // exchangeCodeForSession(). Sin esto el default es 'implicit' (tokens en el
    // fragmento #), que exchangeCodeForSession NO soporta → el login con Google
    // fallaba en la app. En web, detectSessionInUrl completa el intercambio.
    flowType: 'pkce',
  },
});

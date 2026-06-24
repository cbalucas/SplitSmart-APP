import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { User } from '../types';
import { DEMO_USER, DEMO_USER_ID, DEMO_CREDENTIALS } from '../constants/demoUser';
import { databaseService } from '../services/DatabaseFactory';
import { supabase } from '../services/supabase';

// Necesario para completar el flujo OAuth en iOS/Android
WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credential: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isInitializing: boolean;
  initializeAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  autoLoginIfEnabled: () => Promise<User | null>;
  toggleAutoLogin: (enabled: boolean) => Promise<void>;
  toggleChatMode: (enabled: boolean) => Promise<void>;
  loginWithBiometric: (userId?: string) => Promise<boolean>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  registerWithSupabase: (email: string, password: string, name: string, username: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  isOnlineUser: boolean;
  /** true cuando el usuario local tiene email válido y aún no está vinculado a Supabase */
  offerLinkToSupabase: boolean;
  /** Vincular el usuario local activo con su cuenta de Supabase (mismo email) */
  linkToSupabase: (password: string) => Promise<{ success: boolean; error?: string }>;
  /** Descartar la oferta de vinculación para esta sesión */
  dismissLinkOffer: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  loading: false,
  isInitializing: true,
  initializeAuth: async () => {},
  refreshUser: async () => {},
  autoLoginIfEnabled: async () => null,
  toggleAutoLogin: async () => {},
  toggleChatMode: async () => {},
  loginWithBiometric: async (_userId?: string) => false,
  toggleBiometric: async () => {},
  registerWithSupabase: async () => ({ success: false }),
  loginWithGoogle: async () => {},
  isOnlineUser: false,
  offerLinkToSupabase: false,
  linkToSupabase: async () => ({ success: false }),
  dismissLinkOffer: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isOnlineUser, setIsOnlineUser] = useState(false);
  const [offerLinkToSupabase, setOfferLinkToSupabase] = useState(false);

  // Mapea datos de BD local a objeto User
  const _mapDbUserToUser = (dbUser: any, supabaseBased = false): User => ({
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    email: dbUser.email,
    avatar: dbUser.avatar,
    skipPassword: supabaseBased ? true : dbUser.skip_password === 1,
    autoLogin: dbUser.auto_login === 1,
    chatModeAdvanced: dbUser.chat_mode_advanced === 1,
    biometricEnabled: dbUser.biometric_enabled === 1,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    supabaseUserId: dbUser.supabase_user_id || undefined,
  });

  // Inicializar usuario demo en BD si no existe
  const initializeAuth = async () => {
    setIsInitializing(true);
    try {
      // Asegurar que la base de datos esté completamente inicializada
      await databaseService.init();
      
      // Wait a bit to ensure database is fully ready after potential nuke
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const existingUser = await databaseService.getUserByCredential(DEMO_CREDENTIALS.username);
      
      if (!existingUser) {
        // Crear usuario demo en BD
        await databaseService.createUser({
          id: DEMO_USER.id,
          username: DEMO_CREDENTIALS.username,
          email: DEMO_CREDENTIALS.email,
          password: DEMO_CREDENTIALS.password,
          name: DEMO_USER.name,
          skipPassword: true,
          autoLogin: true,
        });
        console.log('✅ Demo user created in database with skipPassword and autoLogin enabled');
      } else {
        console.log('📋 Demo user exists. skip_password:', existingUser.skip_password, 'auto_login:', existingUser.auto_login);
        
        // Verificar si necesita actualización SOLO de skip_password 
        // NO forzar auto_login - respetar configuración del usuario
        const needsSkipPasswordUpdate = existingUser.skip_password !== 1;
        
        if (needsSkipPasswordUpdate) {
          console.log('🔧 Updating Demo user skip_password...');
          try {
            await databaseService.updateUserProfile(existingUser.id, { skipPassword: true });
            console.log('✅ Demo user skipPassword enabled');
          } catch (updateError) {
            console.error('❌ Error updating demo user skip_password:', updateError);
            // Continue anyway, don't block the initialization
          }
        } else {
          console.log('✅ Demo user already has skipPassword enabled');
        }
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      // Don't rethrow - let the app continue with basic functionality
    }

    // Restaurar sesión Supabase existente (si el usuario ya había hecho login online)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        console.log('\ud83d\udd11 Supabase session found for:', session.user.email);
        let localUser = await databaseService.getUserByCredential(session.user.email);
        if (!localUser) {
          // Crear usuario local desde datos de Supabase
          await databaseService.createUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email.split('@')[0],
            email: session.user.email,
            password: '',
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            skipPassword: true,
          });
          localUser = await databaseService.getUserById(session.user.id);
        }
        if (localUser) {
          setUser(_mapDbUserToUser(localUser, true));
          setIsOnlineUser(true);
          console.log('\u2705 Supabase session restored for:', localUser.username);
        }
      }
    } catch (sessionError) {
      console.warn('⚠️ Could not restore Supabase session:', sessionError);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  // Listener para eventos OAuth (Google, etc.)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Solo procesar sign-ins de Google (email/password los maneja login())
        const provider = session.user.app_metadata?.provider;
        if (provider !== 'google') return;

        const supaUser = session.user;
        const email = supaUser.email!;
        const name =
          supaUser.user_metadata?.full_name ||
          supaUser.user_metadata?.name ||
          email.split('@')[0];
        const rawUsername = (supaUser.user_metadata?.preferred_username || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');

        try {
          await databaseService.init();
          let localUser = await databaseService.getUserByCredential(email);
          if (!localUser) {
            // Evitar colisión de username
            let username = rawUsername;
            const existingUsername = await databaseService.getUserByCredential(username);
            if (existingUsername) username = `${rawUsername}_${Date.now().toString().slice(-4)}`;

            await databaseService.createUser({
              id: supaUser.id,
              username,
              email,
              password: '',
              name,
              skipPassword: true,
            });
            localUser = await databaseService.getUserById(supaUser.id);
          }
          if (localUser) {
            try { await databaseService.updateLastLogin(localUser.id); } catch (_) {}
            setUser(_mapDbUserToUser(localUser, true));
            setIsOnlineUser(true);
            console.log('✅ Google OAuth: usuario autenticado como', localUser.username);
          }
        } catch (err) {
          console.error('❌ Error procesando usuario Google OAuth:', err);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (credential: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('🔐 Login attempt with credential:', credential);

      // Asegurar que la base de datos esté inicializada (importante en web)
      await databaseService.init();

      // Buscar usuario en BD
      const dbUser = await databaseService.getUserByCredential(credential);
      
      if (!dbUser) {
        console.log('❌ User not found in database');
        setLoading(false);
        return false;
      }

      console.log('👤 User found:', dbUser.username, 'skip_password:', dbUser.skip_password);

      // Si tiene skipPassword habilitado, solo validar credencial
      if (dbUser.skip_password === 1) {
        console.log('✅ Login successful with skipPassword');
        
        // Actualizar last_login
        try {
          console.log(`🔄 Updating last_login for user ${dbUser.id}...`);
          await databaseService.updateLastLogin(dbUser.id);
          console.log(`✅ Last_login updated successfully for user ${dbUser.id}`);
        } catch (error) {
          console.error('⚠️ Could not update last_login:', error);
          // No bloquear el login por este error
        }
        
        const authenticatedUser: User = {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          email: dbUser.email,
          avatar: dbUser.avatar,
          skipPassword: true,
          autoLogin: dbUser.auto_login === 1,
          chatModeAdvanced: dbUser.chat_mode_advanced === 1,
          biometricEnabled: dbUser.biometric_enabled === 1,
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at,
          supabaseUserId: dbUser.supabase_user_id || undefined,
        };
        setUser(authenticatedUser);
        // Ofrecer vinculación si el usuario no es demo, tiene email real y aún no está vinculado
        if (
          dbUser.id !== DEMO_USER_ID &&
          dbUser.email &&
          dbUser.email !== DEMO_CREDENTIALS.email &&
          !dbUser.supabase_user_id
        ) {
          setOfferLinkToSupabase(true);
        }
        setLoading(false);
        return true;
      }
      
      // Validación normal con contraseña
      console.log('🔑 Checking password... provided:', !!password);
      if (dbUser.password === password) {
        console.log('✅ Login successful with password');
        
        // Actualizar last_login
        try {
          console.log(`🔄 Updating last_login for user ${dbUser.id}...`);
          await databaseService.updateLastLogin(dbUser.id);
          console.log(`✅ Last_login updated successfully for user ${dbUser.id}`);
        } catch (error) {
          console.error('⚠️ Could not update last_login:', error);
          // No bloquear el login por este error
        }
        
        const authenticatedUser: User = {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          email: dbUser.email,
          avatar: dbUser.avatar,
          skipPassword: dbUser.skip_password === 1,
          autoLogin: dbUser.auto_login === 1,
          chatModeAdvanced: dbUser.chat_mode_advanced === 1,
          biometricEnabled: dbUser.biometric_enabled === 1,
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at,
          supabaseUserId: dbUser.supabase_user_id || undefined,
        };
        setUser(authenticatedUser);
        // Ofrecer vinculación si el usuario no es demo, tiene email real y aún no está vinculado
        if (
          dbUser.id !== DEMO_USER_ID &&
          dbUser.email &&
          dbUser.email !== DEMO_CREDENTIALS.email &&
          !dbUser.supabase_user_id
        ) {
          setOfferLinkToSupabase(true);
        }
        setLoading(false);
        return true;
      }
      
      console.log('❌ Password mismatch');
      setLoading(false);
      return false;
    } catch (error) {
      console.error('❌ Error during login:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out');
    if (user && user.autoLogin) {
      console.log('\ud83d\udd12 Auto-login disabled due to manual logout');
      databaseService.toggleAutoLogin(user.id, false).catch(error =>
        console.error('Error disabling auto-login:', error)
      );
    }
    // Cerrar sesión en Supabase si el usuario era online
    if (isOnlineUser) {
      supabase.auth.signOut().catch(e => console.warn('\u26a0\ufe0f Supabase signOut error:', e));
    }
    setIsOnlineUser(false);
    setOfferLinkToSupabase(false);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const dbUser = await databaseService.getUserProfile(user.id);
      if (dbUser) {
        setUser(_mapDbUserToUser(dbUser, isOnlineUser));
        console.log('✅ User refreshed:', dbUser.username);
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
    }
  };

  const autoLoginIfEnabled = async (): Promise<User | null> => {
    try {
      console.log('🔍 Starting auto-login validation process...');
      
      // Asegurar que la base de datos esté inicializada
      await databaseService.init();

      // 1. Verificar si existe algún usuario además del DEMO
      const allUsers = await databaseService.getAllUsersWithLoginInfo();
      
      if (!allUsers || allUsers.length === 0) {
        console.log('⚠️ No users found in database');
        return null;
      }
      
      console.log(`📊 Found ${allUsers.length} users in database`);
      
      const nonDemoUsers = allUsers.filter((user: any) => user.id !== DEMO_USER_ID);
      const demoUser = allUsers.find((user: any) => user.id === DEMO_USER_ID);
      
      console.log(`👥 Non-demo users: ${nonDemoUsers.length}`);
      console.log(`🎭 Demo user exists: ${!!demoUser}`);
      
      let candidateUser = null;
      
      if (nonDemoUsers.length === 0) {
        // Caso 1: Solo existe usuario DEMO
        console.log('📋 Case 1: Only DEMO user exists');
        
        if (!demoUser) {
          console.log('❌ DEMO user not found');
          return null;
        }
        
        console.log(`🎭 DEMO user - skip_password: ${demoUser.skip_password}, auto_login: ${demoUser.auto_login}`);
        
        if (demoUser.skip_password === 1 && demoUser.auto_login === 1) {
          console.log('✅ DEMO user has both skip_password and auto_login enabled');
          candidateUser = demoUser;
        } else {
          console.log('❌ DEMO user does not meet auto-login requirements');
          return null;
        }
      } else {
        // Caso 2: Existen otros usuarios además del DEMO
        console.log('📋 Case 2: Other users exist besides DEMO');
        
        // Debug: mostrar todos los usuarios non-demo
        nonDemoUsers.forEach((user: any, index: number) => {
          console.log(`👤 Non-demo user ${index + 1}: ${user.username} - last_login: ${user.last_login} - skip_password: ${user.skip_password} - auto_login: ${user.auto_login}`);
        });
        
        // Buscar el último usuario que se logeó (incluyendo DEMO)
        const usersWithLogin = allUsers.filter((user: any) => user.last_login);
        console.log(`📊 Users with last_login (including DEMO): ${usersWithLogin.length}`);
        
        // Debug: mostrar todos los usuarios con login
        usersWithLogin.forEach((user: any, index: number) => {
          console.log(`👤 User ${index + 1} with login: ${user.username} - last_login: ${user.last_login} - skip_password: ${user.skip_password} - auto_login: ${user.auto_login}`);
        });
        
        const lastLoginUser = usersWithLogin
          .sort((a: any, b: any) => new Date(b.last_login).getTime() - new Date(a.last_login).getTime())[0];
        
        if (!lastLoginUser) {
          console.log('❌ No user with last_login found');
          console.log('🔄 Fallback: Checking DEMO user as alternative');
          if (demoUser && demoUser.skip_password === 1 && demoUser.auto_login === 1) {
            console.log('✅ DEMO user meets requirements, using as fallback');
            candidateUser = demoUser;
          } else {
            console.log('❌ DEMO user does not meet requirements for fallback');
            console.log('ℹ️ Will show login screen - no valid auto-login user found');
            return null;
          }
        } else {
          console.log(`👤 Last login user: ${lastLoginUser.username} (${lastLoginUser.last_login})`);
          console.log(`👤 User settings - skip_password: ${lastLoginUser.skip_password}, auto_login: ${lastLoginUser.auto_login}`);
          
          if (lastLoginUser.skip_password === 1 && lastLoginUser.auto_login === 1) {
            console.log('✅ Last login user has both skip_password and auto_login enabled');
            candidateUser = lastLoginUser;
          } else {
            console.log('❌ Last login user does not meet auto-login requirements');
            console.log('ℹ️ Will show login screen - last user disabled auto-login');
            return null;
          }
        }
      }
      
      if (!candidateUser) {
        console.log('❌ No candidate user found for auto-login');
        return null;
      }
      
      // Obtener los datos completos del usuario
      const fullUserData = await databaseService.getUserById(candidateUser.id);
      
      if (!fullUserData) {
        console.log('❌ Could not fetch full user data');
        return null;
      }
      
      console.log('🚀 AUTO-LOGIN: Authenticating automatically with:', fullUserData.username);
      try { await databaseService.updateLastLogin(fullUserData.id); } catch (_) {}
      const authenticatedUser = _mapDbUserToUser(fullUserData);
      setUser(authenticatedUser);
      setIsOnlineUser(false);      // Auto-login de usuario no-demo sin supabase_user_id → ofrecer vinculación
      if (
        fullUserData.id !== DEMO_USER_ID &&
        fullUserData.email &&
        fullUserData.email !== DEMO_CREDENTIALS.email &&
        !fullUserData.supabase_user_id
      ) {
        setOfferLinkToSupabase(true);
      }      return authenticatedUser;
    } catch (error) {
      console.error('❌ Error in auto-login:', error);
      return null;
    }
  };

  const toggleAutoLogin = async (enabled: boolean): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      console.log(`🔧 AuthContext: Toggling auto-login for user ID: ${user.id}, enabled: ${enabled}`);
      console.log(`👤 Current user object:`, { id: user.id, username: user.username, autoLogin: user.autoLogin });
      
      await databaseService.toggleAutoLogin(user.id, enabled);
      
      // Actualizar el estado local del usuario
      setUser(prev => prev ? { ...prev, autoLogin: enabled } : null);
      
      console.log(`✅ Auto-login ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('❌ Error toggling auto-login:', error);
      throw error;
    }
  };

  const toggleChatMode = async (enabled: boolean): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    try {
      await databaseService.updateUserProfile(user.id, { chatModeAdvanced: enabled });
      setUser(prev => prev ? { ...prev, chatModeAdvanced: enabled } : null);
    } catch (error) {
      console.error('❌ Error toggling chat mode:', error);
      throw error;
    }
  };

  const toggleBiometric = async (enabled: boolean): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    try {
      await databaseService.updateUserProfile(user.id, { biometricEnabled: enabled });
      setUser(prev => prev ? { ...prev, biometricEnabled: enabled } : null);
    } catch (error) {
      console.error('❌ Error toggling biometric:', error);
      throw error;
    }
  };

  const loginWithBiometric = async (userId?: string): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        console.log('❌ Biometric: no hardware available');
        return false;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        console.log('❌ Biometric: no biometrics enrolled');
        return false;
      }
      const allUsers = await databaseService.getAllUsersWithLoginInfo();
      // Si se especifica userId, usar ese usuario; si no, el primero con biométrico
      const biometricUser = userId
        ? allUsers.find((u: any) => u.id === userId && u.biometric_enabled === 1)
        : allUsers.find((u: any) => u.biometric_enabled === 1);
      if (!biometricUser) {
        console.log('❌ Biometric: user not found or biometric not enabled');
        return false;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verificar identidad',
        fallbackLabel: 'Usar contraseña',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (!result.success) {
        console.log('❌ Biometric authentication failed:', result);
        return false;
      }
      const fullUser = await databaseService.getUserById(biometricUser.id);
      if (!fullUser) return false;
      try { await databaseService.updateLastLogin(fullUser.id); } catch (_) {}
      setUser(_mapDbUserToUser(fullUser));
      setIsOnlineUser(false);
      console.log('✅ Biometric login successful for:', fullUser.username);
      return true;
    } catch (error) {
      console.error('❌ Error in biometric login:', error);
      return false;
    }
  };

  // Login con Google via Supabase OAuth
  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // En web: Supabase maneja el redirect automáticamente
        const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) throw error;
        return;
      }

      // En nativo: usar expo-web-browser + expo-linking
      const redirectTo = Linking.createURL('auth/callback');
      console.log('🔗 Google OAuth redirect URI:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error || new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
        if (sessionError) throw sessionError;
        // onAuthStateChange ('SIGNED_IN') se encarga de crear el usuario local
      }
    } catch (err: any) {
      console.error('❌ Google sign-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Vincular el usuario local activo con su cuenta Supabase (mismo email)
  const linkToSupabase = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No hay usuario activo' };
    if (user.id === DEMO_USER_ID) {
      return { success: false, error: 'El usuario Demo no puede vincularse a Supabase' };
    }
    if (!user.email || user.email === DEMO_CREDENTIALS.email) {
      return { success: false, error: 'El usuario no tiene un email válido para vincular' };
    }
    if (user.supabaseUserId) {
      return { success: false, error: 'El usuario ya está vinculado a Supabase' };
    }
    try {
      console.log('🔗 Linking local user to Supabase:', user.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (error) {
        console.error('❌ Supabase auth error during linking:', error.message);
        return { success: false, error: error.message };
      }
      if (!data.user) {
        return { success: false, error: 'No se pudo autenticar con Supabase' };
      }
      const supabaseId = data.user.id;
      await databaseService.linkUserToSupabase(user.id, supabaseId);
      setUser(prev => prev ? { ...prev, supabaseUserId: supabaseId } : null);
      setIsOnlineUser(true);
      setOfferLinkToSupabase(false);
      console.log('✅ Local user linked to Supabase successfully. SupabaseId:', supabaseId);
      return { success: true };
    } catch (err: any) {
      console.error('❌ Error linking to Supabase:', err);
      return { success: false, error: err?.message ?? 'Error desconocido' };
    }
  };

  /** Descartar la oferta de vinculación para esta sesión */
  const dismissLinkOffer = () => {
    setOfferLinkToSupabase(false);
  };

  // Registro de usuario real via Supabase (email requerido)
  const registerWithSupabase = async (
    email: string,
    password: string,
    name: string,
    username: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🌐 Registering user in Supabase:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, username } },
      });
      if (error) {
        console.error('❌ Supabase signUp error:', error.message);
        return { success: false, error: error.message };
      }
      if (!data.user) return { success: false, error: 'No user returned from Supabase' };

      console.log('✅ Supabase user created:', data.user.id);
      return { success: true };
    } catch (err: any) {
      console.error('❌ registerWithSupabase error:', err);
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading,
      isInitializing,
      initializeAuth,
      refreshUser,
      autoLoginIfEnabled,
      toggleAutoLogin,
      toggleChatMode,
      loginWithBiometric,
      toggleBiometric,
      registerWithSupabase,
      loginWithGoogle,
      isOnlineUser,
      offerLinkToSupabase,
      linkToSupabase,
      dismissLinkOffer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
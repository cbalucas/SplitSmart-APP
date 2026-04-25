import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { DEMO_USER, DEMO_CREDENTIALS } from '../constants/demoUser';
import { databaseService } from '../services/database';

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
  toggleChatMode: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (credential: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('🔐 Login attempt with credential:', credential);
      
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
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at
        };
        setUser(authenticatedUser);
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
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at
        };
        setUser(authenticatedUser);
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
    // Desactivar auto_login al hacer logout manual
    if (user && user.autoLogin) {
      console.log('🔒 Auto-login disabled due to manual logout');
      databaseService.toggleAutoLogin(user.id, false).catch(error => 
        console.error('Error disabling auto-login:', error)
      );
    }
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Refreshing user data from database...');
      const dbUser = await databaseService.getUserProfile(user.id);
      console.log('📥 DB User data:', dbUser);
      if (dbUser) {
        const updatedUser: User = {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          email: dbUser.email,
          avatar: dbUser.avatar,
          skipPassword: dbUser.skip_password === 1,
          autoLogin: dbUser.auto_login === 1,
          chatModeAdvanced: dbUser.chat_mode_advanced === 1,
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at
        };
        console.log('✅ Setting updated user:', updatedUser);
        setUser(updatedUser);
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
      
      const DEMO_USER_ID = 'demo-user';
      
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
      
      console.log('🚀 AUTO-LOGIN: Bypassing login screen and authenticating automatically with:', fullUserData.username);
      
      // Actualizar last_login para auto-login
      try {
        await databaseService.updateLastLogin(fullUserData.id);
      } catch (error) {
        console.error('⚠️ Could not update last_login during auto-login:', error);
        // No bloquear el auto-login por este error
      }
      
      const authenticatedUser: User = {
        id: fullUserData.id,
        name: fullUserData.name,
        username: fullUserData.username,
        email: fullUserData.email,
        avatar: fullUserData.avatar,
        skipPassword: fullUserData.skip_password === 1,
        autoLogin: fullUserData.auto_login === 1,
        chatModeAdvanced: fullUserData.chat_mode_advanced === 1,
        createdAt: fullUserData.created_at,
        updatedAt: fullUserData.updated_at
      };
      
      console.log('🔐 Setting authenticated user via auto-login:', authenticatedUser.username);
      setUser(authenticatedUser);
      return authenticatedUser;
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
      toggleChatMode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
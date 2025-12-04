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
  initializeAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  loading: false,
  initializeAuth: async () => {},
  refreshUser: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Inicializar usuario demo en BD si no existe
  const initializeAuth = async () => {
    try {
      await databaseService.init();
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
        });
        console.log('✅ Demo user created in database with skipPassword');
      } else {
        console.log('📋 Demo user exists. skip_password:', existingUser.skip_password);
        
        // SIEMPRE forzar actualización para asegurar que Demo tenga skipPassword
        console.log('🔧 Forcing Demo user skip_password update...');
        await databaseService.forceUpdateDemoUser(existingUser.id);
        
        // Verificar actualización
        const updatedUser = await databaseService.getUserByCredential(DEMO_CREDENTIALS.username);
        console.log('🔍 After update, skip_password:', updatedUser?.skip_password);
        
        if (updatedUser?.skip_password === 1) {
          console.log('✅ Demo user skipPassword enabled successfully');
        } else {
          console.error('⚠️ Failed to enable skipPassword for Demo user');
        }
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
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
        const authenticatedUser: User = {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          email: dbUser.email,
          avatar: dbUser.avatar,
          skipPassword: true,
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
        const authenticatedUser: User = {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          email: dbUser.email,
          avatar: dbUser.avatar,
          skipPassword: dbUser.skip_password === 1,
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

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading,
      initializeAuth,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthMode = 'loggedIn' | 'guest' | 'unknown';

type AuthContextType = {
  mode: AuthMode;
  userId: string | null;
  isLoggedIn: boolean;
  isGuest: boolean;
  continueAsGuest: () => Promise<void>;
  setLoggedIn: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  mode: 'unknown',
  userId: null,
  isLoggedIn: false,
  isGuest: false,
  continueAsGuest: async () => {},
  setLoggedIn: async () => {},
  logout: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>('unknown');
  const [userId, setUserId] = useState<string | null>(null);

  // Restore persisted auth state on mount
  useEffect(() => {
    const restore = async () => {
      try {
        // 1. Check for a live Supabase session (persisted via AsyncStorage)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const uid = session.user.id;
          await AsyncStorage.setItem('userId', JSON.stringify(uid));
          await AsyncStorage.setItem('authMode', 'loggedIn');
          setUserId(uid);
          setMode('loggedIn');
          return;
        }

        // 2. Fall back to AsyncStorage flags
        const storedMode = await AsyncStorage.getItem('authMode');
        if (storedMode === 'loggedIn') {
          let id = await AsyncStorage.getItem('userId');
          if (id?.startsWith('"')) id = JSON.parse(id);
          if (id) {
            setUserId(id);
            setMode('loggedIn');
            return;
          }
        }
        if (storedMode === 'guest') {
          setMode('guest');
          return;
        }

        // 3. No persisted state → unknown (show landing)
        setMode('unknown');
      } catch (e) {
        console.warn('[auth] Restore error:', e);
        setMode('unknown');
      }
    };

    restore();
  }, []);

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem('authMode', 'guest');
    setUserId(null);
    setMode('guest');
  }, []);

  const setLoggedIn = useCallback(async (uid: string) => {
    await AsyncStorage.setItem('userId', JSON.stringify(uid));
    await AsyncStorage.setItem('authMode', 'loggedIn');
    setUserId(uid);
    setMode('loggedIn');
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    await AsyncStorage.multiRemove(['userId', 'authMode', 'loggedIn']);
    setUserId(null);
    setMode('unknown');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        mode,
        userId,
        isLoggedIn: mode === 'loggedIn',
        isGuest: mode === 'guest',
        continueAsGuest,
        setLoggedIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}

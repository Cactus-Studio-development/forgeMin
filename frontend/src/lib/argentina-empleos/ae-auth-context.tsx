'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { AEUser, AEWallet, AERole } from './types';
import { aeApi } from './ae-api';

interface AEAuthContextType {
  user: AEUser | null;
  wallet: AEWallet | null;
  role: AERole | null;
  isSuperadmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserLocal: (updated: Partial<AEUser>) => void;
}

const AEAuthContext = createContext<AEAuthContextType>({
  user: null,
  wallet: null,
  role: null,
  isSuperadmin: false,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshWallet: async () => {},
  refreshProfile: async () => {},
  updateUserLocal: () => {},
});

export function AEAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AEUser | null>(null);
  const [wallet, setWallet] = useState<AEWallet | null>(null);
  const [loading, setLoading] = useState(true);

  const syncBackendUser = async (firebaseUser: any) => {
    try {
      const res = await aeApi.auth.sync({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoUrl: firebaseUser.photoURL || '',
      });

      setUser(res.user);
      setWallet(res.wallet);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ae_user_id', res.user.id);
        localStorage.setItem('ae_user_role', res.user.role);
      }
    } catch (err) {
      console.error('Error syncing AE user:', err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const token = await fbUser.getIdToken();
        localStorage.setItem('auth_token', token);
        localStorage.setItem('ae_user_id', fbUser.uid);
        await syncBackendUser(fbUser);
      } else {
        setUser(null);
        setWallet(null);
        localStorage.removeItem('ae_user_id');
        localStorage.removeItem('ae_user_role');
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const token = await cred.user.getIdToken();
      localStorage.setItem('auth_token', token);
      localStorage.setItem('ae_user_id', cred.user.uid);
      await syncBackendUser(cred.user);
    } catch (error) {
      console.error('AE Google Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setWallet(null);
      localStorage.removeItem('ae_user_id');
      localStorage.removeItem('ae_user_role');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshWallet = async () => {
    if (!user) return;
    try {
      const res = await aeApi.wallet.getMyWallet(user.id);
      setWallet(res.wallet);
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const updated = await aeApi.auth.getProfile(user.id);
      setUser(updated);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const updateUserLocal = (updated: Partial<AEUser>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const role = user?.role || null;
  const isSuperadmin = role === 'superadmin';

  return (
    <AEAuthContext.Provider
      value={{
        user,
        wallet,
        role,
        isSuperadmin,
        loading,
        loginWithGoogle,
        logout,
        refreshWallet,
        refreshProfile,
        updateUserLocal,
      }}
    >
      {children}
    </AEAuthContext.Provider>
  );
}

export function useAEAuth() {
  return useContext(AEAuthContext);
}

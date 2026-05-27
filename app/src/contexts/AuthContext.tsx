import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types';
import {
  auth,
  getUserProfile,
  getIdToken,
  logoutUser,
  syncUserRoleFromSeedData,
} from '@/services/firebase';
import { socketService } from '@/services/socket';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (): Promise<void> => {
    if (currentUser) {
      const profile =
        (await syncUserRoleFromSeedData(currentUser.uid, currentUser.email ?? '')) ??
        (await getUserProfile(currentUser.uid));
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        setCurrentUser(user);

        if (user) {
          try {
            const profile =
              (await syncUserRoleFromSeedData(user.uid, user.email ?? '')) ??
              (await getUserProfile(user.uid));
            if (profile) {
              setUserProfile(profile);

              // Connect socket with token
              const token = await getIdToken();
              if (token) {
                socketService.connect(token);
              }
            } else {
              // User exists in Auth but has no Firestore profile — sign them out
              console.warn('No user profile found in Firestore, signing out.');
              await logoutUser();
              setCurrentUser(null);
              setUserProfile(null);
            }
          } catch (error) {
            console.error('Error loading user profile:', error);
            // If Firestore read fails (permissions error), sign out
            await logoutUser();
            setCurrentUser(null);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
          socketService.disconnect();
        }

        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, []);

  const logout = async (): Promise<void> => {
    await logoutUser();
    socketService.disconnect();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    isAuthenticated: !!currentUser && !!userProfile?.isActive,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

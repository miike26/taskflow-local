import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Interface do Contexto
interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<User | void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// O Provider que vai envolver seu App
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const result = await signInWithPopup(auth, provider);
            const authUser = result.user;

            // Referência ao documento do usuário
            const userRef = doc(db, 'users', authUser.uid);
            const userSnap = await getDoc(userRef);

            // [CORREÇÃO] Se NÃO existe, CRIA os dados na hora (Login e Cadastro unificados)
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: authUser.uid,
                    email: authUser.email,
                    displayName: authUser.displayName,
                    photoURL: authUser.photoURL,
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                    appSettings: { 
                        disableOverdueColor: false, timeFormat: '24h', weekStart: 'monday', enableAi: true, enableAnimations: true 
                    },
                    notificationSettings: { 
                        enabled: true, remindDaysBefore: 1, taskReminders: true, habitReminders: true, marketingEmails: false 
                    },
                    hasCompletedOnboarding: false
                });
            } else {
                // Se já existe, só atualiza o último login
                await setDoc(userRef, { 
                    lastLoginAt: serverTimestamp() 
                }, { merge: true });
            }

            return authUser;
        } catch (error) {
            console.error("Erro no Auth:", error);
            // Se der erro, desloga para não ficar num estado inconsistente
            await signOut(auth); 
            throw error;
        }
    };

    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// O Hook para usar nos componentes
export const useAuth = () => useContext(AuthContext);
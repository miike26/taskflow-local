import { useState, useEffect } from 'react';
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
  serverTimestamp,
  writeBatch, // [NOVO] Import para escrita em lote
  collection // [NOVO] Import para referência de coleção
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
// [NOVO] Import das constantes para popular o banco

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
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

      const userRef = doc(db, 'users', authUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        throw new Error("Usuário não cadastrado. Crie uma conta primeiro.");
      }
      
      return authUser;

    } catch (error) {
      if (auth.currentUser) await signOut(auth);
      throw error;
    }
  };

const registerWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const authUser = result.user;

      const userRef = doc(db, 'users', authUser.uid);
      
      // Apenas cria o perfil básico. Nada de criar categorias aqui.
      await setDoc(userRef, {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        // Configurações iniciais são leves, pode manter
        appSettings: { 
            disableOverdueColor: false, timeFormat: '24h', weekStart: 'monday', enableAi: true, enableAnimations: true 
        },
        notificationSettings: { 
            enabled: true, remindDaysBefore: 1, taskReminders: true, habitReminders: true, marketingEmails: false 
        },
        hasCompletedOnboarding: false // Isso garante que o Wizard vai abrir
      }, { merge: true });

      setUser(authUser);
      return authUser;

    } catch (error) {
      console.error("Erro no cadastro:", error);
      if (auth.currentUser) await signOut(auth);
      throw error;
    }
  };

  const logout = async () => {
      await signOut(auth);
      setUser(null);
  };

  return { 
    user, 
    loading, 
    loginWithGoogle, 
    registerWithGoogle, 
    logout 
  };
}
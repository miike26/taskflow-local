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
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // Inicializamos como true para verificar a sessão ao carregar a página
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // REMOVIDO: setLoading(true); 
      // Não ativamos o loading global a cada mudança, para não desmontar a tela de login durante o processo.
      
      if (currentUser) {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUser(currentUser);
            } else {
                // Usuário logou no Google, mas não tem conta no sistema.
                // Mantemos user null para que a UI continue na tela de Login/Cadastro
                setUser(null);
            }
        } catch (error) {
            console.error("Erro ao verificar usuário:", error);
            setUser(null);
        }
      } else {
        setUser(null);
      }
      
      // Só sinalizamos que o carregamento INICIAL terminou
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

      // Verificação manual imediata para dar feedback rápido
      const userRef = doc(db, 'users', authUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Se não existir, desloga do Firebase Auth imediatamente
        await signOut(auth);
        throw new Error("Usuário não cadastrado. Crie uma conta primeiro.");
      }
      
      // Se sucesso, o onAuthStateChanged vai atualizar o user eventualmente,
      // mas podemos forçar aqui se quisermos agilidade, embora o listener seja rápido.
      return authUser;

    } catch (error) {
      // Garante logout se algo deu errado no meio do caminho
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
      
      await setDoc(userRef, {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });

      // Aqui forçamos o set para garantir que a UI atualize, 
      // já que o listener pode ter rodado antes do documento ser criado.
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
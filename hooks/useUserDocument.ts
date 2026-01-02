// hooks/useUserDocument.ts
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export function useUserDocument() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Escuta o documento do usuário em tempo real
  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        // Se o documento não existe, define como objeto vazio para não quebrar
        setData({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Função para atualizar o documento (faz merge, ou seja, atualiza só o que mudou)
  const updateDocument = useCallback(async (updates: any) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    try {
        await setDoc(docRef, updates, { merge: true });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
    }
  }, [user]);

  return { data, loading, updateDocument };
}
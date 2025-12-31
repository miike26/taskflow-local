import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

// Hook genérico para qualquer coleção (tasks, projects, categories...)
export function useFirestore<T extends { id: string }>(
  collectionName: string, 
  initialData: T[] = []
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  // 1. ESCUTAR DADOS EM TEMPO REAL
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Caminho: users/{userId}/{collectionName}
    // Ex: users/123xyz/tasks
    const q = query(collection(db, 'users', user.uid, collectionName));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as T);
      });
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Erro ao buscar ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, collectionName]);

  // 2. ADICIONAR (Criar ou Sobrescrever se ID existir)
  const add = useCallback(async (item: T) => {
    if (!user) return;
    try {
      // Usa o ID do item como ID do documento para facilitar
      const docRef = doc(db, 'users', user.uid, collectionName, item.id);
      await setDoc(docRef, item);
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      throw error;
    }
  }, [user, collectionName]);

  // 3. ATUALIZAR (Merge dos dados)
  const update = useCallback(async (id: string, updates: Partial<T>) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, collectionName, id);
      await updateDoc(docRef, updates as any);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      throw error;
    }
  }, [user, collectionName]);

  // 4. DELETAR
  const remove = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar:", error);
      throw error;
    }
  }, [user, collectionName]);

  // 5. OPERAÇÕES EM LOTE (Para o seu ListView)
  const updateBatch = useCallback(async (ids: string[], updates: Partial<T>) => {
    if (!user) return;
    // O Firestore executa promessas em paralelo
    const promises = ids.map(id => {
        const docRef = doc(db, 'users', user.uid, collectionName, id);
        return updateDoc(docRef, updates as any);
    });
    await Promise.all(promises);
  }, [user, collectionName]);

  const deleteBatch = useCallback(async (ids: string[]) => {
    if (!user) return;
    const promises = ids.map(id => {
        const docRef = doc(db, 'users', user.uid, collectionName, id);
        return deleteDoc(docRef);
    });
    await Promise.all(promises);
  }, [user, collectionName]);

  return { 
    data, 
    loading, 
    add, 
    update, 
    remove,
    updateBatch,
    deleteBatch
  };
}
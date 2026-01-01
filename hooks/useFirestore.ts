import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  writeBatch,
  getDocs,
  orderBy,              // <--- Importante: Isso estava faltando
  OrderByDirection,     // <--- Importante: Isso estava faltando
  where                 // <--- Importante: Para filtrar por usuário
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export function useFirestore<T extends { id: string }>(
  collectionName: string, 
  initialData: T[] = [],
  sortField?: string,                      // 3º Argumento novo
  sortDirection: OrderByDirection = 'asc'  // 4º Argumento novo
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  
  const hasCheckedSeed = useRef(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Referência base
    const colRef = collection(db, 'users', user.uid, collectionName);
    
    // --- QUERY COM ORDENAÇÃO ---
    let q;
    if (sortField) {
        // Se pediu ordenação, usamos orderBy
        q = query(colRef, orderBy(sortField, sortDirection));
    } else {
        // Se não, busca padrão
        q = query(colRef);
    }

    // Seed de dados iniciais (se banco vazio)
    const seedDataIfNeeded = async () => {
      if (hasCheckedSeed.current) return;
      
      try {
        const simpleQ = query(colRef); 
        const snapshot = await getDocs(simpleQ);

        if (snapshot.empty && initialData.length > 0) {
          console.log(`Coleção ${collectionName} vazia. Inserindo dados padrão...`);
          const batch = writeBatch(db);
          
          initialData.forEach((item, index) => {
            const docRef = doc(db, 'users', user.uid!, collectionName, item.id);
            // Adiciona ordem automaticamente se necessário
            const itemToSave = sortField === 'order' 
                ? { ...item, order: index } 
                : item;
            batch.set(docRef, itemToSave);
          });
          
          await batch.commit();
        }
        hasCheckedSeed.current = true;
      } catch (error) {
        console.error(`Erro ao verificar/popular ${collectionName}:`, error);
      }
    };

    seedDataIfNeeded();

    // Listener em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as T);
      });
      
      if (!snapshot.empty || hasCheckedSeed.current) {
          setData(items);
      } else if (snapshot.empty && initialData.length > 0) {
          setData(initialData);
      } else {
          setData([]);
      }
      
      setLoading(false);
    }, (error) => {
      console.error(`Erro ao buscar ${collectionName}:`, error);
      
      // DICA: Se der erro de índice no console do navegador, o link para criar aparecerá aqui
      if (error.code === 'failed-precondition') {
          console.warn("FALTA ÍNDICE NO FIRESTORE: Abra o console do navegador e clique no link fornecido pelo Firebase para criar o índice composto.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, collectionName, sortField, sortDirection]);

  // Funções de CRUD (add, update, remove...)
  const add = useCallback(async (item: T) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, collectionName, item.id);
      await setDoc(docRef, item);
    } catch (error) {
      console.error("Erro ao adicionar:", error);
    }
  }, [user, collectionName]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, collectionName, id);
      await updateDoc(docRef, updates as any);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  }, [user, collectionName]);

  const remove = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  }, [user, collectionName]);

  const updateBatch = useCallback(async (ids: string[], updates: Partial<T>) => {
    if (!user) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
        const docRef = doc(db, 'users', user.uid, collectionName, id);
        batch.update(docRef, updates as any);
    });
    await batch.commit();
  }, [user, collectionName]);

  const deleteBatch = useCallback(async (ids: string[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
        const docRef = doc(db, 'users', user.uid, collectionName, id);
        batch.delete(docRef);
    });
    await batch.commit();
  }, [user, collectionName]);

  return { data, loading, add, update, remove, updateBatch, deleteBatch };
}
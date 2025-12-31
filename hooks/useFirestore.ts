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
  getDocs
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
  
  // Ref para evitar loops de verificação
  const hasCheckedSeed = useRef(false);

  // 1. ESCUTAR DADOS EM TEMPO REAL E POPULAR SE NECESSÁRIO
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Define a referência da coleção do usuário
    const colRef = collection(db, 'users', user.uid, collectionName);
    const q = query(colRef);

    // Função para verificar e popular dados iniciais (Seed)
    const seedDataIfNeeded = async () => {
      if (hasCheckedSeed.current) return;
      
      try {
        const snapshot = await getDocs(q);
        // Se o banco estiver vazio E tivermos dados iniciais para inserir
        if (snapshot.empty && initialData.length > 0) {
          console.log(`Coleção ${collectionName} vazia. Inserindo dados padrão...`);
          const batch = writeBatch(db);
          
          initialData.forEach(item => {
            const docRef = doc(db, 'users', user.uid!, collectionName, item.id);
            batch.set(docRef, item);
          });
          
          await batch.commit();
          console.log(`Dados padrão de ${collectionName} inseridos com sucesso.`);
        }
        hasCheckedSeed.current = true;
      } catch (error) {
        console.error(`Erro ao verificar/popular ${collectionName}:`, error);
      }
    };

    // Executa a verificação de seed
    seedDataIfNeeded();

    // Listener em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as T);
      });
      
      // Só atualiza o estado se houver mudança ou se for a primeira carga
      // Isso evita flickers se o array vazio vier antes do seed
      if (!snapshot.empty || hasCheckedSeed.current) {
         setData(items);
      } else if (snapshot.empty && initialData.length > 0) {
         // Se está vazio mas estamos fazendo seed, mantemos o initialData visualmente até o banco responder
         setData(initialData);
      } else {
         setData([]);
      }
      
      setLoading(false);
    }, (error) => {
      console.error(`Erro ao buscar ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, collectionName]); // initialData removido das dependências para evitar re-loops

  // 2. ADICIONAR (Criar ou Sobrescrever se ID existir)
  const add = useCallback(async (item: T) => {
    if (!user) return;
    try {
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

  // 5. OPERAÇÕES EM LOTE
  const updateBatch = useCallback(async (ids: string[], updates: Partial<T>) => {
    if (!user) return;
    try {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, 'users', user.uid, collectionName, id);
            batch.update(docRef, updates as any);
        });
        await batch.commit();
    } catch (error) {
        console.error("Erro no updateBatch:", error);
    }
  }, [user, collectionName]);

  const deleteBatch = useCallback(async (ids: string[]) => {
    if (!user) return;
    try {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, 'users', user.uid, collectionName, id);
            batch.delete(docRef);
        });
        await batch.commit();
    } catch (error) {
        console.error("Erro no deleteBatch:", error);
    }
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
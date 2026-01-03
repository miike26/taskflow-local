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
  orderBy,
  OrderByDirection,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export function useFirestore<T extends { id: string }>(
  collectionName: string, 
  initialData: T[] = [],
  sortField?: string,
  sortDirection: OrderByDirection = 'asc'
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  
  const hasCheckedSeed = useRef(false);

  useEffect(() => {
    // Se não tiver usuário logado, limpa os dados e para o loading
    if (!user) {
      setData([]); // Garante que não sobram dados na tela de login
      setLoading(false);
      return;
    }

    // Referência base
    const colRef = collection(db, 'users', user.uid, collectionName);
    
    // --- QUERY COM ORDENAÇÃO ---
    let q;
    if (sortField) {
        q = query(colRef, orderBy(sortField, sortDirection));
    } else {
        q = query(colRef);
    }

// Seed de dados iniciais (se banco vazio)
    const seedDataIfNeeded = async () => {
      if (hasCheckedSeed.current) return;
      
      try {
        const simpleQ = query(colRef); 
        const snapshot = await getDocs(simpleQ);

        if (snapshot.empty && initialData.length > 0) {
          // console.log(`Coleção ${collectionName} vazia. Inserindo dados padrão...`);
          const batch = writeBatch(db);
          
          initialData.forEach((item, index) => {
            const docRef = doc(db, 'users', user.uid!, collectionName, item.id);
            
            // --- CORREÇÃO DE ÍCONES (Sanitização) ---
            // O Firestore não aceita funções/componentes React.
            // Removemos a propriedade 'icon' se ela for uma função.
            // Para as categorias, isso significa que elas serão salvas SEM ícone no banco.
            // O app precisará lidar com categorias sem ícone (mostrando um padrão) 
            // ou teremos que salvar uma string identificadora no futuro.
            
            // Cria uma cópia rasa para não alterar o original
            const { icon, ...rest } = item as any; 
            
            // Se tiver 'icon' e não for string (é função/componente), removemos do objeto a ser salvo
            const itemToSave = (typeof icon === 'function' || typeof icon === 'object') 
                ? { ...rest } // Salva sem o ícone
                : { ...item }; // Salva normal

            // Adiciona ordem automaticamente se necessário
            if (sortField === 'order') {
                (itemToSave as any).order = index;
            }

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
      
      if (error.code === 'failed-precondition') {
          console.warn("FALTA ÍNDICE NO FIRESTORE: Abra o console do navegador e clique no link fornecido pelo Firebase para criar o índice composto.");
      }
      setLoading(false);
    });

    return () => {
        // [CORREÇÃO] Limpeza crucial para evitar "Ghost Data" ao trocar de conta
        // Antes de desmontar ou trocar de usuário, limpamos o estado local.
        unsubscribe();
        setData([]); 
    };
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
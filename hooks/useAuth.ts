import { useState, useEffect } from 'react';
import { 
    signInWithPopup, 
    signOut as firebaseSignOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

export const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ouve as mudanças de estado da autenticação (login/logout)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser({
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Login com Google (Pop-up)
    const loginGoogle = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            return true;
        } catch (err: any) {
            console.error("Erro no login Google:", err);
            setError("Falha ao conectar. Tente novamente.");
            setLoading(false);
            return false;
        }
    };

    // Mantemos a função 'login' para compatibilidade, mas ela chama o Google agora
    const login = async (user?: string, pass?: string) => {
        // Se vier vazio (clique no botão Google), chama o fluxo real
        if (!user && !pass) {
            return await loginGoogle();
        }
        alert("Por favor, use o botão 'Conectar com Google'.");
        return false;
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (err) {
            console.error("Erro ao sair:", err);
        }
    };

    return { 
        isAuthenticated: !!user, 
        user, 
        loading,
        error,
        login, 
        loginGoogle, 
        logout 
    };
};
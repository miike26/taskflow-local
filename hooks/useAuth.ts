import { useLocalStorage } from './useLocalStorage';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);

    const login = (user: string, pass: string): boolean => {
        // Simulação de verificação de credenciais
        if (user === 'admin' && pass === 'admin') {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
    };

    return { isAuthenticated, login, logout };
};

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface User {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    xp: number;
    level: number;
    streak: number;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshProfile: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    // Initial check
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                // Configure default axios header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    // We interpret relative URLs as pointing to localhost:3000 in dev or use a config
                    // Ideally we should use an env var, but hardcoding for this project structure
                    const res = await axios.get('http://localhost:3000/api/v1/user/me');
                    setUser(res.data.user);
                } catch (e) {
                    console.error("Failed to fetch profile", e);
                    logout();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        toast.info("Logging out...", {
            duration: 1000,
        });
        setTimeout(() => {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
            window.location.href = "/"; // Reload page
        }, 1000);
    };

    const refreshProfile = async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:3000/api/v1/user/me');
            setUser(res.data.user);
        } catch (e) { console.error(e); }
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshProfile, isAuthenticated: !!user }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

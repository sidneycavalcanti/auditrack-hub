"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // ✅ Agora usando sonner

import { AuthUser, LoginCredentials } from "@/types";
import { authAPI, handleApiError } from "@/services/api";

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (credentials: LoginCredentials) => Promise<boolean>;
    signOut: () => void;
    updateUser: (userData: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    return ctx;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const token =
                    typeof window !== "undefined"
                        ? localStorage.getItem("auth_token")
                        : null;
                const userData =
                    typeof window !== "undefined"
                        ? localStorage.getItem("user_data")
                        : null;

                if (token && userData) {
                    const parsedUser = JSON.parse(userData);
                    const authUser = { ...parsedUser, token };
                    setUser(authUser);
                }
            } catch (error) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_data");
                }
                console.error("Erro ao inicializar autenticação:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const signIn = async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            setIsLoading(true);

            const response = await authAPI.signIn(credentials);
            const { token, user: userData } = response.data ?? {};

            if (token && userData) {
                const authUser: AuthUser = {
                    id: userData.id,
                    name: userData.name,
                    categoria: userData.categoria || "usuario",
                    token,
                };

                localStorage.setItem("auth_token", token);
                localStorage.setItem(
                    "user_data",
                    JSON.stringify({
                        id: authUser.id,
                        name: authUser.name,
                        categoria: authUser.categoria,
                    })
                );

                setUser(authUser);

                toast.success(`Bem-vindo(a), ${authUser.name}!`);
                return true;
            }

            throw new Error("Resposta inválida do servidor");
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage || "Erro no login");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
        }
        setUser(null);

        toast.success("Você foi desconectado com sucesso.");
        router.push("/login");
    };

    const updateUser = (userData: Partial<AuthUser>) => {
        if (!user) return;
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);

        localStorage.setItem(
            "user_data",
            JSON.stringify({
                id: updatedUser.id,
                name: updatedUser.name,
                categoria: updatedUser.categoria || "usuario",
            })
        );
    };

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isLoading,
            isAuthenticated: !!user,
            signIn,
            signOut,
            updateUser,
        }),
        [user, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
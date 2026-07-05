import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, useLogin, useLogout, User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutateAsync"];
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { data: me, isLoading: isLoadingMe, error } = useGetMe({
    query: {
      retry: false,
    }
  });
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (me) {
      setUser(me);
    } else if (error) {
      setUser(null);
    }
  }, [me, error]);

  const login = async (data: Parameters<typeof loginMutation.mutateAsync>[0]) => {
    const res = await loginMutation.mutateAsync(data);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
    setLocation("/login");
  };

  const isLoading = isLoadingMe || loginMutation.isPending || logoutMutation.isPending;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

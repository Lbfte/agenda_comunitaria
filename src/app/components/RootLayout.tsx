import { useState, useCallback } from "react";
import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { SplashScreen } from "./SplashScreen";
import { LoginPage } from "./LoginPage";
import { useAuth } from "../contexts/AuthContext";

export function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();

  const handleFinish = useCallback(() => setShowSplash(false), []);

  // Splash screen durante carregamento inicial
  if (showSplash || loading) {
    return <SplashScreen onFinish={handleFinish} />;
  }

  // Não autenticado → tela de login
  if (!user) {
    return <LoginPage />;
  }

  // Autenticado → app principal
  return (
    <div className="flex min-h-screen" style={{ background: "#1E1E1E" }}>
      {/* Sidebar — visible on md+ */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <main className="flex-1 flex flex-col overflow-auto w-full max-w-[1200px] mx-auto">
          <Outlet />
        </main>

        {/* BottomNav — visible on mobile only */}
        <BottomNav />
      </div>
    </div>
  );
}

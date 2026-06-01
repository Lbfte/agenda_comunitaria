"use client";

import React, { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { BottomNav } from "@/app/components/BottomNav";
import { SplashScreen } from "@/app/components/SplashScreen";
import { LoginPage } from "@/app/components/LoginPage";
import { useAuth } from "@/app/contexts/AuthContext";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Agenda da Turma - Home",
      "/tasks": "Agenda da Turma - Lista",
      "/social": "Agenda da Turma - Social",
      "/turmas": "Agenda da Turma - Turmas",
      "/history": "Agenda da Turma - Alertas",
      "/admin": "Agenda da Turma - Admin",
    };
    
    // Check if pathname matches any or starts with any (for subroutes)
    const exactTitle = titles[pathname];
    if (exactTitle) {
      document.title = exactTitle;
    } else if (pathname.startsWith("/tasks")) {
      document.title = titles["/tasks"];
    } else {
      document.title = "Agenda da Turma";
    }
  }, [pathname]);

  const handleFinish = useCallback(() => setShowSplash(false), []);

  if (showSplash || loading) {
    return <SplashScreen onFinish={handleFinish} />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "#1E1E1E" }}>
      {/* Sidebar — visible on md+ */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen relative overflow-hidden">
        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* BottomNav — visible on mobile only */}
        <BottomNav />
      </div>
    </div>
  );
}

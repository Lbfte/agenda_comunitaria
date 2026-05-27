"use client";

import React, { useState, useCallback } from "react";
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

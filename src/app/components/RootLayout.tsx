import { useState, useCallback } from "react";
import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";
import { SplashScreen } from "./SplashScreen";

export function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const handleFinish = useCallback(() => setShowSplash(false), []);

  return (
    <div className="flex justify-center min-h-screen" style={{ background: "#1E1E1E" }}>
      {showSplash && <SplashScreen onFinish={handleFinish} />}
      <div className="w-full max-w-[415px] min-h-screen relative flex flex-col overflow-hidden">
        <Outlet />
        <BottomNav />
      </div>
    </div>
  );
}

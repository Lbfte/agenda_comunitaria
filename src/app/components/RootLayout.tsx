import { useState, useCallback } from "react";
import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { SplashScreen } from "./SplashScreen";

export function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const handleFinish = useCallback(() => setShowSplash(false), []);

  return (
    <div className="flex min-h-screen" style={{ background: "#1E1E1E" }}>
      {showSplash && <SplashScreen onFinish={handleFinish} />}

      {/* Desktop Sidebar — hidden on mobile, visible lg+ */}
      <DesktopSidebar />

      {/* Main content area */}
      <div className="flex-1 min-h-screen relative flex flex-col overflow-hidden">
        <Outlet />

        {/* Bottom Nav — visible on mobile, hidden lg+ */}
        <BottomNav />
      </div>
    </div>
  );
}

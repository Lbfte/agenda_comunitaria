import { useState, useCallback } from "react";
import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";
import { SplashScreen } from "./SplashScreen";
import { DesktopNav } from "./DesktopNav";
import { WeekCalendar } from "./WeekCalendar";

export function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const handleFinish = useCallback(() => setShowSplash(false), []);

  return (
    <div className="flex justify-center min-h-screen" style={{ background: "#1E1E1E" }}>
      {showSplash && <SplashScreen onFinish={handleFinish} />}

      {/* Mobile: single column, max-w-[415px]. Desktop (lg+): full width 2-column. */}
      <div className="w-full lg:max-w-none max-w-[415px] min-h-screen relative flex flex-col lg:flex-row lg:overflow-hidden">
        {/* Desktop top-right nav floating */}
        <div className="hidden lg:flex absolute top-6 right-8 z-40">
          <DesktopNav />
        </div>

        {/* Left column (page content). On desktop, fixed width sidebar. */}
        <div className="w-full lg:w-[380px] lg:shrink-0 lg:h-screen lg:overflow-auto lg:border-r lg:border-[#222] flex flex-col">
          <Outlet />
        </div>

        {/* Right column (week calendar). Desktop only. */}
        <div className="hidden lg:flex flex-1 h-screen">
          <WeekCalendar />
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

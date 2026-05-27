"use client";

import { Home, Layers, FileText, Bell, MessageCircle, GraduationCap } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const mainItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Layers, label: "Cards", path: "/study" },
  { icon: FileText, label: "Lista", path: "/tasks" },
  { icon: MessageCircle, label: "Social", path: "/social" },
  { icon: GraduationCap, label: "Turmas", path: "/turmas" },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isNotification = pathname === "/history";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-4 pt-2 md:hidden">
      <div className="flex items-center gap-2 max-w-[500px] mx-auto">
        {/* Main nav pill */}
        <div
          className="flex-1 flex items-center justify-around h-[58px] rounded-[23px] px-2"
          style={{ background: "#292929" }}
        >
          {mainItems.map((item) => {
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-1.5 h-[44px] rounded-[23px] transition-all duration-300 ${
                  active ? "px-4" : "px-2"
                }`}
                style={active ? { background: "#7A8F6B" } : { background: "#222" }}
              >
                <item.icon size={16} strokeWidth={2} className={active ? "text-white" : "text-[#888]"} />
                {active && (
                  <span className="text-[12px] text-white font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification bell - separate pill */}
        <button
          onClick={() => router.push("/history")}
          className="w-[54px] h-[58px] rounded-[23px] flex items-center justify-center relative transition-all shrink-0"
          style={{ background: isNotification ? "#7A8F6B" : "#292929" }}
        >
          <div
            className="w-[42px] h-[44px] rounded-[18px] flex items-center justify-center"
            style={{ background: isNotification ? "#7A8F6B" : "#222" }}
          >
            <Bell size={16} strokeWidth={2} className={isNotification ? "text-white" : "text-[#888]"} />
          </div>
          {!isNotification && (
            <div className="absolute top-2.5 right-2.5 w-[14px] h-[14px] rounded-full bg-[#E85D5D] flex items-center justify-center">
              <span className="text-[8px] text-white">1</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

import { Home, Layers, FileText, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

const mainItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Layers, label: "Cards", path: "/study" },
  { icon: FileText, label: "Lista", path: "/tasks" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isNotification = location.pathname === "/social" || location.pathname === "/history";

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[415px] px-5 pb-4 pt-2">
      <div className="flex items-center gap-3">
        {/* Main nav pill */}
        <div
          className="flex-1 flex items-center justify-around h-[58px] rounded-[23px]"
          style={{ background: "#292929" }}
        >
          {mainItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 h-[44px] rounded-[23px] transition-all duration-300 ${
                  active ? "px-5" : "px-3"
                }`}
                style={active ? { background: "#7A8F6B" } : { background: "#222" }}
              >
                <item.icon size={18} strokeWidth={2} className={active ? "text-white" : "text-[#888]"} />
                {active && (
                  <span className="text-[14px] text-white">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification bell - separate pill */}
        <button
          onClick={() => navigate("/history")}
          className="w-[60px] h-[58px] rounded-[31px] flex items-center justify-center relative transition-all"
          style={{ background: isNotification ? "#7A8F6B" : "#292929" }}
        >
          <div
            className="w-[48px] h-[44px] rounded-[23px] flex items-center justify-center"
            style={{ background: isNotification ? "#7A8F6B" : "#222" }}
          >
            <Bell size={18} strokeWidth={2} className={isNotification ? "text-white" : "text-[#888]"} />
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

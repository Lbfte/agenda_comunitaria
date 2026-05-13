import { Home, Layers, FileText, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

const mainItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Layers, label: "Cards", path: "/study" },
  { icon: FileText, label: "Lista", path: "/tasks" },
];

export function DesktopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isNotification = location.pathname === "/history" || location.pathname === "/social";

  return (
    <div className="hidden lg:flex items-center gap-3">
      <div
        className="flex items-center gap-1.5 h-[52px] rounded-[26px] px-2"
        style={{ background: "#292929" }}
      >
        {mainItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2 h-[40px] rounded-[20px] transition-all ${
                active ? "px-5" : "px-3"
              }`}
              style={active ? { background: "#7A8F6B" } : { background: "transparent" }}
            >
              <item.icon size={18} strokeWidth={2} className={active ? "text-white" : "text-[#888]"} />
              {active && <span className="text-[14px] text-white">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/history")}
        className="h-[52px] rounded-[26px] flex items-center gap-2 relative transition-all px-4"
        style={{ background: isNotification ? "#7A8F6B" : "#292929" }}
      >
        <Bell size={18} strokeWidth={2} className={isNotification ? "text-white" : "text-[#aaa]"} />
        {isNotification && <span className="text-[14px] text-white">Notificação</span>}
        {!isNotification ? null : (
          <span className="absolute -top-1 -right-1 text-[10px] text-white bg-[#1E1E1E] w-[18px] h-[18px] rounded-full flex items-center justify-center">1</span>
        )}
      </button>
    </div>
  );
}

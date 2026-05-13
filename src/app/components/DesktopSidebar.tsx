import { useNavigate, useLocation } from "react-router";
import { Home, Layers, FileText, Bell, MessageSquare } from "lucide-react";
import { AppLogo } from "./AppLogo";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileText, label: "Tarefas", path: "/tasks" },
  { icon: Layers, label: "Study Hub", path: "/study" },
  { icon: MessageSquare, label: "Social", path: "/social" },
  { icon: Bell, label: "Notificações", path: "/history" },
];

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-[240px] min-h-screen border-r border-[rgba(255,255,255,0.06)] bg-[#191919] shrink-0">
      {/* Logo & Title */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <AppLogo size={32} />
        <span className="text-[15px] font-medium text-white tracking-wide font-[Comfortaa]">
          Agenda da Turma
        </span>
      </div>

      {/* Separator */}
      <div className="mx-5 h-[1px] bg-[rgba(255,255,255,0.06)] mb-4" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active = item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 h-[44px] px-4 rounded-[12px] text-[14px] transition-all duration-200 group ${
                active
                  ? "bg-[rgba(122,143,107,0.2)] text-white"
                  : "text-[#777] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#aaa]"
              }`}
            >
              <item.icon
                size={18}
                strokeWidth={2}
                className={`transition-colors ${
                  active ? "text-[#7A8F6B]" : "text-[#555] group-hover:text-[#777]"
                }`}
              />
              <span className="font-[Comfortaa]">{item.label}</span>
              {item.path === "/history" && (
                <div className="ml-auto w-[20px] h-[20px] rounded-full bg-[#E85D5D] flex items-center justify-center">
                  <span className="text-[9px] text-white font-medium">1</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-5 pb-6">
        <div className="h-[1px] bg-[rgba(255,255,255,0.06)] mb-4" />
        <div className="flex items-center gap-3 px-2">
          <div className="w-[34px] h-[34px] rounded-full bg-[#7A8F6B] flex items-center justify-center">
            <span className="text-[12px] text-white font-medium">US</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-white leading-tight">Usuário</span>
            <span className="text-[10px] text-[#555] leading-tight">Ciências da Comp</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Home, Layers, FileText, Bell, MessageCircle, LogOut, UserCheck, GraduationCap } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { AppLogo } from "./AppLogo";
import { useAuth } from "../../contexts/AuthContext";
import { useViewTurma } from "../../hooks/useViewTurma";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileText, label: "Lista", path: "/tasks" },
  { icon: MessageCircle, label: "Social", path: "/social" },
  { icon: GraduationCap, label: "Turmas", path: "/turmas" },
  { icon: Bell, label: "Alertas", path: "/history" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { activeTurmaName: turmaName } = useViewTurma(profile?.turma_id);

  const items = [...navItems];
  if (user?.email === "morcegosnaodormem@gmail.com") {
    items.push({ icon: UserCheck, label: "Solicitações", path: "/admin/requests" });
  }

  return (
      <aside className="hidden md:flex flex-col w-[72px] lg:w-[220px] h-screen sticky top-0 overflow-hidden bg-[#161616] border-r border-[rgba(255,255,255,0.06)] py-6 px-2 lg:px-4 shrink-0 transition-all duration-300">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 px-2 lg:px-3">
          <AppLogo size={32} />
          <span className="hidden lg:block text-[15px] text-white font-medium tracking-tight">
          Agenda da Turma
        </span>
        </div>

        {/* Navigation */}
        <nav aria-label="Navegação lateral principal" className="flex flex-col gap-1 flex-1">
          {items.map((item) => {
            const active = pathname === item.path;
            return (
                <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 h-[44px] rounded-xl transition-all duration-200 px-3 lg:px-4 group relative ${
                        active
                            ? "bg-[rgba(122,143,107,0.2)] text-white"
                            : "text-[#666] hover:text-[#999] hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[24px] rounded-r-full bg-[#7A8F6B]" />
              )}
              <item.icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                aria-hidden="true"
                className={`shrink-0 transition-colors ${active ? "text-[#7A8F6B]" : ""}`}
              />
              <span className="hidden lg:block text-[14px] truncate">
                {item.label}
              </span>
              {/* Notification badge for Alertas */}
              {item.path === "/history" && !active && (
                <div className="absolute top-2 right-2 lg:right-auto lg:left-7 lg:top-1.5 w-[8px] h-[8px] rounded-full bg-[#E85D5D]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="mt-auto px-2 lg:px-3">
        <div className="h-[1px] bg-[rgba(255,255,255,0.06)] mb-4" />
        <div className="hidden lg:flex items-center gap-3 mb-3">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: profile?.color || '#7A8F6B' }}
            aria-hidden="true"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" aria-hidden="true" />
            ) : (
              <span className="text-[11px] text-white font-medium">{profile?.initials || 'U'}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-[13px] text-white truncate">{profile?.full_name || 'Usuário'}</p>
            <p className="text-[11px] text-[#555] truncate">
              {user?.email === "morcegosnaodormem@gmail.com" ? "Administrador" : (turmaName || "Estudante")}
            </p>
          </div>
        </div>
        {/* Collapsed avatar for tablet */}
        <div className="flex lg:hidden justify-center mb-3">
          <div
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: profile?.color || '#7A8F6B' }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] text-white font-medium">{profile?.initials || 'U'}</span>
            )}
          </div>
        </div>
        {/* Logout button */}
        <button
          onClick={signOut}
          aria-label="Sair da conta"
          className="flex items-center gap-3 w-full h-[40px] rounded-xl px-3 lg:px-4 text-[#666] hover:text-[#E85D5D] hover:bg-[rgba(232,93,93,0.08)] transition-all duration-200"
        >
          <LogOut size={18} className="shrink-0" aria-hidden="true" />
          <span className="hidden lg:block text-[13px]">Sair</span>
        </button>
      </div>
    </aside>
  );
}

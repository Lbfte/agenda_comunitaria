import { AppLogo } from "./AppLogo";
import { useAuth } from "../../contexts/AuthContext";

type Tab = "geral" | "pessoal";

interface PageHeaderProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  /** Hide the logo on desktop (Sidebar already shows it) */
  hideLogo?: boolean;
  viewTurmaId?: string;
  setViewTurmaId?: (id: string) => void;
  hideTabs?: boolean;
  hideGeral?: boolean;
}

export function PageHeader({ tab, onTabChange, hideLogo = true, viewTurmaId, setViewTurmaId, hideTabs = false, hideGeral = false }: PageHeaderProps) {
  const { userTurmas, profile } = useAuth();

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-7 pb-2">
        {/* Logo: always on mobile, conditionally on desktop */}
        <div className={hideLogo ? "md:hidden" : ""}>
          <AppLogo size={28} />
        </div>
        {/* On desktop, fill the space where logo was */}
        {hideLogo && <div className="hidden md:block" />}

        <div className="flex items-center gap-2">
          {(tab === "geral" || hideTabs) && userTurmas && userTurmas.length > 1 && setViewTurmaId && (
            <select
              value={viewTurmaId || profile?.turma_id || ""}
              onChange={(e) => setViewTurmaId(e.target.value)}
              className="h-[33px] bg-[rgba(58,58,58,0.35)] border border-[#3a3a3a] rounded-2xl px-3 text-[13px] text-zinc-300 focus:outline-none focus:border-[#7A8F6B] transition-colors appearance-none cursor-pointer"
            >
              {hideTabs && <option value="all" className="bg-zinc-800 text-white">Todas as turmas</option>}
              {userTurmas.map(t => (
                <option key={t.id} value={t.id} className="bg-zinc-800 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {!hideTabs && (
            <>
              <button
                onClick={() => onTabChange("pessoal")}
                className={`h-[33px] px-5 rounded-2xl text-[14px] transition-all border ${
                  tab === "pessoal"
                    ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                    : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-[rgba(255,255,255,0.14)]"
                }`}
              >
                Pessoal
              </button>
              {!hideGeral && (
                <button
                  onClick={() => onTabChange("geral")}
                  className={`h-[33px] px-5 rounded-2xl text-[14px] transition-all border ${
                    tab === "geral"
                      ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                      : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-white"
                  }`}
                >
                  Geral
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="mx-4 h-[1px] bg-[#222] mb-6" />
    </>
  );
}

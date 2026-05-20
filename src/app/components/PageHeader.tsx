import { AppLogo } from "./AppLogo";

type Tab = "geral" | "pessoal";

interface PageHeaderProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  /** Hide the logo on desktop (Sidebar already shows it) */
  hideLogo?: boolean;
}

export function PageHeader({ tab, onTabChange, hideLogo = true }: PageHeaderProps) {
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
        </div>
      </div>
      <div className="mx-4 h-[1px] bg-[#222] mb-6" />
    </>
  );
}

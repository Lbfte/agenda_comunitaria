import { CATEGORY_FILTERS } from "@/lib/constants";

interface CategoryFilterProps {
  currentFilter: string;
  onFilterChange: (id: string) => void;
  variant?: "dashboard" | "tasks";
}

export function CategoryFilter({ currentFilter, onFilterChange, variant = "dashboard" }: CategoryFilterProps) {
  return (
    <>
      {CATEGORY_FILTERS.map(c => {
        const isActive = currentFilter === c.id;
        
        let className = "px-3 text-[11px] font-medium border select-none transition-all active:scale-95 flex items-center justify-center ";
        
        if (variant === "dashboard") {
          className += "h-7 rounded-full ";
          className += isActive
            ? "bg-[#7A8F6B] border-[#7A8F6B] text-zinc-950 font-semibold "
            : `bg-white/[0.02] ${c.color} `;
        } else {
          className += "h-8 rounded-xl ";
          className += isActive
            ? "bg-[#7A8F6B] border-[#7A8F6B] text-zinc-950 font-bold "
            : "bg-zinc-950 border-white/[0.04] text-zinc-400 hover:text-white ";
        }

        return (
          <button
            key={c.id}
            onClick={() => onFilterChange(c.id)}
            className={className.trim()}
          >
            {c.label}
          </button>
        );
      })}
    </>
  );
}

import { useState } from "react";
import { AppLogo } from "./AppLogo";
import { ChevronDown, X, MoreVertical, ArrowLeftRight } from "lucide-react";

type Card = { id: number; letter: string; label: string; color: string };

const cards: Card[] = [
  { id: 1, letter: "B", label: "Biologia", color: "#454545" },
  { id: 2, letter: "Q", label: "Quimica", color: "#454545" },
  { id: 3, letter: "M", label: "Matemática", color: "#454545" },
];

type FlashcardData = {
  question: string;
  answer: string;
};

const flashcardSets: Record<string, FlashcardData[]> = {
  Biologia: [
    { question: "O que é mitose?", answer: "Divisão celular que resulta em duas células filhas idênticas à célula-mãe." },
    { question: "O que são ribossomos?", answer: "Organelas responsáveis pela síntese de proteínas." },
  ],
  Quimica: [
    { question: "O que é pH?", answer: "Escala que mede o grau de acidez ou basicidade de uma solução." },
    { question: "O que é ligação covalente?", answer: "Ligação formada pelo compartilhamento de elétrons entre átomos." },
  ],
};

export function StudyHub() {
  const [tab, setTab] = useState<"geral" | "pessoal">("geral");
  const [studying, setStudying] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [timer] = useState("0:34");

  if (studying) {
    const set = flashcardSets[studying] || [];
    const current = set[cardIndex];

    return (
      <div className="flex-1 flex flex-col pb-24 overflow-auto">
        {/* Top */}
        <div className="flex items-center justify-between px-6 pt-7 pb-2">
          <AppLogo size={28} />
          <button onClick={() => { setStudying(null); setCardIndex(0); setFlipped(false); setCompleted(0); }}>
            <X size={20} className="text-[#888]" />
          </button>
        </div>
        <div className="mx-4 h-[1px] bg-[#222] mb-6" />

        <div className="px-7">
          <h2 className="text-[16px] text-white mb-1">Olá, Nome!</h2>
          <p className="text-[14px] text-[#707070] mb-5">
            você está em "Cards: perguntas"
          </p>

          {/* Controls */}
          <div className="flex items-center gap-2 mb-4">
            <button className="h-[28px] px-4 rounded-2xl bg-[#7A8F6B] text-[12px] text-white">
              Iniciar
            </button>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="h-[28px] px-3 rounded-2xl border border-[#3a3a3a] bg-[rgba(58,58,58,0.35)] text-[12px] text-white flex items-center gap-1"
            >
              Aleatorio <ChevronDown size={12} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-3">
            <span className="text-[12px] text-[#999]">⊘ Concluidas: {String(completed).padStart(2, "0")}/{String(set.length).padStart(2, "0")}</span>
            <span className="text-[12px] text-[#999]">⊘ Tempo: {timer}</span>
          </div>

          <div className="flex items-center gap-2 mb-5">
            <button className="h-[28px] px-3 rounded-2xl border border-[#3a3a3a] bg-[rgba(58,58,58,0.35)] text-[12px] text-white flex items-center gap-1">
              ✏ Editar <ChevronDown size={10} />
            </button>
            <button className="h-[28px] px-3 rounded-2xl border border-[#3a3a3a] bg-[rgba(58,58,58,0.35)] text-[12px] text-white flex items-center gap-1">
              ⊘ Limitar <ChevronDown size={10} />
            </button>
          </div>

          <div className="h-[1px] bg-[#222] mb-4" />

          {/* Flip button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setFlipped(!flipped)}
              className="h-[25px] px-3 rounded-[3px] text-[12px] text-white flex items-center gap-1"
              style={{ background: "#424C3B" }}
            >
              Virar card
            </button>
          </div>

          {/* Card content */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[16px] text-white">{studying}</h3>
            <ArrowLeftRight size={16} className="text-[#666]" />
          </div>

          <div
            className="rounded-[12px] p-5 min-h-[100px] mb-6 cursor-pointer active:scale-[0.98] transition-all"
            style={{ background: "rgba(58,58,58,0.5)" }}
            onClick={() => setFlipped(!flipped)}
          >
            {current ? (
              <>
                <p className="text-[16px] text-[rgba(255,255,255,0.6)] leading-relaxed">
                  {flipped ? current.answer : current.question}
                </p>
                {flipped && (
                  <p className="text-[13px] text-[#666] mt-2">Respostas aqui em baixo</p>
                )}
              </>
            ) : (
              <p className="text-[16px] text-[rgba(255,255,255,0.4)]">As perguntas aparecerão aqui!!</p>
            )}
          </div>

          {/* Difficulty buttons */}
          <div className="flex items-center gap-2 mb-2">
            {[
              { label: "De novo", time: "<1m", bg: "rgba(232,93,93,0.2)", border: "#E85D5D" },
              { label: "Dificil", time: "<6m", bg: "rgba(232,200,74,0.2)", border: "#E8C84A" },
              { label: "Bom", time: "<10m", bg: "rgba(122,143,107,0.2)", border: "#7A8F6B" },
              { label: "Facil", time: "4d", bg: "rgba(58,58,58,0.5)", border: "#555" },
            ].map((d, i) => (
              <button
                key={i}
                onClick={() => {
                  setCompleted(completed + 1);
                  setFlipped(false);
                  setCardIndex(Math.min(cardIndex + 1, set.length - 1));
                }}
                className="flex-1 flex flex-col items-center py-2 rounded-2xl border text-[12px]"
                style={{ background: d.bg, borderColor: d.border }}
              >
                <span className="text-white">{d.label}</span>
                <span className="text-[10px] text-[#666] mt-0.5">{d.time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-24 overflow-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 pt-7 pb-2">
        <AppLogo size={28} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("pessoal")}
            className={`h-[33px] px-5 rounded-2xl text-[14px] transition-all border ${
              tab === "pessoal"
                ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-[rgba(255,255,255,0.14)]"
            }`}
          >
            Pessoal
          </button>
          <button
            onClick={() => setTab("geral")}
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

      {/* Greeting */}
      <div className="px-7 mb-5">
        <h2 className="text-[16px] text-white">Olá, Nome!</h2>
        <p className="text-[14px] text-[#707070]">você está em "Cards"</p>
      </div>

      {/* Controls */}
      <div className="px-7 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => { if (cards.length > 0) setStudying(cards[0].label); }}
            className="h-[28px] px-4 rounded-2xl bg-[#7A8F6B] border border-[#7A8F6B] text-[12px] text-[rgba(255,255,255,0.76)]"
          >
            Iniciar
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="h-[28px] px-3 rounded-2xl border border-[#3a3a3a] bg-[rgba(58,58,58,0.35)] text-[11px] text-[rgba(255,255,255,0.76)] flex items-center gap-1"
            >
              Aleatorio <ChevronDown size={10} />
            </button>
            {showDropdown && (
              <div className="absolute top-9 left-0 bg-white rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                {cards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setStudying(c.label); setShowDropdown(false); }}
                    className="block w-full text-left px-4 py-2 text-[13px] text-[#333] hover:bg-gray-100"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1" />
          <span className="text-[13px] text-[#707070]">Ver mais...</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="px-7">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* New Card */}
          <div className="shrink-0">
            <div
              className="w-[100px] h-[141px] rounded-[9px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                background: "rgba(122,143,107,0.18)",
                border: "1px dashed #acc59b",
              }}
            >
              <span className="text-[35px] text-[#9bb489]">+</span>
            </div>
            <p className="text-[12px] text-[#7a8f6b] mt-2 text-center">Novo card</p>
          </div>

          {/* Subject Cards */}
          {cards.map((card) => (
            <div key={card.id} className="shrink-0">
              <button
                onClick={() => setStudying(card.label)}
                className="w-[100px] h-[141px] rounded-[9px] flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
                style={{
                  background: "rgba(40,40,40,0.41)",
                  border: "1px solid #282828",
                }}
              >
                {/* Geometric decoration */}
                <div className="absolute inset-0 overflow-hidden rounded-[9px]">
                  <svg className="absolute -bottom-2 -left-2 opacity-60" width="52" height="61" viewBox="0 0 52 61" fill="none">
                    <path d="M23.5 0L0 43V0H23.5Z" fill="#252525" />
                  </svg>
                  <svg className="absolute top-0 -right-1 opacity-30" width="33" height="31" viewBox="0 0 33 31" fill="none">
                    <path d="M33 0V31L0 21L33 0Z" fill="#2D2D2D" />
                  </svg>
                  <svg className="absolute bottom-2 right-2 opacity-50" width="36" height="21" viewBox="0 0 36 21" fill="none">
                    <path d="M0 21L18 0L36 21H0Z" fill="#252525" />
                  </svg>
                </div>
                <span className="text-[25px] text-[#454545] relative z-10">{card.letter}</span>
                <button
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={12} className="text-[#666]" />
                </button>
              </button>
              <p className="text-[12px] text-[#454545] mt-2 text-center">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

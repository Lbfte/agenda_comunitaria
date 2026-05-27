"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "./PageHeader";
import { ChevronDown, X, MoreVertical, ArrowLeftRight, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFlashcards } from "../hooks/useFlashcards";
import { FlashcardFolderModal } from "./FlashcardFolderModal";
import { FlashcardEditModal } from "./FlashcardEditModal";
import { getNextReviewLabel, type DifficultyButton } from "@/lib/spaced-repetition";
import type { Flashcard } from "@/lib/database.types";

export function StudyHub() {
  const [tab, setTab] = useState<"geral" | "pessoal">("geral");
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";

  const {
    folders,
    loadingFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    fetchDueCards,
    fetchCards,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
  } = useFlashcards(tab);

  // ─── Study Mode State ────────────────────────────────────
  const [studyingFolder, setStudyingFolder] = useState<{ id: string; name: string } | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [timerStart, setTimerStart] = useState<number>(0);
  const [elapsed, setElapsed] = useState("0:00");

  // ─── Modal State ─────────────────────────────────────────
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string; letter: string; color: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [editModalCards, setEditModalCards] = useState<Flashcard[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  // ─── Timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!studyingFolder) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - timerStart) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [studyingFolder, timerStart]);

  // ─── Start Study ─────────────────────────────────────────
  const startStudy = useCallback(async (folderId: string, folderName: string) => {
    const cards = await fetchDueCards(folderId);
    if (cards.length === 0) {
      const allCards = await fetchCards(folderId);
      setStudyCards(allCards);
    } else {
      setStudyCards(cards);
    }
    setStudyingFolder({ id: folderId, name: folderName });
    setCardIndex(0);
    setFlipped(false);
    setCompleted(0);
    setTimerStart(Date.now());
  }, [fetchDueCards, fetchCards]);

  const exitStudy = () => {
    setStudyingFolder(null);
    setStudyCards([]);
    setCardIndex(0);
    setFlipped(false);
    setCompleted(0);
  };

  // ─── Review Handler ──────────────────────────────────────
  const handleReview = async (difficulty: DifficultyButton) => {
    const current = studyCards[cardIndex];
    if (!current) return;

    await reviewCard(current, difficulty);
    setCompleted((c) => c + 1);
    setFlipped(false);

    if (cardIndex < studyCards.length - 1) {
      setCardIndex((i) => i + 1);
    }
  };

  // ─── Open Edit Modal ─────────────────────────────────────
  const openEditModal = async (folderId: string) => {
    const cards = await fetchCards(folderId);
    setEditModalCards(cards);
    setShowEditModal(folderId);
    setContextMenu(null);
  };

  // ─── Difficulty Button Data ──────────────────────────────
  const currentCard = studyCards[cardIndex];
  const getDiffButtons = () => {
    if (!currentCard) return [];
    const sm2Input = {
      interval_days: currentCard.interval_days,
      ease_factor: currentCard.ease_factor,
      repetitions: currentCard.repetitions,
    };
    return [
      { key: "de_novo" as DifficultyButton, label: "De novo", time: getNextReviewLabel(1, sm2Input), bg: "rgba(232,93,93,0.2)", border: "#E85D5D" },
      { key: "dificil" as DifficultyButton, label: "Difícil", time: getNextReviewLabel(3, sm2Input), bg: "rgba(232,200,74,0.2)", border: "#E8C84A" },
      { key: "bom" as DifficultyButton, label: "Bom", time: getNextReviewLabel(4, sm2Input), bg: "rgba(122,143,107,0.2)", border: "#7A8F6B" },
      { key: "facil" as DifficultyButton, label: "Fácil", time: getNextReviewLabel(5, sm2Input), bg: "rgba(58,58,58,0.5)", border: "#555" },
    ];
  };

  // ═══════════════════════════════════════════════════════════
  // STUDY MODE
  // ═══════════════════════════════════════════════════════════
  if (studyingFolder) {
    return (
      <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
        {/* Top */}
        <div className="flex items-center justify-between px-6 pt-7 pb-2">
          <div className="md:hidden">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="0" y="0" width="13" height="13" rx="5.85" fill="#FFFFD3" />
              <rect x="14" y="0" width="13" height="13" rx="5.85" fill="#3A3A3A" />
              <rect x="0" y="14" width="13" height="13" rx="5.85" fill="#7A8F6B" />
            </svg>
          </div>
          <div className="hidden md:block" />
          <button onClick={exitStudy}>
            <X size={20} className="text-[#888] hover:text-white transition-colors" />
          </button>
        </div>
        <div className="mx-4 h-[1px] bg-[#222] mb-6" />

        {/* Study content */}
        <div className="px-7 lg:max-w-[640px] lg:mx-auto lg:w-full">
          <h2 className="text-[16px] lg:text-[20px] text-white mb-1">Olá, {firstName}!</h2>
          <p className="text-[14px] text-[#707070] mb-5">
            você está em "Cards: perguntas"
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[12px] text-[#999]">
              ⊘ Concluidas: {String(completed).padStart(2, "0")}/{String(studyCards.length).padStart(2, "0")}
            </span>
            <span className="text-[12px] text-[#999]">⊘ Tempo: {elapsed}</span>
          </div>

          {/* Progress bar */}
          <div className="h-[3px] rounded-full bg-[#333] mb-5">
            <div
              className="h-full rounded-full bg-[#7A8F6B] transition-all duration-500"
              style={{ width: studyCards.length > 0 ? `${(completed / studyCards.length) * 100}%` : '0%' }}
            />
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
            <h3 className="text-[16px] text-white">{studyingFolder.name}</h3>
            <ArrowLeftRight size={16} className="text-[#666]" />
          </div>

          <div
            className="rounded-[12px] p-5 lg:p-8 min-h-[120px] lg:min-h-[180px] mb-6 cursor-pointer active:scale-[0.98] transition-all"
            style={{ background: "rgba(58,58,58,0.5)" }}
            onClick={() => setFlipped(!flipped)}
          >
            {currentCard ? (
              <>
                <p className="text-[11px] text-[#555] mb-2 uppercase tracking-wider">
                  {flipped ? "Resposta" : "Pergunta"}
                </p>
                <p className="text-[16px] lg:text-[18px] text-[rgba(255,255,255,0.7)] leading-relaxed">
                  {flipped ? currentCard.answer : currentCard.question}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[16px] text-[rgba(255,255,255,0.3)]">
                  {studyCards.length === 0 ? "Nenhum card nesta pasta!" : "Parabéns! Todos os cards foram revisados 🎉"}
                </p>
              </div>
            )}
          </div>

          {/* Difficulty buttons */}
          {currentCard && cardIndex < studyCards.length && (
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              {getDiffButtons().map((d) => (
                <button
                  key={d.key}
                  onClick={() => handleReview(d.key)}
                  className="flex-1 flex flex-col items-center py-2 lg:py-3 rounded-2xl border text-[12px] active:scale-95 transition-transform"
                  style={{ background: d.bg, borderColor: d.border }}
                >
                  <span className="text-white">{d.label}</span>
                  <span className="text-[10px] text-[#666] mt-0.5">{d.time}</span>
                </button>
              ))}
            </div>
          )}

          {/* Done state */}
          {completed > 0 && completed >= studyCards.length && (
            <div className="text-center py-6">
              <p className="text-[16px] text-[#7A8F6B] mb-2">Sessão concluída!</p>
              <p className="text-[13px] text-[#666] mb-4">
                {completed} card{completed > 1 ? "s" : ""} revisado{completed > 1 ? "s" : ""} em {elapsed}
              </p>
              <button
                onClick={exitStudy}
                className="h-[40px] px-6 rounded-2xl bg-[#7A8F6B] text-[14px] text-white active:scale-95 transition-transform"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FOLDER LIST MODE
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader tab={tab} onTabChange={setTab} />

      {/* Greeting */}
      <div className="px-7 mb-5">
        <h2 className="text-[16px] lg:text-[20px] text-white">Olá, {firstName}!</h2>
        <p className="text-[14px] text-[#707070]">você está em "Cards"</p>
      </div>

      {/* Controls */}
      <div className="px-7 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => {
              if (folders.length > 0) startStudy(folders[0].id, folders[0].name);
            }}
            className="h-[28px] px-4 rounded-2xl bg-[#7A8F6B] border border-[#7A8F6B] text-[12px] text-[rgba(255,255,255,0.76)]"
          >
            Iniciar
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="h-[28px] px-3 rounded-2xl border border-[#3a3a3a] bg-[rgba(58,58,58,0.35)] text-[11px] text-[rgba(255,255,255,0.76)] flex items-center gap-1"
            >
              Escolher <ChevronDown size={10} />
            </button>
            {showDropdown && (
              <div className="absolute top-9 left-0 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { startStudy(f.id, f.name); setShowDropdown(false); }}
                    className="block w-full text-left px-4 py-2 text-[13px] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.06)]"
                  >
                    {f.name}
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="px-4 py-2 text-[12px] text-[#555]">Nenhuma pasta</p>
                )}
              </div>
            )}
          </div>
          <div className="flex-1" />
          <span className="text-[13px] text-[#707070]">{folders.length} pasta{folders.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="px-7">
        {loadingFolders ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#333] border-t-[#7A8F6B] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto lg:overflow-visible pb-2">
            {/* New Folder Card */}
            <div className="shrink-0 lg:shrink">
              <div
                className="w-[100px] lg:w-full h-[141px] rounded-[9px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                style={{ background: "rgba(122,143,107,0.18)", border: "1px dashed #acc59b" }}
                onClick={() => setShowFolderModal(true)}
              >
                <span className="text-[35px] text-[#9bb489]">+</span>
              </div>
              <p className="text-[12px] text-[#7a8f6b] mt-2 text-center">Novo card</p>
            </div>

            {/* Folder Cards */}
            {folders.map((folder) => (
              <div key={folder.id} className="shrink-0 lg:shrink relative">
                <button
                  onClick={() => startStudy(folder.id, folder.name)}
                  className="w-[100px] lg:w-full h-[141px] rounded-[9px] flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
                  style={{ background: "rgba(40,40,40,0.41)", border: "1px solid #282828" }}
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
                  <span className="text-[25px] relative z-10" style={{ color: folder.color }}>{folder.letter || folder.name.charAt(0)}</span>
                </button>
                {/* Context menu trigger */}
                <button
                  className="absolute top-2 right-2 z-10 p-1"
                  onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === folder.id ? null : folder.id); }}
                >
                  <MoreVertical size={12} className="text-[#666]" />
                </button>
                {/* Context menu */}
                {contextMenu === folder.id && (
                  <div className="absolute top-8 right-0 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl z-20 py-1 min-w-[130px]">
                    <button
                      onClick={() => openEditModal(folder.id)}
                      className="block w-full text-left px-4 py-2 text-[12px] text-white hover:bg-[rgba(255,255,255,0.06)]"
                    >
                      ✏️ Editar cards
                    </button>
                    <button
                      onClick={() => {
                        setEditingFolder({
                          id: folder.id,
                          name: folder.name,
                          letter: folder.letter || "",
                          color: folder.color,
                        });
                        setContextMenu(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-[12px] text-white hover:bg-[rgba(255,255,255,0.06)]"
                    >
                      ✏️ Editar pasta
                    </button>
                    <button
                      onClick={async () => { await deleteFolder(folder.id); setContextMenu(null); }}
                      className="block w-full text-left px-4 py-2 text-[12px] text-[#E85D5D] hover:bg-[rgba(232,93,93,0.1)]"
                    >
                      🗑️ Excluir pasta
                    </button>
                  </div>
                )}
                <p className="text-[12px] text-[#454545] mt-2 text-center">{folder.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showFolderModal && (
        <FlashcardFolderModal
          onSubmit={async (data) => {
            await createFolder(data, tab === "geral" ? profile?.turma_id : undefined);
            setShowFolderModal(false);
          }}
          onClose={() => setShowFolderModal(false)}
        />
      )}

      {editingFolder && (
        <FlashcardFolderModal
          editData={{
            name: editingFolder.name,
            letter: editingFolder.letter,
            color: editingFolder.color,
          }}
          onSubmit={async (data) => {
            await updateFolder(editingFolder.id, data);
            setEditingFolder(null);
          }}
          onClose={() => setEditingFolder(null)}
        />
      )}

      {showEditModal && (
        <FlashcardEditModal
          folderId={showEditModal}
          folderName={folders.find((f) => f.id === showEditModal)?.name || ""}
          cards={editModalCards}
          onCreateCard={createCard}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onClose={() => setShowEditModal(null)}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface CardEditModalProps {
  folderId: string;
  folderName: string;
  cards: { id: string; question: string; answer: string }[];
  onCreateCard: (folderId: string, question: string, answer: string) => Promise<unknown>;
  onUpdateCard: (cardId: string, updates: { question?: string; answer?: string }) => Promise<boolean>;
  onDeleteCard: (cardId: string) => Promise<boolean>;
  onClose: () => void;
}

export function FlashcardEditModal({
  folderId,
  folderName,
  cards,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onClose,
}: CardEditModalProps) {
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [localCards, setLocalCards] = useState(cards);

  const handleCreate = async () => {
    if (!newQ.trim() || !newA.trim()) return;
    const result = await onCreateCard(folderId, newQ.trim(), newA.trim());
    if (result) {
      setLocalCards((prev) => [...prev, { id: (result as { id: string }).id || crypto.randomUUID(), question: newQ.trim(), answer: newA.trim() }]);
      setNewQ('');
      setNewA('');
    }
  };

  const handleUpdate = async (cardId: string) => {
    if (!editQ.trim() || !editA.trim()) return;
    const ok = await onUpdateCard(cardId, { question: editQ.trim(), answer: editA.trim() });
    if (ok) {
      setLocalCards((prev) =>
        prev.map((c) => c.id === cardId ? { ...c, question: editQ.trim(), answer: editA.trim() } : c)
      );
      setEditingId(null);
    }
  };

  const handleDelete = async (cardId: string) => {
    const ok = await onDeleteCard(cardId);
    if (ok) {
      setLocalCards((prev) => prev.filter((c) => c.id !== cardId));
    }
  };

  const startEdit = (card: typeof cards[0]) => {
    setEditingId(card.id);
    setEditQ(card.question);
    setEditA(card.answer);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-[520px] max-h-[80vh] rounded-2xl p-6 z-10 flex flex-col"
        style={{ background: '#2A2A2A', border: '1px solid #3a3a3a' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] text-white">
            Editar Cards — {folderName}
          </h3>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Add new card */}
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(122,143,107,0.1)', border: '1px dashed rgba(122,143,107,0.3)' }}>
          <p className="text-[12px] text-[#7A8F6B] mb-2">Novo card</p>
          <input
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            placeholder="Pergunta..."
            className="w-full h-[38px] rounded-lg px-3 text-[13px] text-white placeholder-[#555] outline-none mb-2"
            style={{ background: '#222' }}
          />
          <input
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
            placeholder="Resposta..."
            className="w-full h-[38px] rounded-lg px-3 text-[13px] text-white placeholder-[#555] outline-none mb-2"
            style={{ background: '#222' }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={!newQ.trim() || !newA.trim()}
            className="h-[34px] px-4 rounded-xl bg-[#7A8F6B] text-[12px] text-white flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-40"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {/* Card list */}
        <div className="flex-1 overflow-auto space-y-2">
          {localCards.length === 0 && (
            <p className="text-[13px] text-[#555] text-center py-6">
              Nenhum card ainda. Adicione o primeiro acima!
            </p>
          )}
          {localCards.map((card) => (
            <div
              key={card.id}
              className="rounded-xl p-3 group"
              style={{ background: 'rgba(42,42,42,0.6)' }}
            >
              {editingId === card.id ? (
                <div className="space-y-2">
                  <input
                    value={editQ}
                    onChange={(e) => setEditQ(e.target.value)}
                    className="w-full h-[34px] rounded-lg px-3 text-[13px] text-white outline-none"
                    style={{ background: '#222' }}
                  />
                  <input
                    value={editA}
                    onChange={(e) => setEditA(e.target.value)}
                    className="w-full h-[34px] rounded-lg px-3 text-[13px] text-white outline-none"
                    style={{ background: '#222' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(card.id)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(card.id)} className="h-[30px] px-3 rounded-lg bg-[#7A8F6B] text-[11px] text-white">Salvar</button>
                    <button onClick={() => setEditingId(null)} className="h-[30px] px-3 rounded-lg bg-[#333] text-[11px] text-[#999]">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => startEdit(card)}>
                    <p className="text-[13px] text-white mb-1">{card.question}</p>
                    <p className="text-[12px] text-[#666]">{card.answer}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 p-1"
                  >
                    <Trash2 size={14} className="text-[#E85D5D]" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-[#333]">
          <p className="text-[11px] text-[#555] text-center">
            {localCards.length} card{localCards.length !== 1 ? 's' : ''} nesta pasta
          </p>
        </div>
      </div>
    </div>
  );
}

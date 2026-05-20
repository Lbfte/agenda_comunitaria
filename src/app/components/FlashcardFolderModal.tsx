import { useState } from 'react';
import { X } from 'lucide-react';

interface FolderModalProps {
  onSubmit: (data: { name: string; letter: string; color: string }) => void;
  onClose: () => void;
  editData?: { name: string; letter: string; color: string };
}

const colorOptions = [
  '#454545', '#7A8F6B', '#8F6B8A', '#5B8DEF', '#E8C84A', '#E85D5D', '#C77DFF',
];

export function FlashcardFolderModal({ onSubmit, onClose, editData }: FolderModalProps) {
  const [name, setName] = useState(editData?.name || '');
  const [letter, setLetter] = useState(editData?.letter || '');
  const [color, setColor] = useState(editData?.color || '#454545');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      letter: letter.trim() || name.charAt(0).toUpperCase(),
      color,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-[380px] rounded-2xl p-6 z-10"
        style={{ background: '#2A2A2A', border: '1px solid #3a3a3a' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] text-white">
            {editData ? 'Editar Pasta' : 'Nova Pasta de Cards'}
          </h3>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] text-[#999] block mb-1">Nome da matéria *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Biologia"
              className="w-full h-[42px] rounded-xl px-4 text-[14px] text-white placeholder-[#555] outline-none"
              style={{ background: '#222' }}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[12px] text-[#999] block mb-1">Letra do card</label>
            <input
              value={letter}
              onChange={(e) => setLetter(e.target.value.slice(0, 2).toUpperCase())}
              placeholder={name ? name.charAt(0).toUpperCase() : 'B'}
              maxLength={2}
              className="w-[60px] h-[42px] rounded-xl px-4 text-[14px] text-white placeholder-[#555] outline-none text-center"
              style={{ background: '#222' }}
            />
          </div>

          <div>
            <label className="text-[12px] text-[#999] block mb-1">Cor</label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-[32px] h-[32px] rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2A2A2A]' : ''
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex justify-center py-3">
            <div
              className="w-[80px] h-[110px] rounded-[9px] flex items-center justify-center"
              style={{ background: 'rgba(40,40,40,0.41)', border: '1px solid #282828' }}
            >
              <span className="text-[22px]" style={{ color }}>{letter || name.charAt(0).toUpperCase() || '?'}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full h-[46px] rounded-2xl bg-[#7A8F6B] text-[14px] text-white font-medium active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {editData ? 'Salvar' : 'Criar Pasta'}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useAuth } from "../../contexts/AuthContext";

interface TaskCreateModalProps {
  onSubmit: (data: TaskFormData) => void;
  onClose: () => void;
  channel: 'geral' | 'pessoal';
  editData?: TaskFormData;
}

export interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  period: 'manha' | 'tarde' | 'noite' | '';
  shape: 'triangle' | 'invTriangle';
  shape_color: string;
  turma_id?: string;
}

const periodOptions = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

const colorOptions = [
  '#7A8F6B', '#E85D5D', '#5B8DEF', '#E8C84A', '#C77DFF', '#666',
];

export function TaskCreateModal({ onSubmit, onClose, channel, editData }: TaskCreateModalProps) {
  const { userTurmas, profile } = useAuth();
  
  const [form, setForm] = useState<TaskFormData>(editData || {
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    period: '',
    shape: 'triangle',
    shape_color: '#666',
    turma_id: profile?.turma_id || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  const update = (field: keyof TaskFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[440px] rounded-2xl p-6 z-10"
        style={{ background: '#2A2A2A', border: '1px solid #3a3a3a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] text-white">
            {editData ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] px-2 py-0.5 rounded"
              style={{
                background: channel === 'geral' ? 'rgba(122,143,107,0.15)' : 'rgba(143,107,138,0.15)',
                color: channel === 'geral' ? '#7A8F6B' : '#8F6B8A',
              }}
            >
              {channel === 'geral' ? 'Turma' : 'Pessoal'}
            </span>
            <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Turma Destino Selector */}
          {channel === 'geral' && userTurmas.length > 1 && (
            <div>
              <label className="text-[12px] text-[#999] block mb-1">Turma Destino</label>
              <select
                value={form.turma_id || profile?.turma_id || ""}
                onChange={(e) => update('turma_id', e.target.value)}
                className="w-full h-[42px] rounded-xl px-4 text-[13px] text-white outline-none cursor-pointer border border-[#333]"
                style={{ background: '#222' }}
              >
                {userTurmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[12px] text-[#999] block mb-1">Título *</label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Ex: Prova de Cálculo"
              className="w-full h-[42px] rounded-xl px-4 text-[14px] text-white placeholder-[#555] outline-none"
              style={{ background: '#222' }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] text-[#999] block mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Detalhes da tarefa..."
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#555] outline-none resize-none"
              style={{ background: '#222' }}
            />
          </div>

          {/* Date + Time row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[12px] text-[#999] block mb-1">Data</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => update('due_date', e.target.value)}
                className="w-full h-[42px] rounded-xl px-4 text-[13px] text-white outline-none [color-scheme:dark]"
                style={{ background: '#222' }}
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-[#999] block mb-1">Horário</label>
              <input
                type="time"
                value={form.due_time}
                onChange={(e) => update('due_time', e.target.value)}
                className="w-full h-[42px] rounded-xl px-4 text-[13px] text-white outline-none [color-scheme:dark]"
                style={{ background: '#222' }}
              />
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="text-[12px] text-[#999] block mb-1">Período</label>
            <div className="flex gap-2">
              {periodOptions.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => update('period', form.period === p.value ? '' : p.value)}
                  className={`flex-1 h-[36px] rounded-xl text-[12px] transition-all border ${
                    form.period === p.value
                      ? 'bg-[rgba(122,143,107,0.2)] border-[#7A8F6B] text-white'
                      : 'bg-[#222] border-[#333] text-[#888]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shape + Color */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[12px] text-[#999] block mb-1">Marcador</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update('shape', 'triangle')}
                  className={`w-[42px] h-[36px] rounded-xl flex items-center justify-center border transition-all ${
                    form.shape === 'triangle' ? 'border-[#7A8F6B]' : 'border-[#333]'
                  }`}
                  style={{ background: '#222' }}
                >
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M6 0L12 10H0L6 0Z" fill={form.shape_color} />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => update('shape', 'invTriangle')}
                  className={`w-[42px] h-[36px] rounded-xl flex items-center justify-center border transition-all ${
                    form.shape === 'invTriangle' ? 'border-[#7A8F6B]' : 'border-[#333]'
                  }`}
                  style={{ background: '#222' }}
                >
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M6 10L0 0H12L6 10Z" fill={form.shape_color} />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-[12px] text-[#999] block mb-1">Cor</label>
              <div className="flex gap-1.5">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update('shape_color', c)}
                    className={`w-[28px] h-[28px] rounded-full transition-all ${
                      form.shape_color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2A2A2A]' : ''
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!form.title.trim()}
            className="w-full h-[46px] rounded-2xl bg-[#7A8F6B] text-[14px] text-white font-medium active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editData ? 'Salvar Alterações' : 'Criar Tarefa'}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";
import { supabase } from "../../lib/supabase";

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [turmas, setTurmas] = useState<{ id: string; name: string }[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadTurmas() {
      try {
        const { data, error } = await supabase
          .from("turmas")
          .select("id, name")
          .order("name", { ascending: true });
        if (error) {
          console.error("Erro ao carregar turmas:", error);
        } else if (data) {
          setTurmas(data);
          if (data.length > 0) {
            setSelectedTurmaId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar turmas:", err);
      }
    }
    loadTurmas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    let error;
    if (isSignUp) {
      if (!fullName.trim()) {
        setFormError("O nome é obrigatório para cadastro.");
        setIsSubmitting(false);
        return;
      }
      if (selectedTurmaId) {
        localStorage.setItem("pending_turma_id", selectedTurmaId);
      }
      const res = await signUpWithEmail(email, password, fullName);
      error = res.error;
    } else {
      const res = await signInWithEmail(email, password);
      error = res.error;
    }

    if (error) {
      // Traduzir erros comuns
      if (error.message.includes("Invalid login credentials")) {
        setFormError("E-mail ou senha incorretos.");
      } else if (error.message.includes("User already registered")) {
        setFormError("Este e-mail já está em uso.");
      } else {
        setFormError(error.message);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#1E1E1E" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[380px] flex flex-col items-center py-10"
      >
        {/* Logo animado */}
        <div className="mb-6">
          <div className="relative" style={{ width: 86, height: 86 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              className="absolute"
              style={{ left: 0, top: 0, width: 42, height: 42, borderRadius: 14, background: "#FFFFD3" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
              className="absolute"
              style={{ left: 46, top: 0, width: 42, height: 42, borderRadius: 14, background: "#3A3A3A" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
              className="absolute"
              style={{ left: 0, top: 46, width: 42, height: 42, borderRadius: 14, background: "#7A8F6B" }}
            />
          </div>
        </div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-[24px] text-white font-medium mb-1 text-center"
        >
          Agenda da Turma
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-[14px] text-[#707070] mb-8 text-center leading-relaxed"
        >
          {isSignUp ? "Crie sua conta para começar" : "Acesse sua conta para continuar"}
        </motion.p>

        {/* Formulário */}
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          onSubmit={handleSubmit} 
          className="w-full flex flex-col gap-4 mb-5"
        >
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[52px] rounded-2xl px-4 text-white placeholder-[#707070] outline-none transition-all focus:border-[#7A8F6B]"
                style={{ background: "rgba(58,58,58,0.5)", border: "1px solid #3a3a3a" }}
              />

              {turmas.length > 0 && (
                <div className="flex flex-col gap-1 w-full text-left">
                  <span className="text-[12px] text-[#A0A0A0] pl-1 font-medium">Selecione sua Turma</span>
                  <select
                    value={selectedTurmaId}
                    onChange={(e) => setSelectedTurmaId(e.target.value)}
                    required
                    className="w-full h-[52px] rounded-2xl px-4 text-white outline-none transition-all focus:border-[#7A8F6B] cursor-pointer"
                    style={{ background: "rgba(58,58,58,0.5)", border: "1px solid #3a3a3a" }}
                  >
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id} style={{ background: "#1E1E1E", color: "white" }}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-[52px] rounded-2xl px-4 text-white placeholder-[#707070] outline-none transition-all focus:border-[#7A8F6B]"
            style={{ background: "rgba(58,58,58,0.5)", border: "1px solid #3a3a3a" }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-[52px] rounded-2xl px-4 text-white placeholder-[#707070] outline-none transition-all focus:border-[#7A8F6B]"
            style={{ background: "rgba(58,58,58,0.5)", border: "1px solid #3a3a3a" }}
          />

          {formError && (
            <div className="text-red-400 text-[13px] text-center mt-1">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center mt-2 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-50 text-white font-medium text-[15px]"
            style={{ background: "#7A8F6B" }}
          >
            {isSubmitting ? "Aguarde..." : (isSignUp ? "Criar Conta" : "Entrar")}
          </button>
        </motion.form>

        {/* Toggle Login/Signup */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setFormError(null);
          }}
          className="text-[13px] text-[#A0A0A0] hover:text-white transition-colors mb-6"
        >
          {isSignUp ? "Já tem uma conta? Faça login" : "Não tem conta? Crie uma agora"}
        </motion.button>

        {/* Divisor */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="w-full flex items-center gap-4 mb-6"
        >
          <div className="flex-1 h-[1px] bg-[#3a3a3a]"></div>
          <span className="text-[12px] text-[#707070]">ou</span>
          <div className="flex-1 h-[1px] bg-[#3a3a3a]"></div>
        </motion.div>

        {/* Botão Google Login */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          onClick={signInWithGoogle}
          disabled={loading || isSubmitting}
          className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-[#2a2a2a] disabled:opacity-50"
          style={{ background: "transparent", border: "1px solid #3a3a3a" }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span className="text-[14px] text-[#d0d0d0] font-medium">
            Continuar com Google
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}

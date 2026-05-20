import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";

/**
 * Rota /auth/callback
 * O Supabase redireciona para cá após o login OAuth.
 * Este componente extrai a sessão da URL e redireciona para o dashboard.
 */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erro ao processar callback OAuth:", error.message);
      }
      // Redireciona para a home independente — o AuthProvider já terá a sessão
      navigate("/", { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#1E1E1E" }}>
      <div className="flex flex-col items-center gap-4">
        {/* Spinner simples */}
        <div
          className="w-8 h-8 border-2 border-[#333] border-t-[#7A8F6B] rounded-full animate-spin"
        />
        <p className="text-[14px] text-[#707070]">Autenticando...</p>
      </div>
    </div>
  );
}

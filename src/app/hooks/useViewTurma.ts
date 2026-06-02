import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useViewTurma(profileTurmaId: string | null | undefined, onNoTurma?: () => void) {
  const [viewTurmaId, setViewTurmaId] = useState<string | null>(null);
  const [activeTurmaName, setActiveTurmaName] = useState<string>("");

  useEffect(() => {
    if (profileTurmaId) {
      setViewTurmaId(profileTurmaId);
      
      if (!activeTurmaName) {
        (supabase as any)
          .from("turmas")
          .select("name")
          .eq("id", profileTurmaId)
          .single()
          .then(({ data }: { data: any }) => {
            if (data) setActiveTurmaName(data.name);
          });
      }
    } else {
      setViewTurmaId(null);
      setActiveTurmaName("");
      if (onNoTurma) onNoTurma();
    }
  }, [profileTurmaId, activeTurmaName, onNoTurma]);

  return { viewTurmaId, setViewTurmaId, activeTurmaName };
}

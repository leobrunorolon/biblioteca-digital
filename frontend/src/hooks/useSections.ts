import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import type { Section } from "../types";

function mapSection(s: any): Section {
  return {
    id:          s.id,
    name:        s.name,
    description: s.description,
    icon:        s.icon,
    color:       s.color,
    tier:        s.tier,
    isActive:    s.is_active,
    createdBy:   s.created_by,
    createdAt:   s.created_at,
    updatedAt:   s.updated_at,
  };
}

export function useSections() {
  return useQuery({
    queryKey: ["sections"],
    queryFn: async (): Promise<Section[]> => {
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .eq("is_active", true)
        .order("tier")   // aprendiz → companero → maestro
        .order("name");

      if (error) throw error;

      return (data ?? []).map(mapSection);
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Secciones agrupadas por tier (útil para mostrar en la UI)
export function useSectionsByTier() {
  const query = useSections();

  const grouped = {
    aprendiz:  (query.data ?? []).filter((s) => s.tier === "aprendiz"),
    companero: (query.data ?? []).filter((s) => s.tier === "companero"),
    maestro:   (query.data ?? []).filter((s) => s.tier === "maestro"),
  };

  return { ...query, grouped };
}

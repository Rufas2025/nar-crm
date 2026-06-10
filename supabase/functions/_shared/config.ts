import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { EvolutionConfig } from "./evolutionGoClient.ts";

/** Carrega a configuração da Evolution GO do usuário autenticado a partir de `evolution_config`. */
export async function loadEvolutionConfig(supabase: SupabaseClient, userId: string): Promise<EvolutionConfig | null> {
  const { data, error } = await supabase
    .from("evolution_config")
    .select("api_url, api_key, instance_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { apiUrl: data.api_url, apiKey: data.api_key, instanceName: data.instance_name };
}

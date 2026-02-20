import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://szdpzatugxkhaocdsfdc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Tufx7JnQ0snrfrPo3XCnGQ_UznvEfZX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Lead = {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  inep: string | null;
  lead_status: string;
  valor: number | null;
  notas: string | null;
  cidade: string | null;
  uf: string | null;
  maturidade_decisao: string | null;
  score_estrategico: number | null;
  proximo_passo: string | null;
  data_decisao_prevista: string | null;
  ultimo_contato_at: string | null;
  stakeholders_mapeados: boolean | null;
  created_at: string;
  updated_at: string | null;
};

export type LeadProduct = {
  id: string;
  lead_id: string;
  produto: string;
  created_at: string;
};

export type Interaction = {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  note: string;
  created_at: string;
};

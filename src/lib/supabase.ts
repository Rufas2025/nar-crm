import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://szdpzatugxkhaocdsfdc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Tufx7JnQ0snrfrPo3XCnGQ_UznvEfZX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Lead = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Interaction = {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  note: string;
  created_at: string;
};

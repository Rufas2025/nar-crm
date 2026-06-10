import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

// Projeto Supabase do CRM (onde ficam auth, leads e activities)
const CRM_URL = "https://szdpzatugxkhaocdsfdc.supabase.co";
const CRM_ANON_KEY = "sb_publishable_Tufx7JnQ0snrfrPo3XCnGQ_UznvEfZX";

function responseJson(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanMessage(value: unknown) {
  const message = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return message.replace(/apikey\s*[:=]\s*[^\s,}"']+/gi, "apikey: ***").slice(0, 500);
}

async function getCrmUserId(authToken: string): Promise<string | null> {
  try {
    const resp = await fetch(`${CRM_URL}/auth/v1/user`, {
      headers: { apikey: CRM_ANON_KEY, Authorization: `Bearer ${authToken}` },
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.id) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

const SaveSchema = z.object({
  action: z.literal("save"),
  authToken: z.string().min(10),
  apiUrl: z.string().url().max(500),
  apiKey: z.string().min(1).max(500),
  instanceName: z.string().min(1).max(200),
  connectionStatus: z.string().max(50).nullable().optional(),
  lastTestedAt: z.string().max(50).nullable().optional(),
  lastTestError: z.string().max(1000).nullable().optional(),
});

const GetSchema = z.object({
  action: z.literal("get"),
  authToken: z.string().min(10),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    const serviceDb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "get") {
      const parsed = GetSchema.safeParse(body);
      if (!parsed.success) return responseJson({ ok: false, error: "Requisição inválida." }, 400);

      const userId = await getCrmUserId(parsed.data.authToken);
      if (!userId) return responseJson({ ok: false, error: "Não autenticado." }, 401);

      const { data, error } = await serviceDb
        .from("evolution_config")
        .select("api_url, api_key, instance_name, connection_status, last_tested_at, last_test_error")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      return responseJson({ ok: true, config: data ?? null });
    }

    if (action === "save") {
      const parsed = SaveSchema.safeParse(body);
      if (!parsed.success) {
        return responseJson(
          { ok: false, error: "Dados inválidos: informe URL, API Key e nome da instância." },
          400
        );
      }

      const userId = await getCrmUserId(parsed.data.authToken);
      if (!userId) return responseJson({ ok: false, error: "Não autenticado." }, 401);

      const { error } = await serviceDb.from("evolution_config").upsert(
        {
          user_id: userId,
          api_url: parsed.data.apiUrl.replace(/\/+$/, ""),
          api_key: parsed.data.apiKey,
          instance_name: parsed.data.instanceName,
          connection_status: parsed.data.connectionStatus ?? null,
          last_tested_at: parsed.data.lastTestedAt ?? null,
          last_test_error: parsed.data.lastTestError ?? null,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      return responseJson({ ok: true });
    }

    return responseJson({ ok: false, error: "Ação inválida." }, 400);
  } catch (e) {
    console.error("[evolution-config] erro:", cleanMessage((e as Error)?.message ?? e));
    return responseJson({ ok: false, error: cleanMessage((e as Error)?.message ?? e) }, 500);
  }
});

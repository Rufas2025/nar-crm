/**
 * Repositórios: CRUD + dedupe sobre as tabelas radar_*.
 *
 * Todo insert carrega user_id explicitamente; a RLS confere que bate com
 * auth.uid(). Dedupe forte reusa o registro existente; dedupe fraco apenas
 * devolve candidato para decisão do agente/humano (nunca merge automático).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canAutoMerge,
  contactDedupeKey,
  institutionDedupeKeys,
  signalDedupeKeys,
  type DedupeKey,
} from '../domain/dedupe.js';
import {
  extractDomain,
  normalizeCity,
  normalizeInstagramUrl,
  normalizeInstitutionName,
  normalizeState,
  normalizeUrl,
} from '../domain/normalize.js';
import type {
  ConstructionAssessment,
  Contact,
  Institution,
  Opportunity,
  OpportunityStatus,
  Signal,
} from '../types.js';

export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
  }
}

function unwrap<T>(result: { data: T | null; error: unknown }, context: string): T {
  if (result.error) {
    const message =
      typeof result.error === 'object' && result.error && 'message' in result.error
        ? String((result.error as { message: unknown }).message)
        : String(result.error);
    throw new RepositoryError(`${context}: ${message}`, result.error);
  }
  if (result.data === null) throw new RepositoryError(`${context}: sem retorno`);
  return result.data;
}

interface Cursor { created_at: string; id: string }

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (typeof parsed?.created_at === 'string' && typeof parsed?.id === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

export interface MatchOutcome<T> {
  record: T | null;
  matchedBy: DedupeKey | null;
  /** true quando a chave é fraca: exige confirmação antes de reusar. */
  requiresConfirmation: boolean;
}

export class RadarRepository {
  constructor(
    private readonly db: SupabaseClient,
    private readonly userId: string,
  ) {}

  // ---------------------------------------------------------- institutions

  async findInstitution(identity: {
    name?: string | null;
    website?: string | null;
    instagram_url?: string | null;
    city?: string | null;
    state?: string | null;
  }): Promise<MatchOutcome<Institution>> {
    const keys = institutionDedupeKeys(identity);

    for (const key of keys) {
      let query = this.db.from('radar_institutions').select('*').eq('user_id', this.userId);

      if (key.field === 'domain') query = query.eq('domain', key.value);
      else if (key.field === 'instagram_url') query = query.eq('instagram_url', key.value);
      else {
        const [name, city, state] = key.value.split('|');
        query = query.eq('normalized_name', name);
        if (city) query = query.eq('city', city);
        if (state) query = query.eq('state', state);
      }

      const { data, error } = await query.limit(1);
      if (error) throw new RepositoryError(`findInstitution: ${error.message}`, error);
      if (data && data.length > 0) {
        return {
          record: data[0] as Institution,
          matchedBy: key,
          requiresConfirmation: !canAutoMerge(key),
        };
      }
    }

    return { record: null, matchedBy: null, requiresConfirmation: false };
  }

  async createInstitution(input: {
    name: string;
    legal_name?: string | null;
    website?: string | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
    city?: string | null;
    state?: string | null;
    phone?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<Institution> {
    const row = {
      user_id: this.userId,
      name: input.name,
      normalized_name: normalizeInstitutionName(input.name),
      legal_name: input.legal_name ?? null,
      website: normalizeUrl(input.website) ?? null,
      domain: extractDomain(input.website),
      instagram_url: normalizeInstagramUrl(input.instagram_url),
      linkedin_url: normalizeUrl(input.linkedin_url) ?? null,
      city: normalizeCity(input.city),
      state: normalizeState(input.state),
      phone: input.phone ?? null,
      metadata: input.metadata ?? {},
    };
    const res = await this.db.from('radar_institutions').insert(row).select().single();
    return unwrap(res, 'createInstitution') as Institution;
  }

  async updateInstitution(id: string, patch: Partial<Institution>): Promise<Institution> {
    const next: Record<string, unknown> = { ...patch };
    delete next.id;
    delete next.user_id;
    if (typeof patch.name === 'string') next.normalized_name = normalizeInstitutionName(patch.name);
    if (typeof patch.website === 'string') {
      next.website = normalizeUrl(patch.website);
      next.domain = extractDomain(patch.website);
    }
    if (typeof patch.instagram_url === 'string') {
      next.instagram_url = normalizeInstagramUrl(patch.instagram_url);
    }
    if (typeof patch.city === 'string') next.city = normalizeCity(patch.city);
    if (typeof patch.state === 'string') next.state = normalizeState(patch.state);

    const res = await this.db
      .from('radar_institutions')
      .update(next)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();
    return unwrap(res, 'updateInstitution') as Institution;
  }

  async getInstitution(id: string): Promise<Institution | null> {
    const { data, error } = await this.db
      .from('radar_institutions')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .maybeSingle();
    if (error) throw new RepositoryError(`getInstitution: ${error.message}`, error);
    return (data as Institution) ?? null;
  }

  // ---------------------------------------------------------------- signals

  async findSignal(identity: {
    source?: string | null;
    source_url?: string | null;
    source_external_id?: string | null;
  }): Promise<MatchOutcome<Signal>> {
    for (const key of signalDedupeKeys(identity)) {
      let query = this.db.from('radar_signals').select('*').eq('user_id', this.userId);
      if (key.field === 'source_url') query = query.eq('source_url', key.value);
      else {
        const [source, externalId] = key.value.split('|');
        query = query.eq('source', source).eq('source_external_id', externalId);
      }
      const { data, error } = await query.limit(1);
      if (error) throw new RepositoryError(`findSignal: ${error.message}`, error);
      if (data && data.length > 0) {
        return { record: data[0] as Signal, matchedBy: key, requiresConfirmation: false };
      }
    }
    return { record: null, matchedBy: null, requiresConfirmation: false };
  }

  async createSignal(input: {
    institution_id?: string | null;
    source?: string;
    source_url?: string | null;
    source_external_id?: string | null;
    raw_text?: string | null;
    published_at?: string | null;
    signal_type?: string | null;
    confidence?: number | null;
    raw_metadata?: Record<string, unknown>;
  }): Promise<Signal> {
    const row = {
      user_id: this.userId,
      institution_id: input.institution_id ?? null,
      source: input.source ?? 'manual',
      source_url: normalizeUrl(input.source_url),
      source_external_id: input.source_external_id ?? null,
      raw_text: input.raw_text ?? null,
      published_at: input.published_at ?? null,
      signal_type: input.signal_type ?? null,
      confidence: input.confidence ?? null,
      raw_metadata: input.raw_metadata ?? {},
    };
    const res = await this.db.from('radar_signals').insert(row).select().single();
    return unwrap(res, 'createSignal') as Signal;
  }

  async getSignal(id: string): Promise<Signal | null> {
    const { data, error } = await this.db
      .from('radar_signals')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .maybeSingle();
    if (error) throw new RepositoryError(`getSignal: ${error.message}`, error);
    return (data as Signal) ?? null;
  }

  async linkSignalToInstitution(signalId: string, institutionId: string): Promise<void> {
    const { error } = await this.db
      .from('radar_signals')
      .update({ institution_id: institutionId })
      .eq('id', signalId)
      .eq('user_id', this.userId);
    if (error) throw new RepositoryError(`linkSignalToInstitution: ${error.message}`, error);
  }

  // ------------------------------------------------------------ assessments

  async createAssessment(input: {
    signal_id: string;
    construction_detected: boolean;
    construction_type: ConstructionAssessment['construction_type'];
    construction_stage: ConstructionAssessment['construction_stage'];
    description?: string | null;
    confidence: number;
    reasoning_summary?: string | null;
    is_educational_institution?: boolean | null;
    lexical_crosscheck: ConstructionAssessment['lexical_crosscheck'];
  }): Promise<ConstructionAssessment> {
    const res = await this.db
      .from('radar_construction_assessments')
      .insert({ user_id: this.userId, ...input })
      .select()
      .single();
    return unwrap(res, 'createAssessment') as ConstructionAssessment;
  }

  /** Todas as avaliações dos sinais, mais recentes primeiro. */
  async assessmentsForSignals(signalIds: string[]): Promise<ConstructionAssessment[]> {
    if (signalIds.length === 0) return [];
    const { data, error } = await this.db
      .from('radar_construction_assessments')
      .select('*')
      .eq('user_id', this.userId)
      .in('signal_id', signalIds)
      .order('created_at', { ascending: false });
    if (error) throw new RepositoryError(`assessmentsForSignals: ${error.message}`, error);
    return (data as ConstructionAssessment[]) ?? [];
  }

  async latestAssessmentForSignals(signalIds: string[]): Promise<ConstructionAssessment | null> {
    if (signalIds.length === 0) return null;
    const { data, error } = await this.db
      .from('radar_construction_assessments')
      .select('*')
      .eq('user_id', this.userId)
      .in('signal_id', signalIds)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw new RepositoryError(`latestAssessment: ${error.message}`, error);
    return (data?.[0] as ConstructionAssessment) ?? null;
  }

  // --------------------------------------------------------------- contacts

  async findContactByName(institutionId: string, name: string): Promise<Contact | null> {
    const key = contactDedupeKey(institutionId, name);
    if (!key) return null;
    const { data, error } = await this.db
      .from('radar_contacts')
      .select('*')
      .eq('user_id', this.userId)
      .eq('institution_id', institutionId)
      .ilike('name', name)
      .limit(1);
    if (error) throw new RepositoryError(`findContactByName: ${error.message}`, error);
    return (data?.[0] as Contact) ?? null;
  }

  async createContact(input: {
    institution_id: string;
    name: string;
    role?: string | null;
    organization?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
    instagram_url?: string | null;
    verification_status: Contact['verification_status'];
    confidence?: number | null;
  }): Promise<Contact> {
    const res = await this.db
      .from('radar_contacts')
      .insert({
        user_id: this.userId,
        ...input,
        linkedin_url: normalizeUrl(input.linkedin_url) ?? null,
        instagram_url: normalizeInstagramUrl(input.instagram_url),
      })
      .select()
      .single();
    return unwrap(res, 'createContact') as Contact;
  }

  async listContacts(institutionId: string): Promise<Contact[]> {
    const { data, error } = await this.db
      .from('radar_contacts')
      .select('*')
      .eq('user_id', this.userId)
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: true });
    if (error) throw new RepositoryError(`listContacts: ${error.message}`, error);
    return (data as Contact[]) ?? [];
  }

  // ---------------------------------------------------------- opportunities

  async findOpenOpportunity(institutionId: string): Promise<Opportunity | null> {
    const { data, error } = await this.db
      .from('radar_opportunities')
      .select('*')
      .eq('user_id', this.userId)
      .eq('institution_id', institutionId)
      .not('status', 'in', '("discarded","false_positive")')
      .limit(1);
    if (error) throw new RepositoryError(`findOpenOpportunity: ${error.message}`, error);
    return (data?.[0] as Opportunity) ?? null;
  }

  async createOpportunity(institutionId: string): Promise<Opportunity> {
    const res = await this.db
      .from('radar_opportunities')
      .insert({ user_id: this.userId, institution_id: institutionId, status: 'new' })
      .select()
      .single();
    return unwrap(res, 'createOpportunity') as Opportunity;
  }

  async updateOpportunity(id: string, patch: Partial<Opportunity>): Promise<Opportunity> {
    const next: Record<string, unknown> = { ...patch };
    delete next.id;
    delete next.user_id;
    const res = await this.db
      .from('radar_opportunities')
      .update(next)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();
    return unwrap(res, 'updateOpportunity') as Opportunity;
  }

  async getOpportunity(id: string): Promise<Opportunity | null> {
    const { data, error } = await this.db
      .from('radar_opportunities')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .maybeSingle();
    if (error) throw new RepositoryError(`getOpportunity: ${error.message}`, error);
    return (data as Opportunity) ?? null;
  }

  /**
   * Paginação keyset (created_at, id) — não offset: estável sob inserção
   * concorrente e sem custo crescente por página.
   */
  async listOpportunities(opts: {
    status?: OpportunityStatus;
    minScore?: number;
    createdAfter?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: Opportunity[]; nextCursor: string | null }> {
    const limit = Math.min(opts.limit ?? 25, 100);
    let query = this.db
      .from('radar_opportunities')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (opts.status) query = query.eq('status', opts.status);
    if (typeof opts.minScore === 'number') query = query.gte('score', opts.minScore);
    if (opts.createdAfter) query = query.gte('created_at', opts.createdAfter);
    if (opts.cursor) {
      const decoded = decodeCursor(opts.cursor);
      if (decoded) query = query.lt('created_at', decoded.created_at);
    }

    const { data, error } = await query;
    if (error) throw new RepositoryError(`listOpportunities: ${error.message}`, error);

    const rows = (data as Opportunity[]) ?? [];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: hasMore && last ? encodeCursor({ created_at: last.created_at, id: last.id }) : null,
    };
  }

  async signalsForInstitution(institutionId: string): Promise<Signal[]> {
    const { data, error } = await this.db
      .from('radar_signals')
      .select('*')
      .eq('user_id', this.userId)
      .eq('institution_id', institutionId)
      .order('detected_at', { ascending: false });
    if (error) throw new RepositoryError(`signalsForInstitution: ${error.message}`, error);
    return (data as Signal[]) ?? [];
  }

  // --------------------------------------------------------------- evidence

  async createEvidence(input: {
    opportunity_id?: string | null;
    signal_id?: string | null;
    contact_id?: string | null;
    evidence_type: string;
    source_url?: string | null;
    source_name?: string | null;
    excerpt?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string }> {
    const res = await this.db
      .from('radar_evidence')
      .insert({
        user_id: this.userId,
        ...input,
        source_url: normalizeUrl(input.source_url),
        metadata: input.metadata ?? {},
      })
      .select('id')
      .single();
    return unwrap(res, 'createEvidence') as { id: string };
  }

  async listEvidence(opportunityId: string) {
    const { data, error } = await this.db
      .from('radar_evidence')
      .select('*')
      .eq('user_id', this.userId)
      .eq('opportunity_id', opportunityId);
    if (error) throw new RepositoryError(`listEvidence: ${error.message}`, error);
    return data ?? [];
  }

  // --------------------------------------------------------------- outreach

  async createOutreachDraft(input: {
    opportunity_id: string;
    contact_id?: string | null;
    channel: 'email' | 'whatsapp' | 'linkedin' | 'phone';
    draft: Record<string, unknown>;
  }): Promise<{ id: string; status: string }> {
    const res = await this.db
      .from('radar_outreach')
      .insert({
        user_id: this.userId,
        opportunity_id: input.opportunity_id,
        contact_id: input.contact_id ?? null,
        channel: input.channel,
        // Nunca 'approved' nem 'sent' na criação.
        status: 'pending_approval',
        draft: input.draft,
      })
      .select('id, status')
      .single();
    return unwrap(res, 'createOutreachDraft') as { id: string; status: string };
  }

  async listOutreach(opportunityId: string) {
    const { data, error } = await this.db
      .from('radar_outreach')
      .select('*')
      .eq('user_id', this.userId)
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false });
    if (error) throw new RepositoryError(`listOutreach: ${error.message}`, error);
    return data ?? [];
  }

  // ------------------------------------------------------------------- jobs

  async createJob(input: {
    job_type: string;
    input: Record<string, unknown>;
    scheduled_for?: string | null;
  }): Promise<{ id: string; status: string; scheduled_for: string | null }> {
    const res = await this.db
      .from('radar_jobs')
      .insert({
        user_id: this.userId,
        job_type: input.job_type,
        input: input.input,
        scheduled_for: input.scheduled_for ?? null,
        status: 'pending',
      })
      .select('id, status, scheduled_for')
      .single();
    return unwrap(res, 'createJob') as { id: string; status: string; scheduled_for: string | null };
  }
}

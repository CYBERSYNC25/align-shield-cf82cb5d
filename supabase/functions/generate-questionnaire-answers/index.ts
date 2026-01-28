/**
 * Generate Questionnaire Answers Edge Function
 * 
 * Uses Claude AI to automatically generate answers for security questionnaires
 * based on company context (controls, policies, evidence, integrations).
 * 
 * @module generate-questionnaire-answers
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, rateLimitHeaders, rateLimitExceededResponse } from '../_shared/rate-limiter.ts';
import { validateAuth, errorResponse } from '../_shared/auth.ts';

const logger = createLogger('GenerateAnswers');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 1024;
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;

interface Question {
  id: string;
  question_number: string;
  question_text: string;
  category: string | null;
  subcategory: string | null;
  answer_status: string | null;
}

interface Control {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
}

interface Policy {
  id: string;
  name: string;
  category: string;
  version: string;
  description: string | null;
}

interface Evidence {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Context {
  controls: Array<{ code: string; title: string; status: string; description: string | null }>;
  policies: Array<{ name: string; category: string; version: string }>;
  evidence: Array<{ id: string; name: string; type: string; status: string }>;
  integrations: unknown[];
  previousAnswers: Array<{ standard_answer: string; question_pattern: string | null }>;
}

/**
 * Extract keywords from question text for matching
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
    'because', 'until', 'while', 'your', 'you', 'we', 'our', 'they', 'their',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'it'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 20); // Limit to 20 keywords
}

/**
 * Find controls related to a question based on keyword matching
 */
function findRelatedControls(questionText: string, controls: Control[]): Control[] {
  const keywords = extractKeywords(questionText);
  
  return controls.filter(control => {
    const controlText = `${control.title} ${control.description || ''} ${control.category}`.toLowerCase();
    return keywords.some(kw => controlText.includes(kw));
  }).slice(0, 5); // Limit to 5 most relevant
}

/**
 * Find policies related to a question based on keyword matching
 */
function findRelatedPolicies(questionText: string, policies: Policy[]): Policy[] {
  const keywords = extractKeywords(questionText);
  
  return policies.filter(policy => {
    const policyText = `${policy.name} ${policy.description || ''} ${policy.category}`.toLowerCase();
    return keywords.some(kw => policyText.includes(kw));
  }).slice(0, 3);
}

/**
 * Find evidence related to controls
 */
function findRelatedEvidence(controlIds: string[], evidence: Evidence[], allEvidence: Evidence[]): Evidence[] {
  // For now, return evidence that matches control categories or general evidence
  return allEvidence.slice(0, 5);
}

/**
 * Calculate confidence score based on available context
 */
function calculateConfidence(context: Context, aiResponse: string): number {
  let score = 50; // Base score
  
  // +20 if found related controls
  if (context.controls.length > 0) score += 20;
  
  // +15 if has approved policies
  if (context.policies.length > 0) score += 15;
  
  // +10 if has evidence
  if (context.evidence.length > 0) score += 10;
  
  // +5 if found in answer library
  if (context.previousAnswers?.length > 0) score += 5;
  
  // -20 if response indicates lack of data
  const lowerResponse = aiResponse.toLowerCase();
  if (lowerResponse.includes('to be determined') || 
      lowerResponse.includes('not applicable') ||
      lowerResponse.includes('information not available') ||
      lowerResponse.includes('no data available')) {
    score -= 20;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Build system prompt for Claude
 */
function buildSystemPrompt(context: Context): string {
  return `Você é um Compliance Officer experiente respondendo um questionário de segurança para uma empresa.

INSTRUÇÕES:
- Responda de forma profissional, factual e objetiva
- Base suas respostas APENAS no contexto fornecido abaixo
- Se a informação não estiver disponível no contexto, responda "To Be Determined" ou "Not Applicable" conforme apropriado
- Cite controles e políticas específicas quando possível (ex: "Conforme controle A.5.1...")
- Use linguagem corporativa e técnica apropriada
- Respostas devem ter entre 2-4 parágrafos
- Seja específico sobre implementações quando o contexto permitir

CONTEXTO DA EMPRESA:

CONTROLES IMPLEMENTADOS:
${context.controls.length > 0 
  ? context.controls.map(c => `- ${c.code}: ${c.title} (Status: ${c.status})`).join('\n')
  : '- Nenhum controle específico encontrado para esta questão'}

POLÍTICAS APROVADAS:
${context.policies.length > 0
  ? context.policies.map(p => `- ${p.name} (${p.category}, v${p.version})`).join('\n')
  : '- Nenhuma política específica encontrada para esta questão'}

EVIDÊNCIAS DISPONÍVEIS:
${context.evidence.length > 0
  ? context.evidence.map(e => `- ${e.name} (${e.type}, Status: ${e.status})`).join('\n')
  : '- Nenhuma evidência específica encontrada para esta questão'}

DADOS DE INTEGRAÇÕES:
${context.integrations.length > 0
  ? `${context.integrations.length} registros de dados coletados de sistemas integrados`
  : '- Nenhum dado de integração disponível'}

${context.previousAnswers?.length > 0 
  ? `\nRESPOSTAS ANTERIORES SIMILARES (para referência):\n${context.previousAnswers.map(a => `- ${a.standard_answer.substring(0, 200)}...`).join('\n')}`
  : ''}`;
}

/**
 * Call Claude API with retry logic
 */
async function callClaudeWithRetry(
  apiKey: string,
  systemPrompt: string,
  questionText: string
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [{ role: 'user', content: questionText }],
        }),
      });
      
      if (response.status === 429) {
        // Rate limited - wait exponentially
        const waitTime = Math.pow(2, attempt) * 1000;
        logger.warn(`Claude rate limited, waiting ${waitTime}ms`, { attempt });
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errorBody}`);
      }
      
      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      }
      
      throw new Error('Invalid Claude response format');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Claude API attempt ${attempt} failed`, { error: lastError.message });
      
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Process a single question
 */
async function processQuestion(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  question: Question,
  controls: Control[],
  policies: Policy[],
  evidence: Evidence[],
  integrationData: unknown[],
  apiKey: string
): Promise<{ success: boolean; questionId: string; error?: string }> {
  try {
    // Find related context
    const relatedControls = findRelatedControls(question.question_text, controls);
    const relatedPolicies = findRelatedPolicies(question.question_text, policies);
    const relatedEvidence = findRelatedEvidence(
      relatedControls.map(c => c.id),
      evidence,
      evidence
    );
    
    // Search answer library
    let libraryAnswers: Array<{ standard_answer: string; question_pattern: string | null }> = [];
    try {
      const { data: answers } = await supabase.rpc('search_answer_library', {
        p_user_id: userId,
        p_search_text: question.question_text,
        p_limit: 3,
      });
      libraryAnswers = answers || [];
    } catch (e) {
      logger.debug('Answer library search failed', { error: e });
    }
    
    // Build context
    const context: Context = {
      controls: relatedControls.map(c => ({
        code: c.code,
        title: c.title,
        status: c.status,
        description: c.description,
      })),
      policies: relatedPolicies.map(p => ({
        name: p.name,
        category: p.category,
        version: p.version,
      })),
      evidence: relatedEvidence.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        status: e.status,
      })),
      integrations: integrationData.slice(0, 10),
      previousAnswers: libraryAnswers,
    };
    
    // Build prompt and call Claude
    const systemPrompt = buildSystemPrompt(context);
    const aiResponse = await callClaudeWithRetry(apiKey, systemPrompt, question.question_text);
    
    // Calculate confidence
    const confidenceScore = calculateConfidence(context, aiResponse);
    
    // Build AI reasoning metadata
    const aiReasoning = JSON.stringify({
      matched_controls: relatedControls.map(c => c.code),
      matched_policies: relatedPolicies.map(p => p.name),
      matched_evidence: relatedEvidence.map(e => e.name),
      library_matches: libraryAnswers.length,
      context_summary: {
        controls_count: relatedControls.length,
        policies_count: relatedPolicies.length,
        evidence_count: relatedEvidence.length,
      },
    });
    
    // Update question with generated answer
    const { error: updateError } = await supabase
      .from('questionnaire_questions')
      .update({
        answer_text: aiResponse,
        answer_status: 'ai_generated',
        confidence_score: confidenceScore,
        ai_reasoning: aiReasoning,
        evidence_links: relatedEvidence.map(e => e.id),
        related_controls: relatedControls.map(c => c.id),
        updated_at: new Date().toISOString(),
      })
      .eq('id', question.id);
    
    if (updateError) {
      throw new Error(`Failed to update question: ${updateError.message}`);
    }
    
    logger.info(`Generated answer for question ${question.question_number}`, {
      confidence: confidenceScore,
      controlsMatched: relatedControls.length,
    });
    
    return { success: true, questionId: question.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to process question ${question.question_number}`, error);
    return { success: false, questionId: question.id, error: errorMessage };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    // Check for API key first
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      logger.warn('ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ANTHROPIC_API_KEY not configured',
          code: 'MISSING_SECRET',
          help: 'Add ANTHROPIC_API_KEY secret to enable AI generation. Get your key at https://console.anthropic.com/settings/keys',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Verify authentication using shared helper
    const authResult = await validateAuth(req.headers.get('Authorization'));
    
    if (!authResult.success) {
      return errorResponse(authResult.error, authResult.status, corsHeaders);
    }
    
    const { userId, userClient: supabase } = authResult;
    
    // Rate limiting - 3 requests per minute (heavy AI operation)
    const rateLimit = await checkRateLimit(userId, 'generate-questionnaire-answers', 3, 60);
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit, corsHeaders);
    }
    
    // Parse request body
    const { questionnaire_id } = await req.json();
    
    if (!questionnaire_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'questionnaire_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify questionnaire ownership
    const { data: questionnaire, error: qError } = await supabase
      .from('security_questionnaires')
      .select('id, user_id, name')
      .eq('id', questionnaire_id)
      .single();
    
    if (qError || !questionnaire) {
      return new Response(
        JSON.stringify({ success: false, error: 'Questionnaire not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (questionnaire.user_id !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch all pending questions
    const { data: questions, error: questionsError } = await supabase
      .from('questionnaire_questions')
      .select('id, question_number, question_text, category, subcategory, answer_status')
      .eq('questionnaire_id', questionnaire_id)
      .eq('answer_status', 'pending')
      .order('question_number');
    
    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }
    
    const pendingQuestions = questions || [];
    
    if (pendingQuestions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          questionnaire_id,
          message: 'No pending questions to process',
          total_questions: 0,
          generated: 0,
          failed: 0,
          processing_time_ms: Date.now() - startTime,
        }),
        {
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders(rateLimit),
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    logger.info(`Starting answer generation for ${pendingQuestions.length} questions`, {
      questionnaire_id,
      questionnaire_name: questionnaire.name,
    });
    
    // Fetch all context data once
    const [controlsRes, policiesRes, evidenceRes, integrationRes] = await Promise.all([
      supabase.from('controls').select('id, code, title, description, category, status').eq('user_id', userId),
      supabase.from('policies').select('id, name, category, version, description').eq('user_id', userId).eq('status', 'approved'),
      supabase.from('evidence').select('id, name, type, status').eq('user_id', userId),
      supabase.from('integration_collected_data').select('*').eq('user_id', userId).limit(100),
    ]);
    
    const controls = (controlsRes.data || []) as Control[];
    const policies = (policiesRes.data || []) as Policy[];
    const evidence = (evidenceRes.data || []) as Evidence[];
    const integrationData = integrationRes.data || [];
    
    // Process questions in batches
    const results: Array<{ success: boolean; questionId: string; error?: string }> = [];
    
    for (let i = 0; i < pendingQuestions.length; i += BATCH_SIZE) {
      const batch = pendingQuestions.slice(i, i + BATCH_SIZE);
      
      // Process batch sequentially to avoid Claude rate limits
      for (const question of batch) {
        const result = await processQuestion(
          supabase,
          userId,
          question,
          controls,
          policies,
          evidence,
          integrationData,
          anthropicKey
        );
        results.push(result);
      }
      
      // Log progress
      const completed = Math.min(i + BATCH_SIZE, pendingQuestions.length);
      logger.info(`Progress: ${completed}/${pendingQuestions.length} questions processed`);
      
      // Pause between batches to avoid rate limiting
      if (i + BATCH_SIZE < pendingQuestions.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    const generated = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    logger.info(`Answer generation completed`, {
      questionnaire_id,
      generated,
      failed,
      processing_time_ms: Date.now() - startTime,
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        questionnaire_id,
        questionnaire_name: questionnaire.name,
        total_questions: pendingQuestions.length,
        generated,
        failed,
        processing_time_ms: Date.now() - startTime,
        questions: results.map(r => ({
          id: r.questionId,
          success: r.success,
          error: r.error,
        })),
      }),
      {
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders(rateLimit),
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    logger.error('Generate answers error', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        processing_time_ms: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

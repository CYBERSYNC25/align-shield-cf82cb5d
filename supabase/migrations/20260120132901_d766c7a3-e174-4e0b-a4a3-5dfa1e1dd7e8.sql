-- =====================================================
-- QUESTIONNAIRE AUTOMATION SCHEMA
-- Tables for security questionnaire management with AI-powered responses
-- =====================================================

-- 1. Main questionnaires table
CREATE TABLE public.security_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('CAIQ', 'VSA', 'SIG', 'HECVAT', 'Custom')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'shared')),
  version TEXT DEFAULT '1.0',
  questions_count INTEGER DEFAULT 0,
  shared_with TEXT[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  requester_name TEXT,
  requester_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 2. Individual questions table
CREATE TABLE public.questionnaire_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.security_questionnaires(id) ON DELETE CASCADE,
  question_number TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'yes_no', 'multiple_choice', 'file_upload', 'scale')),
  category TEXT,
  subcategory TEXT,
  related_controls UUID[] DEFAULT '{}',
  answer_text TEXT,
  answer_status TEXT DEFAULT 'pending' CHECK (answer_status IN ('pending', 'ai_generated', 'reviewed', 'approved', 'not_applicable')),
  evidence_links TEXT[] DEFAULT '{}',
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_reasoning TEXT,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Reusable templates table
CREATE TABLE public.questionnaire_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('CAIQ', 'VSA', 'SIG', 'HECVAT', 'Custom')),
  description TEXT,
  total_questions INTEGER DEFAULT 0,
  questions_data JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Answer library for reusable responses
CREATE TABLE public.answer_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_keywords TEXT[] NOT NULL,
  question_pattern TEXT,
  standard_answer TEXT NOT NULL,
  applies_to_frameworks TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  last_used TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Full-text search on question_text
CREATE INDEX idx_questionnaire_questions_text_search 
ON public.questionnaire_questions 
USING gin(to_tsvector('english', question_text));

-- GIN index for question_keywords array search
CREATE INDEX idx_answer_library_keywords 
ON public.answer_library 
USING gin(question_keywords);

-- Lookup indexes
CREATE INDEX idx_security_questionnaires_user_id 
ON public.security_questionnaires(user_id);

CREATE INDEX idx_security_questionnaires_status 
ON public.security_questionnaires(status);

CREATE INDEX idx_questionnaire_questions_questionnaire_id 
ON public.questionnaire_questions(questionnaire_id);

CREATE INDEX idx_questionnaire_questions_status 
ON public.questionnaire_questions(answer_status);

CREATE INDEX idx_answer_library_user_id 
ON public.answer_library(user_id);

CREATE INDEX idx_answer_library_frameworks 
ON public.answer_library 
USING gin(applies_to_frameworks);

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_security_questionnaires_updated_at
  BEFORE UPDATE ON public.security_questionnaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questionnaire_questions_updated_at
  BEFORE UPDATE ON public.questionnaire_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questionnaire_templates_updated_at
  BEFORE UPDATE ON public.questionnaire_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_answer_library_updated_at
  BEFORE UPDATE ON public.answer_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update questions_count
CREATE OR REPLACE FUNCTION public.update_questionnaire_questions_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE security_questionnaires 
    SET questions_count = questions_count + 1,
        updated_at = now()
    WHERE id = NEW.questionnaire_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE security_questionnaires 
    SET questions_count = GREATEST(0, questions_count - 1),
        updated_at = now()
    WHERE id = OLD.questionnaire_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER questionnaire_questions_count_trigger
  AFTER INSERT OR DELETE ON public.questionnaire_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_questionnaire_questions_count();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- security_questionnaires RLS
ALTER TABLE public.security_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questionnaires"
  ON public.security_questionnaires FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own questionnaires"
  ON public.security_questionnaires FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questionnaires"
  ON public.security_questionnaires FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questionnaires"
  ON public.security_questionnaires FOR DELETE
  USING (auth.uid() = user_id);

-- questionnaire_questions RLS
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions of own questionnaires"
  ON public.questionnaire_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.security_questionnaires 
      WHERE id = questionnaire_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions for own questionnaires"
  ON public.questionnaire_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.security_questionnaires 
      WHERE id = questionnaire_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions of own questionnaires"
  ON public.questionnaire_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.security_questionnaires 
      WHERE id = questionnaire_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions of own questionnaires"
  ON public.questionnaire_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.security_questionnaires 
      WHERE id = questionnaire_id AND user_id = auth.uid()
    )
  );

-- questionnaire_templates RLS
ALTER TABLE public.questionnaire_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public templates"
  ON public.questionnaire_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create own templates"
  ON public.questionnaire_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
  ON public.questionnaire_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own templates"
  ON public.questionnaire_templates FOR DELETE
  USING (auth.uid() = created_by);

-- answer_library RLS
ALTER TABLE public.answer_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answer library"
  ON public.answer_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own answers"
  ON public.answer_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON public.answer_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
  ON public.answer_library FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SEARCH FUNCTION FOR ANSWER LIBRARY
-- =====================================================

CREATE OR REPLACE FUNCTION public.search_answer_library(
  p_user_id UUID,
  p_search_text TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  standard_answer TEXT,
  question_keywords TEXT[],
  applies_to_frameworks TEXT[],
  similarity_score REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    al.id,
    al.standard_answer,
    al.question_keywords,
    al.applies_to_frameworks,
    ts_rank(
      to_tsvector('english', array_to_string(al.question_keywords, ' ')),
      plainto_tsquery('english', p_search_text)
    ) as similarity_score
  FROM answer_library al
  WHERE al.user_id = p_user_id
    AND to_tsvector('english', array_to_string(al.question_keywords, ' ')) 
        @@ plainto_tsquery('english', p_search_text)
  ORDER BY similarity_score DESC
  LIMIT p_limit;
$$;
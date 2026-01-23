/**
 * Centralized React Query keys for consistent cache management
 */
export const queryKeys = {
  // Job Queue
  jobQueue: ['job-queue'] as const,
  jobs: (status?: string | string[], jobType?: string) => 
    ['job-queue', 'list', status, jobType] as const,
  jobStatus: (jobId: string) => ['job-queue', 'status', jobId] as const,
  pendingJobsCount: ['job-queue', 'pending-count'] as const,

  // Integrations
  integrations: ['integrations'] as const,
  integrationStatus: (name: string) => ['integration-status', name] as const,
  integrationData: ['integration-data'] as const,
  
  // AWS
  awsResources: (integrationId: string) => ['aws-resources', integrationId] as const,
  awsConnection: ['aws-connection'] as const,
  
  // Azure
  azureConnection: ['azure-connection'] as const,
  azureUsers: ['azure-users'] as const,
  
  // Google
  googleWorkspace: ['google-workspace'] as const,
  googleOAuthStatus: ['google-oauth-status'] as const,
  googleConnection: ['google-connection'] as const,

  // Datadog
  datadogResources: (integrationId: string) => ['datadog-resources', integrationId] as const,
  
  // Frameworks & Controls
  frameworks: ['frameworks'] as const,
  controls: (frameworkId?: string) => frameworkId 
    ? ['controls', frameworkId] as const 
    : ['controls'] as const,
  
  // Evidence Mapping
  evidenceMapping: ['evidence-mapping'] as const,
  evidenceMappingByControl: (controlId: string) => ['evidence-mapping', controlId] as const,
  
  // Profiles (Responsáveis)
  profiles: ['profiles'] as const,
  profileById: (userId: string) => ['profiles', userId] as const,

  // Questionnaires
  questionnaires: ['questionnaires'] as const,
  questionnaireById: (id: string) => ['questionnaire', id] as const,
  questionnaireQuestions: (questionnaireId: string) => 
    ['questionnaire-questions', questionnaireId] as const,
  questionnaireTemplates: ['questionnaire-templates'] as const,
  answerLibrary: ['answer-library'] as const,

  // Custom Compliance Tests
  customTests: ['custom-tests'] as const,
  customTestById: (id: string) => ['custom-test', id] as const,
  customTestResults: (testId: string) => ['custom-test-results', testId] as const,
};

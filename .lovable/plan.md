
## Plano: Wizard de Onboarding para Novos Usuarios

### Objetivo
Criar um wizard de onboarding fullscreen em 5 passos que guia novos usuarios na configuracao inicial do APOC: apresentacao, selecao de frameworks, primeira integracao, primeiro scan de compliance e proximos passos.

---

### Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND - Onboarding Wizard                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Barra de Progresso (5 steps)                                        │    │
│  │ [●──●──●──●──●] Step 3 de 5                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Step 1: Bem-vindo (30s apresentacao)                               │    │
│  │  Step 2: Escolha Frameworks (LGPD, ISO 27001, SOC 2...)             │    │
│  │  Step 3: Conecte Integracao (GitHub, AWS, Google)                   │    │
│  │  Step 4: Primeiro Scan (executar check + resultados)                │    │
│  │  Step 5: Proximos Passos (checklist)                                │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [Pular]                                     [Voltar] [Continuar/Concluir]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Migracao de Banco de Dados

Adicionar colunas na tabela `profiles` para controlar o onboarding:

```sql
-- Novas colunas para onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Indice para queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);
```

**Dados salvos em `onboarding_data`:**
```json
{
  "selected_frameworks": ["soc2", "iso27001", "lgpd"],
  "connected_integration": "github",
  "first_scan_completed": true,
  "first_scan_results": {
    "score": 78,
    "passing": 12,
    "failing": 3
  }
}
```

---

### Fase 2: Hook useOnboardingWizard

Criar hook centralizado para gerenciar todo o estado do wizard:

**Arquivo:** `src/hooks/useOnboardingWizard.tsx`

```typescript
interface OnboardingWizardState {
  currentStep: number;          // 0-4 (5 steps)
  isActive: boolean;            // Wizard esta ativo
  isLoading: boolean;           // Carregando dados do DB
  hasCompleted: boolean;        // Usuario ja completou
  wasSkipped: boolean;          // Usuario pulou
  data: OnboardingData;         // Dados coletados
}

interface OnboardingData {
  selectedFrameworks: string[];
  connectedIntegration: string | null;
  firstScanCompleted: boolean;
  firstScanResults: ScanResults | null;
}

interface UseOnboardingWizardReturn {
  // Estado
  state: OnboardingWizardState;
  
  // Navegacao
  nextStep: () => Promise<void>;
  prevStep: () => void;
  goToStep: (step: number) => void;
  
  // Acoes
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  
  // Data
  updateData: (data: Partial<OnboardingData>) => Promise<void>;
  
  // Helpers
  canProceed: boolean;  // Step atual permite avancar
  stepProgress: number; // 0-100%
}
```

**Funcionalidades:**
- Carrega estado do onboarding do banco na inicializacao
- Persiste progresso e dados a cada step
- Suporta navegacao bidirecional
- Valida se usuario pode avancar (ex: selecionou framework?)
- Sincroniza com React Query para invalidacao de cache

---

### Fase 3: Componentes do Wizard

**Estrutura de arquivos:**
```
src/components/onboarding/
├── OnboardingWizard.tsx           # Container principal
├── OnboardingProgress.tsx         # Barra de progresso
├── steps/
│   ├── WelcomeStep.tsx            # Step 1: Bem-vindo
│   ├── FrameworksStep.tsx         # Step 2: Selecao frameworks
│   ├── IntegrationStep.tsx        # Step 3: Primeira integracao
│   ├── FirstScanStep.tsx          # Step 4: Primeiro scan
│   └── NextStepsStep.tsx          # Step 5: Proximos passos
└── shared/
    ├── StepContainer.tsx          # Layout padrao de step
    ├── StepNavigation.tsx         # Botoes Voltar/Continuar
    └── SkipButton.tsx             # Botao Pular
```

---

### Step 1: Bem-vindo (WelcomeStep.tsx)

Apresentacao rapida do APOC (30 segundos):

```typescript
// Features apresentadas com icones animados
const features = [
  { icon: Shield, title: 'Compliance Automatizado', 
    desc: 'Monitore ISO 27001, SOC 2 e LGPD automaticamente' },
  { icon: Zap, title: 'Integracoes Nativas', 
    desc: 'Conecte AWS, GitHub, Google e mais' },
  { icon: Eye, title: 'Visibilidade Total', 
    desc: 'Dashboard unificado de riscos e conformidade' },
  { icon: Bell, title: 'Alertas Proativos', 
    desc: 'Notificacoes em tempo real de desvios' },
];

// Animacao de entrada com Framer Motion
// Auto-avancar apos 30s (opcional) ou botao "Comecar"
```

---

### Step 2: Escolha Frameworks (FrameworksStep.tsx)

Cards clicaveis para selecao de frameworks:

```typescript
const availableFrameworks = [
  { 
    id: 'soc2', 
    name: 'SOC 2 Type II', 
    description: 'System and Organization Controls para servicos',
    icon: '🛡️',
    popular: true,
    controlsCount: 64,
  },
  { 
    id: 'iso27001', 
    name: 'ISO 27001:2022', 
    description: 'Sistema de Gestao de Seguranca da Informacao',
    icon: '📋',
    popular: true,
    controlsCount: 114,
  },
  { 
    id: 'lgpd', 
    name: 'LGPD', 
    description: 'Lei Geral de Protecao de Dados',
    icon: '🇧🇷',
    popular: true,
    controlsCount: 42,
  },
  { 
    id: 'gdpr', 
    name: 'GDPR', 
    description: 'General Data Protection Regulation (UE)',
    icon: '🇪🇺',
    popular: false,
    controlsCount: 38,
  },
  { 
    id: 'pci-dss', 
    name: 'PCI DSS', 
    description: 'Payment Card Industry Data Security Standard',
    icon: '💳',
    popular: false,
    controlsCount: 251,
  },
  { 
    id: 'hipaa', 
    name: 'HIPAA', 
    description: 'Health Insurance Portability and Accountability',
    icon: '🏥',
    popular: false,
    controlsCount: 75,
  },
];

// Multi-select com visual de checked state
// Minimo 1 framework para avancar
// Badge "Popular" nos mais usados
```

---

### Step 3: Conecte Integracao (IntegrationStep.tsx)

Cards das integracoes mais populares:

```typescript
const popularIntegrations = [
  { 
    id: 'github', 
    name: 'GitHub', 
    logo: '...', 
    category: 'SDLC',
    description: 'Repositorios, branch protection, vulnerabilidades',
    benefit: 'Detecta repos publicos e branches desprotegidas',
  },
  { 
    id: 'aws', 
    name: 'AWS', 
    logo: '...', 
    category: 'Cloud',
    description: 'IAM, S3, EC2, CloudTrail',
    benefit: 'Monitora buckets publicos e permissoes',
  },
  { 
    id: 'google-workspace', 
    name: 'Google Workspace', 
    logo: '...', 
    category: 'IAM',
    description: 'Usuarios, grupos, Drive, MFA',
    benefit: 'Verifica MFA e acessos compartilhados',
  },
  { 
    id: 'azure-ad', 
    name: 'Azure AD', 
    logo: '...', 
    category: 'IAM',
    description: 'Identidades, grupos, conditional access',
    benefit: 'Analisa usuarios sem MFA e privilegios',
  },
];

// Ao clicar, abre modal de conexao (reutiliza ConnectionModal)
// Mostra status de conexao em real-time
// "Pular por agora" disponivel
// Apos conectar com sucesso, habilita avancar
```

---

### Step 4: Primeiro Scan (FirstScanStep.tsx)

Executar compliance check e mostrar resultados:

```typescript
// Estados do step
type ScanState = 'idle' | 'running' | 'completed' | 'error';

// UI Flow:
// 1. "idle": Mostra botao "Executar Primeiro Scan"
// 2. "running": Progress bar + mensagens animadas
//    - "Analisando repositorios GitHub..."
//    - "Verificando configuracoes AWS..."
//    - "Aplicando regras de compliance..."
// 3. "completed": Mostra resultados em cards
//    - Score geral (ex: 78%)
//    - Passing tests (12)
//    - Failing tests (3)
//    - Preview de 2-3 issues encontradas
// 4. "error": Mensagem + retry

// Usa useComplianceStatus() internamente
// Salva resultados em onboarding_data
```

**Cards de resultado:**
```typescript
<div className="grid grid-cols-3 gap-6">
  <Card className="bg-success/10 border-success/20">
    <CardContent>
      <div className="text-4xl font-bold text-success">78%</div>
      <p>Score de Compliance</p>
    </CardContent>
  </Card>
  
  <Card className="bg-info/10 border-info/20">
    <CardContent>
      <div className="text-4xl font-bold text-info">12</div>
      <p>Controles Passando</p>
    </CardContent>
  </Card>
  
  <Card className="bg-warning/10 border-warning/20">
    <CardContent>
      <div className="text-4xl font-bold text-warning">3</div>
      <p>Issues Detectadas</p>
    </CardContent>
  </Card>
</div>
```

---

### Step 5: Proximos Passos (NextStepsStep.tsx)

Checklist interativo do que fazer depois:

```typescript
const nextSteps = [
  {
    id: 'invite-team',
    title: 'Convide sua Equipe',
    description: 'Adicione membros para colaborar na conformidade',
    icon: Users,
    link: '/settings?tab=permissions',
    action: 'Convidar Membros',
    priority: 'high',
  },
  {
    id: 'configure-slas',
    title: 'Configure SLAs',
    description: 'Defina prazos de remediacao por severidade',
    icon: Clock,
    link: '/settings?tab=system',
    action: 'Configurar',
    priority: 'medium',
  },
  {
    id: 'more-integrations',
    title: 'Conecte Mais Integracoes',
    description: 'Quanto mais integracoes, maior a visibilidade',
    icon: Plug,
    link: '/integrations',
    action: 'Ver Catalogo',
    priority: 'medium',
  },
  {
    id: 'review-policies',
    title: 'Revise Politicas',
    description: 'Personalize politicas de seguranca da empresa',
    icon: FileText,
    link: '/policies',
    action: 'Ver Politicas',
    priority: 'low',
  },
  {
    id: 'schedule-audit',
    title: 'Agende uma Auditoria',
    description: 'Prepare-se para certificacoes com auditorias internas',
    icon: Calendar,
    link: '/audit',
    action: 'Agendar',
    priority: 'low',
  },
];

// Checkboxes de "Ja fiz isso" (salva em onboarding_data)
// Botao "Ir para Dashboard" ao final
// Animacao de confetti ao concluir
```

---

### Fase 4: Integracao no App

**Atualizar ProtectedRoute.tsx:**

```typescript
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { state: onboardingState, isLoading: onboardingLoading } = useOnboardingWizard();
  
  // Mostrar wizard se:
  // 1. Usuario autenticado
  // 2. Onboarding nao completado
  // 3. Onboarding nao foi pulado
  const shouldShowWizard = user && 
    !onboardingState.hasCompleted && 
    !onboardingState.wasSkipped;

  if (shouldShowWizard) {
    return <OnboardingWizard />;
  }

  return <>{children}</>;
};
```

**Adicionar opcao em Settings.tsx:**

Nova secao no tab "account" ou novo tab "Onboarding":

```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Rocket className="w-5 h-5" />
      Tutorial e Onboarding
    </CardTitle>
    <CardDescription>
      Reveja o tutorial inicial ou refaca o onboarding
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Ver Tutorial Depois</p>
        <p className="text-sm text-muted-foreground">
          {hasCompleted 
            ? 'Voce completou o onboarding em ' + formatDate(completedAt)
            : 'Voce pulou o onboarding inicial'
          }
        </p>
      </div>
      <Button variant="outline" onClick={resetOnboarding}>
        <Play className="w-4 h-4 mr-2" />
        Refazer Onboarding
      </Button>
    </div>
  </CardContent>
</Card>
```

---

### Fase 5: Animacoes e UX

**Framer Motion para transicoes:**

```typescript
// Transicao entre steps
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.3 }}
  >
    {renderCurrentStep()}
  </motion.div>
</AnimatePresence>
```

**Barra de progresso animada:**

```typescript
const OnboardingProgress = ({ currentStep, totalSteps }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className={cn(
              "flex items-center gap-2",
              index <= currentStep ? "text-primary" : "text-muted-foreground"
            )}
            initial={{ scale: 0.8 }}
            animate={{ scale: index === currentStep ? 1.1 : 1 }}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              index < currentStep ? "bg-primary text-white" : 
              index === currentStep ? "bg-primary/20 border-2 border-primary" :
              "bg-muted"
            )}>
              {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span className="hidden md:block text-sm">{step.title}</span>
          </motion.div>
        ))}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
```

---

### Estrutura de Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/migrations/xxx_onboarding.sql` | Criar | Colunas de onboarding na profiles |
| `src/hooks/useOnboardingWizard.tsx` | Criar | Hook centralizado do wizard |
| `src/components/onboarding/OnboardingWizard.tsx` | Criar | Container principal fullscreen |
| `src/components/onboarding/OnboardingProgress.tsx` | Criar | Barra de progresso visual |
| `src/components/onboarding/steps/WelcomeStep.tsx` | Criar | Step 1: Bem-vindo |
| `src/components/onboarding/steps/FrameworksStep.tsx` | Criar | Step 2: Frameworks |
| `src/components/onboarding/steps/IntegrationStep.tsx` | Criar | Step 3: Integracao |
| `src/components/onboarding/steps/FirstScanStep.tsx` | Criar | Step 4: Primeiro Scan |
| `src/components/onboarding/steps/NextStepsStep.tsx` | Criar | Step 5: Proximos Passos |
| `src/components/onboarding/shared/StepContainer.tsx` | Criar | Layout padrao |
| `src/components/onboarding/shared/StepNavigation.tsx` | Criar | Navegacao |
| `src/components/auth/ProtectedRoute.tsx` | Modificar | Integrar wizard |
| `src/pages/Settings.tsx` | Modificar | Adicionar opcao de refazer |
| `src/integrations/supabase/types.ts` | Auto-update | Novos campos profiles |

---

### Fluxo de Usuario

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PRIMEIRO LOGIN                                                           │
│    ├── Usuario faz signup/login                                             │
│    ├── ProtectedRoute verifica onboarding_completed = false                 │
│    └── Exibe OnboardingWizard fullscreen                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. NAVEGACAO NO WIZARD                                                      │
│    ├── Step 1: Apresentacao (30s) → clica "Comecar"                         │
│    ├── Step 2: Seleciona frameworks → clica "Continuar"                     │
│    ├── Step 3: Conecta integracao (ou pula) → clica "Continuar"             │
│    ├── Step 4: Executa scan e ve resultados → clica "Continuar"             │
│    └── Step 5: Ve checklist → clica "Ir para Dashboard"                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. SKIP OU COMPLETAR                                                        │
│    ├── A qualquer momento pode clicar "Pular"                               │
│    │   └── onboarding_skipped = true                                        │
│    ├── Ao completar step 5                                                  │
│    │   └── onboarding_completed = true, onboarding_completed_at = now()     │
│    └── Redireciona para /dashboard                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. REFAZER (em /settings)                                                   │
│    ├── Clica "Refazer Onboarding"                                           │
│    ├── onboarding_completed = false, onboarding_step = 0                    │
│    └── Volta para OnboardingWizard                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Consideracoes Tecnicas

| Aspecto | Implementacao |
|---------|---------------|
| **Persistencia** | Cada step salva progresso no banco via Supabase |
| **Estado Local** | React Query + estado local para UI responsiva |
| **Validacao** | Step 2 requer min 1 framework; Step 3 permite skip |
| **Animacoes** | Framer Motion para transicoes suaves |
| **Responsivo** | Layout adapta para mobile (stack vertical) |
| **Acessibilidade** | Focus management, keyboard navigation |
| **Error Handling** | Toast para erros, retry automatico |
| **Cache** | Invalida queries relevantes ao completar |

---

### Ordem de Implementacao

1. Criar migracao de banco (colunas onboarding)
2. Criar hook `useOnboardingWizard`
3. Criar componentes shared (StepContainer, StepNavigation)
4. Criar OnboardingProgress
5. Criar WelcomeStep (Step 1)
6. Criar FrameworksStep (Step 2)
7. Criar IntegrationStep (Step 3)
8. Criar FirstScanStep (Step 4)
9. Criar NextStepsStep (Step 5)
10. Criar OnboardingWizard container
11. Integrar no ProtectedRoute
12. Adicionar opcao em Settings
13. Testar fluxo completo


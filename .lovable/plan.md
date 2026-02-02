
# Plano: Filtrar Integrações por Framework de Compliance

## Objetivo

Adicionar um novo filtro no Marketplace de Integrações que permita visualizar quais integrações atendem a cada framework de compliance (ISO 27001, SOC 2, LGPD), baseado no mapeamento existente em `EVIDENCE_CONTROL_MAP`.

---

## Arquitetura Existente

O sistema já possui o mapeamento entre integrações e controles:

| Integração | Controles Atendidos | Frameworks |
|------------|---------------------|------------|
| AWS | A.8.3, A.8.24, CC6.1, LGPD-46 | ISO 27001, SOC 2, LGPD |
| Google Workspace | A.5.1, A.8.5, CC6.1, CC6.2, LGPD-46 | ISO 27001, SOC 2, LGPD |
| Azure AD | A.5.1, A.5.15, A.8.5, CC6.1, CC6.2, CC6.3, LGPD-46 | ISO 27001, SOC 2, LGPD |
| Slack | A.8.5, CC6.1, LGPD-46 | ISO 27001, SOC 2, LGPD |
| Intune | A.8.1, CC6.6 | ISO 27001, SOC 2 |
| CrowdStrike | A.8.1, CC6.6 | ISO 27001, SOC 2 |
| GitHub/GitLab | A.8.5, A.8.24, CC6.1, LGPD-46 | ISO 27001, SOC 2, LGPD |
| Cloudflare | A.8.24, LGPD-46 | ISO 27001, LGPD |
| Datadog | A.12.4, A.16.1, CC7.2, CC7.3, LGPD-46 | ISO 27001, SOC 2, LGPD |
| BambooHR | A.5.15, CC6.1 | ISO 27001, SOC 2 |
| Okta/Auth0 | A.8.5, CC6.1, LGPD-46 | ISO 27001, SOC 2, LGPD |

---

## Implementacao

### 1. Estender o Catalogo de Integracoes

Arquivo: `src/lib/integrations-catalog.ts`

Adicionar campo `frameworks` e `controlsAutomated` a cada integracao:

```typescript
export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  logo: string | null;
  isNew?: boolean;
  provider: string;
  // NOVOS CAMPOS
  frameworks: ('ISO 27001' | 'SOC 2' | 'LGPD')[];
  controlsAutomated: number; // quantidade de controles que automatiza
}
```

Exemplo atualizado:

```typescript
{
  id: 'aws',
  name: 'Amazon Web Services',
  description: 'Auditoria de IAM, S3, CloudTrail e conformidade AWS',
  category: 'cloud',
  logo: 'https://cdn.simpleicons.org/amazonaws/FF9900',
  provider: 'aws',
  frameworks: ['ISO 27001', 'SOC 2', 'LGPD'],
  controlsAutomated: 4, // A.8.3, A.8.24, CC6.1, LGPD-46
}
```

### 2. Criar Funcao de Mapeamento Automatico

Arquivo: `src/lib/integrations-catalog.ts` (nova funcao)

```typescript
import { EVIDENCE_CONTROL_MAP, FRAMEWORK_CONTROL_CODES } from './evidence-control-map';

export function getIntegrationFrameworks(integrationId: string): string[] {
  const rules = EVIDENCE_CONTROL_MAP.filter(r => r.integrationId === integrationId);
  const allControlCodes = [...new Set(rules.flatMap(r => r.controlCodes))];
  
  const frameworks: string[] = [];
  
  for (const [framework, codes] of Object.entries(FRAMEWORK_CONTROL_CODES)) {
    if (allControlCodes.some(code => codes.some(fc => code.includes(fc)))) {
      frameworks.push(framework);
    }
  }
  
  return frameworks;
}
```

### 3. Adicionar Filtro por Framework nos Filtros

Arquivo: `src/components/integrations/MarketplaceFilters.tsx`

Novo Select para filtrar por framework:

```typescript
const FRAMEWORK_OPTIONS = [
  { value: 'all', label: 'Todos Frameworks', icon: '📋' },
  { value: 'ISO 27001', label: 'ISO 27001', icon: '🔒' },
  { value: 'SOC 2', label: 'SOC 2', icon: '🛡️' },
  { value: 'LGPD', label: 'LGPD', icon: '🇧🇷' },
];

// Novo prop e Select
<Select value={framework} onValueChange={onFrameworkChange}>
  <SelectTrigger className="w-[160px] bg-background/50">
    <SelectValue placeholder="Framework" />
  </SelectTrigger>
  <SelectContent>
    {FRAMEWORK_OPTIONS.map((opt) => (
      <SelectItem key={opt.value} value={opt.value}>
        <span className="flex items-center gap-2">
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 4. Atualizar IntegrationsHub para Filtrar

Arquivo: `src/pages/IntegrationsHub.tsx`

```typescript
const [frameworkFilter, setFrameworkFilter] = useState<string>('all');

// No useMemo de filteredIntegrations:
.filter(integration => {
  // ... filtros existentes ...
  
  // Framework filter
  if (frameworkFilter !== 'all') {
    const integrationFrameworks = getIntegrationFrameworks(integration.id);
    if (!integrationFrameworks.includes(frameworkFilter)) {
      return false;
    }
  }
  
  return true;
})
```

### 5. Exibir Badges de Framework nos Cards

Arquivo: `src/components/integrations/MarketplaceIntegrationCard.tsx`

Adicionar badges visuais mostrando quais frameworks a integracao atende:

```typescript
{/* Framework badges */}
<div className="flex flex-wrap gap-1 mt-2">
  {frameworks.map(fw => (
    <Badge 
      key={fw} 
      variant="outline" 
      className="text-[10px] px-1.5 py-0"
    >
      {fw}
    </Badge>
  ))}
</div>
```

---

## Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/lib/integrations-catalog.ts` | Modificar | Adicionar campos `frameworks` e funcao de mapeamento |
| `src/components/integrations/MarketplaceFilters.tsx` | Modificar | Adicionar Select de framework |
| `src/pages/IntegrationsHub.tsx` | Modificar | Adicionar state e logica de filtro por framework |
| `src/components/integrations/MarketplaceIntegrationCard.tsx` | Modificar | Exibir badges de frameworks |

---

## Resultado Visual Esperado

1. **Novo filtro dropdown** "Framework" ao lado dos filtros existentes
2. **Badges nos cards** mostrando "ISO 27001", "SOC 2", "LGPD"
3. **Contagem de controles** automatizados por integracao
4. Ao selecionar "LGPD", so aparecem integracoes que ajudam com LGPD (AWS, Google, Azure, Slack, GitHub, Cloudflare, Auth0, Okta, Datadog)

---

## Secao Tecnica

### Mapeamento Completo de Frameworks por Integracao

Baseado no `EVIDENCE_CONTROL_MAP` existente:

```
aws          -> ISO 27001 (A.8.3, A.8.24), SOC 2 (CC6.1), LGPD (LGPD-46)
azure-ad     -> ISO 27001 (A.5.1, A.5.15, A.8.5), SOC 2 (CC6.1-CC6.3), LGPD (LGPD-46)
google       -> ISO 27001 (A.5.1, A.8.5), SOC 2 (CC6.1, CC6.2), LGPD (LGPD-46)
github       -> ISO 27001 (A.8.5, A.8.24), SOC 2 (CC6.1), LGPD (LGPD-46)
gitlab       -> ISO 27001 (A.8.24), SOC 2 (CC6.1)
cloudflare   -> ISO 27001 (A.8.24), LGPD (LGPD-46)
slack        -> ISO 27001 (A.8.5), SOC 2 (CC6.1), LGPD (LGPD-46)
okta         -> ISO 27001 (A.8.5), SOC 2 (CC6.1), LGPD (LGPD-46)
auth0        -> ISO 27001 (A.8.5), SOC 2 (CC6.1), LGPD (LGPD-46)
intune       -> ISO 27001 (A.8.1), SOC 2 (CC6.6)
crowdstrike  -> ISO 27001 (A.8.1), SOC 2 (CC6.6)
bamboohr     -> ISO 27001 (A.5.15), SOC 2 (CC6.1)
datadog      -> ISO 27001 (A.12.4, A.16.1), SOC 2 (CC7.2, CC7.3), LGPD (LGPD-46)
jira         -> (sem mapeamento direto, adicionar se necessario)
```

### Exemplo de Uso

Quando usuario selecionar "LGPD" no filtro:
- Aparecem: AWS, Azure AD, Google, GitHub, Cloudflare, Slack, Okta, Auth0, Datadog
- Nao aparecem: GitLab, Intune, CrowdStrike, BambooHR, Jira

# Conclusão: APOC como fork simples da plataforma Vanta

**Data:** 02/02/2026  
**Objetivo avaliado:** Verificar se o projeto APOC conseguiu atingir o objetivo de ser um **fork simples** da plataforma Vanta.

---

## 1. O que é a Vanta?

A **Vanta** é uma **Trust Management Platform** (plataforma de gestão de confiança) que:

- **Automatiza compliance**: coleta automática de evidências para múltiplos frameworks (SOC 2, ISO 27001, GDPR, HIPAA etc.), com cross-mapping de controles.
- **Monitora continuamente**: centenas de testes automatizados em tempo (quase) real, com notificações quando testes falham.
- **Gerencia riscos**: avaliação de riscos, gestão de riscos de fornecedores (vendor risk), workflows de remediação.
- **Unifica o programa de segurança**: onboarding/offboarding, gestão de acessos, políticas, vulnerabilidades, inventário de ativos.
- **Gera relatórios e evidências**: documentação automática (ex.: System Description SOC 2), dashboards, integrações para coleta de evidências.
- **Oferece IA**: auxílio em políticas, questionários e sinalização de problemas.
- **Integra em escala**: 300+ integrações pré-construídas; opções para integrações privadas e Connectors API.

O modelo de produto é **self-service**: o cliente conecta suas próprias ferramentas (AWS, Okta, GitHub, etc.) e a plataforma coleta evidências e aplica regras de compliance automaticamente.

---

## 2. Referências explícitas ao “modelo Vanta” no APOC

No código e na documentação do APOC há referências diretas à Vanta:

| Onde | O que diz |
|------|-----------|
| Migration (2-layer roles) | "APOC 2-Layer Role System (**Vanta Model**)" |
| `useUserRoles.tsx` | "Org-Level Roles (**Vanta model**)", "OBJECT-LEVEL PERMISSION CHECKS (**Vanta Model**)" |
| `useObjectPermissions.tsx` | "Segue modelo **Vanta** de object-level permissions" |
| `UserRolesManagement.tsx` | "NEW **Vanta-model** roles" |
| `INTEGRATION_DATA_COLLECTION.md` | Modelo **Self-Service (similar à Vanta)** para credenciais de integração |
| `APOC_TECHNICAL_DOCUMENTATION.md` | "**97% de paridade funcional** com plataformas líderes de mercado (**Vanta**, Drata)" |

Ou seja: o projeto **teve a Vanta como referência** de produto e de modelo (roles, permissões, integrações self-service).

---

## 3. Comparação objetiva: Vanta vs APOC

### 3.1 Onde o APOC atinge o mesmo tipo de objetivo da Vanta

| Capacidade Vanta | No APOC | Status |
|------------------|---------|--------|
| **Compliance automation** | Múltiplos frameworks (LGPD, ISO 27001, SOC 2, HIPAA, PCI-DSS, NIST CSF), controles, evidências, gap assessment | ✅ Alinhado |
| **Monitoramento contínuo** | Regras automatizadas (14+), testes que falham por severidade, SLA (Critical/High/Medium), score de compliance em tempo real | ✅ Alinhado |
| **Gestão de riscos** | Registro de riscos, matriz 5x5, workflow de aceitação, vendor management | ✅ Alinhado |
| **Programa de segurança** | Revisão de acessos, políticas e treinamentos, gestão de incidentes, inventário de ativos | ✅ Alinhado |
| **Relatórios e evidências** | Relatórios, Portal do Auditor, locker de evidências, Trust Center público | ✅ Alinhado |
| **Integrações self-service** | Hub de integrações; usuário insere credenciais; coleta e regras sobre dados coletados | ✅ Mesmo conceito (modelo Vanta) |
| **Modelo de permissões** | Dois níveis: por organização (roles) e por objeto (owner/reviewer/viewer) | ✅ Inspirado no modelo Vanta |
| **Questionários + IA** | Questionários de segurança com automação de respostas (ex.: Claude) | ✅ Alinhado (Vanta também usa IA) |
| **Conformidade e privacidade** | LGPD/GDPR (classificação, mascaramento, retenção, exportação, exclusão) | ✅ Alinhado |

Ou seja: nas **áreas de produto principais** (compliance, risco, auditoria, integrações, relatórios, permissões, self-service), o APOC **atinge o mesmo tipo de objetivo** que a Vanta, em formato de plataforma GRC.

### 3.2 Diferenças de escopo (esperadas em um “fork simples”)

| Aspecto | Vanta | APOC |
|---------|--------|------|
| **Número de integrações** | 300+ / 400+ | ~14 integrações (com várias já funcionais) |
| **Frequência/volume de testes** | 1.200+ testes/hora, contínuo | Regras sobre dados sincronizados (conceito igual, escala menor) |
| **Vendor risk** | Produto maduro + aquisição (ex. Riskey) | Vendor management presente, menos aprofundado |
| **IA** | Políticas, questionários, remediação | Foco em questionários (Claude) |
| **Maturidade operacional** | Produto comercial maduro | Beta avançado; partes ainda com mocks (conforme plano de dados reais) |

Essas diferenças são **normais** para um fork simples: mesmo conceito e fluxos, com menos integrações, menos testes e menos polish.

---

## 4. Conclusão: o projeto atingiu o objetivo?

### Objetivo declarado

- Ser um **fork simples** da plataforma **Vanta**.

### Avaliação

**Sim, o projeto conseguiu atingir esse objetivo**, com as seguintes ressalvas:

1. **Conceito e posicionamento**
   - O APOC é uma **plataforma de GRC / trust management** que automatiza compliance, riscos, auditoria e evidências, no mesmo **modelo de produto** da Vanta (self-service, integrações, monitoramento por regras, score, relatórios).

2. **Paridade funcional de conceito**
   - As **áreas principais** da Vanta estão cobertas no APOC:
     - Compliance (frameworks, controles, evidências).
     - Monitoramento contínuo (regras, testes falhando, SLA, score).
     - Risco e fornecedores.
     - Auditoria e evidências (portal do auditor, Trust Center).
     - Integrações self-service e modelo de permissões inspirado na Vanta.
   - A documentação interna já descreve o sistema em **“Beta Avançado” com ~97% de paridade funcional** em relação a Vanta/Drata no que diz respeito a **funcionalidades** (não escala).

3. **“Fork simples”**
   - “Simples” aqui significa: **mesma ideia de produto**, com **menos integrações**, **menor escala de testes** e **menor maturidade operacional**.
   - O APOC não replica a Vanta feature-by-feature com 300+ integrações; replica o **tipo** de plataforma e os **fluxos** principais (conectar ferramentas → coletar dados → aplicar regras → score, relatórios, auditoria).

4. **O que ainda afasta de um “clone completo”**
   - Partes do produto ainda usam **dados mockados** (há plano para migrar para dados reais).
   - **Cobertura de testes** automatizados ainda baixa.
   - **Número de integrações** muito menor que o da Vanta (14 vs 300+).

### Resumo em uma frase

**O APOC atingiu o objetivo de ser um fork simples da Vanta:** mesma categoria de produto (trust management / GRC automatizado), mesmo modelo (self-service, integrações, regras, score, auditoria) e mesmo tipo de permissões (modelo Vanta), com escopo e maturidade reduzidos, como é esperado de um fork simples.

---

## 5. Recomendações para reforçar o alinhamento (opcional)

- Concluir a **remoção de mocks** e uso de **dados reais** em todas as áreas (seguir `PLANO_DADOS_REAIS_SEM_MOCK.md`).
- Aumentar o **número de integrações** e a **cobertura de regras** de compliance, conforme prioridade de negócio.
- Documentar de forma explícita no README ou em um “Positioning” que o APOC é inspirado no modelo Vanta (trust management, self-service, 2-layer permissions), para deixar claro o objetivo de “fork simples” para qualquer leitor externo.

---

*Documento gerado para responder à pergunta: “O projeto conseguiu atingir o objetivo de ser um fork simples da plataforma Vanta?”*

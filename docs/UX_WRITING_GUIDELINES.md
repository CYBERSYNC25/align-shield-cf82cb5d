# Diretrizes de UX Writing - Complice

## Resumo Executivo

Guia completo para padronizar textos de interface, CTAs, labels e mensagens do sistema, priorizando clareza, objetividade e tom amigável.

---

## 🎯 Princípios Fundamentais

### 1. Clareza Acima de Tudo
- Use linguagem simples e direta
- Evite jargões técnicos desnecessários
- Seja específico, não genérico

### 2. Tom de Voz
- **Profissional mas amigável**
- **Confiante sem ser arrogante**
- **Útil sem ser condescendente**
- **Direto sem ser seco**

### 3. Estrutura de Frase
- **Verbos no infinitivo** para ações ("Conectar", "Criar", "Ver")
- **Substantivos claros** para estados ("Conexão Ativa", "Evidências Coletadas")
- **Números e métricas** quando relevante ("+ Nova Integração", "Ver 12 Evidências")

---

## 📝 Botões e CTAs

### ✅ FAZER

| Contexto | ❌ Evitar | ✅ Preferir |
|----------|----------|------------|
| Ação principal | "Criar" | "+ Nova Integração" |
| Confirmar ação | "OK" | "Confirmar" / "Salvar" |
| Conectar serviço | "Conectar" | "+ Conectar Google Workspace" |
| Ver detalhes | "Ver" | "Ver Detalhes" / "Ver Evidências" |
| Adicionar item | "Adicionar" | "+ Adicionar Política" |
| Iniciar processo | "Começar" | "Iniciar Auditoria" |
| Configurar | "Configurar" | "Configurar Integração" |
| Testar | "Testar" | "Testar Conexão" |

### Padrões de CTAs

#### CTAs Primárias (Ação Principal)
```
+ Nova [Entidade]
+ Conectar [Serviço]
+ Criar [Recurso]
Salvar Alterações
Confirmar [Ação]
```

#### CTAs Secundárias (Ação Alternativa)
```
Cancelar
Ver Detalhes
Editar [Recurso]
Configurar
```

#### CTAs Destrutivas (Ação Irreversível)
```
Desconectar
Excluir [Recurso]
Remover
```

---

## 🏷️ Labels e Títulos

### Hierarquia de Informação

#### H1 - Título da Página
```
✅ "Hub de Integrações"
✅ "Gestão de Riscos"
✅ "Políticas e Treinamentos"
```

#### H2 - Seção Principal
```
✅ "Suas Integrações Ativas"
✅ "Conectar Nova Integração"
✅ "Histórico de Requisições"
```

#### H3 - Subseção
```
✅ "Integrações Mais Populares"
✅ "Configurações OAuth 2.0"
```

### Descrições Curtas (Subtítulos)
- **Máximo 100 caracteres**
- **Foco no benefício para o usuário**
- **Tom informativo, não promocional**

```
✅ "Conecte suas ferramentas para coleta automática de evidências e monitoramento contínuo"
✅ "Gerencie suas conexões OAuth e integrações ativas"
✅ "Acompanhe todas as requisições feitas através do conector"
```

---

## 📊 Status e Badges

### Status de Conexão

| Status | Label | Cor |
|--------|-------|-----|
| Ativo | "Ativa" | Verde |
| Pausado | "Pausada" | Cinza |
| Com problemas | "Com Problemas" | Amarelo |
| Desconectado | "Desconectada" | Vermelho |
| Conectando | "Conectando..." | Azul |

### Badges Informativos

```
✅ "Novo" (features novas)
✅ "Popular" (mais usado)
✅ "3 Pendentes" (contador numérico)
✅ "+15%" (variação positiva)
✅ "Resolvido" (status de incidente)
```

### Estados de Processo

| Estado | Label |
|--------|-------|
| Não iniciado | "Não Iniciado" |
| Em progresso | "Em Andamento" |
| Aguardando | "Aguardando Aprovação" |
| Completo | "Concluído" |
| Falhou | "Falhou - Ver Detalhes" |

---

## 🔔 Mensagens do Sistema

### Mensagens de Sucesso
```
✅ "Integração conectada com sucesso"
✅ "Política criada e publicada"
✅ "Configurações salvas"
✅ "Auditoria iniciada com sucesso"
```

### Mensagens de Erro
```
✅ "Não foi possível conectar. Verifique suas credenciais"
✅ "Erro ao salvar. Tente novamente"
✅ "Token expirado. Reconecte sua conta"
✅ "Campos obrigatórios não preenchidos"
```

### Mensagens de Confirmação
```
✅ "Tem certeza que deseja desconectar esta integração?"
✅ "Esta ação não pode ser desfeita. Deseja continuar?"
✅ "Excluir permanentemente este item?"
```

### Mensagens de Estado Vazio
```
✅ "Nenhuma integração conectada"
✅ "Você ainda não tem políticas cadastradas"
✅ "Sem evidências disponíveis no momento"
```

**Sempre adicionar uma CTA após mensagem vazia:**
```
Título: "Nenhuma integração conectada"
Descrição: "Conecte suas primeiras integrações para começar a coletar evidências automaticamente"
CTA: "+ Conectar Integração"
```

---

## 🗂️ Navegação e Menus

### Tabs (Abas)

| ❌ Genérico | ✅ Específico |
|------------|--------------|
| "Guia" | "Catálogo" |
| "Testes" | "Testar Integração" |
| "OAuth" | "Conectar" |
| "Logs" | "Monitorar" |

### Menu de Contexto (Dropdown)

```
✅ Ver Detalhes
✅ Editar Configurações
✅ Pausar Integração
✅ Retomar Integração
✅ Testar Conexão
---
✅ Desconectar  (em vermelho)
```

### Sidebar

```
🏠 Dashboard
🛡️ Compliance
    ↳ Controles & Frameworks
    ↳ Prontidão
    ↳ Auditorias
⚖️ Governança
    ↳ Políticas & Treinamentos
    ↳ Revisões de Acesso
```

---

## 📋 Formulários e Inputs

### Labels de Campos
```
✅ "Nome da Política" (não "Política Nome")
✅ "Email do Responsável"
✅ "Data de Vencimento"
✅ "Selecione o Framework"
```

### Placeholders
```
✅ "Buscar integrações..."
✅ "Digite o nome da política"
✅ "exemplo@empresa.com"
✅ "Selecione uma data"
```

### Textos de Ajuda
```
✅ "Este email será usado para notificações importantes"
✅ "Escolha uma data até 90 dias no futuro"
✅ "Mínimo 8 caracteres, incluindo números"
```

### Mensagens de Validação
```
✅ "Campo obrigatório"
✅ "Email inválido"
✅ "Senha muito curta (mínimo 8 caracteres)"
✅ "Data deve ser no futuro"
```

---

## 📈 Métricas e Números

### Formatação

```
✅ "1.247 coletas" (separador de milhares)
✅ "99,2%" (vírgula para decimais em PT-BR)
✅ "+15%" (variação com sinal)
✅ "3 dias atrás" (tempo relativo)
```

### Labels de KPIs

```
✅ "Integrações Ativas" (não "Total Ativo")
✅ "Coletas Hoje"
✅ "Taxa de Sucesso"
✅ "Último Incidente"
```

---

## ⏱️ Tempo e Datas

### Formatos
```
✅ "Há 5 minutos"
✅ "Hoje às 14:30"
✅ "Ontem às 09:15"
✅ "15 de novembro de 2025"
✅ "15/11/2025" (quando espaço é limitado)
```

### Durações
```
✅ "8-12 minutos" (range)
✅ "Aproximadamente 10 minutos"
✅ "Menos de 5 minutos"
```

---

## 🚫 Termos a Evitar

| ❌ Evitar | ✅ Usar |
|----------|--------|
| "Clique aqui" | "Ver Detalhes" (texto descritivo) |
| "Submit" | "Enviar" / "Salvar" |
| "Ok" | "Confirmar" / "Entendi" |
| "Cancel" | "Cancelar" |
| "Error" | "Erro ao [ação]" (específico) |
| "Success" | "[Ação] realizada com sucesso" |
| "Warning" | "Atenção" / "Aviso" |
| "Are you sure?" | "Tem certeza que deseja [ação]?" |

---

## ✨ Microtextos Importantes

### Loading States
```
✅ "Carregando integrações..."
✅ "Conectando..."
✅ "Salvando alterações..."
✅ "Processando requisição..."
```

### Empty States
```
Título: Curto e descritivo
Descrição: Explica por que está vazio e o que fazer
CTA: Ação clara para resolver
```

### Tooltips
```
✅ Curtos (máximo 60 caracteres)
✅ Informativos, não óbvios
✅ Complementam, não repetem o label
```

---

## 📱 Responsividade do Texto

### Mobile
- **Texto mais curto**
- **Abreviações aceitáveis:**
  - "Config." em vez de "Configurações"
  - "Docs" em vez de "Documentação"
- **Ícones + texto quando possível**

### Desktop
- **Texto completo**
- **Mais contexto nos tooltips**
- **Descrições mais detalhadas**

---

## 🎨 Exemplos Práticos

### Antes vs Depois

#### Exemplo 1: Botão de Criar
```
❌ Antes: [Criar]
✅ Depois: [+ Nova Integração]
```

#### Exemplo 2: Status
```
❌ Antes: "OK" (badge verde)
✅ Depois: "Ativa" (badge verde com ícone)
```

#### Exemplo 3: Ação de Menu
```
❌ Antes: "View"
✅ Depois: "Ver Detalhes"
```

#### Exemplo 4: Empty State
```
❌ Antes: 
  "Sem dados"

✅ Depois:
  Título: "Nenhuma integração conectada"
  Descrição: "Conecte suas primeiras integrações para começar a coletar evidências automaticamente"
  CTA: "+ Conectar Integração"
```

---

## 🔍 Checklist de Revisão

Antes de publicar qualquer texto, verifique:

- [ ] O texto é claro e direto?
- [ ] Evita jargões desnecessários?
- [ ] O CTA indica exatamente o que acontecerá?
- [ ] Números estão formatados corretamente (PT-BR)?
- [ ] Status e badges são descritivos?
- [ ] Mensagens de erro são específicas e úteis?
- [ ] Empty states têm ação clara?
- [ ] Tom de voz está consistente?
- [ ] Textos estão em português brasileiro correto?

---

**Última Atualização:** 2025-11-18  
**Versão:** 1.0  
**Status:** ✅ Documento Oficial de UX Writing

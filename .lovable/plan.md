
# Plano: Configurar Auditoria Automática de Dependências

## Objetivo

Implementar um processo automatizado de auditoria de segurança de dependências com:
- GitHub Dependabot para PRs automáticos
- Script de verificação de vulnerabilidades
- Documentação de políticas de segurança

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `.github/dependabot.yml` | Criar | Configuração do Dependabot |
| `package.json` | Modificar | Adicionar script `audit:check` |
| `README.md` | Modificar | Adicionar seção "Segurança de Dependências" |

---

## Implementação

### 1. Criar `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### 2. Adicionar Script no `package.json`

Adicionar na seção `scripts`:

```json
"audit:check": "npm audit --audit-level=high"
```

### 3. Adicionar Seção no README.md

Inserir antes da seção "Segurança de Uploads" (linha ~560):

```markdown
## Seguranca de Dependencias

### Dependencias

- Auditoria semanal via npm audit
- Dependabot configurado para PRs automaticos
- Nenhuma vulnerabilidade high/critical permitida em producao
- Lock file (package-lock.json) sempre commitado

### Politica de Merge

PRs nao sao mergeados se `npm audit` falhar com vulnerabilidades high ou critical.

### Scripts Disponiveis

| Script | Descricao |
|--------|-----------|
| `npm run audit:check` | Verifica vulnerabilidades high/critical |

### Dependabot

O projeto utiliza GitHub Dependabot para:
- Verificacao semanal de dependencias
- PRs automaticos para atualizacoes de seguranca
- Limite de 10 PRs abertos simultaneamente
```

---

## Resultado Esperado

Apos a implementacao:

1. GitHub Dependabot criara PRs automaticos semanalmente
2. Script `npm run audit:check` disponivel para CI/CD
3. Politica documentada no README para referencia da equipe
4. Processo claro para manter dependencias seguras

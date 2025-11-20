# ☁️ Guia de Integração AWS - Auditoria Cross-Account

## 📋 Visão Geral

Este documento descreve a arquitetura e o passo a passo para a implementação da integração com Amazon Web Services (AWS) no Hub de Compliance.

Diferente das integrações OAuth (Google/Microsoft), a AWS utiliza um modelo de **Cross-Account Role (STS)**. Isso significa que não armazenamos credenciais de longa duração (Access Keys) dos clientes, apenas assumimos uma identidade temporária para leitura.

**Status Atual:** 🚧 Em Implementação (Aguardando Configuração de IAM do Sistema)  
**Tipo de Coleta:** Leitura de IAM (Usuários, Políticas) e S3 (Configurações de Bucket).

## 🏗️ Arquitetura de Segurança

A integração segue o princípio de "Least Privilege" (Menor Privilégio).

### O Fluxo de Conexão

1. **SaaS Account (Nossa Conta):** Possui um "Robô" (IAM User) com permissão apenas para solicitar acesso (`sts:AssumeRole`).
2. **Client Account (Conta do Cliente):** Cria uma Role específica que "confia" na nossa conta.
3. **Handshake:**
   - Nossa Edge Function usa as credenciais do "Robô".
   - Solicita à AWS: "Quero assumir a Role do Cliente X".
   - Se a confiança estiver configurada, a AWS retorna chaves temporárias (validade de 1h).
   - O sistema usa essas chaves para ler os dados de evidência.

## 🛠️ Configuração do Lado do Servidor (Admin)

⚠️ **Ação Necessária:** Esta etapa deve ser realizada pelo Administrador da Conta AWS do SaaS antes que a funcionalidade funcione.

Precisamos criar a identidade que o Supabase usará para conectar.

### 1. Criar Usuário IAM de Sistema

- **Nome Sugerido:** `system-compliance-connector`
- **Tipo de Acesso:** Apenas Programático (Access Key).

### 2. Permissões do Usuário (Policy)

Este usuário NÃO deve ter permissões administrativas na nossa conta. Ele precisa apenas da permissão para assumir roles externas.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAssumingExternalRoles",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "*"
        }
    ]
}
```

### 3. Configurar Variáveis de Ambiente (Supabase)

As credenciais geradas no passo acima devem ser inseridas no **Supabase Dashboard > Settings > Edge Functions > Secrets:**

| Variável | Descrição |
|----------|-----------|
| `AWS_ACCESS_KEY_ID` | ID da chave do usuário de sistema (AKIA...) |
| `AWS_SECRET_ACCESS_KEY` | Segredo da chave (não compartilhar) |
| `AWS_REGION` | Região padrão (ex: us-east-1) |
| `SAAS_AWS_ACCOUNT_ID` | O ID numérico da nossa conta AWS (ex: 123456789012) |

## 💻 Implementação Técnica

### 1. Banco de Dados (integrations)

As configurações da AWS são armazenadas na coluna JSONB `configuration`.

```sql
-- Exemplo de registro na tabela integrations
{
  "id": "uuid...",
  "provider": "AWS",
  "name": "AWS Produção",
  "status": "active",
  "configuration": {
    "role_arn": "arn:aws:iam::987654321098:role/ComplianceAuditorRole"
  }
}
```

### 2. Edge Function (aws-test-connection)

**Objetivo:** Validar se o ARN fornecido pelo cliente é acessível.

**Lógica do Script:**
1. Recebe `integration_id`.
2. Busca `role_arn` no banco.
3. Inicializa `STSClient` com as credenciais do ambiente (`AWS_ACCESS_KEY_ID`...).
4. Executa `AssumeRoleCommand` visando o ARN do cliente.
5. Se sucesso, recebe credenciais temporárias.
6. Inicializa `IAMClient` com as credenciais temporárias.
7. Executa `ListUsersCommand` (teste de fumaça).
8. Retorna sucesso se listar usuários, ou erro se falhar.

### 3. Componente Frontend (AwsConnectionModal.tsx)

- **Validação:** Regex obriga o input a começar com `arn:aws:iam::`.
- **UX:** Fornece o JSON exato que o cliente precisa colar na AWS dele.

## 👥 Guia para o Cliente Final

Estas são as instruções que apresentamos no modal de "Como Configurar".

### Passo 1: Criar a Permissão

No console da AWS, crie uma Policy com as permissões de leitura que nosso auditor precisa:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "iam:ListUsers",
                "iam:GetAccountSummary",
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation"
            ],
            "Resource": "*"
        }
    ]
}
```

### Passo 2: Criar a Role de Confiança

1. Crie uma nova Role.
2. Selecione "Another AWS Account".
3. Em Account ID, insira o ID do nosso SaaS: **[SAAS_AWS_ACCOUNT_ID]**.
4. Anexe a Policy criada no passo 1.
5. Copie o Role ARN gerado e cole no nosso sistema.

## 🔍 Troubleshooting e Erros Comuns

### ❌ Erro: AccessDenied ou 403
- **Causa Provável:** O cliente criou a Role, mas esqueceu de colocar o ID da nossa conta na "Trust Relationship", ou a Role não tem a policy de leitura.
- **Solução:** Pedir para o cliente verificar a aba "Trust Relationships" da Role.

### ❌ Erro: InvalidClientTokenId (Backend)
- **Causa Provável:** As variáveis de ambiente `AWS_ACCESS_KEY_ID` no Supabase estão erradas, expiradas ou são fictícias.
- **Solução:** Administrador deve rotacionar as chaves do usuário `system-compliance-connector`.

### ❌ Erro: SignatureDoesNotMatch
- **Causa Provável:** A Secret Key no Supabase não corresponde ao Access Key ID. Geralmente erro de copiar/colar (espaços em branco).

## ✅ Checklist de Validação (Smoke Test)

- [ ] Frontend: Modal abre corretamente.
- [ ] Frontend: Validação de Regex impede ARNs inválidos.
- [ ] Database: Registro salvo na tabela integrations com provider 'AWS'.
- [ ] Backend: Edge Function configurada com Secrets reais.
- [ ] E2E: Teste com uma conta AWS real retorna "Sucesso" e contagem de usuários.

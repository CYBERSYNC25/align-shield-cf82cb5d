
# Plano: Implementação de Autenticação Multi-Fator (MFA) com TOTP

## Visão Geral

Implementar um sistema completo de MFA usando TOTP (Time-based One-Time Password) compatível com Google Authenticator/Authy, incluindo:
- Geração de QR code para setup
- 10 backup codes de uso único
- Configuração obrigatória por role (admin obrigatório, outros encorajado)
- Re-challenge para ações sensíveis
- Badge visual de MFA no avatar

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         MFA TOTP Architecture                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌─────────────────┐     ┌───────────────────┐    │
│  │   Frontend   │────▶│  Edge Functions  │────▶│  Database (RLS)   │    │
│  │              │     │                 │     │                   │    │
│  │ Setup2FAModal│     │ mfa-setup       │     │ user_mfa_settings │    │
│  │ MFAChallenge │     │ mfa-verify      │     │   - secret_enc    │    │
│  │ BackupCodes  │     │ mfa-backup      │     │   - backup_codes  │    │
│  └──────────────┘     │ mfa-disable     │     │   - enabled_at    │    │
│                       └─────────────────┘     └───────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ TOTP Flow:                                                       │   │
│  │                                                                  │   │
│  │  1. User clicks "Enable MFA"                                     │   │
│  │  2. Edge Function generates secret + QR code (otpauth://...)    │   │
│  │  3. User scans QR with authenticator app                        │   │
│  │  4. User enters 6-digit code to verify                          │   │
│  │  5. System shows 10 backup codes (one-time display)             │   │
│  │  6. MFA enabled - Badge appears on avatar                       │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Login Flow with MFA:                                             │   │
│  │                                                                  │   │
│  │  1. Email + Password → Supabase Auth                            │   │
│  │  2. Check if MFA enabled → user_mfa_settings                    │   │
│  │  3. If enabled → Show MFA Challenge Modal                       │   │
│  │  4. User enters TOTP code OR backup code                        │   │
│  │  5. Verify via Edge Function                                    │   │
│  │  6. Login complete                                              │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Database - Tabela `user_mfa_settings`

### 1.1 Migration SQL

```sql
-- Tabela de configurações MFA por usuário
CREATE TABLE public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted TOTP secret
  backup_codes_encrypted TEXT, -- AES-256-GCM encrypted JSON array
  backup_codes_used INTEGER DEFAULT 0,
  enabled_at TIMESTAMPTZ, -- NULL = not enabled (pending verification)
  verified_at TIMESTAMPTZ, -- When user first verified setup
  last_used_at TIMESTAMPTZ, -- Last successful TOTP verification
  recovery_email TEXT, -- Optional recovery email
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_mfa_user ON public.user_mfa_settings(user_id);
CREATE INDEX idx_mfa_enabled ON public.user_mfa_settings(enabled_at) WHERE enabled_at IS NOT NULL;

-- RLS
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Service role only (Edge Functions)
CREATE POLICY "Service role manages MFA"
  ON public.user_mfa_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can check if they have MFA enabled (não vê secret)
CREATE POLICY "Users can check own MFA status"
  ON public.user_mfa_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 Helper Functions

```sql
-- Verificar se usuário tem MFA habilitado
CREATE OR REPLACE FUNCTION public.user_has_mfa_enabled(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = _user_id
    AND enabled_at IS NOT NULL
  )
$$;

-- Verificar se role requer MFA
CREATE OR REPLACE FUNCTION public.role_requires_mfa(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'master_admin')
  )
$$;
```

---

## Fase 2: Edge Functions para MFA

### 2.1 `mfa-setup` - Iniciar configuração MFA

**Arquivo:** `supabase/functions/mfa-setup/index.ts`

```typescript
/**
 * MFA Setup - Generate TOTP secret and QR code
 * 
 * POST /mfa-setup
 * 
 * Response:
 * - qrCodeDataUrl: Data URL for QR code image
 * - otpauthUrl: Manual entry URL
 * - setupToken: Temporary token to complete setup
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encryptToken } from "../_shared/crypto-utils.ts";
import { createLogger } from "../_shared/logger.ts";

// TOTP library for Deno
import { encode as base32Encode } from "https://deno.land/std@0.190.0/encoding/base32.ts";

const logger = createLogger('mfa-setup');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate cryptographically secure TOTP secret (20 bytes = 160 bits)
function generateTotpSecret(): string {
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  return base32Encode(randomBytes);
}

// Generate OTPAuth URL for authenticator apps
function generateOtpAuthUrl(secret: string, email: string, issuer: string = 'APOC'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// Generate 10 backup codes (8 chars each, alphanumeric)
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar chars
  
  for (let i = 0; i < 10; i++) {
    let code = '';
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    for (let j = 0; j < 8; j++) {
      code += chars[randomBytes[j] % chars.length];
    }
    // Format: XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}

// Simple QR code generation using Google Charts API (fallback)
// For production, use a proper QR library
function generateQrCodeUrl(data: string): string {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has MFA enabled
    const { data: existingMfa } = await adminClient
      .from('user_mfa_settings')
      .select('enabled_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMfa?.enabled_at) {
      return new Response(JSON.stringify({ error: "MFA already enabled" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate new TOTP secret and backup codes
    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes();
    const otpauthUrl = generateOtpAuthUrl(secret, user.email!, 'APOC');
    const qrCodeUrl = generateQrCodeUrl(otpauthUrl);

    // Encrypt sensitive data
    const secretEncrypted = await encryptToken(secret, encryptionKey);
    const backupCodesEncrypted = await encryptToken(JSON.stringify(backupCodes), encryptionKey);

    // Upsert MFA settings (pending verification)
    const { error: upsertError } = await adminClient
      .from('user_mfa_settings')
      .upsert({
        user_id: user.id,
        secret_encrypted: secretEncrypted,
        backup_codes_encrypted: backupCodesEncrypted,
        backup_codes_used: 0,
        enabled_at: null, // Not enabled until verified
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      logger.error('Failed to save MFA settings', upsertError);
      throw new Error('Failed to initialize MFA setup');
    }

    logger.info('MFA setup initiated', { userId: user.id });

    return new Response(JSON.stringify({
      qrCodeUrl,
      otpauthUrl,
      backupCodes, // Show only once during setup!
      message: 'Scan the QR code with your authenticator app, then verify with a code'
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    logger.error('MFA setup error', error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
```

### 2.2 `mfa-verify` - Verificar código TOTP

**Arquivo:** `supabase/functions/mfa-verify/index.ts`

```typescript
/**
 * MFA Verify - Verify TOTP code or backup code
 * 
 * POST /mfa-verify
 * Body: { code: string, action?: 'setup' | 'login' | 'sensitive' }
 * 
 * - action='setup': Complete MFA setup (first verification)
 * - action='login': Verify during login flow
 * - action='sensitive': Re-challenge for sensitive actions
 */

// TOTP verification using Web Crypto API
async function verifyTotp(secret: string, token: string, window: number = 1): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const period = 30;
  
  for (let i = -window; i <= window; i++) {
    const counter = Math.floor((now + i * period) / period);
    const expectedToken = await generateTotp(secret, counter);
    if (expectedToken === token) return true;
  }
  
  return false;
}

async function generateTotp(secret: string, counter: number): Promise<string> {
  // Decode base32 secret
  const secretBytes = base32Decode(secret);
  
  // Counter as 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }
  
  // HMAC-SHA1
  const key = await crypto.subtle.importKey(
    'raw', secretBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hash = new Uint8Array(signature);
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0xf;
  const binary = (hash[offset] & 0x7f) << 24
    | hash[offset + 1] << 16
    | hash[offset + 2] << 8
    | hash[offset + 3];
  
  // 6 digits
  return (binary % 1000000).toString().padStart(6, '0');
}
```

### 2.3 `mfa-disable` - Desabilitar MFA

**Arquivo:** `supabase/functions/mfa-disable/index.ts`

Requer código TOTP atual para desabilitar, mantém registro de auditoria.

---

## Fase 3: Frontend - Componentes

### 3.1 Hook `useMFA`

**Arquivo:** `src/hooks/useMFA.tsx`

```typescript
export interface MFAStatus {
  enabled: boolean;
  enabledAt: Date | null;
  requiresMfa: boolean; // Based on role
  pendingSetup: boolean;
}

export const useMFA = () => {
  const { user } = useAuth();
  const { isAdmin, isMasterAdmin } = useUserRoles();
  
  // Check MFA status
  const { data: mfaStatus, isLoading } = useQuery({
    queryKey: ['mfa-status', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_mfa_settings')
        .select('enabled_at')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      return {
        enabled: !!data?.enabled_at,
        enabledAt: data?.enabled_at ? new Date(data.enabled_at) : null,
        requiresMfa: isAdmin() || isMasterAdmin(),
        pendingSetup: !data?.enabled_at && (isAdmin() || isMasterAdmin())
      };
    },
    enabled: !!user
  });
  
  // Setup MFA
  const setupMfa = useMutation({...});
  
  // Verify code
  const verifyCode = useMutation({...});
  
  // Disable MFA
  const disableMfa = useMutation({...});
  
  return { mfaStatus, isLoading, setupMfa, verifyCode, disableMfa };
};
```

### 3.2 Novo `Setup2FAModal` (substituir mock atual)

Componente com 4 passos:
1. **Instrução** - Explica MFA + mostra apps compatíveis
2. **QR Code** - Exibe QR + URL manual para escanear
3. **Verificar** - Campo OTP de 6 dígitos para validar
4. **Backup Codes** - Exibe 10 códigos (uma única vez) + botão download

### 3.3 `MFAChallengeModal`

Modal para verificação durante login ou ações sensíveis:
- Input OTP de 6 dígitos (usando componente `InputOTP` existente)
- Link "Usar código de backup"
- Contador regressivo de 30s para novo código

### 3.4 `MFARequiredBanner`

Banner para admins sem MFA:
```typescript
<Alert variant="warning">
  <Shield className="h-4 w-4" />
  <AlertTitle>MFA Obrigatório</AlertTitle>
  <AlertDescription>
    Como administrador, você deve habilitar autenticação de dois fatores.
    <Button onClick={() => setShowSetup(true)}>Configurar Agora</Button>
  </AlertDescription>
</Alert>
```

---

## Fase 4: Fluxo de Login com MFA

### 4.1 Atualizar `src/pages/Auth.tsx`

```typescript
const handleSignIn = async (e: React.FormEvent) => {
  // ... existing validation ...
  
  const { error, data } = await signIn(email, password);
  
  if (!error && data?.user) {
    // Check if MFA is enabled
    const { data: mfaSettings } = await supabase
      .from('user_mfa_settings')
      .select('enabled_at')
      .eq('user_id', data.user.id)
      .maybeSingle();
    
    if (mfaSettings?.enabled_at) {
      // Show MFA challenge modal
      setPendingUser(data.user);
      setShowMfaChallenge(true);
      return; // Don't complete login yet
    }
    
    // No MFA - proceed with login
    navigate('/');
  }
};
```

### 4.2 Context para MFA Challenge

```typescript
const MFAContext = createContext<{
  challengeRequired: boolean;
  triggerChallenge: (action: string, onSuccess: () => void) => void;
  completeChallenge: () => void;
}>({...});
```

---

## Fase 5: Re-Challenge para Ações Sensíveis

### 5.1 Hook `useMFAChallenge`

```typescript
export const useMFAChallenge = () => {
  const { mfaStatus } = useMFA();
  const [showChallenge, setShowChallenge] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>();
  
  const requireMfa = (action: () => void) => {
    if (mfaStatus?.enabled) {
      setPendingAction(() => action);
      setShowChallenge(true);
    } else {
      action(); // MFA not enabled, proceed
    }
  };
  
  return { requireMfa, showChallenge, setShowChallenge, pendingAction };
};
```

### 5.2 Ações que Requerem Re-Challenge

| Ação | Componente | Implementação |
|------|------------|---------------|
| Trocar senha | `ChangePasswordModal` | Chamar `requireMfa()` antes de submit |
| Adicionar integração | `ConnectionModal` | Chamar `requireMfa()` antes de salvar |
| Exportar dados | `ExportDataModal` | Chamar `requireMfa()` antes de iniciar |
| Excluir conta | `DeleteAccountModal` | Chamar `requireMfa()` antes de confirmar |

---

## Fase 6: Badge MFA no Avatar

### 6.1 Atualizar `Header.tsx`

```typescript
const Header = () => {
  const { mfaStatus } = useMFA();
  
  return (
    // ... existing code ...
    <Avatar className="h-9 w-9 relative">
      <AvatarFallback>{getUserInitials()}</AvatarFallback>
      {mfaStatus?.enabled && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-success rounded-full p-0.5">
          <ShieldCheck className="h-3 w-3 text-white" />
        </div>
      )}
    </Avatar>
  );
};
```

### 6.2 Tooltip com Status MFA

```typescript
<Tooltip>
  <TooltipTrigger>
    <Avatar>...</Avatar>
  </TooltipTrigger>
  <TooltipContent>
    {mfaStatus?.enabled ? (
      <div className="flex items-center gap-1 text-success">
        <ShieldCheck className="h-3 w-3" />
        MFA Ativo
      </div>
    ) : (
      <div className="flex items-center gap-1 text-warning">
        <Shield className="h-3 w-3" />
        MFA Desabilitado
      </div>
    )}
  </TooltipContent>
</Tooltip>
```

---

## Fase 7: Configuração por Role

### 7.1 MFA Obrigatório para Admins

No `ProtectedRoute.tsx`:

```typescript
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { mfaStatus, isLoading: mfaLoading } = useMFA();
  const { isAdmin, isMasterAdmin } = useUserRoles();
  
  // Se admin sem MFA, forçar configuração
  if (!mfaLoading && (isAdmin() || isMasterAdmin()) && !mfaStatus?.enabled) {
    return <MFASetupRequired />;
  }
  
  return <>{children}</>;
};
```

### 7.2 Banner de Encorajamento

Para usuários não-admin, mostrar banner em `/settings`:

```typescript
{!mfaStatus?.enabled && (
  <Alert className="border-primary/20 bg-primary/5">
    <Shield className="h-4 w-4 text-primary" />
    <AlertTitle>Proteja sua conta</AlertTitle>
    <AlertDescription>
      Ative a autenticação de dois fatores para maior segurança.
      <Button variant="link" onClick={() => setShowSetup(true)}>
        Configurar MFA
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Database Migration** | Criar | Tabela `user_mfa_settings` + funções |
| `supabase/functions/mfa-setup/index.ts` | **NOVO** | Gerar secret + QR code |
| `supabase/functions/mfa-verify/index.ts` | **NOVO** | Verificar código TOTP |
| `supabase/functions/mfa-disable/index.ts` | **NOVO** | Desabilitar MFA |
| `supabase/functions/_shared/totp-utils.ts` | **NOVO** | Funções TOTP compartilhadas |
| `supabase/config.toml` | Modificar | Adicionar 3 novas funções |
| `src/hooks/useMFA.tsx` | **NOVO** | Hook de gerenciamento MFA |
| `src/hooks/useMFAChallenge.tsx` | **NOVO** | Hook para re-challenge |
| `src/components/settings/Setup2FAModal.tsx` | Modificar | Implementação real com QR |
| `src/components/auth/MFAChallengeModal.tsx` | **NOVO** | Modal de verificação |
| `src/components/auth/MFARequiredBanner.tsx` | **NOVO** | Banner para admins |
| `src/pages/Auth.tsx` | Modificar | Integrar fluxo MFA no login |
| `src/components/auth/ProtectedRoute.tsx` | Modificar | Forçar MFA para admins |
| `src/components/layout/Header.tsx` | Modificar | Badge MFA no avatar |
| `src/components/settings/ChangePasswordModal.tsx` | Modificar | Adicionar re-challenge |
| `src/components/settings/DeleteAccountModal.tsx` | Modificar | Adicionar re-challenge |
| `src/components/settings/ExportDataModal.tsx` | Modificar | Adicionar re-challenge |

---

## Padrões de Backup Codes

| Propriedade | Valor |
|-------------|-------|
| Quantidade | 10 códigos |
| Formato | `XXXX-XXXX` (8 chars + hífen) |
| Caracteres | A-Z (sem I, O), 2-9 (sem 0, 1) |
| Uso | Single-use (marcado após uso) |
| Armazenamento | AES-256-GCM encrypted |

---

## Fluxo de Segurança

```text
┌─────────────────────────────────────────────────────────────────┐
│                    MFA Security Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SETUP:                                                         │
│  1. User requests MFA setup                                     │
│  2. Generate 160-bit secret (crypto.getRandomValues)           │
│  3. Encrypt with AES-256-GCM before storing                    │
│  4. Generate 10 backup codes (also encrypted)                  │
│  5. Return QR code URL (otpauth://)                            │
│  6. User scans and enters code to verify                       │
│  7. Mark MFA as enabled only after successful verification     │
│                                                                 │
│  VERIFICATION:                                                  │
│  1. User enters 6-digit code                                   │
│  2. Decrypt secret from database                               │
│  3. Generate expected TOTP (window = ±1 period)               │
│  4. Compare with submitted code                                │
│  5. If match: success, update last_used_at                     │
│  6. If no match: check backup codes                            │
│  7. If backup match: mark code as used, success                │
│  8. If all fail: reject                                        │
│                                                                 │
│  RATE LIMITING:                                                 │
│  - 5 failed attempts → 15 min lockout                          │
│  - Uses existing rate limiter infrastructure                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Benefícios

1. **Segurança Reforçada**: TOTP padrão compatível com Google Authenticator/Authy
2. **Backup Codes**: 10 códigos de uso único para recuperação
3. **Role-based**: Obrigatório para admins, opcional para outros
4. **Re-challenge**: Verificação extra em ações sensíveis
5. **Visual Feedback**: Badge no avatar indica status MFA
6. **Criptografia**: Secrets armazenados com AES-256-GCM

---

## Dependências

| Dependência | Propósito | Notas |
|-------------|-----------|-------|
| `input-otp` | ✅ Já instalado | Componente OTP input |
| QR Code API | Externa (qrserver.com) | Gerar imagem QR |
| `@libs/qrcode` (Deno) | Alternativa local | Para gerar QR no servidor |

---

## Notas de Implementação

1. **Secrets nunca expostos**: O secret TOTP é criptografado e nunca retornado ao frontend após o setup
2. **Backup codes uma vez**: Mostrados apenas durante o setup, depois não podem ser recuperados
3. **Auditoria**: Todas as ações MFA (setup, verify, disable) são logadas em `audit_logs`
4. **Compatibilidade**: Padrão RFC 6238 (TOTP) compatível com todos os apps authenticator
5. **Window**: ±1 período (30s) para tolerância de clock drift

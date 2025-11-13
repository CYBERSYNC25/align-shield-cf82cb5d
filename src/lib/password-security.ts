/**
 * Utilidades de Segurança de Senha
 * 
 * @module password-security
 * @description
 * Fornece funções para verificar se senhas foram comprometidas em vazamentos conhecidos
 * usando a API Have I Been Pwned (HIBP) com k-Anonymity para proteger a privacidade.
 * 
 * Como funciona:
 * 1. Hash SHA-1 da senha é calculado no cliente
 * 2. Apenas os primeiros 5 caracteres do hash são enviados à API
 * 3. API retorna todos os hashes que começam com esses 5 caracteres
 * 4. Cliente verifica localmente se o hash completo está na lista
 * 
 * Este método garante que a senha nunca sai do cliente de forma reconhecível.
 * 
 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
 * 
 * @example
 * ```typescript
 * import { checkPasswordPwned, checkPasswordStrength } from '@/lib/password-security';
 * 
 * const password = "MyPassword123!";
 * 
 * // Verificar se foi vazada
 * const isPwned = await checkPasswordPwned(password);
 * if (isPwned) {
 *   console.log("⚠️ Esta senha foi encontrada em vazamentos de dados");
 * }
 * 
 * // Verificar força
 * const strength = checkPasswordStrength(password);
 * console.log(`Força: ${strength.score}/4 - ${strength.feedback}`);
 * ```
 */

/**
 * Resultado da verificação de senha vazada
 * 
 * @typedef {Object} PwnedCheckResult
 * @property {boolean} isPwned - Se a senha foi encontrada em vazamentos
 * @property {number} count - Quantas vezes apareceu em vazamentos (0 se não vazada)
 * @property {string} [error] - Mensagem de erro se a verificação falhou
 */
export interface PwnedCheckResult {
  isPwned: boolean;
  count: number;
  error?: string;
}

/**
 * Resultado da análise de força da senha
 * 
 * @typedef {Object} PasswordStrength
 * @property {number} score - Pontuação de 0 (muito fraca) a 4 (muito forte)
 * @property {string} label - Rótulo descritivo: "Muito Fraca", "Fraca", "Média", "Forte", "Muito Forte"
 * @property {string[]} feedback - Array de sugestões para melhorar a senha
 * @property {boolean} passesRequirements - Se atende aos requisitos mínimos
 */
export interface PasswordStrength {
  score: number;
  label: string;
  feedback: string[];
  passesRequirements: boolean;
}

/**
 * Calcula hash SHA-1 de uma string
 * 
 * @param {string} str - String para criar hash
 * @returns {Promise<string>} Hash SHA-1 em hexadecimal maiúsculo
 * 
 * @example
 * ```typescript
 * const hash = await sha1Hash("password123");
 * // Retorna: "CBFDAC6008F9CAB4083784CBD1874F76618D2A97"
 * ```
 * 
 * @throws {Error} Se SubtleCrypto não estiver disponível (navegador antigo)
 */
async function sha1Hash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

/**
 * Verifica se uma senha foi exposta em vazamentos de dados conhecidos
 * 
 * Usa a API Have I Been Pwned com k-Anonymity model:
 * - Apenas os primeiros 5 caracteres do hash SHA-1 são enviados
 * - Nenhuma informação identificável da senha sai do cliente
 * - Resposta contém ~500 hashes possíveis para verificação local
 * 
 * @param {string} password - Senha a ser verificada
 * @returns {Promise<PwnedCheckResult>} Resultado da verificação
 * 
 * @example Senha comprometida:
 * ```typescript
 * const result = await checkPasswordPwned("password123");
 * // {
 * //   isPwned: true,
 * //   count: 2384305,
 * //   error: undefined
 * // }
 * ```
 * 
 * @example Senha segura (não encontrada):
 * ```typescript
 * const result = await checkPasswordPwned("xK9@mP2$vN8!qL5");
 * // {
 * //   isPwned: false,
 * //   count: 0,
 * //   error: undefined
 * // }
 * ```
 * 
 * @example Erro de rede:
 * ```typescript
 * // Sem conexão com internet
 * const result = await checkPasswordPwned("anypassword");
 * // {
 * //   isPwned: false,
 * //   count: 0,
 * //   error: "Erro ao verificar senha: NetworkError"
 * // }
 * ```
 * 
 * @remarks
 * - Timeout de 5 segundos para evitar espera longa
 * - Retorna false em caso de erro (fail-safe)
 * - Em produção, considere adicionar retry logic
 * 
 * @seeAlso
 * - API Documentation: https://haveibeenpwned.com/API/v3#PwnedPasswords
 * - k-Anonymity: https://en.wikipedia.org/wiki/K-anonymity
 */
export async function checkPasswordPwned(password: string): Promise<PwnedCheckResult> {
  try {
    // Calcula SHA-1 hash da senha
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Busca hashes similares na API (apenas primeiros 5 chars)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        signal: controller.signal,
        headers: {
          'Add-Padding': 'true' // Adiciona padding para dificultar análise de tráfego
        }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const text = await response.text();
    
    // Cada linha: SUFFIX:COUNT
    // Exemplo: "00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2"
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix === suffix) {
        const count = parseInt(countStr, 10);
        return {
          isPwned: true,
          count,
          error: undefined
        };
      }
    }

    // Senha não encontrada em vazamentos
    return {
      isPwned: false,
      count: 0,
      error: undefined
    };

  } catch (error) {
    // Em caso de erro (rede, timeout, etc), retorna false mas registra erro
    // Melhor permitir senha do que bloquear usuário por erro técnico
    console.error('Erro ao verificar senha em vazamentos:', error);
    
    return {
      isPwned: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Analisa a força de uma senha com base em múltiplos critérios
 * 
 * Critérios avaliados:
 * - Comprimento (8+ caracteres)
 * - Presença de maiúsculas e minúsculas
 * - Presença de números
 * - Presença de caracteres especiais
 * - Diversidade de caracteres
 * - Padrões comuns (sequências, repetições)
 * 
 * @param {string} password - Senha a ser analisada
 * @returns {PasswordStrength} Análise completa da força
 * 
 * @example Senha muito fraca:
 * ```typescript
 * const strength = checkPasswordStrength("12345");
 * // {
 * //   score: 0,
 * //   label: "Muito Fraca",
 * //   feedback: [
 * //     "Senha muito curta. Use pelo menos 8 caracteres",
 * //     "Adicione letras maiúsculas",
 * //     "Adicione letras minúsculas",
 * //     "Adicione caracteres especiais"
 * //   ],
 * //   passesRequirements: false
 * // }
 * ```
 * 
 * @example Senha forte:
 * ```typescript
 * const strength = checkPasswordStrength("MyS3cur3P@ssw0rd!");
 * // {
 * //   score: 4,
 * //   label: "Muito Forte",
 * //   feedback: ["Senha excelente!"],
 * //   passesRequirements: true
 * // }
 * ```
 * 
 * @example Senha com padrão comum:
 * ```typescript
 * const strength = checkPasswordStrength("Abcd1234!");
 * // {
 * //   score: 2,
 * //   label: "Média",
 * //   feedback: [
 * //     "Evite sequências óbvias de caracteres",
 * //     "Adicione mais caracteres especiais"
 * //   ],
 * //   passesRequirements: true
 * // }
 * ```
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Requisitos básicos
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

  // Verifica requisitos mínimos
  const passesRequirements = hasMinLength && hasUpperCase && hasLowerCase && 
                            hasNumber && hasSpecialChar;

  // Pontuação baseada em comprimento
  if (password.length < 8) {
    feedback.push("Senha muito curta. Use pelo menos 8 caracteres");
  } else if (password.length < 12) {
    score += 1;
  } else if (password.length < 16) {
    score += 2;
  } else {
    score += 3;
  }

  // Diversidade de caracteres
  if (!hasUpperCase) feedback.push("Adicione letras maiúsculas");
  if (!hasLowerCase) feedback.push("Adicione letras minúsculas");
  if (!hasNumber) feedback.push("Adicione números");
  if (!hasSpecialChar) feedback.push("Adicione caracteres especiais (!@#$%^&*)");

  // Pontuação por diversidade
  const diversity = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar]
    .filter(Boolean).length;
  score += Math.floor(diversity / 2);

  // Penaliza padrões comuns
  const commonPatterns = [
    /(.)\1{2,}/, // Repetição (aaa, 111)
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequências
    /012|123|234|345|456|567|678|789/, // Números em sequência
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      feedback.push("Evite sequências óbvias de caracteres");
      score = Math.max(0, score - 1);
      break;
    }
  }

  // Entropia: caracteres únicos / total
  const uniqueChars = new Set(password).size;
  const entropy = uniqueChars / password.length;
  if (entropy > 0.7) {
    score += 1;
  }

  // Normaliza score (0-4)
  score = Math.min(4, Math.max(0, score));

  // Define label
  const labels = ["Muito Fraca", "Fraca", "Média", "Forte", "Muito Forte"];
  const label = labels[score];

  // Feedback positivo para senhas fortes
  if (score >= 3 && passesRequirements) {
    feedback.length = 0; // Limpa feedbacks negativos
    feedback.push(score === 4 ? "Senha excelente!" : "Boa senha!");
  }

  return {
    score,
    label,
    feedback,
    passesRequirements
  };
}

/**
 * Gera uma senha forte aleatória
 * 
 * @param {number} length - Comprimento desejado (mínimo 12)
 * @returns {string} Senha gerada
 * 
 * @example
 * ```typescript
 * const password = generateStrongPassword(16);
 * // "xK9@mP2$vN8!qL5t"
 * 
 * const strength = checkPasswordStrength(password);
 * // score: 4, label: "Muito Forte"
 * ```
 */
export function generateStrongPassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const all = lowercase + uppercase + numbers + special;
  
  // Garante pelo menos um de cada tipo
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Preenche o resto aleatoriamente
  for (let i = password.length; i < Math.max(12, length); i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Embaralha
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

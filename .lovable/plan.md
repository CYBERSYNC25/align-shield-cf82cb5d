
<contexto-e-diagnostico>
Você descreveu que “o projeto bugou e não está mais carregando” e que parece estar “loopando” tentando carregar permissões/sessão.

Na inspeção do código e dos logs do Supabase, encontrei uma causa bem objetiva que explica esse comportamento:

1) A Edge Function <code>session-manager</code> está quebrando em runtime com o erro:
   <code>TypeError: supabase.auth.getClaims is not a function</code> (linha ~51 do <code>supabase/functions/session-manager/index.ts</code>).

2) O <code>ProtectedRoute</code> tenta criar uma sessão logo após o login:
   - Condição: usuário logado + <code>localStorage.current_session_id</code> ausente
   - A chamada vai para <code>/functions/v1/session-manager/create</code>
   - Como a função está quebrada, essa criação falha
   - E o código atual tenta de novo repetidamente (loop) porque:
     - o effect depende do objeto inteiro da mutation (<code>createSession</code>), que muda a cada render (React Query), re-disparando o effect
     - <code>sessionCreated</code> só vira <code>true</code> no <code>onSuccess</code>; em erro, fica <code>false</code> para sempre

Resultado prático: depois do login, o app pode entrar num ciclo de requisições/falhas que “parece travamento” (ou loading infinito), mesmo que o problema original reportado fosse “permissões”.

Também identifiquei que outras Edge Functions usam o mesmo método <code>getClaims()</code> (ex.: <code>mfa-setup</code>, <code>mfa-verify</code>, <code>mfa-disable</code>, <code>generate-questionnaire-answers</code>), então a correção precisa ser consistente (não só no <code>session-manager</code>), senão outras áreas podem quebrar mais tarde.

Observação: o seu banco já está consistente após a migração (existe 1 org, profiles e user_roles com org_id preenchido, e pelo menos 2 roles criadas: admin e viewer).
</contexto-e-diagnostico>

<objetivo>
Restaurar o carregamento do app pós-login eliminando o loop e corrigindo a verificação de token nas Edge Functions (principalmente <code>session-manager</code>), e melhorar o comportamento para usuários que realmente não têm roles/permissões atribuídas.
</objetivo>

<plano-de-implementacao>
<etapa-1-corrigir-edge-function-session-manager>
1.1) Ajustar <code>supabase/functions/session-manager/index.ts</code> para NÃO usar <code>supabase.auth.getClaims()</code>.
- Trocar por um método suportado (estável) em <code>@supabase/supabase-js</code> v2:
  - opção A (recomendada): <code>supabase.auth.getUser(token)</code> para validar o JWT e obter o <code>user.id</code>
  - e então <code>const userId = data.user.id</code>
- Manter o client “user scoped” (com header Authorization) para chamadas que dependem de <code>auth.uid()</code> no Postgres.
- Manter o <code>supabaseAdmin</code> (service role) somente para RPCs administrativas (<code>create_user_session</code>, <code>create_notification</code>), como já está.

1.2) Melhorar a resposta de erro do <code>session-manager</code>:
- Se token inválido: 401 com JSON claro
- Se falha interna: 500 com <code>error</code> e um <code>code</code> (ex.: <code>SESSION_MANAGER_INTERNAL</code>) para facilitar debugging

1.3) Validar com logs:
- Conferir que o log “getClaims is not a function” para de aparecer depois da correção
- A chamada <code>/create</code> deve retornar <code>success: true</code> e <code>sessionId</code>
</etapa-1-corrigir-edge-function-session-manager>

<etapa-2-parar-loop-no-frontend-mesmo-em-caso-de-falha>
2.1) Ajustar o effect de criação de sessão em <code>src/components/auth/ProtectedRoute.tsx</code> para não re-tentar infinitamente quando falhar.
Mudanças planejadas:
- Não depender do objeto inteiro <code>createSession</code> no dependency array (isso causa reruns constantes).
- Guardar “já tentei criar sessão” em <code>useRef</code> ou em state separado (<code>sessionCreateAttempted</code>), e:
  - tentar no máximo 1 vez por mount/login
  - se der erro, parar as tentativas automáticas (opcionalmente, permitir um botão “Tentar novamente” em UI)

2.2) (Opcional, mas recomendado) Feedback ao usuário:
- Se falhar criar sessão, mostrar um toast do tipo “Não foi possível iniciar a sessão de segurança (sessões/dispositivos). Você ainda pode usar o sistema, mas sem rastreamento de sessões. Tente novamente mais tarde.”
Isso evita o usuário achar que é “permissão” e também reduz tickets.

2.3) Garantir que o app funcione mesmo sem <code>current_session_id</code>:
- O rastreamento de atividade (<code>useSessionActivity</code>) já é resiliente: só chama update se houver sessionId
- Então o bloqueio deve ser removido do fluxo principal (dashboard não pode depender disso)
</etapa-2-parar-loop-no-frontend-mesmo-em-caso-de-falha>

<etapa-3-corrigir-as-outras-edge-functions-que-usam-getClaims>
3.1) Criar um helper compartilhado em <code>supabase/functions/_shared</code> (ex.: <code>auth.ts</code>) para centralizar:
- Extração do Bearer token
- Validação do token via <code>supabase.auth.getUser(token)</code>
- Retorno padronizado (userId, email opcional)

3.2) Atualizar estas funções para usar o helper (eliminando <code>getClaims()</code>):
- <code>mfa-setup</code>
- <code>mfa-verify</code>
- <code>mfa-disable</code>
- <code>generate-questionnaire-answers</code>
- (e qualquer outra que apareça na busca)

Isso evita regressões futuras e garante consistência.
</etapa-3-corrigir-as-outras-edge-functions-que-usam-getClaims>

<etapa-4-permissoes-quando-o-usuario-realmente-nao-tem-role>
4.1) Garantir UX clara quando <code>roles.length === 0</code>:
- Em vez de parecer “travado”, mostrar uma tela/estado do tipo:
  “Sua conta ainda não tem permissões atribuídas. Peça ao administrador para te adicionar.”
- Incluir botão de logout e/ou link para suporte.

4.2) Revisar o auto-assign de role no client (<code>ensureUserHasRole</code> em <code>useAuth.tsx</code>):
- Hoje existe policy que permite o usuário inserir a role inicial <code>viewer</code> se não existir nenhuma (isso é OK).
- Mas o plano é fortalecer para multi-tenant:
  - garantir que o <code>org_id</code> também seja preenchido no <code>user_roles</code> quando criar a role viewer (para não gerar inconsistências futuras)
  - opcionalmente mover esse “bootstrap” para uma Edge Function com service role (mais controlado e auditável), mantendo a regra “só cria viewer e apenas se não existir role”
</etapa-4-permissoes-quando-o-usuario-realmente-nao-tem-role>

<etapa-5-validacao-end-to-end>
5.1) Cenário principal (pós-login):
- Fazer login
- Confirmar que não há spam de requests
- Confirmar que o dashboard carrega normalmente
- Confirmar que <code>current_session_id</code> é criado (quando a função estiver ok)

5.2) Verificar sessão:
- Abrir Configurações → Segurança/Sessões (onde aplicável)
- Confirmar que listar sessões funciona (endpoint <code>/list</code>)

5.3) Verificar MFA (se você usa):
- Abrir fluxo de MFA setup/verify
- Confirmar que a Edge Function responde sem erro (já que também será corrigida)

5.4) Verificar usuário sem role:
- Logar com um usuário que não tenha entries em <code>user_roles</code>
- Confirmar que o sistema não “fica carregando” e mostra instrução clara (ou cria viewer de forma segura, dependendo da opção escolhida)
</etapa-5-validacao-end-to-end>
</plano-de-implementacao>

<riscos-e-cuidados>
- Como há várias Edge Functions usando <code>getClaims()</code>, corrigir apenas <code>session-manager</code> resolve o “travamento”, mas pode deixar bugs escondidos em MFA e geração de respostas. Por isso o plano inclui padronização.
- O loop de sessão é um bug de “resiliência do cliente”: mesmo com backend fora, o app não pode tentar infinitamente; vamos blindar isso.
- Permissões: “não ter role” deve ser um estado válido e tratado (UX), e não um estado que parece falha do sistema.
</riscos-e-cuidados>

<entregaveis>
- Edge Function <code>session-manager</code> corrigida e estável
- Remoção do loop de criação de sessão no <code>ProtectedRoute</code>
- Padronização de autenticação em Edge Functions (helper compartilhado)
- Melhor UX para usuário sem permissões/roles atribuídas
</entregaveis>

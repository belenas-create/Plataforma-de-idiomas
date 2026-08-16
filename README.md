# 🌎 Meu Painel de Idiomas

Um painel de comando pessoal para estudar idiomas com consistência — combina planejamento semanal, catálogo de conteúdos, métodos de estudo, vocabulário, progresso, gamificação leve e um Professor IA de conversação separado.

> "Você não precisa estudar muito. Precisa continuar voltando."

## Status desta versão

Esta é a **primeira versão funcional completa**, com dados fictícios/iniciais pré-carregados (idiomas, métodos, cursos, catálogo, vocabulário FCL/IMPO). Ela funciona **100% localmente** (localStorage) assim que você abre `index.html` — nenhuma configuração é obrigatória para começar a usar.

Firebase (sincronização entre dispositivos) e um backend de IA real para o Professor IA são **opcionais** e ficam claramente identificados como pontos de integração — veja as seções abaixo.

## Estrutura do projeto

```
language-platform/
│
├── index.html          → aplicativo principal (dashboard, planner, catálogo...)
├── style.css
├── app.js               → toda a lógica do dashboard
├── data.js               → dados iniciais/seed (idiomas, métodos, cursos, catálogo, caderno)
├── store.js              → camada de dados (hoje: localStorage; futuro: Firestore)
│
├── speaking/
│   ├── speaking.html     → Professor IA (app INDEPENDENTE, abre em nova aba)
│   ├── speaking.css
│   └── speaking.js
│
├── backend/
│   ├── openai-proxy-worker.js → proxy seguro pro Professor IA usar IA real (OpenAI)
│   └── wrangler.toml           → config do Cloudflare Worker
│
├── firebase/
│   └── config.example.js → modelo de configuração do Firebase (copie para config.js)
│
├── assets/
│   ├── icons/
│   └── images/
│
└── README.md
```

## Como rodar localmente

Como o app usa `fetch`/módulos simples de JS, o mais tranquilo é servir por um servidor local (abrir com `file://` direto também funciona para a maior parte das telas, mas alguns navegadores restringem certas APIs em `file://`):

```bash
cd language-platform
python3 -m http.server 8080
# depois abra http://localhost:8080
```

Ou, com Node instalado:

```bash
npx serve .
```

## Modelo de dados (lógico)

| Coleção | Descrição |
|---|---|
| `languages` | Idiomas cadastrados (inglês, espanhol, futuros) — nível, prioridade, meta |
| `studySessions` | Sessões de estudo registradas (timer, registro rápido, planner) |
| `weeklyPlans` | Plano semanal por `weekId` (ex: `2026-W33`), com atividades por dia |
| `resources` | Catálogo de conteúdos (cursos, sites, YouTube, apps, TikTok...) |
| `courses` | Cursos com módulos/aulas e progresso |
| `methods` | Métodos de estudo (Chunks, Shadowing, Roleplay, Anki, etc.) — extensível |
| `notes` | Caderno de anotações (gramática, dicas) — vocabulário fica no Anki, fora da plataforma |
| `tags` | Lista de tags disponíveis (extensível pelo usuário) |
| `notebooks` | Atalhos para NotebookLM |
| `goals` | Metas diárias/semanais/por habilidade |
| `badgesUnlocked` | Badges de gamificação leve já desbloqueadas |
| `settings` | Preferências do usuário, onboarding, tema |

Tudo isso vive hoje em `localStorage`, sob chaves `langplatform_v1::<colecao>`, gerenciado por `store.js`. Nenhuma tela fala diretamente com `localStorage` — todas passam por `Store`, então trocar o backend para Firestore no futuro não exige reescrever as telas.

## Configurar o Firebase (sincronização entre dispositivos) — opcional

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto.
2. Ative **Authentication** (recomendado: login por e-mail/senha ou Google) e **Cloud Firestore**.
3. Em "Configurações do projeto" → "Seus apps" → "Web", copie o objeto `firebaseConfig`.
4. Copie `firebase/config.example.js` para `firebase/config.js` e cole seus valores.
5. Configure as regras de segurança do Firestore (modelo já sugerido dentro de `config.example.js`) para que cada usuário só acesse os próprios dados.
6. Implemente (ou peça para uma próxima etapa de desenvolvimento implementar) um `firebase-store.js` que reproduza as mesmas funções de `store.js` (`getAll`, `add`, `update`, `remove`, `logSession`...) usando o SDK do Firestore, e troque `backend` para `"firestore"` dentro de `store.js`.
7. **Nunca** faça commit de `firebase/config.js` com valores reais preenchidos de forma que exponha chaves privadas de administrador — os valores do `firebaseConfig` do app Web são públicos por natureza (protegidos pelas regras do Firestore, não por serem secretos), mas Service Account keys (`.json` de admin) NUNCA devem estar no frontend nem no repositório.

Até que isso esteja configurado, a plataforma mostra o aviso "💾 Modo local ativo" e continua funcionando normalmente.

## Configurar o Professor IA com uma IA real — opcional

Por padrão, o Professor IA (`speaking/speaking.js`) roda em **modo simulado**: respostas geradas por roteiros de cenário + regras locais, deixado bem claro na interface ("🧪 Modo simulado (offline)"). Isso evita fingir uma IA que não existe.

**Importante sobre contas:** a assinatura do ChatGPT (chatgpt.com) é um produto diferente da API da OpenAI (platform.openai.com) — mesmo pagando o ChatGPT Plus, isso não dá acesso à API. A boa notícia é que ambos usam o **mesmo login/conta OpenAI**: você só precisa entrar em [platform.openai.com](https://platform.openai.com), ativar cobrança por uso ali (separada da assinatura do ChatGPT) e gerar uma chave de API. O uso é cobrado por token/minuto consumido, não por mensalidade fixa.

Este projeto já vem com o backend pronto em `backend/openai-proxy-worker.js` — um Cloudflare Worker que protege sua chave (ela nunca fica no frontend nem no GitHub). Passo a passo:

1. Crie uma chave de API em [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (com billing ativado na conta).
2. Instale a CLI da Cloudflare e faça login:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. Dentro da pasta `backend/`, publique o Worker:
   ```bash
   cd backend
   wrangler deploy
   ```
4. Configure sua chave como segredo do Worker (não vai para nenhum arquivo):
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```
   (cole a chave quando solicitado).
5. O comando `wrangler deploy` mostra a URL pública do seu Worker (algo como `https://professor-ia-proxy.SEU-USUARIO.workers.dev`).
6. Em `speaking/speaking.js`, preencha `AI_CONFIG.endpoint` com essa URL.
7. Suba essa alteração pro GitHub (substituindo o arquivo `speaking/speaking.js` do repositório) — pronto, o Professor IA passa a responder com GPT de verdade, com fallback automático para o modo simulado se a chamada falhar.

Quer usar Claude (Anthropic) ou outro modelo em vez do GPT? A lógica é a mesma — troque a chamada dentro de `openai-proxy-worker.js` pelo endpoint da API desejada; o contrato com o frontend (`POST {messages,...} → {reply}`) continua igual.

Arquitetura: **Frontend → Cloudflare Worker (protege a chave) → API da OpenAI**. A chave nunca trafega até o navegador do usuário nem aparece no GitHub.

A voz (síntese de fala) continua sendo a nativa do navegador nesta configuração — só as *respostas* passam a vir de uma IA real. Se quiser evoluir para voz mais natural depois, isso é um passo separado (ex: OpenAI TTS ou ElevenLabs), me avise que eu monto.

## Publicar / hospedar

**GitHub Pages** (mais simples, gratuito):
```bash
git init
git add .
git commit -m "Primeira versão do painel de idiomas"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/language-platform.git
git push -u origin main
```
Depois, em Settings → Pages, escolha a branch `main` e pasta raiz.

**Firebase Hosting** (se já estiver usando Firebase):
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## O que colocar no `.gitignore`

```
firebase/config.js
node_modules/
.DS_Store
```

(`firebase/config.example.js` pode e deve ir para o Git — é só o modelo, sem valores reais.)

## Sobre os links do catálogo

Alguns recursos do catálogo não tinham uma URL confirmada e foram deixados com o campo `url` vazio de propósito — nenhuma URL foi inventada. Clique em **✏️ Editar** no card do recurso, em **Catálogo**, para preencher o link (ou qualquer outro campo) a qualquer momento — e **🗑️ Excluir** se quiser remover um item.

Em **Meus Cursos**, os links da página inicial de "Mairo Vergara" (mairovergara.com) e "Inglês Sem Neura" (inglessemneura.com.br) já foram preenchidos — eles abrem a home do curso, não um login direto. O link de "Plataforma do Poliglota" ficou vazio de propósito: existem vários serviços com nomes parecidos ("Poliglota.org", "Instituto Poliglota" etc.) e eu não tinha certeza qual é o seu — clique em "✏️ Editar link" no card do curso pra colocar o endereço certo.

## Próximas evoluções sugeridas (não incluídas nesta primeira versão)

- Implementar `firebase-store.js` de fato (hoje é só o ponto de integração preparado).
- Autenticação multiusuário real.
- Drag-and-drop mais refinado entre semanas diferentes no planner.
- Análise de pronúncia mais sofisticada no Professor IA (hoje as métricas de speaking são estimativas heurísticas locais, não uma avaliação fonética real).
- Exportar plano semanal em PDF/calendário (.ics).

## Filosofia do projeto

Consistência > perfeição. Output > consumo passivo. Chunks > palavras isoladas. Contexto > decoração. Sessões pequenas > rotinas impossíveis. Falar > esperar estar pronta.

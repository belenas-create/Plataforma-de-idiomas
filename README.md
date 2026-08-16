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
├── store.js              → camada de dados (localStorage + sincronização com Firestore)
├── firebase-sync.js      → autenticação (Google) e leitura/escrita no Firestore
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

Tudo isso vive sempre em `localStorage` primeiro (cópia local/offline), gerenciado por `store.js`. Nenhuma tela fala diretamente com `localStorage` ou com o Firestore — todas passam por `Store`, que decide se replica cada escrita na nuvem (ver seção seguinte).

## Configurar o Firebase (sincronização entre dispositivos)

Isso já está implementado e funcionando (`firebase-sync.js` + os hooks em `store.js`) — falta só você criar o projeto Firebase e conectar. Sem fazer isso, a plataforma mostra "💾 Modo local ativo" e funciona normalmente, só que presa a um dispositivo.

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto (é grátis no plano Spark, que é mais que suficiente pra uso pessoal).
2. Vá em **Authentication** → **Sign-in method** → ative **Google** como provedor.
3. Vá em **Firestore Database** → **Create database** → modo produção → escolha uma região (ex: `southamerica-east1`).
4. Em **Firestore Database → Regras**, cole:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   Isso garante que só você (autenticada) acessa os seus próprios dados.
5. Em "Configurações do projeto" (ícone de engrenagem) → "Seus apps" → clique no ícone Web (`</>`) para registrar um app → copie o objeto `firebaseConfig` gerado.
6. No repositório, copie `firebase/config.example.js` para um novo arquivo `firebase/config.js` e cole os valores copiados no lugar dos placeholders.
7. Suba `firebase/config.js` pro seu repositório no GitHub (esses valores são identificadores públicos do projeto — quem protege seus dados de verdade é a regra do passo 4, não o sigilo desses valores).
8. Abra a plataforma publicada, vá em **Configurações → Firebase** e clique em **"Entrar com Google"**.
9. Pronto — no primeiro login, seus dados locais atuais sobem pra nuvem automaticamente. Nos próximos aparelhos onde você fizer login com a mesma conta Google, os dados da nuvem substituem os locais e ficam sincronizados dali em diante (toda alteração — sessão registrada, planner, catálogo etc. — é replicada em segundo plano).

**Nunca** faça commit de uma Service Account key (`.json` de admin do Firebase) — isso é diferente do `firebaseConfig` do passo 5/6 e nunca deve estar no frontend nem no repositório.

## Professor IA — conversar com IA de verdade

Por padrão, a tela inicial do Professor IA tem dois caminhos:

1. **🧑‍🏫 "Professor IA" (botão principal)** — abre o **ChatGPT** (chatgpt.com) numa nova aba, já com uma mensagem inicial pronta (idioma, seu nível, o modo escolhido — Fluency/Correction/Teacher/Challenge — e o cenário sorteado), usando a **sua conta ChatGPT paga**, com a voz e a desenvoltura reais do ChatGPT (inclusive o modo de voz dele, se você usar o app). Essa mensagem também é copiada para a área de transferência — caso o preenchimento automático não funcione (isso depende do ChatGPT e não é garantido), é só colar. Não precisa de nenhuma configuração — já funciona assim que você publica o site.
2. **"▶️ Começar conversa simulada"** — continua funcionando 100% offline, com o motor de roteiros/regras local, direto na plataforma (com voz do navegador). Bom para praticar rapidinho sem sair do app.

**Importante sobre contas:** a assinatura do ChatGPT (chatgpt.com) é um produto diferente da API da OpenAI (platform.openai.com) — mesmo pagando o ChatGPT Plus, isso não dá acesso à API. Ambos usam o **mesmo login/conta OpenAI**, mas são cobrados separadamente. Como o botão principal simplesmente abre o chatgpt.com no seu navegador (você loga normalmente, do jeito que já usa hoje), você não precisa mexer com API nem com chaves para essa opção.

### Alternativa avançada: backend próprio (opcional, não é o caminho padrão)

Se um dia você quiser que as respostas apareçam **dentro** do Professor IA (em vez de abrir o ChatGPT em outra aba) — por exemplo pra manter o histórico e o feedback automático da conversa —, dá pra conectar via API, com um pouco mais de configuração técnica. Isso já está pronto em `backend/openai-proxy-worker.js` (um Cloudflare Worker que protege sua chave, ela nunca fica no frontend nem no GitHub), mas fica desligado por padrão. Passo a passo, se quiser ativar depois:

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

Em **Meus Cursos**, os links da página inicial de "Mairo Vergara" (mairovergara.com) e "Inglês Sem Neura" (inglessemneura.com.br) já foram preenchidos — eles abrem a home do curso, não um login direto. Cada card de curso também tem **✏️ Editar link** e **🗑️ Excluir**, caso você queira ajustar ou remover algum. O curso "Plataforma do Poliglota" foi removido desta versão (havia ambiguidade sobre qual serviço era — existem vários com nomes parecidos, "Poliglota.org", "Instituto Poliglota" etc. — e você preferiu remover em vez de adivinhar); se o item correspondente ainda existir no seu Catálogo, é só excluí-lo por lá também.

Em **Configurações → Notebook LM**, cada atalho sem link próprio configurado agora abre a página inicial do NotebookLM (notebooklm.google.com) em vez de mostrar "sem link" — assim você já pode entrar e criar/abrir o notebook certo. Depois de criar o notebook, clique no ✏️ ao lado do nome pra colar a URL exata dele (assim o atalho passa a abrir aquele notebook específico direto).

## Próximas evoluções sugeridas (não incluídas nesta primeira versão)

- Login por e-mail/senha como alternativa ao Google (hoje só tem Google Sign-In).
- Resolução de conflito quando o mesmo usuário edita em dois aparelhos ao mesmo tempo offline (hoje quem sincronizar por último vence).
- Drag-and-drop mais refinado entre semanas diferentes no planner.
- Análise de pronúncia mais sofisticada no Professor IA (hoje as métricas de speaking são estimativas heurísticas locais, não uma avaliação fonética real).
- Exportar plano semanal em PDF/calendário (.ics).

## Filosofia do projeto

Consistência > perfeição. Output > consumo passivo. Chunks > palavras isoladas. Contexto > decoração. Sessões pequenas > rotinas impossíveis. Falar > esperar estar pronta.

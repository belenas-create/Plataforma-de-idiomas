/* ==========================================================================
   data.js — Dados iniciais (seed) da plataforma
   --------------------------------------------------------------------------
   Este arquivo só é usado UMA VEZ: quando não existe nada salvo ainda
   (primeiro acesso). Depois disso, tudo vive no Store (localStorage hoje,
   Firestore no futuro) e pode ser editado livremente pelo usuário.

   Nenhuma URL foi inventada — quando o link exato não estava confirmado no
   briefing, o campo "url" foi deixado vazio ("") para o usuário preencher
   depois em Configurações > Catálogo.
   ========================================================================== */

const SEED_DATA = {

  /* ---------------------------------------------------------------------
   * IDIOMAS — sistema genérico, não travado em inglês/espanhol
   * ------------------------------------------------------------------- */
  languages: [
    {
      id: "english",
      name: "English",
      flag: "🇺🇸",
      level: "B1",
      status: "primary",       // primary | secondary | future
      priority: "alta",        // alta | media | baixa
      goal: "Consistência + inglês profissional (comex/logística) e cotidiano",
      weeklyGoalSessions: 4,
      prioritySkills: ["speaking", "listening"],
      color: "lang-english"
    },
    {
      id: "spanish",
      name: "Español",
      flag: "🇪🇸",
      level: "A0",
      status: "secondary",
      priority: "baixa",
      goal: "Preparação — sem pressão ainda",
      weeklyGoalSessions: 0,
      prioritySkills: [],
      color: "lang-spanish"
    }
  ],

  /* ---------------------------------------------------------------------
   * MÉTODOS DE ESTUDO
   * ------------------------------------------------------------------- */
  methods: [
    {
      id: "chunks",
      name: "Chunks",
      concept: "Aprender blocos de linguagem prontos (chunks) em vez de palavras isoladas. O cérebro guarda e recupera frases inteiras muito melhor do que palavras soltas.",
      whenToUse: "Sempre que for estudar vocabulário novo — cotidiano ou profissional.",
      duration: "5-20 min",
      mainSkill: "vocabulary",
      steps: [
        "Escolha uma palavra-alvo (ex: 'deadline').",
        "Encontre 2-3 chunks reais que a usam ('meet the deadline', 'on track to meet the deadline').",
        "Leia/ouça os chunks em contexto (não isolados).",
        "Crie 1 frase sua usando o chunk.",
        "Fale a frase em voz alta.",
        "Registre no vocabulário com tag #ativo se você já consegue usar, ou #passivo se ainda só reconhece."
      ],
      example: "Em vez de memorizar 'look', aprenda 'look forward to' → 'I look forward to hearing from you.'",
      languages: ["english", "spanish"],
      compatibleContent: ["vocabulary"],
      tags: ["vocabulary", "chunks"]
    },
    {
      id: "10min",
      name: "Método 10 Minutos",
      concept: "Sessão curta e completa para dias corridos — sempre com input e output, nunca só consumo passivo.",
      whenToUse: "Quando você tem pouco tempo mas não quer só 'passar os olhos'.",
      duration: "10 min",
      mainSkill: "mix",
      steps: [
        "2 min — revisão (Anki, chunks salvos ou anotações recentes).",
        "3 min — input (ouvir ou ler algo curto e compreensível).",
        "3 min — output (falar ou escrever algo usando o que acabou de consumir).",
        "2 min — revisão final (repetir mentalmente ou anotar 1 chunk novo)."
      ],
      example: "2 min Anki + 3 min vídeo curto + 3 min resumo falado + 2 min anotar 1 frase nova.",
      languages: ["english", "spanish"],
      compatibleContent: ["listening", "speaking", "vocabulary"],
      tags: ["snack", "entrada"]
    },
    {
      id: "comprehensible-input-output",
      name: "Comprehensible Input + Output",
      concept: "Você aprende melhor consumindo conteúdo um pouco acima do seu nível atual (i+1) — desde que seja compreensível — e depois produzindo algo com o que entendeu.",
      whenToUse: "Listening, reading e qualquer estudo de vocabulário/gramática em contexto.",
      duration: "15-45 min",
      mainSkill: "listening",
      steps: [
        "Escolha um conteúdo compreensível (você entende a maior parte sem legenda/tradução).",
        "Ouça ou leia sem pausar para traduzir tudo.",
        "Tente entender pelo contexto.",
        "Identifique 3-5 chunks ou palavras relevantes.",
        "Ouça/leia novamente prestando atenção neles.",
        "Produza algo: resuma oralmente, escreva 3 frases ou explique o que entendeu.",
        "Fale ou escreva usando o vocabulário novo."
      ],
      example: "Vídeo do VOA Learning English → 3 chunks anotados → resumo oral de 1 minuto.",
      languages: ["english", "spanish"],
      compatibleContent: ["listening", "reading", "speaking", "writing"],
      tags: ["listening", "input", "output"]
    },
    {
      id: "anki-srs",
      name: "Anki — Repetição Espaçada",
      concept: "Active recall + spaced repetition: você tenta lembrar antes de ver a resposta, e revisa em intervalos crescentes. É a forma mais eficiente de fixar vocabulário a longo prazo.",
      whenToUse: "Todos os dias, mesmo que só 5 minutos — consistência importa mais que volume.",
      duration: "5-20 min",
      mainSkill: "vocabulary",
      steps: [
        "Abra o deck e revise os cards do dia (active recall — tente lembrar antes de virar o card).",
        "Cartões bons: frase completa + áudio + contexto real, não só palavra + tradução.",
        "Adicione novos cards a partir dos chunks que você anotou na semana.",
        "Marque a honestidade da resposta (again/hard/good/easy) — isso ajusta o algoritmo.",
        "Registre a sessão: 'Hoje fiz 15 minutos de Anki.'"
      ],
      example: "Card ruim: 'shipment = embarque'. Card bom: 'The shipment left the port yesterday.' + áudio.",
      languages: ["english", "spanish"],
      compatibleContent: ["vocabulary"],
      tags: ["anki", "vocabulary", "snack"]
    },
    {
      id: "shadowing",
      name: "Shadowing",
      concept: "Repetir em voz alta, simultaneamente ou logo depois do áudio original, imitando ritmo, entonação e pronúncia — conecta listening e speaking diretamente.",
      whenToUse: "Para melhorar pronúncia, fluência e ritmo natural da fala.",
      duration: "10-30 min",
      mainSkill: "speaking",
      steps: [
        "Ouça o trecho curto (1 frase ou parágrafo) sem repetir.",
        "Certifique-se de entender o que está sendo dito.",
        "Ouça novamente prestando atenção no ritmo/entonação.",
        "Repita simultaneamente ou logo em seguida, imitando o áudio.",
        "Grave sua própria voz.",
        "Compare com o áudio original.",
        "Repita até sentir mais natural."
      ],
      example: "1 minuto de um vídeo do RealLife English, repetido 5x com gravação.",
      languages: ["english", "spanish"],
      compatibleContent: ["listening", "speaking"],
      tags: ["shadowing", "speaking", "pronunciation"],
      fields: ["conteúdo", "áudio", "duração", "número de repetições", "observações"]
    },
    {
      id: "roleplay",
      name: "Roleplay",
      concept: "Simular uma conversa real de um cenário específico (trabalho ou cotidiano) para praticar linguagem funcional sob contexto, não frases soltas.",
      whenToUse: "Quando quiser praticar speaking aplicado a uma situação real, sozinho ou com o Professor IA.",
      duration: "10-30 min",
      mainSkill: "speaking",
      steps: [
        "Escolha um cenário (ex: Customer Service x Customer).",
        "Defina os dois papéis.",
        "Estabeleça o objetivo da conversa (ex: resolver um atraso de embarque).",
        "Converse (em voz alta ou com o Professor IA) por 5-15 minutos.",
        "Anote 3 frases úteis que surgiram.",
        "Repita o mesmo cenário depois de alguns dias, tentando melhorar."
      ],
      example: "Cenário: 'Cotação' — você é Pricing Analyst, cliente pede um frete FCL de Shanghai a Santos.",
      languages: ["english", "spanish"],
      compatibleContent: ["speaking"],
      tags: ["roleplay", "speaking"],
      scenarios: {
        trabalho: [
          "Customer Service Agent x Customer",
          "Pricing / Sales x Customer",
          "Forwarder x Client (Importação)",
          "Customer x Pricing Analyst (Cotação)",
          "Booking confirmation call",
          "Shipment delay explanation",
          "Negotiation de rate"
        ],
        cotidiano: [
          "Restaurant", "Airport", "Hotel", "Shopping",
          "Small Talk", "Meeting", "Job Interview"
        ]
      }
    }
  ],

  /* ---------------------------------------------------------------------
   * CURSOS
   * ------------------------------------------------------------------- */
  courses: [
    {
      id: "mairo-vergara",
      name: "Mairo Vergara",
      language: "english",
      url: "",
      tags: ["curso", "english", "prato-principal"],
      modules: [
        { id: "mv-m1", name: "Módulo 1", lessons: [
          { id: "mv-l1", name: "Aula 1", status: "concluído", notes: "" },
          { id: "mv-l2", name: "Aula 2", status: "concluído", notes: "" },
          { id: "mv-l3", name: "Aula 3", status: "não iniciado", notes: "" }
        ]}
      ],
      progress: 20,
      lastLesson: "Aula 2 — Módulo 1",
      nextLesson: "Aula 3 — Módulo 1",
      timeStudiedMin: 90,
      notes: "Focar em pronúncia neste módulo."
    },
    {
      id: "ingles-sem-neura",
      name: "Inglês Sem Neura",
      language: "english",
      url: "",
      tags: ["curso", "english", "prato-principal"],
      modules: [
        { id: "isn-m1", name: "Fundamentos", lessons: [
          { id: "isn-l1", name: "Aula 1", status: "não iniciado", notes: "" }
        ]}
      ],
      progress: 0,
      lastLesson: "—",
      nextLesson: "Aula 1 — Fundamentos",
      timeStudiedMin: 0,
      notes: ""
    },
    {
      id: "plataforma-poliglota",
      name: "Plataforma do Poliglota",
      language: "general",
      url: "",
      tags: ["curso", "idiomas"],
      modules: [],
      progress: 0,
      lastLesson: "—",
      nextLesson: "—",
      timeStudiedMin: 0,
      notes: ""
    }
  ],

  /* ---------------------------------------------------------------------
   * CATÁLOGO DE RECURSOS (sites, apps, cursos avulsos, YouTube, TikTok...)
   * ------------------------------------------------------------------- */
  resources: [
    // CURSOS (também aparecem no catálogo)
    { id: "res-mairo", name: "Mairo Vergara", category: "curso", language: "english", skill: "mix", type: "curso", duration: 30, level: "A2-B2", tags: ["curso","english","prato-principal"], menu: "prato-principal", activePassive: "ativo", url: "", notes: "Curso completo de inglês.", status: "em andamento", progress: 20 },
    { id: "res-isn", name: "Inglês Sem Neura", category: "curso", language: "english", skill: "mix", type: "curso", duration: 30, level: "A2-B2", tags: ["curso","english","prato-principal"], menu: "prato-principal", activePassive: "ativo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-poliglota", name: "Plataforma do Poliglota", category: "curso", language: "general", skill: "mix", type: "curso", duration: 30, level: "todos", tags: ["curso","idiomas"], menu: "prato-principal", activePassive: "ativo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-kultivi", name: "Kultivi", category: "curso", language: "general", skill: "mix", type: "curso", duration: 30, level: "todos", tags: ["curso","varios-idiomas"], menu: "prato-principal", activePassive: "ativo", url: "https://kultivi.com", notes: "Cursos completos de vários idiomas gratuitos.", status: "não iniciado", progress: 0 },

    // SITES
    { id: "res-babadum", name: "BaBaDum", category: "site", language: "general", skill: "vocabulary", type: "site", duration: 5, level: "todos", tags: ["vocabulary","game","snack"], menu: "snack", activePassive: "passivo", url: "https://www.babadum.com", notes: "Vocabulário por meio de jogos.", status: "não iniciado", progress: 0 },
    { id: "res-lingua", name: "Lingua", category: "site", language: "english", skill: "listening", type: "site", duration: 15, level: "A2-B1", tags: ["listening","reading","english"], menu: "entrada", activePassive: "passivo", url: "", notes: "Conteúdo para aprendizagem de idiomas.", status: "não iniciado", progress: 0 },
    { id: "res-voa", name: "VOA Learning English", category: "site", language: "english", skill: "listening", type: "site", duration: 15, level: "A2-B1", tags: ["listening","english","comprehensible-input"], menu: "entrada", activePassive: "passivo", url: "https://learningenglish.voanews.com", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-englishclub", name: "English Club", category: "site", language: "english", skill: "grammar", type: "site", duration: 15, level: "todos", tags: ["english","grammar","vocabulary","listening"], menu: "entrada", activePassive: "passivo", url: "https://www.englishclub.com", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-newsinlevels", name: "News in Levels", category: "site", language: "english", skill: "listening", type: "site", duration: 10, level: "A1-B2", tags: ["listening","reading","english","input"], menu: "snack", activePassive: "passivo", url: "https://www.newsinlevels.com", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-breakingnews", name: "Breaking News English", category: "site", language: "english", skill: "listening", type: "site", duration: 15, level: "A2-C1", tags: ["listening","reading","english","news"], menu: "entrada", activePassive: "passivo", url: "https://breakingnewsenglish.com", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-eslfast", name: "ESL Fast", category: "site", language: "english", skill: "listening", type: "site", duration: 15, level: "A2-B2", tags: ["listening","conversation","english"], menu: "entrada", activePassive: "passivo", url: "https://www.eslfast.com", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-youglish", name: "YouGlish", category: "site", language: "english", skill: "speaking", type: "site", duration: 10, level: "todos", tags: ["pronunciation","listening","speaking"], menu: "snack", activePassive: "ativo", url: "https://youglish.com", notes: "Ótimo para checar pronúncia de palavras/chunks em contexto real.", status: "não iniciado", progress: 0 },
    { id: "res-engvid", name: "EngVid", category: "site", language: "english", skill: "grammar", type: "site", duration: 20, level: "A2-C1", tags: ["grammar","vocabulary","english"], menu: "entrada", activePassive: "passivo", url: "https://www.engvid.com", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-lyricstraining", name: "Lingoclip / LyricsTraining", category: "site", language: "english", skill: "listening", type: "site", duration: 5, level: "todos", tags: ["listening","music","snack"], menu: "sobremesa", activePassive: "passivo", url: "https://lyricstraining.com", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-dailydictation", name: "Daily Dictation", category: "site", language: "english", skill: "listening", type: "site", duration: 15, level: "B1-C1", tags: ["listening","dictation","writing"], menu: "entrada", activePassive: "ativo", url: "", notes: "", status: "não iniciado", progress: 0 },

    // YOUTUBE
    { id: "res-yt-abcfluent", name: "ABC Fluent", category: "youtube", language: "english", skill: "listening", type: "youtube", duration: 15, level: "A2-B2", tags: ["youtube","listening","casual"], menu: "entrada", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-englishsponge", name: "English Sponge", category: "youtube", language: "english", skill: "listening", type: "youtube", duration: 15, level: "B1-B2", tags: ["youtube","listening","vocabulary"], menu: "entrada", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-benji", name: "Learn English with Benji", category: "youtube", language: "english", skill: "listening", type: "youtube", duration: 15, level: "A2-B1", tags: ["youtube","listening","casual"], menu: "entrada", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-tvseries", name: "Learn English With TV Series", category: "youtube", language: "english", skill: "listening", type: "youtube", duration: 15, level: "B1-B2", tags: ["youtube","listening","casual"], menu: "entrada", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-jay", name: "English by Jay", category: "youtube", language: "english", skill: "speaking", type: "youtube", duration: 15, level: "B1-B2", tags: ["youtube","speaking","pronunciation"], menu: "entrada", activePassive: "ativo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-reallife", name: "RealLife English", category: "youtube", language: "english", skill: "speaking", type: "youtube", duration: 20, level: "B1-C1", tags: ["youtube","speaking","listening","casual"], menu: "prato-principal", activePassive: "ativo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-duncan", name: "English Addict with Mr. Duncan", category: "youtube", language: "english", skill: "listening", type: "youtube", duration: 20, level: "A2-B2", tags: ["youtube","listening","grammar"], menu: "entrada", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-fingtam", name: "Fingtam Languages", category: "youtube", language: "english", skill: "vocabulary", type: "youtube", duration: 10, level: "todos", tags: ["youtube","vocabulary"], menu: "snack", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-volka", name: "Volka English", category: "youtube", language: "english", skill: "speaking", type: "youtube", duration: 15, level: "A2-B1", tags: ["youtube","speaking","vocabulary"], menu: "entrada", activePassive: "ativo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-yt-misshoney", name: "Miss Honey – Slow English Podcast", category: "youtube", language: "english", skill: "listening", type: "youtube", duration: 15, level: "A2-B1", tags: ["youtube","listening","podcast","slow"], menu: "entrada", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },

    // APPS
    { id: "res-anki", name: "Anki", category: "app", language: "general", skill: "vocabulary", type: "app", duration: 10, level: "todos", tags: ["anki","vocabulary","snack"], menu: "snack", activePassive: "ativo", url: "https://apps.ankiweb.net", notes: "Repetição espaçada.", status: "em andamento", progress: 0 },
    { id: "res-wordbox", name: "WordBox English", category: "app", language: "english", skill: "vocabulary", type: "app", duration: 5, level: "todos", tags: ["vocabulary","app","snack"], menu: "snack", activePassive: "ativo", url: "", notes: "Aplicativo que eu já possuo.", status: "em andamento", progress: 0 },
    { id: "res-drops", name: "Drops", category: "app", language: "general", skill: "vocabulary", type: "app", duration: 5, level: "todos", tags: ["vocabulary","app","snack"], menu: "snack", activePassive: "passivo", url: "https://languagedrops.com", notes: "Usar como snack de 5 minutos.", status: "não iniciado", progress: 0 },
    { id: "res-gliglish", name: "Gliglish", category: "app", language: "general", skill: "speaking", type: "app", duration: 15, level: "todos", tags: ["speaking","app","conversation"], menu: "prato-principal", activePassive: "ativo", url: "https://gliglish.com", notes: "Conversação com IA.", status: "não iniciado", progress: 0 },
    { id: "res-podcasts", name: "Podcasts (Apple/Spotify)", category: "app", language: "english", skill: "listening", type: "podcast", duration: 20, level: "B1-C1", tags: ["listening","podcast","fretado"], menu: "entrada", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },

    // FRETADO / TIKTOK
    { id: "res-tt-doggodaiily", name: "@doggodaiily", category: "tiktok", language: "english", skill: "listening", type: "tiktok", duration: 5, level: "todos", tags: ["fretado","snack","casual"], menu: "snack", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-tt-cuffed", name: "@cuffed", category: "tiktok", language: "english", skill: "listening", type: "tiktok", duration: 5, level: "todos", tags: ["fretado","snack","casual"], menu: "snack", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-tt-samueldonner", name: "@samueldonner", category: "tiktok", language: "english", skill: "listening", type: "tiktok", duration: 5, level: "todos", tags: ["fretado","snack","casual"], menu: "snack", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-tt-amugoflife", name: "@amugoflife", category: "tiktok", language: "english", skill: "listening", type: "tiktok", duration: 5, level: "todos", tags: ["fretado","snack","casual"], menu: "snack", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 },
    { id: "res-tt-myartbroker", name: "@myartbroker", category: "tiktok", language: "english", skill: "listening", type: "tiktok", duration: 5, level: "todos", tags: ["fretado","snack","casual"], menu: "snack", activePassive: "passivo", url: "", notes: "", status: "não iniciado", progress: 0 }
  ],

  /* ---------------------------------------------------------------------
   * VOCABULÁRIO — inclui a seção especial FCL/IMPO/Customer Service/Pricing
   * ------------------------------------------------------------------- */
  vocabulary: [
    { id: "v1", term: "shipment", translation: "embarque / carregamento", definition: "A batch of goods sent together.", example: "The shipment left the port yesterday.", professionalPhrase: "Could you confirm the status of the shipment?", dailyPhrase: "", language: "english", category: "fcl-impo", level: "B1", activePassive: "ativo", tags: ["fcl","customer-service","professional"] },
    { id: "v2", term: "demurrage", translation: "sobrestadia", definition: "A charge for keeping a container at the port beyond the free time.", example: "We were charged demurrage because the container stayed 3 extra days.", professionalPhrase: "The demurrage charges will apply after the free time expires.", dailyPhrase: "", language: "english", category: "fcl-impo", level: "B2", activePassive: "passivo", tags: ["fcl","pricing","logistics"] },
    { id: "v3", term: "meet the deadline", translation: "cumprir o prazo", definition: "To finish something by the agreed date.", example: "We need to meet the deadline for the customs documentation.", professionalPhrase: "Are we still on track to meet the deadline?", dailyPhrase: "I need to meet the deadline for my report.", language: "english", category: "customer-service", level: "B1", activePassive: "ativo", tags: ["chunk","professional","customer-service"] },
    { id: "v4", term: "quotation / quote", translation: "cotação", definition: "A formal statement of the estimated price for a service.", example: "Could you send me a quotation for a 40' container to Santos?", professionalPhrase: "I'd like to request a quote for FCL shipment.", dailyPhrase: "", language: "english", category: "pricing", level: "B1", activePassive: "ativo", tags: ["pricing","fcl"] },
    { id: "v5", term: "transit time", translation: "tempo de trânsito", definition: "The time it takes for cargo to travel from origin to destination.", example: "What's the transit time from Shanghai to Santos?", professionalPhrase: "The transit time is approximately 30 days.", dailyPhrase: "", language: "english", category: "logistics", level: "B1", activePassive: "ativo", tags: ["logistics","fcl"] },
    { id: "v6", term: "Incoterms", translation: "Incoterms (termos internacionais de comércio)", definition: "Standardized trade terms that define responsibilities between buyer and seller.", example: "Which Incoterm are we using for this shipment — FOB or CIF?", professionalPhrase: "Please confirm the Incoterm before we proceed.", dailyPhrase: "", language: "english", category: "fcl-impo", level: "B2", activePassive: "passivo", tags: ["fcl","impo","documentation"] },
    { id: "v7", term: "booking", translation: "reserva de espaço", definition: "A confirmed reservation of space on a vessel.", example: "The booking was confirmed for next Friday's vessel.", professionalPhrase: "Could you send me the booking confirmation?", dailyPhrase: "", language: "english", category: "logistics", level: "B1", activePassive: "ativo", tags: ["fcl","logistics"] },
    { id: "v8", term: "Bill of Lading (BL)", translation: "conhecimento de embarque", definition: "A legal document issued by the carrier confirming receipt of cargo for shipment.", example: "We need the original Bill of Lading to release the cargo.", professionalPhrase: "Has the BL been issued yet?", dailyPhrase: "", language: "english", category: "documentation", level: "B2", activePassive: "passivo", tags: ["fcl","impo","documentation"] },
    { id: "v9", term: "follow up on something", translation: "dar continuidade / cobrar retorno", definition: "To check the progress of something previously discussed.", example: "I'm following up on the quotation I sent last week.", professionalPhrase: "I just wanted to follow up on my previous email.", dailyPhrase: "I'll follow up with you next week.", language: "english", category: "emails", level: "B1", activePassive: "ativo", tags: ["chunk","emails","professional"] },
    { id: "v10", term: "customer complaint", translation: "reclamação de cliente", definition: "A formal expression of dissatisfaction from a client.", example: "We received a customer complaint about the delayed shipment.", professionalPhrase: "I understand your frustration — let me look into this complaint right away.", dailyPhrase: "", language: "english", category: "customer-service", level: "B1", activePassive: "ativo", tags: ["customer-service","professional"] },
    { id: "v11", term: "small talk", translation: "conversa fiada / bate-papo", definition: "Light, casual conversation about unimportant topics.", example: "We made some small talk before the meeting started.", professionalPhrase: "", dailyPhrase: "I'm not great at small talk with strangers.", language: "english", category: "small-talk", level: "A2", activePassive: "ativo", tags: ["small-talk","daily"] },
    { id: "v12", term: "How's it going?", translation: "Como vai?", definition: "Casual greeting.", example: "Hey! How's it going?", professionalPhrase: "", dailyPhrase: "How's it going? Long time no see!", language: "english", category: "small-talk", level: "A1", activePassive: "ativo", tags: ["small-talk","daily","chunk"] },
    { id: "v13", term: "freight", translation: "frete", definition: "Goods transported, or the cost of transporting them.", example: "The freight cost increased due to fuel surcharges.", professionalPhrase: "Can you break down the freight cost for this route?", dailyPhrase: "", language: "english", category: "fcl-impo", level: "B1", activePassive: "ativo", tags: ["fcl","pricing"] },
    { id: "v14", term: "vessel / vessel schedule", translation: "navio / cronograma de navios", definition: "The ship, or its planned route/timing.", example: "The next vessel departs on the 15th.", professionalPhrase: "Could you send me the vessel schedule for next month?", dailyPhrase: "", language: "english", category: "logistics", level: "B1", activePassive: "passivo", tags: ["fcl","logistics"] },
    { id: "v15", term: "free time", translation: "prazo livre (antes de multa)", definition: "The period a container can be used/held before extra charges apply.", example: "We have 7 days of free time at the destination port.", professionalPhrase: "How many days of free time do we have before demurrage applies?", dailyPhrase: "", language: "english", category: "pricing", level: "B2", activePassive: "passivo", tags: ["fcl","pricing"] }
  ],

  /* ---------------------------------------------------------------------
   * CATEGORIAS FIXAS DE VOCABULÁRIO (para os filtros)
   * ------------------------------------------------------------------- */
  vocabularyCategories: [
    { id: "daily-english", name: "Inglês cotidiano" },
    { id: "professional-english", name: "Inglês profissional" },
    { id: "fcl-impo", name: "FCL / IMPO" },
    { id: "customer-service", name: "Customer Service" },
    { id: "pricing", name: "Pricing" },
    { id: "logistics", name: "Logistics" },
    { id: "meetings", name: "Meetings" },
    { id: "emails", name: "Emails" },
    { id: "negotiation", name: "Negotiation" },
    { id: "small-talk", name: "Small Talk" },
    { id: "travel", name: "Travel" },
    { id: "documentation", name: "Documentation" },
    { id: "general-english", name: "General English" }
  ],

  /* ---------------------------------------------------------------------
   * TAGS (o usuário pode adicionar mais)
   * ------------------------------------------------------------------- */
  tags: [
    "english","spanish","french","general","professional",
    "fcl","impo","customer-service","pricing",
    "listening","speaking","writing","vocabulary","grammar",
    "active","passive",
    "snack","entrada","prato-principal","sobremesa","menu-principal",
    "curso","youtube","podcast","site","app","anki","shadowing","roleplay",
    "fretado","chunk","input","output"
  ],

  /* ---------------------------------------------------------------------
   * NOTEBOOK LM — apenas atalhos
   * ------------------------------------------------------------------- */
  notebooks: [
    { id: "nb-fcl", name: "FCL", url: "" },
    { id: "nb-professional", name: "Inglês profissional", url: "" },
    { id: "nb-grammar", name: "Gramática", url: "" },
    { id: "nb-spanish", name: "Espanhol", url: "" },
    { id: "nb-work-docs", name: "Documentos de trabalho", url: "" }
  ],

  /* ---------------------------------------------------------------------
   * METAS PADRÃO
   * ------------------------------------------------------------------- */
  goals: {
    dailyMinutes: 15,
    weeklySessions: 4,
    speakingSessionsPerWeek: 2,
    listeningMinutesPerWeek: 90,
    vocabularyItemsPerWeek: 30,
    writingSessionsPerWeek: 1
  },

  /* ---------------------------------------------------------------------
   * PLANO SEMANAL DE EXEMPLO (semana atual)
   * ------------------------------------------------------------------- */
  weeklyPlanTemplate: {
    monday:    [{ language: "english", menu: "entrada", skill: "listening", content: "", method: "comprehensible-input-output", duration: 15, status: "planejado", note: "Listening + Speaking" }],
    tuesday:   [{ language: "english", menu: "prato-principal", skill: "speaking", content: "res-mairo", method: "roleplay", duration: 30, status: "planejado", note: "Mairo + Speaking" }],
    wednesday: [{ language: "english", menu: "snack", skill: "vocabulary", content: "res-anki", method: "anki-srs", duration: 5, status: "planejado", note: "Vocabulary" }],
    thursday:  [{ language: "english", menu: "entrada", skill: "listening", content: "", method: "shadowing", duration: 15, status: "planejado", note: "Listening + Shadowing" }],
    friday:    [{ language: "english", menu: "prato-principal", skill: "writing", content: "", method: "comprehensible-input-output", duration: 30, status: "planejado", note: "Writing + Customer Service" }],
    saturday:  [{ language: "english", menu: "menu-principal", skill: "mix", content: "", method: "roleplay", duration: 60, status: "planejado", note: "Aula longa + conversação" }],
    sunday:    [{ language: "english", menu: "sobremesa", skill: "listening", content: "res-lyricstraining", method: "", duration: 5, status: "planejado", note: "Conteúdo leve + revisão" }]
  },

  /* ---------------------------------------------------------------------
   * BADGES (gamificação leve)
   * ------------------------------------------------------------------- */
  badges: [
    { id: "b-streak7", name: "7 dias de consistência", icon: "🏃", condition: "streak >= 7" },
    { id: "b-listening10", name: "10 sessões de listening", icon: "🎧", condition: "listeningSessions >= 10" },
    { id: "b-speaking10", name: "10 sessões de speaking", icon: "🗣️", condition: "speakingSessions >= 10" },
    { id: "b-writing10", name: "10 writings", icon: "✍️", condition: "writingSessions >= 10" },
    { id: "b-professional25", name: "25 sessões de inglês profissional", icon: "🚢", condition: "professionalSessions >= 25" },
    { id: "b-spanish-first", name: "Primeiro contato com espanhol", icon: "🇪🇸", condition: "spanishSessions >= 1" }
  ]
};

// Evita erro caso o script seja carregado mais de uma vez
if (typeof window !== "undefined") window.SEED_DATA = SEED_DATA;

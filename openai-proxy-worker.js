/* ==========================================================================
   backend/openai-proxy-worker.js
   --------------------------------------------------------------------------
   Proxy seguro entre o Professor IA (speaking.js) e a API da OpenAI.
   Roda como um Cloudflare Worker — gratuito na faixa de uso pessoal.

   IMPORTANTE: sua conta do ChatGPT (assinatura chatgpt.com) NÃO dá acesso a
   isso. A API da OpenAI é um produto separado, cobrado por uso (não por
   mensalidade), mas usa o MESMO login/conta. Veja o passo a passo completo
   em README.md, seção "Professor IA com IA real (OpenAI)".

   A chave da API (OPENAI_API_KEY) NUNCA fica escrita neste arquivo — ela é
   configurada como "secret" no painel/CLI da Cloudflare, fora do código.
   ========================================================================== */

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return corsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
    if (!env.OPENAI_API_KEY) return jsonResponse({ error: "missing_api_key", detail: "Configure o secret OPENAI_API_KEY (wrangler secret put OPENAI_API_KEY)." }, 500);

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: "invalid_json" }, 400);
    }

    const { messages = [], language = "english", level = "auto", mode = "fluency", conversationMode = "livre", scenario = "" } = body;

    const systemPrompt = buildSystemPrompt({ language, level, mode, conversationMode, scenario });
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20).map(m => ({ role: m.role === "teacher" ? "assistant" : "user", content: String(m.text || "").slice(0, 2000) }))
    ];

    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          temperature: 0.8,
          max_tokens: 300
        })
      });

      if (!resp.ok) {
        const detail = await resp.text();
        return jsonResponse({ error: "openai_error", detail }, 502);
      }

      const data = await resp.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't come up with a reply — try again?";
      return jsonResponse({ reply });
    } catch (err) {
      return jsonResponse({ error: "upstream_failure", detail: String(err) }, 502);
    }
  }
};

function buildSystemPrompt({ language, level, mode, conversationMode, scenario }) {
  const langName = language === "spanish" ? "Spanish" : language === "english" ? "English" : language;
  const modeInstructions = {
    fluency: "Do NOT interrupt to correct errors. Focus on keeping the conversation natural and flowing. Only mention 1-2 corrections briefly, and only at a natural pause — never mid-sentence.",
    correction: "Gently correct important errors as they come up, in one short aside, then continue the conversation naturally without dwelling on it.",
    teacher: "When you correct an error, briefly explain the grammar rule or reason in one sentence, then keep the conversation moving.",
    challenge: "Gradually raise the difficulty: introduce more advanced vocabulary and push the student with harder, more open-ended follow-up questions."
  };
  return `You are a warm, encouraging private ${langName} conversation teacher, talking with a Brazilian Portuguese speaker practicing ${langName}.
Student's target level: ${level === "auto" ? "not specified — infer it from how they write and adapt gradually" : level} (CEFR scale).
Conversation mode: ${conversationMode}. Scenario: ${scenario || "open conversation, no fixed scenario"}.
Correction behavior: ${mode}. ${modeInstructions[mode] || ""}

Rules:
- Keep replies SHORT — 1 to 4 sentences. This is a spoken conversation, not an essay.
- Always end with a question or prompt so the student keeps talking. Don't dominate the conversation.
- Match vocabulary to the student's level; if you use an advanced word, briefly gloss it in parentheses.
- If in a roleplay scenario, stay in character as the counterpart role.
- Never break character to say you are an AI unless the student directly asks.`;
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...corsHeaders() } });
}
function corsHeaders() {
  return {
    // Para mais segurança, troque "*" pelo domínio exato do seu GitHub Pages,
    // ex: "https://belenas-create.github.io"
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
function corsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
